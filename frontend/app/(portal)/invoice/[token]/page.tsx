"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchPortalInvoice, recordPayment, type ApiInvoice } from "@/lib/api/invoices";
import { formatCurrency, formatDate } from "@/lib/format";

export default function CustomerInvoicePortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [invoice, setInvoice] = useState<ApiInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchPortalInvoice(token)
      .then((data) => {
        setInvoice(data);
        setPaid(data.status === "paid" || data.paid_amount >= data.total_amount);
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading portal invoice:", err);
        setError("Unable to find or load this tax invoice. The link may have expired.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handlePayNow = async () => {
    if (!invoice) return;
    try {
      setProcessing(true);
      const balance = invoice.total_amount - invoice.paid_amount;
      await recordPayment(invoice.id, {
        amount: balance > 0 ? balance : invoice.total_amount,
        payment_method: "card",
        transaction_reference: `PORTAL-PAY-${Date.now().toString().slice(-6)}`,
      });
      setPaid(true);
      setInvoice({
        ...invoice,
        paid_amount: invoice.total_amount,
        status: "paid",
      });
    } catch (err) {
      console.error("Failed to complete online payment:", err);
      alert("Payment processing error. Please contact the workshop.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
        <p className="text-xs text-[#8c8c8c]">Loading tax invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm text-red-400">{error || "Invoice not found."}</p>
        <p className="text-xs text-neutral-500">Please contact the workshop if you need assistance.</p>
      </div>
    );
  }

  const balanceDue = paid ? 0 : Math.max(0, invoice.total_amount - invoice.paid_amount);

  return (
    <div className="space-y-6">
      {/* Invoice Banner */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22c55e]">
            Official Tax Invoice
          </span>
          <span className="font-mono text-xs text-[#737373]">
            {invoice.invoice_number}
          </span>
        </div>
        <h1 className="text-xl font-black text-white">
          Invoice #{invoice.invoice_number}
        </h1>
        <p className="text-xs text-[#8a8a8a]">
          Date Issued: {formatDate(invoice.created_at)} &bull; Due: {formatDate(invoice.due_date)}
        </p>
      </div>

      {/* Invoice Summary Card */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-[#212121] pb-3">
          <div>
            <p className="text-xs text-[#737373]">Payment Status</p>
            <p className="text-sm font-bold text-white capitalize">
              {paid ? "Paid in Full ✓" : "Pending Payment"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#737373]">Balance Due</p>
            <p className="font-mono text-xl font-black text-[#22c55e]">
              {formatCurrency(balanceDue)}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-[#8a8a8a]">
          <div className="flex justify-between">
            <span>Subtotal (Excl. VAT):</span>
            <span className="font-mono text-white">
              {formatCurrency(invoice.subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>VAT ({invoice.tax_rate_percent}%):</span>
            <span className="font-mono text-white">
              {formatCurrency(invoice.tax_amount)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-white pt-2 border-t border-[#262626]">
            <span>Grand Total:</span>
            <span className="font-mono text-[#22c55e]">
              {formatCurrency(invoice.total_amount)}
            </span>
          </div>
          {invoice.paid_amount > 0 && !paid && (
            <div className="flex justify-between text-xs text-[#38bdf8]">
              <span>Already Paid:</span>
              <span className="font-mono">
                -{formatCurrency(invoice.paid_amount)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Options */}
      {!paid ? (
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Online Settlement</h3>
          <p className="text-xs text-[#737373]">
            Settle securely via instant EFT, Visa, Mastercard, or Ozow.
          </p>

          <button
            onClick={handlePayNow}
            disabled={processing}
            className="w-full min-h-[48px] rounded-xl bg-[#22c55e] text-black font-black text-sm hover:bg-[#16a34a] shadow-lg transition-all select-none touch-manipulation flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {processing ? (
              <span>Securing transaction... ⏳</span>
            ) : (
              <span>💳 Settle Balance {formatCurrency(balanceDue)} via Card / EFT</span>
            )}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 p-6 text-center space-y-2">
          <span className="text-3xl">✅</span>
          <h3 className="text-lg font-black text-white">Payment Received</h3>
          <p className="text-xs text-[#86efac]">
            Thank you! This invoice has been marked as Paid in Full in our workshop accounting ledger.
          </p>
        </div>
      )}
    </div>
  );
}
