import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const skip = (page - 1) * limit;

    // Build search conditions
    const where: any = {
      status: "UPCOMING",
      OR: [
        {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    };

    if (category && category !== "all") {
      where.category = {
        contains: category,
        mode: "insensitive",
      };
    }

    if (location && location !== "all") {
      where.location = {
        contains: location,
        mode: "insensitive",
      };
    }

    const total = await prisma.event.count({ where });

    const events: any = await (prisma.event.findMany as any)({
      where,
      skip,
      take: limit,
      orderBy: {
        startDate: "asc",
      },
      include: {
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
    } as any);

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
    console.error("Search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search events",
      },
      { status: 500 }
    );
  }
}
