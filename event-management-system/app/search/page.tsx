"use client";

import { useState, useCallback, useEffect } from "react";
import { EventGrid } from "@/components/EventGrid";
import { SearchBar } from "@/components/SearchBar";
import { X, ChevronDown, Check } from "lucide-react";

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

interface ApiResponse {
  success: boolean;
  data: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const CATEGORIES = [
  "Music",
  "Sports",
  "Tech",
  "Business",
  "Entertainment",
  "Conference",
  "Workshop",
  "Meetup",
  "Art",
  "Food",
];

const LOCATIONS = [
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Yogyakarta",
  "Medan",
  "Semarang",
  "Makassar",
  "Palembang",
  "Balikpapan",
  "Bali",
  "Lombok",
  "Manado",
];
const EVENT_TYPES = ["All Events", "Online Only", "Offline Only"];

const SORT_OPTIONS = [
  { value: "newest", label: "Waktu Mulai (Terdekat)" },
  { value: "oldest", label: "Waktu Mulai (Terjauh)" },
  { value: "price-low", label: "Harga Terendah" },
  { value: "price-high", label: "Harga Tertinggi" },
  { value: "popularity", label: "Paling Populer" },
];

const PRICE_RANGES = [
  { label: "Gratis", value: "free" },
  { label: "Berbayar", value: "paid" },
];

export default function SearchPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedEventType, setSelectedEventType] = useState("All Events");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  const [activeFilters, setActiveFilters] = useState<
    { key: string; label: string; value: string }[]
  >([]);

  const limit = 8;

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setCurrentPage(1);

      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append("q", searchQuery);
        if (selectedCategory !== "all")
          params.append("category", selectedCategory);
        if (selectedLocation !== "all")
          params.append("location", selectedLocation);
        params.append("page", "1");
        params.append("limit", String(limit));

        const response = await fetch(`/api/events/search?${params}`);
        const result: ApiResponse = await response.json();

        if (result.success) {
          // Apply client-side filters
          let filteredEvents = result.data;

          // Filter by event type
          if (selectedEventType !== "All Events") {
            if (selectedEventType === "Online Only") {
              filteredEvents = filteredEvents.filter((e) =>
                e.location.toLowerCase().includes("online")
              );
            } else if (selectedEventType === "Offline Only") {
              filteredEvents = filteredEvents.filter(
                (e) => !e.location.toLowerCase().includes("online")
              );
            }
          }

          // Filter by price
          if (selectedPriceRange !== "all") {
            if (selectedPriceRange === "free") {
              filteredEvents = filteredEvents.filter((e) => e.price === 0);
            } else if (selectedPriceRange === "paid") {
              filteredEvents = filteredEvents.filter((e) => e.price > 0);
            }
          }

          // Sort
          filteredEvents.sort((a, b) => {
            switch (sortBy) {
              case "oldest":
                return (
                  new Date(b.startDate).getTime() -
                  new Date(a.startDate).getTime()
                );
              case "price-low":
                return a.price - b.price;
              case "price-high":
                return b.price - a.price;
              case "popularity":
                return b.ticketsSold - a.ticketsSold;
              default: // newest
                return (
                  new Date(a.startDate).getTime() -
                  new Date(b.startDate).getTime()
                );
            }
          });

          setEvents(filteredEvents);
          setTotalPages(Math.ceil(filteredEvents.length / limit));
          setTotalEvents(filteredEvents.length);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [searchQuery, selectedCategory, selectedLocation, selectedEventType, selectedPriceRange, sortBy]);

  const handleClearFilter = (key: string) => {
    if (key === "location") setSelectedLocation("all");
    if (key === "price") setSelectedPriceRange("all");
    if (key === "category") setSelectedCategory("all");
    if (key === "eventType") setSelectedEventType("All Events");
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  const getDisplayedEvents = () => {
    const startIdx = (currentPage - 1) * limit;
    return events.slice(startIdx, startIdx + limit);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Search Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Cari event, kategori, atau lokasi..."
            debounceDelay={300}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 sticky top-32">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Filter
                </h2>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700">
                  ↻
                </button>
              </div>

              <div className="space-y-6">
                {/* Event Type */}
                <div>
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 block">
                    Tipe Event
                  </label>
                  <div className="space-y-2">
                    {EVENT_TYPES.map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="eventType"
                          checked={selectedEventType === type}
                          onChange={() => setSelectedEventType(type)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 block">
                    Lokasi
                  </label>
                  <div
                    className="relative"
                    onClick={() => toggleDropdown("location")}
                  >
                    <button className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedLocation === "all"
                          ? "Pilih Lokasi"
                          : selectedLocation}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {openDropdowns.includes("location") && (
                      <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                        {["all", ...LOCATIONS].map((loc) => (
                          <button
                            key={loc}
                            onClick={() => {
                              setSelectedLocation(loc);
                              toggleDropdown("location");
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                          >
                            <span>{loc === "all" ? "Semua Lokasi" : loc}</span>
                            {selectedLocation === loc && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedLocation !== "all" && (
                    <button
                      onClick={() => handleClearFilter("location")}
                      className="mt-2 text-xs text-red-600 hover:text-red-700"
                    >
                      Clear ×
                    </button>
                  )}
                </div>

                {/* Kategori Event */}
                <div>
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 block">
                    Kategori Event
                  </label>
                  <div
                    className="relative"
                    onClick={() => toggleDropdown("category")}
                  >
                    <button className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedCategory === "all"
                          ? "Pilih Kategori"
                          : selectedCategory}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {openDropdowns.includes("category") && (
                      <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {["all", ...CATEGORIES].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                              toggleDropdown("category");
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                          >
                            <span>
                              {cat === "all" ? "Semua Kategori" : cat}
                            </span>
                            {selectedCategory === cat && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Harga */}
                <div>
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 block">
                    Harga
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        checked={selectedPriceRange === "all"}
                        onChange={() => setSelectedPriceRange("all")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Semua Harga
                      </span>
                    </label>
                    {PRICE_RANGES.map((range) => (
                      <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="price"
                          checked={selectedPriceRange === range.value}
                          onChange={() => setSelectedPriceRange(range.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {range.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedPriceRange !== "all" && (
                    <button
                      onClick={() => handleClearFilter("price")}
                      className="mt-2 text-xs text-red-600 hover:text-red-700"
                    >
                      Clear ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Memapilkan{" "}
                  <span className="font-semibold">
                    {getDisplayedEvents().length > 0
                      ? (currentPage - 1) * limit + 1
                      : 0}
                    {" "} - {" "}
                    {Math.min(currentPage * limit, totalEvents)}
                  </span>{" "}
                  Dari Total{" "}
                  <span className="font-semibold">{totalEvents}</span>
                </p>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("sort")}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <span>Urutkan: {SORT_OPTIONS.find(s => s.value === sortBy)?.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {openDropdowns.includes("sort") && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          toggleDropdown("sort");
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                      >
                        <span>{option.label}</span>
                        {sortBy === option.value && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Event Grid */}
            <EventGrid
              events={getDisplayedEvents()}
              loading={loading}
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
