import { ActionLink } from "@/components/action-link";
import { SectionCard } from "@/components/section-card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { listSalesEntries } from "@/lib/sales/data";
import type { SalesListResult } from "@/lib/sales/types";
import { parseSalesListFilters } from "@/lib/sales/validation";

type SalesPageProps = {
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

function buildPageLink(currentParams: Record<string, string | string[] | undefined>, page: number) {
  const params = new URLSearchParams();

  Object.entries(currentParams).forEach(([key, value]) => {
    const resolved = Array.isArray(value) ? value[0] : value;

    if (resolved) {
      params.set(key, resolved);
    }
  });

  params.set("page", String(page));

  return `/sales?${params.toString()}`;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const user = await requireCurrentUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = parseSalesListFilters(resolvedSearchParams);
  const notice = readStringValue(resolvedSearchParams.notice);

  let sales: SalesListResult | null = null;
  let loadError: string | null = null;

  try {
    sales = await listSalesEntries(filters);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Sales are temporarily unavailable while the database connection is missing.";
  }

  if (loadError || !sales) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <SectionCard eyebrow="Sales unavailable" title="The sales workspace needs setup">
          <p>{loadError ?? "Sales could not be loaded right now."}</p>
          <p className="mt-3">
            Next step: confirm your Supabase phase 2 migration and dev seed files were applied, then reload this page.
          </p>
        </SectionCard>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(239,246,255,0.92))] p-6 shadow-[var(--shadow)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              Phase 4 sales
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Sales workspace
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
              Track linked inventory sales and quick manual counter sales from one mobile-first workspace with searchable history.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            {user.role === "viewer" ? null : <ActionLink href="/sales/new">Add sale</ActionLink>}
            <ActionLink href="/" muted>
              Back to dashboard
            </ActionLink>
          </div>
        </div>
      </section>

      {notice === "read-only" ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 shadow-[var(--shadow)]">
          Your current role is read-only for sales changes. You can review sales history, but create and edit actions stay locked.
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard eyebrow="Filtered results" title={`${sales.total} sale lines`}>
          The current filters show {sales.total} sales lines across linked and manual entries.
        </SectionCard>
        <SectionCard eyebrow="Units sold" title={`${sales.totalQuantity} units`}>
          This filtered view currently covers {sales.totalQuantity} sold units.
        </SectionCard>
        <SectionCard eyebrow="Revenue" title={formatCurrency(sales.totalRevenue)}>
          Revenue total is based on saved line totals for the currently visible sales records.
        </SectionCard>
      </section>

      <SectionCard eyebrow="Filters" title="Find the right sales quickly">
        <form method="GET" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label htmlFor="query" className="text-xs font-semibold uppercase tracking-[0.24em]">
              Search
            </label>
            <input
              id="query"
              name="query"
              type="text"
              defaultValue={filters.query}
              placeholder="Search by product, category, brand, or note"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            />
          </div>

          <div>
            <label htmlFor="category" className="text-xs font-semibold uppercase tracking-[0.24em]">
              Category
            </label>
            <input
              id="category"
              name="category"
              type="text"
              defaultValue={filters.category}
              placeholder="Any category"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            />
          </div>

          <div>
            <label htmlFor="brand" className="text-xs font-semibold uppercase tracking-[0.24em]">
              Brand
            </label>
            <input
              id="brand"
              name="brand"
              type="text"
              defaultValue={filters.brand}
              placeholder="Any brand"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            />
          </div>

          <div>
            <label htmlFor="mode" className="text-xs font-semibold uppercase tracking-[0.24em]">
              Mode
            </label>
            <select
              id="mode"
              name="mode"
              defaultValue={filters.mode}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            >
              <option value="all">All sales</option>
              <option value="linked">Linked only</option>
              <option value="manual">Manual only</option>
            </select>
          </div>

          <div>
            <label htmlFor="dateFrom" className="text-xs font-semibold uppercase tracking-[0.24em]">
              From
            </label>
            <input
              id="dateFrom"
              name="dateFrom"
              type="date"
              defaultValue={filters.dateFrom}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="text-xs font-semibold uppercase tracking-[0.24em]">
              To
            </label>
            <input
              id="dateTo"
              name="dateTo"
              type="date"
              defaultValue={filters.dateTo}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:col-span-3 xl:justify-end">
            <button
              type="submit"
              className="ui-button ui-button-primary w-full sm:w-auto"
            >
              Apply filters
            </button>
            <ActionLink href="/sales" muted>
              Reset
            </ActionLink>
          </div>
        </form>
      </SectionCard>

      <section className="grid gap-4">
        {sales.items.length === 0 ? (
          <SectionCard eyebrow="No sales yet" title="Nothing matches these filters">
            {user.role === "viewer"
              ? "Try clearing one or two filters or ask a staff or admin user to create the first sale entry."
              : "Try clearing one or two filters, or add the first sale from the button above."}
          </SectionCard>
        ) : (
          sales.items.map((sale) => (
            <section
              key={sale.id}
              className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[color:rgba(15,118,110,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">
                      {sale.saleMode}
                    </span>
                    {sale.categoryNameSnapshot ? (
                      <span className="rounded-full bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        {sale.categoryNameSnapshot}
                      </span>
                    ) : null}
                    {sale.brandSnapshot ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                        {sale.brandSnapshot}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[color:var(--foreground)]">
                    {sale.productNameSnapshot}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    Quantity {sale.quantity} | Unit price {formatCurrency(sale.unitPrice)} | Sold {formatDateTime(sale.soldAt)}
                  </p>
                  {sale.notes ? <p className="mt-2 text-sm text-[color:var(--muted)]">{sale.notes}</p> : null}
                </div>

                <div className="flex min-w-[220px] flex-col gap-3">
                  <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Line total</p>
                    <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">
                      {formatCurrency(sale.lineTotal)}
                    </p>
                  </div>
                  <ActionLink href={`/sales/${sale.id}`} muted={user.role === "viewer"}>
                    {user.role === "viewer" ? "View details" : "Open sale"}
                  </ActionLink>
                </div>
              </div>
            </section>
          ))
        )}
      </section>

      {sales.totalPages > 1 ? (
        <section className="flex items-center justify-between rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-4 shadow-[var(--shadow)]">
          <p className="text-sm text-[color:var(--muted)]">
            Page {sales.page} of {sales.totalPages}
          </p>
          <div className="flex gap-3">
            {sales.page > 1 ? (
              <ActionLink href={buildPageLink(resolvedSearchParams, sales.page - 1)} muted>
                Previous
              </ActionLink>
            ) : (
              <span className="inline-flex min-h-10 items-center rounded-full border border-[color:var(--border)] px-4 text-sm text-[color:var(--muted)]">
                Previous
              </span>
            )}
            {sales.page < sales.totalPages ? (
              <ActionLink href={buildPageLink(resolvedSearchParams, sales.page + 1)}>
                Next
              </ActionLink>
            ) : (
              <span className="inline-flex min-h-10 items-center rounded-full border border-[color:var(--border)] px-4 text-sm text-[color:var(--muted)]">
                Next
              </span>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
