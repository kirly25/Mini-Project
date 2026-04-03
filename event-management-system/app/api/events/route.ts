import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const status = searchParams.get("status") || "UPCOMING";

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      status: status,
    };

    if (category) {
      where.category = {
        contains: category,
        mode: "insensitive",
      };
    }

    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive",
      };
    }

    // Get total count for pagination
    const total = await prisma.event.count({ where });

    // Get events
    const events: any = await prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        startDate: "asc",
      },
      include: { // @ts-ignore
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            reviews: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: events,
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
    console.error("Events fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch events",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }

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
      createdById,
    } = body;

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

    try {
      // Get or create default user if createdById is not provided/valid
      let userId = createdById;
      
      if (!userId) {
        // Try to get the default admin user
        let user = await prisma.user.findFirst({
          where: { role: "ADMIN" },
        });

        // If no admin user exists, create one
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: "organizer@example.com",
              name: "EventHub Organizer",
              role: "ADMIN",
            },
          });
        }
        userId = user.id;
      }

      const event = await (prisma.event.create as any)({
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
          createdById: userId,
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
          data: event,
        },
        { status: 201 }
      );
    } catch (prismaError: any) {
      console.error("Prisma error:", prismaError);
      return NextResponse.json(
        {
          success: false,
          error: prismaError?.message || "Database operation failed",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create event",
      },
      { status: 500 }
    );
  }
}
