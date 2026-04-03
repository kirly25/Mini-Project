import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const includeAll = url.searchParams.get("includeAll") === "true";

    // Get all non-expired vouchers (not limited by event)
    // All valid vouchers can be applied to any event
    const now = new Date();
    const vouchers = await prisma.voucher.findMany({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        events: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map to include available uses
    const mappedVouchers = vouchers.map((v) => ({
      ...v,
      availableUses: v.maxUses ? v.maxUses - v.usedCount : null,
    }));

    return NextResponse.json({
      success: true,
      data: mappedVouchers,
    });
  } catch (error) {
    console.error("Failed to fetch vouchers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userHeader = req.headers.get("x-user");
    if (!userHeader) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = JSON.parse(userHeader);

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only admins can create vouchers" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      code,
      description,
      discountAmount,
      isPercentage,
      maxUses,
      expiresAt,
      eventIds,
    } = body;

    // Validate required fields
    if (!code || discountAmount === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Code and discountAmount are required",
        },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingVoucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingVoucher) {
      return NextResponse.json(
        { success: false, error: "Voucher code already exists" },
        { status: 400 }
      );
    }

    // Create voucher
    const voucher = await prisma.voucher.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountAmount,
        isPercentage,
        maxUses: maxUses || null,
        usedCount: 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: user.id,
      },
    });

    // Link to events if provided
    if (eventIds && eventIds.length > 0) {
      const eventVouchers = eventIds.map((eventId: string) => ({
        voucherId: voucher.id,
        eventId,
      }));

      await prisma.eventVoucher.createMany({
        data: eventVouchers,
      });
    }

    return NextResponse.json({
      success: true,
      data: voucher,
      message: "Voucher created successfully",
    });
  } catch (error) {
    console.error("Failed to create voucher:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create voucher" },
      { status: 500 }
    );
  }
}
