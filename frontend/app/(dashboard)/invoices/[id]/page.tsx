"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { type ApiInvoice } from "@/lib/api/invoices";
import { type RepairOrderRead } from "@/lib/api/jobs";
import { useApi } from "@/lib/api/use-api";
import { formatCurrency, formatDate } from "@/lib/format";

const WORKSHOP_INFO = {
  name: "MechanicMate Workshop (Pty) Ltd",
  shortName: "MechanicMate Workshop",
  regNumber: "2024/884120/07",
  vatNumber: "ZA-4902188201",
  accreditation: "RMI & MIWA Accredited Service Centre",
  phone: "+27 11 482 9900",
  email: "billing@mechanicmate.co.za",
  address: "Unit 4, Industrial Park, Main Reef Road, Johannesburg, 2092",
  bankName: "Standard Bank South Africa",
  accountName: "MechanicMate Workshop (Pty) Ltd",
  accountNumber: "021 984 5510",
  branchCode: "051001 (Universal)",
  accountType: " Current / Business Cheque",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  draft: {
    label: "Draft",
    text: "text-neutral-300",
    bg: "bg-neutral-800/50",
    border: "border-neutral-700",
    dot: "bg-neutral-400",
  },
  sent: {
    label: "Awaiting Payment",
    text: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    border: "border-[#f59e0b]/30",
    dot: "bg-[#f59e0b]",
  },
  "partially-paid": {
    label: "Partially Paid",
    text: "text-[#38bdf8]",
    bg: "bg-[#38bdf8]/10",
    border: "border-[#38bdf8]/30",
    dot: "bg-[#38bdf8]",
  },
  paid: {
    label: "Paid in Full",
    text: "text-[#22c55e]",
    bg: "bg-[#22c55e]/10",
    border: "border-[#22c55e]/30",
    dot: "bg-[#22c55e]",
  },
  overdue: {
    label: "Overdue",
    text: "text-[#ef4444]",
    bg: "bg-[#ef4444]/10",
    border: "border-[#ef4444]/30",
    dot: "bg-[#ef4444]",
  },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const api = useApi();

  const [invoice, setInvoice] = useState<ApiInvoice | null>(null);
  const [job, setJob] = useState<RepairOrderRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "eft" | "cash">("card");
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    api.invoices
      .get(id)
      .then(async (inv) => {
        setInvoice(inv);
        if (inv.repair_order_id) {
          try {
            const jobData = await api.jobs.get(inv.repair_order_id);
            setJob(jobData);
          } catch (e) {
            console.warn("Could not load associated repair order:", e);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load invoice:", err);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    const balance = invoice.total_amount - invoice.paid_amount;
    if (balance <= 0) return;

    try {
      setProcessingPayment(true);
      const payment = await api.invoices.recordPayment(invoice.id, {
        amount: balance,
        payment_method: paymentMethod,
        transaction_reference: `${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      });

      setInvoice({
        ...invoice,
        paid_amount: invoice.total_amount,
        status: "paid",
        payments: [...(invoice.payments || []), payment],
      });
      setShowPaymentSuccess(true);
      setTimeout(() => setShowPaymentSuccess(false), 4500);
    } catch (err) {
      console.error("Failed to record payment:", err);
      alert("Failed to record payment. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCopyPortalLink = () => {
    if (!invoice || typeof window === "undefined") return;
    const url = `${window.location.origin}/invoice/${invoice.invoice_number}`;
    navigator.clipboard.writeText(url);
    setCopiedPortalLink(true);
    setTimeout(() => setCopiedPortalLink(false), 2500);
  };

  if (loading) {
    return (
      <AppShell activeItem="invoices">
        <div className="mx-auto max-w-5xl px-4 py-20 flex flex-col items-center justify-center space-y-4">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
          <p className="text-xs font-semibold text-[#8c8c8c]">
            Preparing official SARS tax invoice...
          </p>
        </div>
      </AppShell>
    );
  }

  if (!invoice) {
    return (
      <AppShell activeItem="invoices">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
          <p className="text-sm font-bold text-red-400">Tax invoice not found</p>
          <Link
            href="/invoices"
            className="inline-block rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
          >
            ← Return to Invoices
          </Link>
        </div>
      </AppShell>
    );
  }

  const allItems = job?.items?.length ? job.items : invoice.items || [];
  const partsItems = allItems.filter((i) => i.item_type === "part");
  const laborItems = allItems.filter(
    (i) => i.item_type === "labour" || i.item_type === "labor"
  );

  const partsSubtotal = partsItems.reduce((acc, p) => acc + Number(p.total_price || 0), 0);
  const laborSubtotal = laborItems.reduce((acc, l) => acc + Number(l.total_price || 0), 0);
  const calculatedSubtotal =
    partsSubtotal + laborSubtotal > 0
      ? partsSubtotal + laborSubtotal
      : Number(invoice.subtotal || 0);
  const calculatedVat =
    partsSubtotal + laborSubtotal > 0
      ? calculatedSubtotal * (Number(invoice.tax_rate_percent || 15) / 100)
      : Number(invoice.tax_amount || 0);
  const grandTotal =
    partsSubtotal + laborSubtotal > 0
      ? calculatedSubtotal + calculatedVat
      : Number(invoice.total_amount || 0);
  const balanceDue =
    invoice.status === "paid"
      ? 0
      : Math.max(0, grandTotal - Number(invoice.paid_amount || 0));

  const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.sent;

  const customerName =
    job?.customer?.name || invoice.customer_name || "Workshop Client";
  const customerPhone =
    job?.customer?.phone || invoice.customer_phone || "+27 11 482 9900";
  const customerEmail =
    job?.customer?.email || invoice.customer_email || "client@mechanicmate.co.za";
  const vehicleName = job?.vehicle
    ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`
    : invoice.vehicle_name || "Vehicle Service";
  const licensePlate =
    job?.vehicle?.license_plate || invoice.license_plate || "WORKSHOP";
  const vehicleVin = job?.vehicle?.vin || invoice.vehicle_vin || "Recorded on RO";
  const vehicleMileage =
    job?.vehicle?.mileage_km || invoice.vehicle_mileage_km || null;
  const roNumber = job?.ro_number || invoice.ro_number || null;
  const concernText =
    job?.customer_concern || invoice.customer_concern || null;
  const workPerformedText =
    job?.recommended_work || job?.diagnosis || invoice.recommended_work || null;

  const cleanWaPhone = customerPhone.replace(/\D/g, "").replace(/^0/, "27");
  const portalInvoiceUrl = `${
    typeof window !== "undefined"
      ? window.location.origin
      : "https://mechanicmate.vercel.app"
  }/invoice/${invoice.invoice_number}`;

  return (
    <AppShell activeItem="invoices">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Top Action Bar (Hidden when printing) */}
        <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl bg-[#141414] border border-[#242424] p-4 sm:p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link
                href="/invoices"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white transition-colors"
              >
                <span>← All Tax Invoices</span>
              </Link>
              {roNumber && (
                <>
                  <span className="text-[#333]">•</span>
                  <Link
                    href={`/jobs/${invoice.repair_order_id}`}
                    className="text-xs font-bold text-[#22c55e] hover:underline"
                  >
                    Repair Order {roNumber}
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Tax Invoice {invoice.invoice_number}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* Interactive Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {invoice.status !== "paid" && (
              <div className="flex items-center gap-1.5 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] p-1">
                <select
                  aria-label="Payment method"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as "card" | "eft" | "cash")
                  }
                  className="bg-transparent text-xs font-bold text-neutral-200 px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="card" className="bg-[#141414]">
                    💳 Card POS
                  </option>
                  <option value="eft" className="bg-[#141414]">
                    🏦 Instant EFT
                  </option>
                  <option value="cash" className="bg-[#141414]">
                    💵 Cash
                  </option>
                </select>
                <button
                  onClick={handleMarkAsPaid}
                  disabled={processingPayment}
                  className="rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/40 px-3 py-1.5 text-xs font-black text-[#22c55e] hover:bg-[#22c55e] hover:text-black transition-all cursor-pointer disabled:opacity-50"
                >
                  {processingPayment ? "Recording..." : "Record Full Payment"}
                </button>
              </div>
            )}

            <button
              onClick={handleCopyPortalLink}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] px-3.5 py-2 text-xs font-bold text-neutral-200 hover:bg-[#242424] transition-all cursor-pointer"
            >
              <span>{copiedPortalLink ? "✓ Link Copied" : "🔗 Copy Payment Link"}</span>
            </button>

            <a
              href={`https://wa.me/${cleanWaPhone}?text=${encodeURIComponent(
                `Hi ${customerName}, here is your official tax invoice ${invoice.invoice_number} from ${WORKSHOP_INFO.shortName} for ${vehicleName} (${licensePlate}).\n\nTotal: ${formatCurrency(
                  grandTotal
                )}\nBalance Due: ${formatCurrency(
                  balanceDue
                )}\n\nView & Settle Online: ${portalInvoiceUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#0f2416] border border-[#1d472c] px-3.5 py-2 text-xs font-bold text-[#22c55e] hover:bg-[#163620] transition-all"
            >
              <span>💬 WhatsApp Invoice</span>
            </a>

            <button
              onClick={() => window.print()}
              className="min-h-[40px] inline-flex items-center gap-2 rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-black text-black hover:bg-[#16a34a] shadow-md transition-all cursor-pointer"
            >
              <span>🖨️ Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Payment Confirmation Banner */}
        {showPaymentSuccess && (
          <div className="no-print rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 p-4 flex items-center gap-3 text-sm text-[#22c55e] animate-in fade-in">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22c55e] text-black font-black text-xs">
              ✓
            </span>
            <div>
              <p className="font-bold text-white">Payment Recorded & Ledger Updated</p>
              <p className="text-xs text-[#86efac]">
                Tax Invoice {invoice.invoice_number} is now marked as Paid in Full.
              </p>
            </div>
          </div>
        )}

        {/* ─── Executive SARS Tax Invoice Sheet ─────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-[#111111] border border-[#262626] shadow-2xl print:rounded-none print:border-none print:bg-white print:text-black print:shadow-none">
          {/* Top Emerald Signature Accent Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-[#22c55e] via-emerald-400 to-[#15803d] print:bg-black" />

          <div className="p-6 sm:p-10 space-y-8 print:p-2">
            {/* 1. Letterhead & Invoice Meta */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-[#242424] pb-7 print:border-neutral-300">
              {/* Workshop Brand Identity */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#22c55e] text-black font-black text-base shadow-md print:border print:border-black">
                    MM
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#22c55e] print:text-neutral-700 block">
                      {WORKSHOP_INFO.accreditation}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight print:text-black">
                      {WORKSHOP_INFO.name}
                    </h2>
                  </div>
                </div>

                <p className="text-xs text-[#9a9a9a] print:text-neutral-700 max-w-md leading-relaxed">
                  {WORKSHOP_INFO.address}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#8e8e8e] print:text-neutral-800 pt-0.5">
                  <span>Tel: {WORKSHOP_INFO.phone}</span>
                  <span>Email: {WORKSHOP_INFO.email}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="rounded-md bg-[#1a1a1a] border border-[#2d2d2d] px-2.5 py-1 font-mono text-[11px] font-bold text-white print:bg-neutral-100 print:text-black print:border-neutral-400">
                    SARS VAT Reg: {WORKSHOP_INFO.vatNumber}
                  </span>
                  <span className="rounded-md bg-[#1a1a1a] border border-[#2d2d2d] px-2.5 py-1 font-mono text-[11px] font-medium text-[#a3a3a3] print:bg-neutral-100 print:text-black print:border-neutral-400">
                    Reg: {WORKSHOP_INFO.regNumber}
                  </span>
                </div>
              </div>

              {/* Right: Official Tax Invoice Metadata Box */}
              <div className="md:text-right space-y-2 shrink-0 rounded-2xl bg-[#171717] border border-[#282828] p-5 print:bg-neutral-50 print:border-neutral-300">
                <div className="flex md:justify-end items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#22c55e] print:text-black">
                    Original SARS Document
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white print:text-black">
                  TAX INVOICE
                </h3>
                <p className="font-mono text-base font-black text-[#22c55e] print:text-black">
                  #{invoice.invoice_number}
                </p>

                <div className="space-y-1 text-xs text-[#9a9a9a] print:text-neutral-700 pt-2 border-t border-[#262626] print:border-neutral-300">
                  <div className="flex justify-between md:justify-end gap-4">
                    <span>Issue Date:</span>
                    <span className="font-mono font-bold text-white print:text-black">
                      {formatDate(invoice.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between md:justify-end gap-4">
                    <span>Due Date:</span>
                    <span className="font-mono font-bold text-white print:text-black">
                      {formatDate(invoice.due_date)}
                    </span>
                  </div>
                  {roNumber && (
                    <div className="flex justify-between md:justify-end gap-4">
                      <span>Job Card Ref:</span>
                      <span className="font-mono font-bold text-[#22c55e] print:text-black">
                        {roNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Three-Column Client, Vehicle & Service Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: Billed To */}
              <div className="rounded-2xl bg-[#161616] border border-[#262626] p-4 space-y-2 print:bg-neutral-50 print:border-neutral-300">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#22c55e] print:text-neutral-600 block">
                  01 • Billed To (Client)
                </span>
                <p className="text-base font-black text-white print:text-black">
                  {customerName}
                </p>
                <div className="space-y-1 text-xs text-[#9a9a9a] print:text-neutral-700">
                  <p className="font-mono">{customerPhone}</p>
                  <p>{customerEmail}</p>
                  <p className="text-[11px] text-[#737373] print:text-neutral-600 pt-1">
                    Tax Status: Standard 15% SARS VAT
                  </p>
                </div>
              </div>

              {/* Column 2: Vehicle Specifications */}
              <div className="rounded-2xl bg-[#161616] border border-[#262626] p-4 space-y-2 print:bg-neutral-50 print:border-neutral-300">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#22c55e] print:text-neutral-600 block">
                  02 • Vehicle Serviced
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-black text-white print:text-black">
                    {vehicleName}
                  </p>
                  <span className="font-mono text-xs font-black text-black bg-[#22c55e] px-2.5 py-0.5 rounded-md uppercase print:border print:border-black">
                    {licensePlate}
                  </span>
                </div>
                <div className="space-y-1 text-xs font-mono text-[#9a9a9a] print:text-neutral-700">
                  <p>VIN: {vehicleVin}</p>
                  {vehicleMileage ? (
                    <p>Odometer: {vehicleMileage.toLocaleString()} km</p>
                  ) : (
                    <p>Job Status: {job?.status?.toUpperCase() || "COMPLETED"}</p>
                  )}
                </div>
              </div>

              {/* Column 3: Scope of Work / Technical Summary */}
              <div className="rounded-2xl bg-[#161616] border border-[#262626] p-4 space-y-2 print:bg-neutral-50 print:border-neutral-300">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#22c55e] print:text-neutral-600 block">
                  03 • Technical Scope
                </span>
                <p className="text-xs font-semibold text-white print:text-black line-clamp-2">
                  {concernText || "Scheduled Mechanical Service & Diagnostic Inspection"}
                </p>
                {workPerformedText && (
                  <p className="text-xs text-[#8e8e8e] print:text-neutral-700 line-clamp-2">
                    {workPerformedText}
                  </p>
                )}
                <p className="text-[11px] font-mono text-[#737373] print:text-neutral-600 pt-1">
                  Authorized by: {customerName}
                </p>
              </div>
            </div>

            {/* 3. Itemized Parts Table */}
            {partsItems.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                    <h3
                      id="invoice-parts-heading"
                      className="text-xs font-black uppercase tracking-wider text-white print:text-black"
                    >
                      Section A — Genuine Parts, OEM Spares & Consumables
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#a3a3a3] print:text-black">
                    Subtotal: {formatCurrency(partsSubtotal)}
                  </span>
                </div>

                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="invoice-parts-heading"
                  className="overflow-x-auto rounded-2xl border border-[#262626] print:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
                >
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#181818] print:bg-neutral-100 text-[#8a8a8a] print:text-black uppercase text-[10px] tracking-wider border-b border-[#262626] print:border-neutral-400">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-extrabold">
                          Part / Component Description
                        </th>
                        <th scope="col" className="px-3 py-3 font-extrabold w-28">
                          Part No.
                        </th>
                        <th scope="col" className="px-3 py-3 font-extrabold text-center w-20">
                          Qty
                        </th>
                        <th scope="col" className="px-4 py-3 font-extrabold text-right w-32">
                          Unit Price
                        </th>
                        <th scope="col" className="px-4 py-3 font-extrabold text-right w-32">
                          Line Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f1f] print:divide-neutral-300">
                      {partsItems.map((part, idx) => (
                        <tr
                          key={part.id || idx}
                          className="hover:bg-[#171717] print:hover:bg-transparent"
                        >
                          <th
                            scope="row"
                            className="px-4 py-3.5 text-white print:text-black font-semibold text-left"
                          >
                            {part.description}
                          </th>
                          <td className="px-3 py-3.5 font-mono text-[11px] text-[#7a7a7a] print:text-neutral-700">
                            {part.part_number || `OEM-${100 + idx}`}
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono text-neutral-300 print:text-black">
                            {part.quantity}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-[#9a9a9a] print:text-black">
                            {formatCurrency(part.unit_price)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-white print:text-black">
                            {formatCurrency(part.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Itemized Mechanical Labour Table */}
            {laborItems.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#38bdf8]" />
                    <h3
                      id="invoice-labor-heading"
                      className="text-xs font-black uppercase tracking-wider text-white print:text-black"
                    >
                      Section B — Specialized Mechanical Labour & Diagnostics
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#a3a3a3] print:text-black">
                    Subtotal: {formatCurrency(laborSubtotal)}
                  </span>
                </div>

                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="invoice-labor-heading"
                  className="overflow-x-auto rounded-2xl border border-[#262626] print:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
                >
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#181818] print:bg-neutral-100 text-[#8a8a8a] print:text-black uppercase text-[10px] tracking-wider border-b border-[#262626] print:border-neutral-400">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-extrabold">
                          Labour Operation & Technical Procedure
                        </th>
                        <th scope="col" className="px-3 py-3 font-extrabold text-center w-24">
                          Hours
                        </th>
                        <th scope="col" className="px-4 py-3 font-extrabold text-right w-32">
                          Tariff / Hr
                        </th>
                        <th scope="col" className="px-4 py-3 font-extrabold text-right w-32">
                          Line Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f1f] print:divide-neutral-300">
                      {laborItems.map((lab, idx) => (
                        <tr
                          key={lab.id || idx}
                          className="hover:bg-[#171717] print:hover:bg-transparent"
                        >
                          <th
                            scope="row"
                            className="px-4 py-3.5 text-white print:text-black font-semibold text-left"
                          >
                            {lab.description}
                          </th>
                          <td className="px-3 py-3.5 text-center font-mono text-neutral-300 print:text-black">
                            {Number(lab.labour_hours || lab.quantity || 1).toFixed(1)} hrs
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-[#9a9a9a] print:text-black">
                            {formatCurrency(lab.labour_hourly_rate || lab.unit_price)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-white print:text-black">
                            {formatCurrency(lab.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fallback when no individual items exist */}
            {partsItems.length === 0 && laborItems.length === 0 && (
              <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white print:text-black">
                    Workshop Service & Mechanical Repair Charge ({roNumber || invoice.invoice_number})
                  </p>
                  <p className="text-xs text-[#8c8c8c] print:text-neutral-600 mt-0.5">
                    Complete vehicle service, diagnostic inspection, and workshop consumables
                  </p>
                </div>
                <span className="font-mono text-base font-black text-white print:text-black">
                  {formatCurrency(calculatedSubtotal)}
                </span>
              </div>
            )}

            {/* 5. Recorded Payments Ledger (if any) */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#22c55e] print:text-black">
                  Payment Transaction History
                </h4>
                <div className="rounded-2xl bg-[#151c17] border border-[#22c55e]/25 divide-y divide-[#1f2e23] print:bg-neutral-50 print:border-neutral-300">
                  {invoice.payments.map((pmt) => (
                    <div
                      key={pmt.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-md bg-[#22c55e]/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#22c55e] print:text-black print:border print:border-black">
                          {pmt.payment_method}
                        </span>
                        <span className="font-mono text-white print:text-black font-semibold">
                          Ref: {pmt.transaction_reference || "WORKSHOP-RECEIPT"}
                        </span>
                        <span className="text-[#8a8a8a] print:text-neutral-600">
                          • {formatDate(pmt.created_at)}
                        </span>
                      </div>
                      <span className="font-mono font-black text-[#22c55e] print:text-black">
                        +{formatCurrency(pmt.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Banking Remittance & Financial Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-[#242424] print:border-neutral-300">
              {/* Left 7 Cols: EFT Banking Details & Warranty */}
              <div className="lg:col-span-7 rounded-2xl bg-[#161616] border border-[#262626] p-5 space-y-4 print:bg-neutral-50 print:border-neutral-300">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2.5 print:border-neutral-300">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#22c55e] print:text-black">
                    Direct EFT Banking & Settlement Details
                  </span>
                  <span className="font-mono text-[11px] font-bold text-neutral-400 print:text-black">
                    Ref: {invoice.invoice_number}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-[11px] text-[#7a7a7a] print:text-neutral-600">Bank</p>
                    <p className="font-bold text-white print:text-black">
                      {WORKSHOP_INFO.bankName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#7a7a7a] print:text-neutral-600">
                      Account Number
                    </p>
                    <p className="font-mono font-black text-white print:text-black">
                      {WORKSHOP_INFO.accountNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#7a7a7a] print:text-neutral-600">
                      Branch Code
                    </p>
                    <p className="font-mono font-bold text-white print:text-black">
                      {WORKSHOP_INFO.branchCode}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-[#7a7a7a] print:text-neutral-600">
                      Account Holder
                    </p>
                    <p className="font-semibold text-white print:text-black">
                      {WORKSHOP_INFO.accountName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#7a7a7a] print:text-neutral-600">
                      Payment Reference
                    </p>
                    <p className="font-mono font-black text-[#22c55e] print:text-black">
                      {invoice.invoice_number}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#242424] print:border-neutral-300 text-[11px] text-[#7a7a7a] print:text-neutral-600 leading-relaxed">
                  <strong className="text-neutral-300 print:text-black">
                    RMI Workmanship Guarantee:
                  </strong>{" "}
                  All mechanical workmanship carries a 6-month / 10,000 km warranty. OEM and aftermarket parts are covered under manufacturer warranty terms.
                </div>
              </div>

              {/* Right 5 Cols: Totals Box */}
              <div className="lg:col-span-5 rounded-2xl bg-[#161616] border border-[#262626] p-5 space-y-3 flex flex-col justify-between print:bg-neutral-50 print:border-neutral-300">
                <div className="space-y-2 text-xs">
                  {partsSubtotal > 0 && (
                    <div className="flex justify-between text-[#9a9a9a] print:text-neutral-700">
                      <span>Parts & Consumables:</span>
                      <span className="font-mono text-neutral-200 print:text-black">
                        {formatCurrency(partsSubtotal)}
                      </span>
                    </div>
                  )}
                  {laborSubtotal > 0 && (
                    <div className="flex justify-between text-[#9a9a9a] print:text-neutral-700">
                      <span>Mechanical Labour:</span>
                      <span className="font-mono text-neutral-200 print:text-black">
                        {formatCurrency(laborSubtotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#9a9a9a] print:text-neutral-700 pt-1 border-t border-[#222] print:border-neutral-300">
                    <span>Net Subtotal (Excl. VAT):</span>
                    <span className="font-mono font-semibold text-white print:text-black">
                      {formatCurrency(calculatedSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#9a9a9a] print:text-neutral-700">
                    <span>SARS Value-Added Tax ({invoice.tax_rate_percent}%):</span>
                    <span className="font-mono font-semibold text-white print:text-black">
                      {formatCurrency(calculatedVat)}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-black text-white print:text-black pt-2.5 border-t border-[#2c2c2c] print:border-black">
                    <span>Grand Total (Incl. VAT):</span>
                    <span className="font-mono text-lg text-[#22c55e] print:text-black">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>

                  {Number(invoice.paid_amount) > 0 && (
                    <div className="flex justify-between text-xs font-bold text-[#38bdf8] print:text-neutral-800">
                      <span>Less Payments Received:</span>
                      <span className="font-mono">
                        -{formatCurrency(invoice.paid_amount)}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-xl p-3.5 border flex items-center justify-between ${
                    balanceDue === 0
                      ? "bg-[#22c55e]/10 border-[#22c55e]/40"
                      : "bg-[#1f1616] border-[#ef4444]/40"
                  } print:bg-neutral-100 print:border-black`}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-300 print:text-black block">
                      {balanceDue === 0 ? "Account Settled" : "Balance Due"}
                    </span>
                    <span className="text-[11px] text-[#8a8a8a] print:text-neutral-600">
                      {balanceDue === 0 ? "Paid in Full ✓" : `Due by ${formatDate(invoice.due_date)}`}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xl font-black ${
                      balanceDue === 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                    } print:text-black`}
                  >
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* 7. Signature & Handover Block */}
            <div className="pt-6 border-t border-[#242424] print:border-neutral-300 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-[#737373] print:text-neutral-700">
              <div>
                <p className="font-bold text-neutral-300 print:text-black">
                  Workshop Quality Release & Sign-Off
                </p>
                <div className="h-10 border-b border-[#333333] print:border-black mt-3 flex items-end pb-1 font-mono text-neutral-400 print:text-black">
                  Master Diagnostic Technician • {WORKSHOP_INFO.shortName}
                </div>
                <p className="text-[10px] text-[#666] print:text-neutral-500 mt-1">
                  Authorized Workshop Representative
                </p>
              </div>
              <div>
                <p className="font-bold text-neutral-300 print:text-black">
                  Customer Vehicle Handover & Acceptance
                </p>
                <div className="h-10 border-b border-[#333333] print:border-black mt-3 flex items-end pb-1 font-mono text-neutral-400 print:text-black">
                  {customerName}
                </div>
                <p className="text-[10px] text-[#666] print:text-neutral-500 mt-1">
                  Client Signature confirming satisfactory completion of work
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
