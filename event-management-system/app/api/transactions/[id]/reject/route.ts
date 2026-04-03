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

    const body = await request.json();
    const { rejectionReason } = body;

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

    // Reject transaction and perform rollback atomically
    await rollbackTransaction(transactionId, rejectionReason);

    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        event: true,
        user: true,
        voucher: true,
      },
    });

    return Response.json({
      success: true,
      message: "Transaction rejected successfully",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Transaction rejection error:", error);
    return Response.json(
      { error: "Failed to reject transaction" },
      { status: 500 }
    );
  }
}

async function rollbackTransaction(transactionId: string, rejectionReason?: string) {
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
      data: {
        status: "REJECTED",
        notes: rejectionReason || "Transaction rejected by admin",
        updatedAt: new Date(),
      },
    });
  }, {
    isolationLevel: "Serializable",
    timeout: 10000,
  });
}
