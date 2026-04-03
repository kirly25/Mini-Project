"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  Users,
  Star,
  Clock,
  ArrowLeft,
  Share2,
  Heart,
} from "lucide-react";
import { formatDate, formatDateTime, formatPrice } from "@/lib/utils/formatters";

interface EventDetailsProps {
  event: {
    id: string;
    title: string;
    description: string;
    image?: string;
    category: string;
    location: string;
    address?: string;
    startDate: string;
    endDate: string;
    price: number;
    capacity: number;
    ticketsSold: number;
    status: string;
    createdBy: {
      id: string;
      name: string;
    };
    averageRating: number;
    reviews: Array<{
      id: string;
      rating: number;
      comment?: string;
      user: {
        id: string;
        name: string;
      };
      createdAt: string;
    }>;
    _count: {
      transactions: number;
      reviews: number;
    };
  };
}

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const [event, setEvent] = useState<EventDetailsProps["event"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/events/${eventId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch event details");
        }

        const result = await response.json();
        if (result.success && result.data) {
          // Ensure all required fields exist
          const eventData = {
            ...result.data,
            _count: result.data._count || { transactions: 0, reviews: 0 },
            averageRating: result.data.averageRating || 0,
            reviews: result.data.reviews || [],
          };
          setEvent(eventData);
        } else {
          throw new Error(result.error || "No event data received");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Event Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "The event you're looking for doesn't exist."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const ticketsAvailable = event.capacity - event.ticketsSold;
  const ticketsPercentage = Math.round((event.ticketsSold / event.capacity) * 100);
  const isSoldOut = ticketsAvailable <= 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Back Button */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Events</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Event Image */}
        <div className="relative rounded-lg overflow-hidden mb-8 h-96 bg-gradient-to-br from-blue-400 to-purple-500">
          {event.image && !imageError ? (
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-9xl opacity-20">📅</div>
              </div>
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className="absolute top-4 right-4 p-3 bg-white dark:bg-gray-800 rounded-full hover:scale-105 transition-transform"
          >
            <Heart
              className={`w-6 h-6 ${
                isFavorited
                  ? "fill-red-500 text-red-500"
                  : "text-gray-400 dark:text-gray-600"
              }`}
            />
          </button>

          {/* Category Badge */}
          <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-full font-semibold text-gray-800 dark:text-gray-100">
            {event.category}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Rating */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {event.title}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {event.averageRating > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(event.averageRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">
                      {event.averageRating.toFixed(1)} rating ({event._count.reviews}{" "}
                      reviews)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Start Date
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(event.startDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      End Date
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(event.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Location
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {event.location}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Attendees
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {event._count.transactions} attendees
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                About This Event
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
              {event.address && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Full Address
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {event.address}
                  </p>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            {event.reviews.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Recent Reviews
                </h2>
                <div className="space-y-4">
                  {event.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {review.user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 dark:text-gray-300">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-6">
              {/* Price */}
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                  Price per ticket
                </p>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {formatPrice(event.price)}
                </p>
              </div>

              {/* Availability */}
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Tickets Available
                </p>
                <div className="mb-2">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {ticketsAvailable > 0
                      ? `${ticketsAvailable} left`
                      : "Sold Out"}
                  </p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isSoldOut
                        ? "bg-red-500"
                        : ticketsPercentage > 80
                          ? "bg-orange-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(ticketsPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {ticketsPercentage}% Sold
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <Link
                  href={isSoldOut ? "#" : `/checkout/${event.id}`}
                  onClick={(e) => isSoldOut && e.preventDefault()}
                  className={`block w-full py-3 rounded-lg font-bold text-lg transition-colors text-center ${
                    isSoldOut
                      ? "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500"
                  }`}
                >
                  {isSoldOut ? "Sold Out" : "Book Now"}
                </Link>

                <button className="w-full py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>

              {/* Organizer Info */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Organized by
                </p>
                <Link
                  href={`/organizer/${event.createdBy.id}`}
                  className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {event.createdBy.name}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
