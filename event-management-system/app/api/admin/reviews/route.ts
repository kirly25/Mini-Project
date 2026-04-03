import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (minRating || maxRating) {
      where.rating = {};
      if (minRating) {
        where.rating.gte = parseInt(minRating);
      }
      if (maxRating) {
        where.rating.lte = parseInt(maxRating);
      }
    }

    // Get total count
    const total = await prisma.review.count({ where });

    // Get reviews with relations
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        transaction: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Get all events for filter options
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
      },
      orderBy: { title: "asc" },
    });

    // Calculate stats per event
    const eventStats = await Promise.all(
      events.map(async (event) => {
        const eventReviews = await prisma.review.findMany({
          where: { eventId: event.id },
          select: { rating: true },
        });

        const avgRating =
          eventReviews.length > 0
            ? eventReviews.reduce((sum, r) => sum + r.rating, 0) / eventReviews.length
            : 0;

        return {
          eventId: event.id,
          eventTitle: event.title,
          reviewCount: eventReviews.length,
          averageRating: parseFloat(avgRating.toFixed(1)),
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: reviews,
        events,
        eventStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch reviews",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json(
        {
          success: false,
          error: "Review ID is required",
        },
        { status: 400 }
      );
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: "Review not found",
        },
        { status: 404 }
      );
    }

    // Delete review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Review deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Review delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete review",
      },
      { status: 500 }
    );
  }
}
