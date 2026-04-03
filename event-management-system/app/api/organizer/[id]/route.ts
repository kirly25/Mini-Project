import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get organizer
    const organizer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!organizer) {
      return NextResponse.json(
        { success: false, error: "Organizer not found" },
        { status: 404 }
      );
    }

    // Get organizer's events with ratings
    const events = await prisma.event.findMany({
      where: { createdById: id },
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate average rating per event
    const eventsWithRatings = events.map((event) => {
      const avgRating =
        event.reviews.length > 0
          ? event.reviews.reduce((sum, r) => sum + r.rating, 0) /
            event.reviews.length
          : 0;

      return {
        id: event.id,
        title: event.title,
        location: event.location,
        startDate: event.startDate,
        price: event.price,
        capacity: event.capacity,
        ticketsSold: event.ticketsSold,
        averageRating: parseFloat(avgRating.toFixed(1)),
        _count: event._count,
      };
    });

    // Get all reviews for organizer's events
    const reviews = await (prisma as any).$queryRaw`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.createdAt,
        u.name as "user_name",
        e.title as "event_title"
      FROM reviews r
      JOIN users u ON r."userId" = u.id
      JOIN events e ON r."eventId" = e.id
      WHERE e."createdById" = ${id}
      ORDER BY r."createdAt" DESC
      LIMIT 20
    `;

    const formattedReviews = reviews.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: { name: r.user_name },
      event: { title: r.event_title },
    }));

    // Calculate statistics
    const totalEvents = events.length;

    const allReviews = events.flatMap((e) => e.reviews);
    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    const totalReviews = allReviews.length;

    // Calculate success rate (DONE transactions / total transactions)
    const transactions = await prisma.transaction.findMany({
      where: {
        event: {
          createdById: id,
        },
      },
      select: {
        status: true,
      },
    });

    const successCount = transactions.filter((t) => t.status === "DONE").length;
    const successRate =
      transactions.length > 0
        ? Math.round((successCount / transactions.length) * 100)
        : 0;

    const stats = {
      totalEvents,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews,
      successRate,
    };

    return NextResponse.json({
      success: true,
      organizer,
      events: eventsWithRatings,
      reviews: formattedReviews,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch organizer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch organizer profile",
      },
      { status: 500 }
    );
  }
}
