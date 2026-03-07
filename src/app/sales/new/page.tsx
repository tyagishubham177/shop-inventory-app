import { redirect } from "next/navigation";

import { ActionLink } from "@/components/action-link";
import { SectionCard } from "@/components/section-card";
import { SalesEntryForm } from "@/components/sales/sales-entry-form";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getSalesProductOptions } from "@/lib/sales/data";
import type { SalesProductOption } from "@/lib/sales/types";

export default async function NewSalesEntryPage() {
  const user = await requireCurrentUser();

  if (user.role === "viewer") {
    redirect("/sales?notice=read-only");
  }

  let products: SalesProductOption[] = [];
  let loadError: string | null = null;

  try {
    products = await getSalesProductOptions();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Sales cannot be created until Supabase is connected.";
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <SectionCard eyebrow="Cannot create yet" title="Sales setup is still missing">
          <p>{loadError}</p>
          <p className="mt-3">
            Next step: confirm your phase 2 migration and inventory seed data exist, then reload this page.
          </p>
        </SectionCard>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Phase 4 sales
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900">
            Add a sale
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--muted)]">
            Capture either a linked inventory sale or a quick manual sale from the same mobile-friendly screen.
          </p>
        </div>

        <ActionLink href="/sales" muted>
          Back to sales
        </ActionLink>
      </section>

      <SalesEntryForm mode="create" products={products} />
    </main>
  );
}
