import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (for compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const transactionId = resolvedParams.id;

    if (!transactionId) {
      return Response.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const paymentProofUrl = formData.get("paymentProofUrl") as string;
    const paymentMethod = formData.get("paymentMethod") as string;

    if (!paymentProofUrl || !paymentMethod) {
      return Response.json(
        { error: "Payment proof URL and method are required" },
        { status: 400 }
      );
    }

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return Response.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if payment proof deadline has passed
    if (transaction.paymentExpiredAt && new Date() > new Date(transaction.paymentExpiredAt)) {
      // Expire transaction
      await expireTransaction(transactionId);
      return Response.json(
        { error: "Payment deadline has passed. Transaction expired." },
        { status: 400 }
      );
    }

    // Update transaction with payment proof
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentProofUrl,
        paymentMethod: paymentMethod as any,
        status: "WAITING_FOR_ADMIN_CONFIRMATION",
        updatedAt: new Date(),
      },
      include: {
        event: true,
        user: true,
        voucher: true,
      },
    });

    return Response.json({
      success: true,
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Payment proof upload error:", error);
    return Response.json(
      { error: "Failed to upload payment proof", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function expireTransaction(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) return;

  // Restore points
  if (transaction.pointsUsed > 0) {
    await prisma.user.update({
      where: { id: transaction.userId },
      data: { points: { increment: transaction.pointsUsed } },
    });
  }

  // Restore voucher usage count
  if (transaction.voucherId) {
    await prisma.voucher.update({
      where: { id: transaction.voucherId },
      data: { usedCount: { decrement: 1 } },
    });
  }

  // Restore available tickets
  await prisma.event.update({
    where: { id: transaction.eventId },
    data: { ticketsSold: { decrement: transaction.quantity } },
  });

  // Update transaction status
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "EXPIRED" },
  });
}
