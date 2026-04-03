import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, quantity, pointsToUse = 0, voucherId } = body;

    // Get user from header or session
    const userStr = request.headers.get("x-user") || "{}";
    const user = JSON.parse(userStr);

    if (!user.id) {
      return Response.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Fetch event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return Response.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check available seats
    const availableTickets = event.capacity - event.ticketsSold;
    if (quantity > availableTickets) {
      return Response.json(
        { error: `Only ${availableTickets} tickets available` },
        { status: 400 }
      );
    }

    // Calculate price
    let originalTotalPrice = event.price * quantity;
    let voucherDiscount = 0;

    // Apply voucher if provided
    if (voucherId) {
      const voucher = await prisma.voucher.findUnique({
        where: { id: voucherId },
      });

      if (!voucher) {
        return Response.json(
          { error: "Voucher not found" },
          { status: 404 }
        );
      }

      // Check voucher validity
      if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
        return Response.json(
          { error: "Voucher expired" },
          { status: 400 }
        );
      }

      if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
        return Response.json(
          { error: "Voucher usage limit reached" },
          { status: 400 }
        );
      }

      // Calculate voucher discount
      voucherDiscount = voucher.isPercentage
        ? (originalTotalPrice * voucher.discountAmount) / 100
        : voucher.discountAmount;
    }

    // Calculate final price with points
    const finalPrice = Math.max(
      0,
      originalTotalPrice - voucherDiscount - pointsToUse
    );

    // Create transaction and update all related records atomically
    const transaction = await prisma.$transaction(async (tx) => {
      // Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
          eventId,
          userId: user.id,
          quantity,
          pricePerTicket: event.price,
          originalTotalPrice,
          pointsUsed: pointsToUse,
          voucherId: voucherId || null,
          finalPrice,
          status: "WAITING_FOR_PAYMENT",
          paymentExpiredAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          approvalDeadlineAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        },
        include: {
          event: true,
          voucher: true,
        },
      } as any);

      // Update voucher usage count if used
      if (voucherId) {
        await tx.voucher.update({
          where: { id: voucherId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Deduct points from user if used
      if (pointsToUse > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: { points: { decrement: pointsToUse } },
        });
      }

      // Update ticket sold count
      await tx.event.update({
        where: { id: eventId },
        data: { ticketsSold: { increment: quantity } },
      });

      return newTransaction;
    }, {
      isolationLevel: "Serializable",
      timeout: 10000,
    });

    return Response.json(
      {
        success: true,
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Transaction creation error:", error);
    return Response.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userStr = request.headers.get("x-user") || "{}";
    const user = JSON.parse(userStr);

    if (!user.id) {
      return Response.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: {
        event: true,
        voucher: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Transaction fetch error:", error);
    return Response.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
