import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Verify this is a legitimate cron request (you should add proper auth)
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || "dev-secret"}`) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    // Find and expire transactions that passed the 2-hour payment deadline
    const expiredPaymentTransactions = await prisma.transaction.findMany({
      where: {
        status: "WAITING_FOR_PAYMENT",
        paymentExpiredAt: {
          lt: now,
        },
      },
    });

    for (const transaction of expiredPaymentTransactions) {
      await expireTransaction(transaction.id);
    }

    // Find and cancel transactions that passed the 3-day admin approval deadline
    const expiredApprovalTransactions = await prisma.transaction.findMany({
      where: {
        status: "WAITING_FOR_ADMIN_CONFIRMATION",
        approvalDeadlineAt: {
          lt: now,
        },
      },
    });

    for (const transaction of expiredApprovalTransactions) {
      await cancelTransaction(transaction.id);
    }

    return Response.json({
      success: true,
      expiredPayments: expiredPaymentTransactions.length,
      cancelledApprovalsau: expiredApprovalTransactions.length,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return Response.json(
      { error: "Cron job failed" },
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

async function cancelTransaction(transactionId: string) {
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
    data: { status: "CANCELLED" },
  });
}
