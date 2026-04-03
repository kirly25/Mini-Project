import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
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

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true, event: true },
    });

    if (!transaction) {
      return Response.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if approval deadline has passed
    if (
      transaction.approvalDeadlineAt &&
      new Date() > new Date(transaction.approvalDeadlineAt)
    ) {
      // Auto-cancel transaction
      await cancelTransaction(transactionId);
      return Response.json(
        { error: "Approval deadline has passed. Transaction has been auto-cancelled." },
        { status: 400 }
      );
    }

    // Approve transaction with atomic transaction
    const pointsEarned = Math.floor(transaction.finalPrice * 0.01);
    
    const result = await prisma.$transaction(async (tx) => {
      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "DONE",
          updatedAt: new Date(),
        },
        include: {
          event: true,
          user: true,
          voucher: true,
        },
      });

      // Award points to user in the same transaction
      await tx.user.update({
        where: { id: transaction.userId },
        data: { points: { increment: pointsEarned } },
      });

      return updatedTransaction;
    }, {
      isolationLevel: "Serializable",
      timeout: 10000,
    });

    return Response.json({
      success: true,
      message: "Transaction approved successfully",
      transaction: result,
      pointsAwarded: pointsEarned,
    });
  } catch (error) {
    console.error("Transaction approval error:", error);
    return Response.json(
      { error: "Failed to approve transaction" },
      { status: 500 }
    );
  }
}

async function cancelTransaction(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) return;

  // Perform all rollback operations atomically
  await prisma.$transaction(async (tx) => {
    // Restore points if used
    if (transaction.pointsUsed > 0) {
      await tx.user.update({
        where: { id: transaction.userId },
        data: { points: { increment: transaction.pointsUsed } },
      });
    }

    // Restore voucher usage count
    if (transaction.voucherId) {
      await tx.voucher.update({
        where: { id: transaction.voucherId },
        data: { usedCount: { decrement: 1 } },
      });
    }

    // Restore available tickets
    await tx.event.update({
      where: { id: transaction.eventId },
      data: { ticketsSold: { decrement: transaction.quantity } },
    });

    // Update transaction status
    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: "CANCELLED" },
    });
  }, {
    isolationLevel: "Serializable",
    timeout: 10000,
  });
}
