import { ActionLink } from "@/components/action-link";
import { SectionCard } from "@/components/section-card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getInventoryCategories, listInventoryProducts } from "@/lib/inventory/data";
import type { InventoryCategoryOption, InventoryListResult } from "@/lib/inventory/types";
import { parseInventoryListFilters } from "@/lib/inventory/validation";

type InventoryPageProps = {
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

function buildPageLink(
  currentParams: Record<string, string | string[] | undefined>,
  page: number,
) {
  const params = new URLSearchParams();

  Object.entries(currentParams).forEach(([key, value]) => {
    const resolved = Array.isArray(value) ? value[0] : value;

    if (resolved) {
      params.set(key, resolved);
    }
  });

  params.set("page", String(page));

  return `/inventory?${params.toString()}`;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const user = await requireCurrentUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = parseInventoryListFilters(resolvedSearchParams);
  const notice = readStringValue(resolvedSearchParams.notice);

  let inventory: InventoryListResult | null = null;
  let categories: InventoryCategoryOption[] = [];
  let loadError: string | null = null;

  try {
    [inventory, categories] = await Promise.all([
      listInventoryProducts(filters),
      getInventoryCategories(),
    ]);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Inventory is temporarily unavailable while the database connection is missing.";
  }

  if (loadError || !inventory) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <SectionCard eyebrow="Inventory unavailable" title="The inventory workspace needs setup">
          <p>{loadError ?? "Inventory could not be loaded right now."}</p>
          <p className="mt-3">
            Next step: confirm your Supabase phase 2 migration and seed files were applied, then
            reload this page.
          </p>
        </SectionCard>
      </main>
    );
  }

  const currentLowStockCount = inventory.items.filter((item) => item.isLowStock).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(236,253,245,0.9))] p-6 shadow-[var(--shadow)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              Phase 3 inventory
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Inventory workspace
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
              Search stock, open a product, and create or archive records with the same
              app-managed auth and role checks we already shipped in earlier phases.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            {user.role === "viewer" ? null : <ActionLink href="/inventory/new">Add product</ActionLink>}
            <ActionLink href="/" muted>
              Back to dashboard
            </ActionLink>
          </div>
        </div>
      </section>

      {notice === "read-only" ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 shadow-[var(--shadow)]">
          Your current role is read-only for inventory changes. You can browse products, but create
          and edit actions stay locked.
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard eyebrow="Visible results" title={`${inventory.total} products`}>
          The current filters show {inventory.total} matching products across active and archived
          inventory views.
        </SectionCard>
        <SectionCard eyebrow="Current page" title={`${currentLowStockCount} low stock`}>
          Items at or below their reorder level are flagged so the team can refill them quickly.
        </SectionCard>
        <SectionCard eyebrow="Role" title={user.role === "viewer" ? "Read only" : "Can manage"}>
          {user.role === "viewer"
            ? "You can inspect records but not change inventory from this account."
            : "You can create, edit, archive, and restore inventory records from this workspace."}
        </SectionCard>
      </section>

      <SectionCard eyebrow="Filters" title="Find the right products fast">
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
              placeholder="Search by SKU, name, brand, or category"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            />
          </div>

          <div>
            <label htmlFor="category" className="text-xs font-semibold uppercase tracking-[0.24em]">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue={filters.categoryId}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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
            <label htmlFor="archived" className="text-xs font-semibold uppercase tracking-[0.24em]">
              Status
            </label>
            <select
              id="archived"
              name="archived"
              defaultValue={filters.archived}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            >
              <option value="active">Active only</option>
              <option value="archived">Archived only</option>
              <option value="all">All products</option>
            </select>
          </div>

          <div className="flex items-center gap-3 xl:col-span-2">
            <input
              id="lowStock"
              name="lowStock"
              type="checkbox"
              value="true"
              defaultChecked={filters.lowStock}
              className="h-5 w-5 rounded border border-[color:var(--border)] text-[color:var(--primary)]"
            />
            <label htmlFor="lowStock" className="text-sm font-medium text-[color:var(--foreground)]">
              Show only low-stock items
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:col-span-3 xl:justify-end">
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:bg-[color:var(--primary-strong)]"
            >
              Apply filters
            </button>
            <ActionLink href="/inventory" muted>
              Reset
            </ActionLink>
          </div>
        </form>
      </SectionCard>

      <section className="grid gap-4">
        {inventory.items.length === 0 ? (
          <SectionCard eyebrow="No products" title="Nothing matches these filters yet">
            {user.role === "viewer"
              ? "Try clearing one or two filters or ask an admin or staff user to add the first product."
              : "Try clearing one or two filters, or add the first product from the button above."}
          </SectionCard>
        ) : (
          inventory.items.map((item) => (
            <section
              key={item.id}
              className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[color:rgba(15,118,110,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">
                      {item.sku}
                    </span>
                    <span className="rounded-full bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {item.categoryName}
                    </span>
                    {item.isLowStock ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900">
                        Low stock
                      </span>
                    ) : null}
                    {item.isArchived ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                        Archived
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[color:var(--foreground)]">
                    {item.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {item.brand ? `${item.brand} | ` : ""}
                    Stock {item.currentStock} / Reorder {item.reorderLevel}
                    {item.location ? ` | ${item.location}` : ""}
                    {item.size ? ` | Size ${item.size}` : ""}
                    {item.color ? ` | ${item.color}` : ""}
                  </p>
                </div>

                <div className="flex min-w-[220px] flex-col gap-3">
                  <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                      Selling price
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">
                      {formatCurrency(item.sellingPrice)}
                    </p>
                  </div>
                  <ActionLink href={`/inventory/${item.id}`} muted={user.role === "viewer"}>
                    {user.role === "viewer" ? "View details" : "Open product"}
                  </ActionLink>
                </div>
              </div>
            </section>
          ))
        )}
      </section>

      {inventory.totalPages > 1 ? (
        <section className="flex items-center justify-between rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-4 shadow-[var(--shadow)]">
          <p className="text-sm text-[color:var(--muted)]">
            Page {inventory.page} of {inventory.totalPages}
          </p>
          <div className="flex gap-3">
            {inventory.page > 1 ? (
              <ActionLink href={buildPageLink(resolvedSearchParams, inventory.page - 1)} muted>
                Previous
              </ActionLink>
            ) : (
              <span className="inline-flex min-h-10 items-center rounded-full border border-[color:var(--border)] px-4 text-sm text-[color:var(--muted)]">
                Previous
              </span>
            )}
            {inventory.page < inventory.totalPages ? (
              <ActionLink href={buildPageLink(resolvedSearchParams, inventory.page + 1)}>
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
