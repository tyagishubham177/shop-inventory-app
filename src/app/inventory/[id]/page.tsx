import { notFound } from "next/navigation";

import { ActionLink } from "@/components/action-link";
import { InventoryArchiveToggle } from "@/components/inventory/inventory-archive-toggle";
import { InventoryProductForm } from "@/components/inventory/inventory-product-form";
import { SectionCard } from "@/components/section-card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getInventoryCategories, getInventoryProductDetail } from "@/lib/inventory/data";
import type { InventoryCategoryOption, InventoryProductDetail } from "@/lib/inventory/types";

type InventoryDetailPageProps = {
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

export default async function InventoryDetailPage({
  params,
  searchParams,
}: InventoryDetailPageProps) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const banner =
    (readStringValue(resolvedSearchParams.created) === "1" && "Product created successfully.") ||
    (readStringValue(resolvedSearchParams.saved) === "1" && "Product changes saved successfully.") ||
    (readStringValue(resolvedSearchParams.archived) === "1" &&
      "Product archived. It will stay hidden from active inventory lists.") ||
    (readStringValue(resolvedSearchParams.restored) === "1" &&
      "Product restored and returned to the active inventory list.");

  let detail: InventoryProductDetail | null = null;
  let categories: InventoryCategoryOption[] = [];
  let loadError: string | null = null;

  try {
    [detail, categories] = await Promise.all([
      getInventoryProductDetail(id),
      getInventoryCategories(),
    ]);
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Inventory detail is temporarily unavailable.";
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <SectionCard eyebrow="Inventory unavailable" title="This product could not be loaded">
          <p>{loadError}</p>
          <p className="mt-3">Next step: verify Supabase is connected, then retry this page.</p>
        </SectionCard>
      </main>
    );
  }

  if (!detail) {
    notFound();
  }

  const canEdit = user.role !== "viewer";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Inventory detail
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900">
            {detail.product.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--muted)]">
            SKU {detail.product.sku} | {detail.product.categoryName}
            {detail.product.brand ? ` | ${detail.product.brand}` : ""}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <ActionLink href="/inventory" muted>
            Back to inventory
          </ActionLink>
          {canEdit ? (
            <InventoryArchiveToggle isArchived={detail.product.isArchived} productId={detail.product.id} />
          ) : null}
        </div>
      </section>

      {banner ? (
        <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-900 shadow-[var(--shadow)]">
          {banner}
        </section>
      ) : null}

      {!canEdit ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 shadow-[var(--shadow)]">
          This account is read-only for inventory edits. You can review product details and stock
          history here, but only staff or admin users can save changes.
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <InventoryProductForm
          categories={categories}
          mode="edit"
          product={detail.product}
          readOnly={!canEdit}
        />

        <div className="grid gap-4">
          <SectionCard eyebrow="At a glance" title="Current product summary">
            <div className="grid gap-3">
              <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Selling price
                </p>
                <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">
                  {formatCurrency(detail.product.sellingPrice)}
                </p>
              </div>
              <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Purchase price
                </p>
                <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">
                  {formatCurrency(detail.product.purchasePrice)}
                </p>
              </div>
              <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Stock status
                </p>
                <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">
                  {detail.product.currentStock} in stock
                </p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  Reorder level {detail.product.reorderLevel}
                  {detail.product.isLowStock ? " | Refill soon" : " | Healthy stock"}
                </p>
              </div>
              <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Updated
                </p>
                <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                  {formatDateTime(detail.product.updatedAt)}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow="Recent stock activity" title="Latest inventory transactions">
            {detail.recentTransactions.length === 0 ? (
              <p>No stock history has been recorded for this product yet.</p>
            ) : (
              <ul className="space-y-3">
                {detail.recentTransactions.map((transaction) => (
                  <li
                    key={transaction.id}
                    className="rounded-2xl bg-[color:var(--surface-strong)] p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--primary)]">
                      {transaction.transactionType.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">
                      Delta {transaction.quantityDelta >= 0 ? "+" : ""}
                      {transaction.quantityDelta}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">{transaction.reason}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      {formatDateTime(transaction.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </section>
    </main>
  );
}
