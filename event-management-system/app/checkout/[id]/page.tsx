"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Ticket, MapPin, Calendar, Zap, Gift, ArrowLeft } from "lucide-react";

interface Event {
  id: string;
  title: string;
  price: number;
  capacity: number;
  ticketsSold: number;
  location: string;
  startDate: string;
  category: string;
}

interface UserData {
  id: string;
  points?: number;
  saldo?: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [voucherId, setVoucherId] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get user from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (err) {
        console.error("Failed to parse user:", err);
      }
    }

    // Fetch event
    fetchEvent();
    // Fetch available vouchers
    fetchAvailableVouchers();
  }, [eventId]);

  const fetchAvailableVouchers = async () => {
    try {
      const response = await fetch("/api/vouchers");
      const data = await response.json();
      if (data.success) {
        setAvailableVouchers(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch vouchers:", err);
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      const data = await response.json();
      if (data.success) {
        setEvent(data.data);
      }
    } catch (err) {
      setError("Failed to load event");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const availableTickets = event ? event.capacity - event.ticketsSold : 0;
  const subtotal = event ? event.price * quantity : 0;
  const userPoints = user?.points ?? 0;
  const maxPointsToUse = Math.min(pointsToUse, userPoints, subtotal - voucherDiscount);
  const finalPrice = Math.max(0, subtotal - voucherDiscount - maxPointsToUse);

  const handleApplyVoucher = () => {
    setVoucherError("");
    const trimmedCode = voucherCode.toUpperCase().trim();

    if (!trimmedCode) {
      setVoucherError("Please enter a voucher code");
      return;
    }

    console.log("Looking for voucher:", trimmedCode);
    console.log("Available vouchers:", availableVouchers.map(v => v.code));

    // Find voucher (case-insensitive)
    const found = availableVouchers.find((v) => v.code.toUpperCase() === trimmedCode);

    if (!found) {
      setVoucherError("Voucher not found or invalid");
      return;
    }

    // Check if already at usage limit
    if (found.maxUses && found.usedCount >= found.maxUses) {
      setVoucherError("Voucher usage limit reached");
      return;
    }

    // Check if expired
    if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
      setVoucherError("Voucher has expired");
      return;
    }

    // Calculate discount
    const discount = found.isPercentage
      ? (subtotal * found.discountAmount) / 100
      : found.discountAmount;

    setVoucherId(found.id);
    setVoucherDiscount(Math.min(discount, subtotal));
    setVoucherCode("");
    setVoucherError("");
  };

  const handleRemoveVoucher = () => {
    setVoucherId("");
    setVoucherDiscount(0);
    setVoucherCode("");
    setVoucherError("");
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (quantity <= 0) {
      setError("Please select at least 1 ticket");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": JSON.stringify(user),
        },
        body: JSON.stringify({
          eventId,
          quantity,
          pointsToUse: maxPointsToUse,
          voucherId: voucherId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Checkout failed");
        return;
      }

      // Redirect to payment proof upload
      router.push(`/transactions/${data.transaction.id}/payment-proof`);
    } catch (err) {
      setError("Failed to process checkout");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {!user ? "Silakan login terlebih dahulu" : "Event tidak ditemukan"}
          </p>
          <Link
            href={!user ? "/auth/login" : "/"}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {!user ? "Go to Login" : "Back to Home"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/events/${eventId}`} className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Event Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Event Details</h2>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{event.title}</h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.startDate).toLocaleDateString("id-ID")}
                </div>
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  Harga: Rp{event.price.toLocaleString("id-ID")}
                </div>
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Jumlah Tiket</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={availableTickets}
                  className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => setQuantity(Math.min(availableTickets, quantity + 1))}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
                >
                  +
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {availableTickets} tiket tersedia
                </span>
              </div>
            </div>

            {/* Voucher Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gunakan Kode Promo</h2>
              </div>

              {voucherId ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-300">Voucher Applied!</p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Discount: Rp{voucherDiscount.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveVoucher}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Enter voucher code"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      onKeyPress={(e) => e.key === "Enter" && handleApplyVoucher()}
                    />
                    <button
                      onClick={handleApplyVoucher}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {voucherError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{voucherError}</p>
                  )}
                  {availableVouchers.length > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-semibold mb-2">Available vouchers:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableVouchers.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              setVoucherCode(v.code);
                              setTimeout(() => {
                                const voucher = availableVouchers.find((x) => x.code === v.code);
                                if (voucher) {
                                  const discount = voucher.isPercentage
                                    ? (subtotal * voucher.discountAmount) / 100
                                    : voucher.discountAmount;
                                  setVoucherId(voucher.id);
                                  setVoucherDiscount(Math.min(discount, subtotal));
                                  setVoucherCode("");
                                  setVoucherError("");
                                }
                              }, 0);
                            }}
                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                          >
                            {v.code} ({v.isPercentage ? v.discountAmount + "%" : "Rp" + v.discountAmount.toLocaleString("id-ID")})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Points Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gunakan Poin Saya</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Poin Anda: <span className="font-semibold text-yellow-600 dark:text-yellow-400">{userPoints.toLocaleString("id-ID")}</span>
              </p>
              <input
                type="number"
                value={pointsToUse}
                onChange={(e) => setPointsToUse(Math.max(0, parseInt(e.target.value) || 0))}
                max={Math.min(userPoints, subtotal)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Masukkan jumlah poin yang ingin digunakan"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Maksimal: Rp{Math.min(userPoints, subtotal).toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Price Summary */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Ringkasan Pesanan</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tiket ({quantity}x)</span>
                  <span className="text-gray-900 dark:text-white font-semibold">Rp{subtotal.toLocaleString("id-ID")}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-purple-600 dark:text-purple-400">
                    <span>Potongan Voucher</span>
                    <span>-Rp{voucherDiscount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {maxPointsToUse > 0 && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>Potongan Poin</span>
                    <span>-Rp{maxPointsToUse.toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  Rp{finalPrice.toLocaleString("id-ID")}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={submitting || quantity <= 0}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Memproses..." : "Lanjutkan ke Pembayaran"}
              </button>

              <button
                onClick={() => router.back()}
                className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
