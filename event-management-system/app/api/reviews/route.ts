import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, transactionId, rating, reviewText, userId } = body;

    console.log("Review create request:", { eventId, transactionId, rating, reviewText: reviewText?.substring(0, 50), userId });

    // Validate input
    if (!eventId || !transactionId || !rating || !reviewText) {
      console.log("Validation failed:", { eventId, transactionId, rating, reviewText });
      return Response.json(
        { error: "All fields are required", details: { eventId: !!eventId, transactionId: !!transactionId, rating: !!rating, comment: !!reviewText } },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return Response.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!userId) {
      return Response.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Verify transaction belongs to user and is DONE
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    console.log("Transaction found:", transaction?.id, "Status:", transaction?.status);

    if (!transaction) {
      return Response.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.userId !== userId) {
      return Response.json(
        { error: "Unauthorized - transaction does not belong to user" },
        { status: 403 }
      );
    }

    // Check that transaction is DONE (event attended)
    if (transaction.status !== "DONE") {
      return Response.json(
        { error: "Can only review after completing the transaction" },
        { status: 400 }
      );
    }

    // Check if review already exists for this user on this event
    const existingReview = await prisma.review.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (existingReview) {
      return Response.json(
        { error: "You already reviewed this event" },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        eventId,
        userId,
        transactionId,
        rating,
        comment: reviewText,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    console.log("Review created successfully:", review.id);

    return Response.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Review creation error:", error);
    return Response.json(
      { error: "Failed to create review", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get("eventId");

    if (!eventId) {
      return Response.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    // Get reviews for event
    const reviews = await prisma.review.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return Response.json({
      success: true,
      reviews,
      averageRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Review fetch error:", error);
    return Response.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
