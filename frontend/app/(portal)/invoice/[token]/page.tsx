"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  fetchPortalInvoice,
  recordPortalPayment,
  type ApiInvoice,
} from "@/lib/api/invoices";
import { formatCurrency, formatDate } from "@/lib/format";

const WORKSHOP_INFO = {
  name: "MechanicMate Workshop (Pty) Ltd",
  vatNumber: "ZA-4902188201",
  phone: "+27 11 482 9900",
  email: "billing@mechanicmate.co.za",
  address: "Unit 4, Industrial Park, Main Reef Road, Johannesburg, 2092",
  bankName: "Standard Bank SA",
  accountNumber: "021 984 5510",
  branchCode: "051001",
};

export default function CustomerInvoicePortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [invoice, setInvoice] = useState<ApiInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "eft">("card");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchPortalInvoice(token)
      .then((data) => {
        setInvoice(data);
        setPaid(
          data.status === "paid" ||
            Number(data.paid_amount) >= Number(data.total_amount)
        );
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading portal invoice:", err);
        setError(
          "Unable to find or load this tax invoice. Please verify your link or contact the workshop."
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handlePayNow = async () => {
    if (!invoice) return;
    try {
      setProcessing(true);
      const balance = Number(invoice.total_amount) - Number(invoice.paid_amount);
      const pmt = await recordPortalPayment(token, {
        amount: balance > 0 ? balance : Number(invoice.total_amount),
        payment_method: paymentMethod,
        transaction_reference: `PORTAL-${paymentMethod.toUpperCase()}-${Date.now()
          .toString()
          .slice(-6)}`,
      });
      setPaid(true);
      setInvoice({
        ...invoice,
        paid_amount: invoice.total_amount,
        status: "paid",
        payments: [...(invoice.payments || []), pmt],
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
        <p className="text-xs text-[#8c8c8c]">Loading official tax invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm font-bold text-red-400">
          {error || "Invoice not found."}
        </p>
        <p className="text-xs text-neutral-500">
          Please contact {WORKSHOP_INFO.name} ({WORKSHOP_INFO.phone}) for assistance.
        </p>
      </div>
    );
  }

  const allItems = invoice.items || [];
  const partsItems = allItems.filter((i) => i.item_type === "part");
  const laborItems = allItems.filter(
    (i) => i.item_type === "labour" || i.item_type === "labor"
  );

  const balanceDue = paid
    ? 0
    : Math.max(0, Number(invoice.total_amount) - Number(invoice.paid_amount));

  return (
    <div className="space-y-6 pb-8">
      {/* Official Tax Invoice Sheet */}
      <div className="overflow-hidden rounded-3xl bg-[#121212] border border-[#262626] shadow-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#22c55e] via-emerald-400 to-[#15803d]" />

        <div className="p-5 sm:p-7 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#242424] pb-5">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#22c55e] block">
                SARS Tax Invoice • VAT Reg {WORKSHOP_INFO.vatNumber}
              </span>
              <h1 className="text-xl font-black text-white">
                {WORKSHOP_INFO.name}
              </h1>
              <p className="text-xs text-[#8a8a8a]">{WORKSHOP_INFO.address}</p>
              <p className="text-xs font-mono text-[#7a7a7a]">
                {WORKSHOP_INFO.phone} • {WORKSHOP_INFO.email}
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                  paid
                    ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30"
                    : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    paid ? "bg-[#22c55e]" : "bg-[#f59e0b]"
                  }`}
                />
                {paid ? "Paid in Full ✓" : "Payment Due"}
              </span>
              <p className="font-mono text-lg font-black text-white pt-1">
                #{invoice.invoice_number}
              </p>
              <p className="text-xs text-[#8a8a8a]">
                Issued {formatDate(invoice.created_at)} • Due{" "}
                {formatDate(invoice.due_date)}
              </p>
            </div>
          </div>

          {/* Client & Vehicle Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-2xl bg-[#181818] border border-[#262626] p-4 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737373] block">
                Billed To
              </span>
              <p className="text-sm font-bold text-white">
                {invoice.customer_name || "Valued Workshop Client"}
              </p>
              {invoice.customer_phone && (
                <p className="text-xs font-mono text-[#8a8a8a]">
                  {invoice.customer_phone}
                </p>
              )}
              {invoice.ro_number && (
                <p className="text-xs font-mono text-[#22c55e]">
                  Repair Order: {invoice.ro_number}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-[#181818] border border-[#262626] p-4 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737373] block">
                Vehicle Serviced
              </span>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-white">
                  {invoice.vehicle_name || "Vehicle Service"}
                </p>
                {invoice.license_plate && (
                  <span className="font-mono text-xs font-black text-black bg-[#22c55e] px-2 py-0.5 rounded uppercase">
                    {invoice.license_plate}
                  </span>
                )}
              </div>
              {invoice.customer_concern && (
                <p className="text-xs text-[#8a8a8a] line-clamp-2">
                  {invoice.customer_concern}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Line Items */}
          {allItems.length > 0 && (
            <div className="space-y-3">
              <h2
                id="portal-invoice-items-heading"
                className="text-xs font-black uppercase tracking-wider text-white"
              >
                Itemized Parts &amp; Labour Breakdown
              </h2>

              <div
                tabIndex={0}
                role="region"
                aria-labelledby="portal-invoice-items-heading"
                className="overflow-x-auto rounded-2xl border border-[#262626]"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#181818] text-[#8a8a8a] uppercase text-[10px] tracking-wider border-b border-[#262626]">
                    <tr>
                      <th scope="col" className="px-3.5 py-2.5 font-bold">
                        Description
                      </th>
                      <th scope="col" className="px-2.5 py-2.5 font-bold text-center">
                        Type
                      </th>
                      <th scope="col" className="px-2.5 py-2.5 font-bold text-center">
                        Qty / Hrs
                      </th>
                      <th scope="col" className="px-3.5 py-2.5 font-bold text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f1f1f]">
                    {[...partsItems, ...laborItems].map((item, idx) => (
                      <tr key={item.id || idx}>
                        <th
                          scope="row"
                          className="px-3.5 py-3 text-white font-semibold text-left"
                        >
                          {item.description}
                        </th>
                        <td className="px-2.5 py-3 text-center">
                          <span className="rounded bg-[#1f1f1f] px-2 py-0.5 text-[10px] font-mono uppercase text-[#a3a3a3]">
                            {item.item_type}
                          </span>
                        </td>
                        <td className="px-2.5 py-3 text-center font-mono text-[#9a9a9a]">
                          {item.item_type === "part"
                            ? item.quantity
                            : `${Number(item.labour_hours || item.quantity || 1).toFixed(1)}h`}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-bold text-white">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals & EFT Info */}
          <div className="rounded-2xl bg-[#181818] border border-[#262626] p-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-[#9a9a9a]">
              <span>Subtotal (Excl. VAT):</span>
              <span className="font-mono text-white">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#9a9a9a]">
              <span>SARS VAT ({invoice.tax_rate_percent}%):</span>
              <span className="font-mono text-white">
                {formatCurrency(invoice.tax_amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-[#262626]">
              <span>Invoice Total:</span>
              <span className="font-mono text-[#22c55e]">
                {formatCurrency(invoice.total_amount)}
              </span>
            </div>
            {Number(invoice.paid_amount) > 0 && !paid && (
              <div className="flex justify-between text-xs text-[#38bdf8]">
                <span>Already Paid:</span>
                <span className="font-mono">
                  -{formatCurrency(invoice.paid_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-[#262626]">
              <span className="font-bold uppercase tracking-wider text-neutral-300">
                Balance Due:
              </span>
              <span
                className={`font-mono text-lg font-black ${
                  balanceDue === 0 ? "text-[#22c55e]" : "text-[#f59e0b]"
                }`}
              >
                {formatCurrency(balanceDue)}
              </span>
            </div>
          </div>

          {/* Direct EFT Details */}
          <div className="rounded-2xl bg-[#161616] border border-[#242424] p-4 text-xs space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#22c55e] block">
              Direct EFT Banking Details
            </span>
            <p className="text-[#a3a3a3]">
              Bank: <strong className="text-white">{WORKSHOP_INFO.bankName}</strong> • Acc:{" "}
              <strong className="font-mono text-white">
                {WORKSHOP_INFO.accountNumber}
              </strong>{" "}
              • Branch:{" "}
              <strong className="font-mono text-white">
                {WORKSHOP_INFO.branchCode}
              </strong>
            </p>
            <p className="text-[#8a8a8a]">
              Beneficiary Reference:{" "}
              <strong className="font-mono text-[#22c55e]">
                {invoice.invoice_number}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Payment Action / Receipt Banner */}
      {!paid ? (
        <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Instant Online Settlement
              </h3>
              <p className="text-xs text-[#737373]">
                Pay securely via Visa / Mastercard or Instant EFT (Ozow / PayFast)
              </p>
            </div>
            <select
              aria-label="Choose payment method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as "card" | "eft")}
              className="rounded-xl bg-[#1c1c1c] border border-[#2e2e2e] px-3 py-2 text-xs font-bold text-white"
            >
              <option value="card">💳 Credit / Debit Card</option>
              <option value="eft">🏦 Instant EFT</option>
            </select>
          </div>

          <button
            onClick={handlePayNow}
            disabled={processing}
            className="w-full min-h-[48px] rounded-xl bg-[#22c55e] text-black font-black text-sm hover:bg-[#16a34a] shadow-lg transition-all select-none touch-manipulation flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {processing ? (
              <span>Processing payment... ⏳</span>
            ) : (
              <span>
                💳 Settle {formatCurrency(balanceDue)} Online Now
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 p-6 text-center space-y-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#22c55e] text-black font-black text-lg">
            ✓
          </span>
          <h3 className="text-lg font-black text-white">
            Tax Invoice Paid in Full
          </h3>
          <p className="text-xs text-[#86efac]">
            Thank you! Your payment has been recorded against #{invoice.invoice_number}.
          </p>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#182c1f] border border-[#22c55e]/40 px-4 py-2 text-xs font-bold text-white hover:bg-[#1f3a29] cursor-pointer"
          >
            <span>🖨️ Print / Download Official Receipt</span>
          </button>
        </div>
      )}
    </div>
  );
}
