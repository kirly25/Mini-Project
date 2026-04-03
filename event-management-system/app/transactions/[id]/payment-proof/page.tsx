"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Upload, ArrowLeft, CheckCircle } from "lucide-react";

interface Transaction {
  id: string;
  event: { title: string };
  quantity: number;
  finalPrice: number;
  status: string;
  paymentExpiredAt: string;
}

export default function PaymentProofPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTransaction();
  }, [transactionId]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/${transactionId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setTransaction(data.data);
      } else {
        setError(data.error || "Transaction not found");
      }
    } catch (err) {
      setError("Failed to load transaction");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!transaction) return;

    const timer = setInterval(() => {
      const expiresAt = new Date(transaction.paymentExpiredAt).getTime();
      const now = new Date().getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        clearInterval(timer);
        return;
      }

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [transaction]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a payment proof file");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        const formData = new FormData();
        formData.append("paymentProofUrl", base64);
        formData.append("paymentMethod", paymentMethod);

        const response = await fetch(`/api/transactions/${transactionId}/payment-proof`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Upload failed");
          setUploading(false);
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          router.push("/transactions");
        }, 2000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to upload payment proof");
      console.error(err);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (!transaction || error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Transaction not found</p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "The transaction you're looking for doesn't exist."}</p>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Transactions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/transactions" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Unggah Bukti Pembayaran</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="w-5 h-5" />
            <span>Bukti pembayaran berhasil diunggah! Mengarahkan...</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Timer Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Clock className={`w-6 h-6 ${timeLeft === "EXPIRED" ? "text-red-500" : "text-blue-500"}`} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sisa Waktu Pembayaran</h2>
          </div>
          <div className={`text-4xl font-bold ${timeLeft === "EXPIRED" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
            {timeLeft || "Loading..."}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {timeLeft === "EXPIRED" ? "Waktu pembayaran telah berakhir. Transaksi akan dibatalkan." : "Anda memiliki 2 jam untuk mengunggah bukti pembayaran"}
          </p>
        </div>

        {/* Transaction Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detail Transaksi</h2>
          <div className="space-y-2 text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Event:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{transaction.event.title}</span>
            </div>
            <div className="flex justify-between">
              <span>Jumlah Tiket:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{transaction.quantity}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Pembayaran:</span>
              <span className="text-blue-600 dark:text-blue-400">Rp{transaction.finalPrice.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Pilih Metode Pembayaran</h2>
          <div className="space-y-3">
            {[
              { value: "BANK_TRANSFER", label: "Transfer Bank", desc: "Kirim ke rekening kami" },
              { value: "E_WALLET", label: "E-Wallet", desc: "GCash, Gopay, OVO, dll" },
              { value: "CREDIT_CARD", label: "Kartu Kredit", desc: "Visa, Mastercard" },
            ].map((method) => (
              <label key={method.value} className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{method.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{method.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Unggah Bukti Pembayaran</h2>

          {preview ? (
            <div className="mb-4">
              <img src={preview} alt="Preview" className="max-w-full h-48 object-contain rounded-lg" />
              <button
                onClick={() => {
                  setFile(null);
                  setPreview("");
                }}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Ubah gambar
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-700 dark:text-gray-300 font-semibold">Klik untuk memilih file</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">atau drag and drop</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG (maks 5MB)</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading || timeLeft === "EXPIRED"}
            className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Mengunggah..." : "Konfirmasi Pembayaran"}
          </button>
        </div>
      </div>
    </div>
  );
}
