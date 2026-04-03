"use client";

import { Filter } from "lucide-react";
import { useState } from "react";

interface FilterBarProps {
  categories: string[];
  locations: string[];
  onCategoryChange: (category: string) => void;
  onLocationChange: (location: string) => void;
  currentCategory?: string;
  currentLocation?: string;
}

export function FilterBar({
  categories,
  locations,
  onCategoryChange,
  onLocationChange,
  currentCategory = "all",
  currentLocation = "all",
}: FilterBarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Filter className="w-5 h-5" />
          Filter Events
        </button>
      </div>

      {/* Filters Container */}
      <div
        className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 lg:p-6 mb-6 lg:mb-0 ${
          showMobileFilters ? "block" : "hidden lg:block"
        }`}
      >
        <div className="space-y-6">
          {/* Category Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Category
            </h3>
            <div className="space-y-2">
              {["all", ...categories].map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={currentCategory === cat}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="w-4 h-4 text-blue-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {cat === "all" ? "All Categories" : cat}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              📍 Location
            </h3>
            <div className="space-y-2">
              {["all", ...locations].map((loc) => (
                <label key={loc} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="location"
                    value={loc}
                    checked={currentLocation === loc}
                    onChange={(e) => onLocationChange(e.target.value)}
                    className="w-4 h-4 text-blue-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {loc === "all" ? "All Locations" : loc}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Reset Filters */}
          {(currentCategory !== "all" || currentLocation !== "all") && (
            <button
              onClick={() => {
                onCategoryChange("all");
                onLocationChange("all");
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </>
  );
}
