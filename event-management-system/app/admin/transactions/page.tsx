"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Eye, Filter } from "lucide-react";

interface Transaction {
  id: string;
  event: {
    id: string;
    title: string;
    location: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  quantity: number;
  finalPrice: number;
  status: string;
  paymentProofUrl?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  WAITING_FOR_PAYMENT: "bg-yellow-100 text-yellow-800",
  WAITING_FOR_ADMIN_CONFIRMATION: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is admin
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/auth/login");
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== "ADMIN") {
      router.push("/");
      return;
    }

    setUser(userData);
    fetchAllTransactions();
  }, []);

  const fetchAllTransactions = async () => {
    try {
      // For admin, fetch all transactions from admin endpoint
      const response = await fetch("/api/admin/transactions");
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
        setError("");
      } else {
        setError(data.error || "Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setError("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        fetchAllTransactions();
        alert("Transaksi berhasil disetujui!");
      } else {
        alert(data.error || "Gagal menyetujui transaksi");
      }
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("Gagal menyetujui transaksi");
    }
  };

  const handleReject = async (transactionId: string) => {
    if (!rejectionReason.trim()) {
      alert("Silakan masukkan alasan penolakan");
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejectionReason }),
      });

      const data = await response.json();
      if (response.ok) {
        fetchAllTransactions();
        setSelectedTransaction(null);
        setRejectionReason("");
        alert("Transaksi berhasil ditolak!");
      } else {
        alert(data.error || "Gagal menolak transaksi");
      }
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("Gagal menolak transaksi");
    }
  };

  const filteredTransactions =
    filterStatus === "ALL"
      ? transactions
      : transactions.filter((t) => t.status === filterStatus);

  const pendingCount = transactions.filter(
    (t) => t.status === "WAITING_FOR_ADMIN_CONFIRMATION"
  ).length;
  const doneCount = transactions.filter((t) => t.status === "DONE").length;
  const rejectedCount = transactions.filter((t) => t.status === "REJECTED").length;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Kelola Transaksi
            </h1>
            <Link
              href="/admin/events"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              ← Kembali ke Event
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Total: {transactions.length} transaksi
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Menunggu Approval</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Disetujui</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{doneCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ditolak</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
            }`}
          >
            Semua
          </button>
          {["WAITING_FOR_ADMIN_CONFIRMATION", "WAITING_FOR_PAYMENT", "DONE", "REJECTED", "EXPIRED", "CANCELLED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
              }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            Tidak ada transaksi dengan status ini
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Event</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {transaction.event.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {transaction.user.name}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.user.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      Rp{transaction.finalPrice.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        statusColors[transaction.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {transaction.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {transaction.status === "WAITING_FOR_ADMIN_CONFIRMATION" && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {transaction.paymentProofUrl && (
                      <button
                        onClick={() => setPreviewProofUrl(transaction.paymentProofUrl || null)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Lihat Bukti
                      </button>
                    )}
                    <button
                      onClick={() => handleApprove(transaction.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Setujui
                    </button>
                    <button
                      onClick={() => setSelectedTransaction(transaction)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      <XCircle className="w-4 h-4" />
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Tolak Transaksi
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Alasan penolakan untuk {selectedTransaction.event.title}
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Masukkan alasan penolakan..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleReject(selectedTransaction.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Tolak
              </button>
              <button
                onClick={() => {
                  setSelectedTransaction(null);
                  setRejectionReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Preview Modal */}
      {previewProofUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Bukti Pembayaran
              </h2>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              {previewProofUrl && previewProofUrl.startsWith('data:') ? (
                // If it's base64 data URL, display as image
                <img
                  src={previewProofUrl}
                  alt="Payment Proof"
                  className="w-full rounded-lg max-h-[60vh] object-contain"
                />
              ) : previewProofUrl && previewProofUrl.startsWith('http') ? (
                // If it's an external URL, display as image
                <img
                  src={previewProofUrl}
                  alt="Payment Proof"
                  className="w-full rounded-lg max-h-[60vh] object-contain"
                  onError={(e) => {
                    console.error("Failed to load image");
                  }}
                />
              ) : (
                // If it's a simple filename/text or no proof
                <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg text-center">
                  {previewProofUrl ? (
                    <>
                      <p className="text-gray-500 dark:text-gray-400 mb-2">Bukti tidak terbaca</p>
                      <p className="text-gray-900 dark:text-white font-mono break-words text-sm">
                        {previewProofUrl}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">Tidak ada bukti pembayaran</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {previewProofUrl && previewProofUrl.startsWith('http') && (
                <a
                  href={previewProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Buka di Tab Baru
                </a>
              )}
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
