"use client";

import { EventCard } from "./EventCard";

interface Event {
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

interface EventGridProps {
  events: Event[];
  loading?: boolean;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export function EventGrid({
  events,
  loading = false,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
}: EventGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 animate-pulse"
          >
            <div className="h-48 bg-gray-200 dark:bg-gray-800" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No events found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Event Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} {...event} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 flex-wrap mt-8">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            ←
          </button>

          <div className="flex items-center gap-1">
            {/* First page */}
            <button
              onClick={() => onPageChange?.(1)}
              className={`flex items-center justify-center w-10 h-10 rounded-lg font-semibold transition-colors ${
                currentPage === 1
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              1
            </button>

            {/* Middle pages */}
            {totalPages > 2 &&
              Array.from({ length: Math.min(3, totalPages - 2) }, (_, i) => {
                const pageNum = Math.max(2, currentPage - 1) + i;
                if (pageNum >= totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange?.(pageNum)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg font-semibold transition-colors ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

            {/* Ellipsis */}
            {currentPage + 2 < totalPages && (
              <span className="px-2 text-gray-500">...</span>
            )}

            {/* Last page */}
            {totalPages > 1 && (
              <button
                onClick={() => onPageChange?.(totalPages)}
                className={`flex items-center justify-center w-10 h-10 rounded-lg font-semibold transition-colors ${
                  currentPage === totalPages
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {totalPages}
              </button>
            )}
          </div>

          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
