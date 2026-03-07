import { redirect } from "next/navigation";

import { ActionLink } from "@/components/action-link";
import { InventoryProductForm } from "@/components/inventory/inventory-product-form";
import { SectionCard } from "@/components/section-card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import type { InventoryCategoryOption } from "@/lib/inventory/types";
import { getInventoryCategories } from "@/lib/inventory/data";

export default async function NewInventoryProductPage() {
  const user = await requireCurrentUser();

  if (user.role === "viewer") {
    redirect("/inventory?notice=read-only");
  }

  let categories: InventoryCategoryOption[] = [];
  let loadError: string | null = null;

  try {
    categories = await getInventoryCategories();
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Inventory cannot be created until Supabase is connected.";
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <SectionCard eyebrow="Cannot create yet" title="Inventory setup is still missing">
          <p>{loadError}</p>
          <p className="mt-3">
            Next step: apply the phase 2 migration and category seed in your dev Supabase project,
            then reload this page.
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
            Phase 3 inventory
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900">
            Add a product
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--muted)]">
            Start with the essentials first. Pricing, stock, and notes all stay in one mobile-first
            form.
          </p>
        </div>

        <ActionLink href="/inventory" muted>
          Back to inventory
        </ActionLink>
      </section>

      <InventoryProductForm categories={categories} mode="create" />
    </main>
  );
}
