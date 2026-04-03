"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket, Calendar, MapPin, Eye, MoreVertical } from "lucide-react";

interface Transaction {
  id: string;
  event: {
    id: string;
    title: string;
    location: string;
    startDate: string;
  };
  quantity: number;
  finalPrice: number;
  status: string;
  createdAt: string;
  paymentExpiredAt?: string;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  WAITING_FOR_PAYMENT: { bg: "bg-yellow-50 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", label: "Menunggu Pembayaran" },
  WAITING_FOR_ADMIN_CONFIRMATION: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", label: "Menunggu Konfirmasi" },
  DONE: { bg: "bg-green-50 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", label: "Selesai" },
  REJECTED: { bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", label: "Ditolak" },
  EXPIRED: { bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", label: "Kadaluarsa" },
  CANCELLED: { bg: "bg-gray-50 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300", label: "Dibatalkan" },
};

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check auth
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/auth/login");
      return;
    }

    setUser(JSON.parse(userStr));
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const userStr = localStorage.getItem("user");
      const userData = userStr ? JSON.parse(userStr) : null;

      const response = await fetch("/api/transactions", {
        headers: {
          "x-user": JSON.stringify(userData),
        },
      });

      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Pesanan Saya
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola dan lihat status semua pesanan tiket Anda
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Pesanan</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Anda belum membeli tiket event apapun
            </p>
            <Link
              href="/events"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Jelajahi Event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const statusInfo = statusColors[transaction.status] || statusColors.CANCELLED;
              return (
                <div
                  key={transaction.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link
                        href={`/events/${transaction.event.id}`}
                        className="text-lg font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {transaction.event.title}
                      </Link>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {transaction.event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(transaction.event.startDate).toLocaleDateString("id-ID")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Ticket className="w-4 h-4" />
                          {transaction.quantity} tiket
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`${statusInfo.bg} ${statusInfo.text} px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold`}>
                      {statusInfo.label}
                    </div>
                  </div>

                  {/* Timer for WAITING_FOR_PAYMENT */}
                  {transaction.status === "WAITING_FOR_PAYMENT" && transaction.paymentExpiredAt && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
                      ⏱️ Bayar sebelum: {new Date(transaction.paymentExpiredAt).toLocaleString("id-ID")}
                    </div>
                  )}

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        Rp{transaction.finalPrice.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {transaction.status === "WAITING_FOR_PAYMENT" && (
                        <Link
                          href={`/transactions/${transaction.id}/payment-proof`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold inline-flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Upload Bukti
                        </Link>
                      )}

                      {transaction.status === "DONE" && (
                        <Link
                          href={`/events/${transaction.event.id}/review?transactionId=${transaction.id}`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                        >
                          Tulis Review
                        </Link>
                      )}

                      <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
