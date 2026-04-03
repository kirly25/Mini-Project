"use client";

import Link from "next/link";
import { MapPin, Users, AlertCircle } from "lucide-react";
import {
  formatDate,
  formatPrice,
  getTicketsPercentage,
  daysUntilEvent,
} from "@/lib/utils/formatters";

interface EventCardProps {
  id: string;
  title: string;
  image?: string;
  category: string;
  location: string;
  startDate: string;
  price: number;
  capacity: number;
  ticketsSold: number;
  status?: string;
}

export function EventCard({
  id,
  title,
  image,
  category,
  location,
  startDate,
  price,
  capacity,
  ticketsSold,
  status = "UPCOMING",
}: EventCardProps) {
  const percentage = getTicketsPercentage(ticketsSold, capacity);
  const daysLeft = daysUntilEvent(startDate);
  const isSoldOut = ticketsSold >= capacity;
  const isLimited = percentage > 80;

  return (
    <Link href={`/events/${id}`}>
      <div className="h-full rounded-lg border border-gray-200 overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300 dark:border-gray-800 dark:bg-gray-900">
        {/* Image Container */}
        <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl opacity-20">📅</div>
              </div>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-800 dark:text-gray-100">
            {category}
          </div>

          {/* Status Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {isSoldOut && (
              <div className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                Sold Out
              </div>
            )}
            {isLimited && !isSoldOut && (
              <div className="bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Limited
              </div>
            )}
          </div>

          {/* Days Left Banner */}
          {daysLeft > 0 && daysLeft <= 7 && !isSoldOut && (
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent py-2 px-3">
              <p className="text-white text-xs font-semibold">
                {daysLeft === 1 ? "Tomorrow!" : `${daysLeft} days left`}
              </p>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="p-4 flex flex-col h-48">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 hover:text-blue-600 dark:hover:text-blue-400">
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{location}</span>
          </div>

          {/* Date and Price */}
          <div className="mb-auto space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {formatDate(startDate)}
            </p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatPrice(price)}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-3 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Tickets</span>
              <span>
                {ticketsSold}/{capacity}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isSoldOut
                    ? "bg-red-500"
                    : isLimited
                      ? "bg-orange-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* CTA Button */}
          <button
            className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
              isSoldOut
                ? "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500"
            }`}
            disabled={isSoldOut}
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            {isSoldOut ? "Sold Out" : "View Details"}
          </button>
        </div>
      </div>
    </Link>
  );
}
