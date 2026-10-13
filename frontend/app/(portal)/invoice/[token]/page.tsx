"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { MOCK_INVOICES, MOCK_WORKSHOP, formatCurrency } from "@/lib/mock-data";

export default function CustomerInvoicePortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const invoice = MOCK_INVOICES[0];
  const [paid, setPaid] = useState(invoice.paymentStatus === "paid");
  const [processing, setProcessing] = useState(false);

  const handlePayNow = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPaid(true);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Invoice Banner */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#22c55e]">
            Tax Invoice
          </span>
          <span className="font-mono text-xs text-[#737373]">
            {invoice.invoiceNumber}
          </span>
        </div>
        <h1 className="text-xl font-black text-white">
          Invoice for {invoice.customerName}
        </h1>
        <p className="text-xs text-[#8a8a8a]">
          Vehicle: {invoice.vehicleName} &bull; Plate:{" "}
          <span className="font-mono text-white font-bold">
            {invoice.licensePlate}
          </span>
        </p>
      </div>

      {/* Invoice Summary Card */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-[#212121] pb-3">
          <div>
            <p className="text-xs text-[#737373]">Status</p>
            <p className="text-sm font-bold text-white capitalize">
              {paid ? "Paid in Full" : "Pending Payment"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#737373]">Total Due</p>
            <p className="font-mono text-xl font-black text-[#22c55e]">
              {paid
                ? "R 0.00"
                : formatCurrency(invoice.total - invoice.amountPaid)}
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
            <span>VAT ({invoice.taxRatePercent}%):</span>
            <span className="font-mono text-white">
              {formatCurrency(invoice.taxAmount)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-white pt-2 border-t border-[#262626]">
            <span>Grand Total:</span>
            <span className="font-mono text-[#22c55e]">
              {formatCurrency(invoice.total)}
            </span>
          </div>
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
            className="w-full min-h-[48px] rounded-xl bg-[#22c55e] text-black font-black text-sm hover:bg-[#16a34a] shadow-lg transition-all select-none touch-manipulation flex items-center justify-center gap-2"
          >
            {processing ? (
              <span>Securing transaction... ⏳</span>
            ) : (
              <span>💳 Pay {formatCurrency(invoice.total)} via Card / EFT</span>
            )}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 p-6 text-center space-y-2">
          <span className="text-3xl">✅</span>
          <h3 className="text-lg font-black text-white">Payment Received</h3>
          <p className="text-xs text-[#86efac]">
            Thank you. Your payment receipt has been issued and emailed to{" "}
            {invoice.customerEmail}.
          </p>
        </div>
      )}
    </div>
  );
}
