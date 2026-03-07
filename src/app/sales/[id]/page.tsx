import { notFound } from "next/navigation";

import { ActionLink } from "@/components/action-link";
import { SectionCard } from "@/components/section-card";
import { SalesEntryForm } from "@/components/sales/sales-entry-form";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getSaleEntry, getSalesProductOptions } from "@/lib/sales/data";
import type { SaleEntry, SalesProductOption } from "@/lib/sales/types";

type SalesDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readStringValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function SalesDetailPage({ params, searchParams }: SalesDetailPageProps) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const banner =
    (readStringValue(resolvedSearchParams.created) === "1" && "Sale created successfully.") ||
    (readStringValue(resolvedSearchParams.saved) === "1" && "Sale correction saved successfully.");

  let sale: SaleEntry | null = null;
  let products: SalesProductOption[] = [];
  let loadError: string | null = null;

  try {
    [sale, products] = await Promise.all([getSaleEntry(id), getSalesProductOptions()]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Sales detail is temporarily unavailable.";
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <SectionCard eyebrow="Sales unavailable" title="This sale could not be loaded">
          <p>{loadError}</p>
          <p className="mt-3">Next step: verify Supabase is connected, then retry this page.</p>
        </SectionCard>
      </main>
    );
  }

  if (!sale) {
    notFound();
  }

  const canEdit = user.role !== "viewer";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Sales detail
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900">
            {sale.productNameSnapshot}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--muted)]">
            {sale.saleMode === "linked" ? "Linked inventory sale" : "Manual sale"}
            {sale.categoryNameSnapshot ? ` | ${sale.categoryNameSnapshot}` : ""}
            {sale.brandSnapshot ? ` | ${sale.brandSnapshot}` : ""}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <ActionLink href="/sales" muted>
            Back to sales
          </ActionLink>
        </div>
      </section>

      {banner ? (
        <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-900 shadow-[var(--shadow)]">
          {banner}
        </section>
      ) : null}

      {!canEdit ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 shadow-[var(--shadow)]">
          This account is read-only for sales edits. You can review the sale detail here, but only staff or admin users can save corrections.
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <SalesEntryForm mode="edit" sale={sale} products={products} readOnly={!canEdit} />

        <div className="grid gap-4">
          <SectionCard eyebrow="At a glance" title="Current sale summary">
            <div className="grid gap-3">
              <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Line total</p>
                <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">
                  {formatCurrency(sale.lineTotal)}
                </p>
              </div>
              <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Quantity</p>
                <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">{sale.quantity}</p>
              </div>
              <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Sold at</p>
                <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                  {formatDateTime(sale.soldAt)}
                </p>
              </div>
              <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Inventory effect</p>
                <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                  {sale.saleMode === "linked" ? "Deducts linked stock" : "No stock change"}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Snapshot" title="Stored sale details">
            <ul className="space-y-3">
              <li className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Unit price</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                  {formatCurrency(sale.unitPrice)}
                </p>
              </li>
              <li className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Mode</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                  {sale.saleMode === "linked" ? "Linked inventory" : "Manual"}
                </p>
              </li>
              <li className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Notes</p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">{sale.notes ?? "No notes saved."}</p>
              </li>
            </ul>
          </SectionCard>
        </div>
      </section>
    </main>
  );
}
