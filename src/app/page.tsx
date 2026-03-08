import type { ReactNode } from "react";

import { ActionLink } from "@/components/action-link";
import { LogoutButton } from "@/components/logout-button";
import { MobileFabMenu } from "@/components/mobile-fab-menu";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getDashboardData } from "@/lib/dashboard/data";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type MobileDashboardDisclosureProps = {
  eyebrow: string;
  summary: string;
  detailTitle: string;
  children: ReactNode;
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

function formatTrend(current: number, previous: number) {
  if (previous === 0 && current === 0) {
    return "No change from the previous 7 days";
  }

  if (previous === 0) {
    return "New revenue this week with no sales in the previous 7 days";
  }

  const change = ((current - previous) / previous) * 100;
  const direction = change >= 0 ? "up" : "down";

  return `${Math.abs(change).toFixed(0)}% ${direction} vs previous 7 days`;
}

function MobileDashboardDisclosure({
  eyebrow,
  summary,
  detailTitle,
  children,
}: MobileDashboardDisclosureProps) {
  return (
    <details className="ui-details-card md:hidden">
      <summary className="flex cursor-pointer items-start justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            {eyebrow}
          </p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{summary}</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Tap to expand</p>
        </div>
        <span className="ui-badge ui-badge-primary">Open</span>
      </summary>
      <div className="border-t border-[color:var(--border)] px-4 py-4">
        <p className="text-sm font-semibold text-[color:var(--foreground)]">{detailTitle}</p>
        <div className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{children}</div>
      </div>
    </details>
  );
}

export default async function Home({ searchParams }: HomePageProps) {
  const user = await requireCurrentUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const adminNotice = readStringValue(resolvedSearchParams.notice) === "admin-only";

  let dashboard = null;
  let loadError: string | null = null;

  try {
    dashboard = await getDashboardData();
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Dashboard data is temporarily unavailable while the database connection is missing.";
  }

  if (loadError || !dashboard) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,247,237,0.9))] p-6 shadow-[var(--shadow)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <StatusPill label={`Signed in as ${user.role}`} />
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Welcome back, {user.name}.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
                The dashboard still needs its live data connection before the summary cards and chat checks can load.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <ActionLink href="/inventory" muted className="w-full sm:w-auto">
                Open inventory
              </ActionLink>
              <ActionLink href="/sales" className="w-full sm:w-auto">
                Open sales
              </ActionLink>
              <ActionLink href="/chat" muted className="w-full sm:w-auto">
                Open chat
              </ActionLink>
              <LogoutButton className="w-full sm:w-auto" />
            </div>
          </div>
        </section>

        <SectionCard eyebrow="Dashboard unavailable" title="The summary workspace needs setup">
          <p>{loadError ?? "Dashboard data could not be loaded right now."}</p>
          <p className="mt-3">
            Next step: confirm your Supabase schema and seed data are applied, then reload this page.
          </p>
        </SectionCard>
      </main>
    );
  }

  const trendLabel = formatTrend(
    dashboard.summary.last7DaysRevenue,
    dashboard.summary.previous7DaysRevenue,
  );

  const fabActions = [
    { href: "/inventory", label: "Inventory" },
    { href: "/sales", label: "Sales" },
    { href: "/chat", label: "Chat", tone: "secondary" as const },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Backups", tone: "secondary" as const }] : []),
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 pb-28 sm:px-6 md:pb-10 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,247,237,0.9))] p-6 shadow-[var(--shadow)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <StatusPill label={`Signed in as ${user.role}`} />
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Daily dashboard for {user.name}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)] sm:text-lg">
              The dashboard now pairs live inventory and sales summaries with a read-only chat workspace, so the team can spot low stock, track revenue, and ask quick questions without leaving the phone flow.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <ActionLink href="/inventory" muted className="hidden sm:inline-flex sm:w-auto">
              Open inventory
            </ActionLink>
            <ActionLink href="/sales" className="hidden sm:inline-flex sm:w-auto">
              Open sales
            </ActionLink>
            <ActionLink href="/chat" muted className="hidden sm:inline-flex sm:w-auto">
              Open chat
            </ActionLink>
            {user.role === "admin" ? (
              <ActionLink href="/admin" muted className="hidden sm:inline-flex sm:w-auto">
                Open backup center
              </ActionLink>
            ) : null}
            <LogoutButton className="w-full sm:w-auto" />
          </div>
        </div>
      </section>

      {adminNotice ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 shadow-[var(--shadow)]">
          This route is limited to admins. Sign in with the admin demo user to verify access.
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard eyebrow="Inventory count" title={`${dashboard.summary.activeProducts} active products`}>
          {dashboard.summary.totalUnitsInStock} units are currently available across active inventory records.
        </SectionCard>
        <SectionCard eyebrow="Low stock" title={`${dashboard.summary.lowStockCount} products need attention`}>
          Products at or below reorder level are surfaced here before the team sees a stock-out.
        </SectionCard>
        <SectionCard eyebrow="Today" title={formatCurrency(dashboard.summary.todayRevenue)}>
          {dashboard.summary.todaySalesCount} sales lines and {dashboard.summary.todayUnitsSold} units sold since midnight.
        </SectionCard>
        <SectionCard eyebrow="7-day trend" title={formatCurrency(dashboard.summary.last7DaysRevenue)}>
          {trendLabel}. {dashboard.summary.last7DaysSalesCount} sales lines were logged in the last 7 days.
        </SectionCard>
      </section>

      <div className="grid gap-3 md:hidden">
        <MobileDashboardDisclosure
          eyebrow="Low stock"
          summary={`${dashboard.summary.lowStockCount} items to restock`}
          detailTitle="Restock these first"
        >
          {dashboard.lowStockItems.length === 0 ? (
            <p>Nothing is below reorder level right now.</p>
          ) : (
            <div className="space-y-3">
              {dashboard.lowStockItems.map((item) => (
                <a
                  key={item.id}
                  href={`/inventory/${item.id}`}
                  className="flex items-start justify-between gap-3 rounded-[22px] bg-[color:var(--surface-strong)] px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{item.name}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      {item.sku} - {item.categoryName}
                    </p>
                  </div>
                  <div className="text-right text-xs text-[color:var(--muted)]">
                    <p className="font-semibold text-amber-900">{item.currentStock} left</p>
                    <p>{item.gapToTarget} below target</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </MobileDashboardDisclosure>

        <MobileDashboardDisclosure
          eyebrow="Recent sales"
          summary={`${formatCurrency(dashboard.summary.todayRevenue)} today`}
          detailTitle="Latest revenue snapshot"
        >
          <div className="space-y-3">
            <div className="rounded-[22px] bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Stock value estimate</p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">
                {formatCurrency(dashboard.summary.inventoryValueEstimate)}
              </p>
            </div>
            {dashboard.recentSales.length === 0 ? (
              <p>No sales have been saved yet.</p>
            ) : (
              dashboard.recentSales.map((sale) => (
                <a
                  key={sale.id}
                  href={`/sales/${sale.id}`}
                  className="flex items-start justify-between gap-3 rounded-[22px] bg-[color:var(--surface-strong)] px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{sale.productName}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      {sale.saleMode} sale - {sale.quantity} units
                    </p>
                  </div>
                  <div className="text-right text-xs text-[color:var(--muted)]">
                    <p className="font-semibold text-[color:var(--foreground)]">{formatCurrency(sale.lineTotal)}</p>
                    <p>{formatDateTime(sale.soldAt)}</p>
                  </div>
                </a>
              ))
            )}
          </div>
        </MobileDashboardDisclosure>
      </div>

      <section className="hidden gap-4 md:grid lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard eyebrow="Low-stock summary" title="Refill these first">
          {dashboard.lowStockItems.length === 0 ? (
            <p>Nothing is below reorder level right now. The current active catalog looks healthy.</p>
          ) : (
            <div className="space-y-3">
              {dashboard.lowStockItems.map((item) => (
                <a
                  key={item.id}
                  href={`/inventory/${item.id}`}
                  className="flex items-start justify-between gap-4 rounded-2xl bg-[color:var(--surface-strong)] px-4 py-3 transition hover:-translate-y-0.5"
                >
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{item.name}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {item.sku} - {item.categoryName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-900">
                      {item.currentStock} / {item.reorderLevel}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">{item.gapToTarget} below target</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard eyebrow="Recent sales" title="Latest revenue snapshot">
          <div className="grid gap-3">
            <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Stock value estimate</p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                {formatCurrency(dashboard.summary.inventoryValueEstimate)}
              </p>
            </div>
            {dashboard.recentSales.length === 0 ? (
              <p>No sales have been saved yet, so this panel will fill in after the first sale is recorded.</p>
            ) : (
              dashboard.recentSales.map((sale) => (
                <a
                  key={sale.id}
                  href={`/sales/${sale.id}`}
                  className="flex items-start justify-between gap-4 rounded-2xl bg-[color:var(--surface-strong)] px-4 py-3 transition hover:-translate-y-0.5"
                >
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{sale.productName}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {sale.saleMode} sale - {sale.quantity} units
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[color:var(--foreground)]">{formatCurrency(sale.lineTotal)}</p>
                    <p className="text-xs text-[color:var(--muted)]">{formatDateTime(sale.soldAt)}</p>
                  </div>
                </a>
              ))
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard eyebrow="Recent activity" title="What changed most recently">
          {dashboard.recentActivity.length === 0 ? (
            <p>The activity feed will start filling as sales and stock changes are saved.</p>
          ) : (
            <div className="space-y-3">
              {dashboard.recentActivity.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-3 rounded-2xl bg-[color:var(--surface-strong)] px-4 py-3 transition hover:-translate-y-0.5"
                >
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${
                      item.tone === "positive"
                        ? "bg-emerald-500"
                        : item.tone === "warning"
                          ? "bg-amber-500"
                          : "bg-slate-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[color:var(--foreground)]">{item.title}</p>
                      <p className="text-xs text-[color:var(--muted)]">{formatDateTime(item.happenedAt)}</p>
                    </div>
                    <p>{item.description}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard eyebrow="Quick access" title="Jump into the next task" className="hidden md:block">
          <div className="grid gap-3">
            <ActionLink href="/inventory" className="w-full sm:w-auto">Open inventory list</ActionLink>
            <ActionLink href="/sales" muted className="w-full sm:w-auto">
              Open sales history
            </ActionLink>
            <ActionLink href="/chat" muted className="w-full sm:w-auto">
              Open chat workspace
            </ActionLink>
            <div className="rounded-2xl bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">User</p>
              <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">{user.email}</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Role: {user.role}. Archived products: {dashboard.summary.archivedProducts}.
              </p>
            </div>
            {user.role === "admin" ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-3 text-sm text-[color:var(--muted)]">
                Backup export is now available from the admin workspace, while chat remains read-only.
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-3 text-sm text-[color:var(--muted)]">
                Chat remains read-only, and backup export stays limited to admin users.
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <MobileFabMenu actions={fabActions} label="Dashboard actions" />
    </main>
  );
}
