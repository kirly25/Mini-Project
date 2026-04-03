import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event: any = await (prisma.event.findUnique as any)({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        _count: {
          select: {
            transactions: true,
            reviews: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
        },
        { status: 404 }
      );
    }

    // Calculate average rating
    const ratings = await prisma.review.findMany({
      where: { eventId: id },
      select: { rating: true },
    });

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    // Ensure _count exists with default values
    const eventData = {
      ...event,
      averageRating,
      _count: event._count || {
        transactions: 0,
        reviews: event.reviews?.length || 0,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: eventData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Event fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch event",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      title,
      description,
      image,
      category,
      location,
      address,
      startDate,
      endDate,
      price,
      capacity,
    } = body;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
        },
        { status: 404 }
      );
    }

    // Validate required fields
    if (
      !title ||
      !description ||
      !category ||
      !location ||
      !startDate ||
      !endDate ||
      !price ||
      !capacity
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Validate date values
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format",
        },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        {
          success: false,
          error: "Start date must be before end date",
        },
        { status: 400 }
      );
    }

    // Update event
    const updatedEvent = await (prisma.event.update as any)({
      where: { id },
      data: {
        title,
        description,
        image,
        category,
        location,
        address,
        startDate: start,
        endDate: end,
        price: parseFloat(String(price)),
        capacity: parseInt(String(capacity)),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    } as any);

    return NextResponse.json(
      {
        success: true,
        data: updatedEvent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Event update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update event",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
        },
        { status: 404 }
      );
    }

    // Delete event (cascade will handle related records)
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Event delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete event",
      },
      { status: 500 }
    );
  }
}
