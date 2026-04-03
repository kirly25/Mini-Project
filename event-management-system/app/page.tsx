"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { EventGrid } from "@/components/EventGrid";
import { SearchBar } from "@/components/SearchBar";
import { Calendar, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

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

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Fetch featured events (first 4)
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch(`/api/events?page=1&limit=4`);
        const result: ApiResponse = await response.json();
        if (result.success) {
          setFeaturedEvents(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch featured events:", error);
      }
    };

    fetchFeatured();
  }, []);

  // Fetch all events without filters
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setCurrentPage(1);

      try {
        const params = new URLSearchParams();
        params.append("page", "1");
        params.append("limit", "12");

        const response = await fetch(`/api/events/search?${params}`);
        const result: ApiResponse = await response.json();

        if (result.success) {
          setEvents(result.data);
          setTotalPages(result.pagination.pages);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handlePageChange = useCallback(async (page: number) => {
    setCurrentPage(page);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "12");

      const response = await fetch(`/api/events/search?${params}`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setEvents(result.data);
        window.scrollTo({ top: 800, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (featuredEvents.length === 0) return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredEvents.length]);

  const handleCarouselPrev = () => {
    setCarouselIndex(
      (prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length
    );
  };

  const handleCarouselNext = () => {
    setCarouselIndex((prev) => (prev + 1) % featuredEvents.length);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      {/* Hero Section with Search */}
      <section className="bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 text-white py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-xs md:text-sm font-semibold uppercase tracking-wide">
              Jangan Lewatkan Event Favoritmu
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Pesan Tiket Event Impianmu Sekarang
          </h1>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <SearchBar
              placeholder="Cari event, artis, atau kategori..."
              debounceDelay={300}
              isLandingPage={true}
            />
          </div>

          {/* Category Tags */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              "#Promo_Indodana",
              "#EventHubPLus",
              "#ECENTHUBScreen",
              "#EVENTHUB_Promo",
              "#EventHubAtraction",
            ].map((tag) => (
              <button
                key={tag}
                className="text-xs md:text-sm px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Carousel Banner */}
      {featuredEvents.length > 0 && (
        <section className="bg-gray-900 py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl overflow-hidden bg-gray-950 h-64 md:h-96 lg:h-[450px]">
              {/* Carousel */}
              <div className="relative w-full h-full">
                {featuredEvents.map((event, idx) => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div
                      className={`absolute inset-0 transition-opacity duration-1000 ${
                        idx === carouselIndex ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Carousel Controls */}
              <button
                onClick={handleCarouselPrev}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 hover:bg-white/50 text-white transition-colors z-10 flex items-center justify-center"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleCarouselNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 hover:bg-white/50 text-white transition-colors z-10 flex items-center justify-center"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Carousel Indicators */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                {featuredEvents.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === carouselIndex
                        ? "bg-white w-8"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Events Section */}
      {featuredEvents.length > 0 && (
        <section className="bg-white dark:bg-gray-900 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Event Populer Minggu Ini
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Event terbaru yang paling banyak diminati pengunjung
                </p>
              </div>
              <Link
                href="/search"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold"
              >
                Lihat Semua →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="group rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
                    {/* Event Image */}
                    <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700">
                          <Calendar className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                        </div>
                      )}
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                          {event.category}
                        </span>
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-2">
                        {event.title}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(event.startDate).toLocaleDateString(
                              "id-ID",
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>📍 {event.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          Rp{event.price.toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs text-gray-500">
                          {event.ticketsSold}/{event.capacity} sold
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse All Events */}
      <section className="py-12 md:py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Semua Event untuk Kamu
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Jelajahi koleksi lengkap event dan temukan yang sesuai dengan minatmu
            </p>
          </div>

          {/* Event Grid - Full Width */}
          <EventGrid
            events={events}
            loading={loading}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      </section>

      {/* Customer Benefits Section */}
      <section className="bg-white dark:bg-gray-950 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Kenapa Memilih EventHub?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Easy Booking */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Pemesanan Mudah</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Pesan tiket dalam hitungan detik dengan antarmuka yang sederhana dan intuitif
              </p>
            </div>

            {/* Secure Payment */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Pembayaran Aman</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Berbagai metode pembayaran dengan enkripsi tingkat tinggi untuk keamanan maksimal
              </p>
            </div>

            {/* 24/7 Support */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Dukungan 24/7</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tim customer support kami siap membantu kamu kapan saja, setiap saat
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                500+
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Event Tersedia
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">
                50K+
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Pengunjung Aktif
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-pink-600 dark:text-pink-400">
                10K+
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Tiket Terjual Bulan Ini
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
                4.9★
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Rating Dari Pelanggan
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
