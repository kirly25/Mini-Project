"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit2, AlertCircle } from "lucide-react";

interface Voucher {
  id: string;
  code: string;
  description?: string;
  discountAmount: number;
  isPercentage: boolean;
  maxUses: number | null;
  usedCount: number;
  expiresAt?: string;
  createdAt: string;
  events: Array<{ event: { id: string; title: string } }>;
}

export default function AdminVouchersPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountAmount: "",
    isPercentage: false,
    maxUses: "",
    expiresAt: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check authentication
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/auth/admin/login");
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== "ADMIN") {
      router.push("/");
      return;
    }

    setUser(userData);
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem("user");
      const userData = userStr ? JSON.parse(userStr) : null;

      const response = await fetch("/api/vouchers?includeAll=true", {
        headers: {
          "x-user": JSON.stringify(userData),
        },
      });

      const data = await response.json();
      if (data.success) {
        setVouchers(data.data);
      } else {
        setError(data.error || "Failed to load vouchers");
      }
    } catch (err) {
      console.error("Failed to fetch vouchers:", err);
      setError("Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!formData.code || !formData.discountAmount) {
        setError("Code and discount amount are required");
        return;
      }

      const payload = {
        ...formData,
        discountAmount: parseFloat(formData.discountAmount),
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        expiresAt: formData.expiresAt || null,
      };

      const response = await fetch("/api/vouchers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": JSON.stringify(user),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create voucher");
        return;
      }

      // Reset form
      setFormData({
        code: "",
        description: "",
        discountAmount: "",
        isPercentage: false,
        maxUses: "",
        expiresAt: "",
      });
      setShowForm(false);

      // Refresh list
      fetchVouchers();
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to create voucher");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (voucherId: string) => {
    if (!confirm("Are you sure you want to delete this voucher?")) return;

    try {
      const response = await fetch(`/api/vouchers/${voucherId}`, {
        method: "DELETE",
        headers: {
          "x-user": JSON.stringify(user),
        },
      });

      if (response.ok) {
        fetchVouchers();
      } else {
        setError("Failed to delete voucher");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to delete voucher");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading vouchers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Promo Vouchers
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage event promotions and discount codes
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Buat Voucher Baru
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Create New Voucher
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kode Voucher *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g., SUMMER2026"
                    maxLength={20}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Discount Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jumlah Diskon *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.discountAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, discountAmount: e.target.value })
                      }
                      placeholder="100000"
                      min="0"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <select
                      value={formData.isPercentage ? "percent" : "fixed"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isPercentage: e.target.value === "percent",
                        })
                      }
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="fixed">Rp (Fixed)</option>
                      <option value="percent">% (Percentage)</option>
                    </select>
                  </div>
                </div>

                {/* Max Uses */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maksimal Penggunaan
                  </label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: e.target.value })
                    }
                    placeholder="Kosongkan untuk unlimited"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Expires At */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Expired
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiresAt: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="e.g., 50% off untuk event musik"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Creating..." : "Create Voucher"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vouchers List */}
        {vouchers.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tidak ada voucher
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Buat Voucher Pertama
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {vouchers.map((voucher) => {
              const isExpired =
                voucher.expiresAt && new Date(voucher.expiresAt) < new Date();
              const isLimitReached =
                voucher.maxUses &&
                voucher.usedCount >= voucher.maxUses;

              return (
                <div
                  key={voucher.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {voucher.code}
                        </h3>
                        {isExpired && (
                          <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm rounded-full">
                            Expired
                          </span>
                        )}
                        {isLimitReached && (
                          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-sm rounded-full">
                            Limit Reached
                          </span>
                        )}
                      </div>

                      {voucher.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {voucher.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Discount
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {voucher.isPercentage
                              ? `${voucher.discountAmount}%`
                              : `Rp${voucher.discountAmount.toLocaleString(
                                  "id-ID"
                                )}`}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Used
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {voucher.usedCount}
                            {voucher.maxUses ? `/${voucher.maxUses}` : ""}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Created
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {new Date(voucher.createdAt).toLocaleDateString(
                              "id-ID"
                            )}
                          </p>
                        </div>

                        {voucher.expiresAt && (
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Expires
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {new Date(voucher.expiresAt).toLocaleDateString(
                                "id-ID"
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {voucher.events.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Applied to {voucher.events.length} event(s):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {voucher.events.map((ev) => (
                              <span
                                key={ev.event.id}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded"
                              >
                                {ev.event.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleDelete(voucher.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete voucher"
                      >
                        <Trash2 className="w-5 h-5" />
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
