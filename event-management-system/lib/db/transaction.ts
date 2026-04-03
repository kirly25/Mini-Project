/**
 * Database Transaction Utilities
 * Provides atomic transaction wrappers for critical multi-step operations
 * 
 * Benefits:
 * - Data consistency: All or nothing updates
 * - Prevents race conditions
 * - Automatic rollback on failure
 * - Serializable isolation level prevents dirty reads
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Atomic approve transaction operation
 * Updates transaction status AND awards points in single transaction
 * If any operation fails, ALL changes rollback
 */
export async function approveTransactionAtomic(
  transactionId: string,
  userData: { userId: string; finalPrice: number }
) {
  const pointsEarned = Math.floor(userData.finalPrice * 0.01); // 1% reward
  
  return prisma.$transaction(async (tx) => {
    // Step 1: Update transaction to DONE
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

    // Step 2: Award points to user
    await tx.user.update({
      where: { id: userData.userId },
      data: { points: { increment: pointsEarned } },
    });

    return { transaction: updatedTransaction, pointsEarned };
  }, {
    isolationLevel: "Serializable",
    timeout: 10000,
  });
}

/**
 * Atomic reject transaction operation
 * Restores all resources (points, voucher usage, ticket count) in single transaction
 * If any operation fails, ALL changes rollback
 */
export async function rejectTransactionAtomic(
  transactionId: string,
  rejectionReason?: string
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return prisma.$transaction(async (tx) => {
    // Step 1: Restore points if user spent any
    if (transaction.pointsUsed > 0) {
      await tx.user.update({
        where: { id: transaction.userId },
        data: { points: { increment: transaction.pointsUsed } },
      });
    }

    // Step 2: Restore voucher usage count
    if (transaction.voucherId) {
      await tx.voucher.update({
        where: { id: transaction.voucherId },
        data: { usedCount: { decrement: 1 } },
      });
    }

    // Step 3: Restore available tickets
    await tx.event.update({
      where: { id: transaction.eventId },
      data: { ticketsSold: { decrement: transaction.quantity } },
    });

    // Step 4: Update transaction status
    return await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: "REJECTED",
        notes: rejectionReason || "Transaction rejected by admin",
        updatedAt: new Date(),
      },
      include: {
        event: true,
        user: true,
        voucher: true,
      },
    });
  }, {
    isolationLevel: "Serializable",
    timeout: 10000,
  });
}

/**
 * Atomic transaction creation
 * Creates transaction AND updates all related records in single transaction
 * If any operation fails, ALL changes rollback - prevents inconsistent state
 */
export async function createTransactionAtomic(
  data: {
    eventId: string;
    userId: string;
    quantity: number;
    pricePerTicket: number;
    originalTotalPrice: number;
    finalPrice: number;
    pointsToUse?: number;
    voucherId?: string | null;
  }
) {
  return prisma.$transaction(async (tx) => {
    // Step 1: Create transaction
    const newTransaction = await tx.transaction.create({
      data: {
        eventId: data.eventId,
        userId: data.userId,
        quantity: data.quantity,
        pricePerTicket: data.pricePerTicket,
        originalTotalPrice: data.originalTotalPrice,
        pointsUsed: data.pointsToUse || 0,
        voucherId: data.voucherId || null,
        finalPrice: data.finalPrice,
        status: "WAITING_FOR_PAYMENT",
        paymentExpiredAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        approvalDeadlineAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      },
      include: {
        event: true,
        voucher: true,
      },
    } as any);

    // Step 2: Update voucher usage if applied
    if (data.voucherId) {
      await tx.voucher.update({
        where: { id: data.voucherId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Step 3: Deduct points from user if used
    if (data.pointsToUse && data.pointsToUse > 0) {
      await tx.user.update({
        where: { id: data.userId },
        data: { points: { decrement: data.pointsToUse } },
      });
    }

    // Step 4: Update event ticket sold count
    await tx.event.update({
      where: { id: data.eventId },
      data: { ticketsSold: { increment: data.quantity } },
    });

    return newTransaction;
  }, {
    isolationLevel: "Serializable",
    timeout: 10000,
  });
}

/**
 * Atomic cancel transaction operation
 * Restores resources when approval deadline passes
 */
export async function cancelTransactionAtomic(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return prisma.$transaction(async (tx) => {
    // Step 1: Restore points if used
    if (transaction.pointsUsed > 0) {
      await tx.user.update({
        where: { id: transaction.userId },
        data: { points: { increment: transaction.pointsUsed } },
      });
    }

    // Step 2: Restore voucher usage
    if (transaction.voucherId) {
      await tx.voucher.update({
        where: { id: transaction.voucherId },
        data: { usedCount: { decrement: 1 } },
      });
    }

    // Step 3: Restore tickets
    await tx.event.update({
      where: { id: transaction.eventId },
      data: { ticketsSold: { decrement: transaction.quantity } },
    });

    // Step 4: Update transaction status
    return await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: "CANCELLED",
        notes: "Approval deadline passed. Auto-cancelled.",
        updatedAt: new Date(),
      },
    });
  }, {
    isolationLevel: "Serializable",
    timeout: 10000,
  });
}

/**
 * Fix Documentation - What Was Fixed
 * 
 * BEFORE:
 * - Approve: 2 separate DB calls → if 2nd fails, transaction marked DONE but points not awarded
 * - Reject: 4 separate DB calls → If any fails after first, partial rollback happens
 * - Create: 4 separate DB calls → If ticket update fails, transaction created but seats not reserved
 * - Cancel: 4 separate DB calls → Could leave inconsistent state
 * 
 * AFTER:
 * - All critical operations now use prisma.$transaction
 * - All-or-nothing semantics: Either ALL succeed or ALL rollback
 * - Serializable isolation prevents race conditions
 * - Automatic rollback on any error
 * 
 * FILES UPDATED:
 * ✅ /app/api/transactions/[id]/approve/route.ts
 * ✅ /app/api/transactions/[id]/reject/route.ts 
 * ✅ /app/api/transactions/route.ts (POST)
 * 
 * ISOLATION LEVEL:
 * - Using Serializable: Highest isolation level
 * - Prevents dirty reads, non-repeatable reads, and phantom reads
 * - Best for financial/critical operations
 * 
 * TIMEOUT:
 * - 10 seconds timeout to prevent hanging transactions
 * - Automatically rolls back if exceeds timeout
 */
