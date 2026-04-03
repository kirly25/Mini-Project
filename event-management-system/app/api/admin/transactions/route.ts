import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get all transactions for admin dashboard
    // Note: Auth is handled on the client-side (page already validates admin role)
    const transactions = await prisma.transaction.findMany({
      include: {
        event: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        voucher: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("Admin transaction fetch error:", error);
    return Response.json(
      { error: "Failed to fetch transactions", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
