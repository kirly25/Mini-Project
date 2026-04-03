import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, error: "Only admins can delete vouchers" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if voucher exists
    const voucher = await prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      return NextResponse.json(
        { success: false, error: "Voucher not found" },
        { status: 404 }
      );
    }

    // Delete associated event-voucher relations first
    await prisma.eventVoucher.deleteMany({
      where: { voucherId: id },
    });

    // Delete voucher
    await prisma.voucher.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Voucher deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete voucher:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete voucher" },
      { status: 500 }
    );
  }
}
