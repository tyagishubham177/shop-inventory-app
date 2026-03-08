"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { InventoryCategoryOption, InventoryProduct } from "@/lib/inventory/types";

type InventoryProductFormProps = {
  categories: InventoryCategoryOption[];
  mode: "create" | "edit";
  product?: InventoryProduct;
  readOnly?: boolean;
};

type InventoryMutationResponse = {
  product?: {
    id: string;
  };
  error?: string;
  errors?: string[];
};

function formatMoney(value?: number) {
  return typeof value === "number" ? value.toFixed(2) : "0.00";
}

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-700">{message}</p>;
}

export function InventoryProductForm({
  categories,
  mode,
  product,
  readOnly = false,
}: InventoryProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    if (readOnly) {
      return;
    }

    setError(null);

    const payload = {
      sku: String(formData.get("sku") ?? ""),
      name: String(formData.get("name") ?? ""),
      brand: String(formData.get("brand") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      size: String(formData.get("size") ?? ""),
      color: String(formData.get("color") ?? ""),
      purchasePrice: String(formData.get("purchasePrice") ?? ""),
      sellingPrice: String(formData.get("sellingPrice") ?? ""),
      currentStock: String(formData.get("currentStock") ?? ""),
      reorderLevel: String(formData.get("reorderLevel") ?? ""),
      location: String(formData.get("location") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      stockReason: String(formData.get("stockReason") ?? ""),
    };

    const endpoint = mode === "create" ? "/api/inventory" : `/api/inventory/${product?.id}`;
    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as InventoryMutationResponse;

    if (!response.ok) {
      const validationMessage = data.errors?.join(" ");
      setError(validationMessage ?? data.error ?? "The inventory record could not be saved.");
      return;
    }

    const nextId = data.product?.id ?? product?.id;

    startTransition(() => {
      if (!nextId) {
        router.refresh();
        return;
      }

      router.replace(
        mode === "create" ? `/inventory/${nextId}?created=1` : `/inventory/${nextId}?saved=1`,
      );
      router.refresh();
    });
  }

  return (
    <form
      action={handleSubmit}
      className="grid gap-5 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)] backdrop-blur md:p-6"
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="sku"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            SKU
          </label>
          <input
            id="sku"
            name="sku"
            type="text"
            defaultValue={product?.sku ?? ""}
            placeholder="SKU-001"
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly}
            required
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            Product name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={product?.name ?? ""}
            placeholder="Slim fit jeans"
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly}
            required
          />
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={product?.categoryId ?? categories[0]?.id ?? ""}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly || categories.length === 0}
            required
          >
            {categories.length === 0 ? <option value="">No categories available</option> : null}
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FormError
            message={
              categories.length === 0
                ? "Seed the category master data first so products can be assigned correctly."
                : undefined
            }
          />
        </div>

        <div>
          <label
            htmlFor="brand"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            Brand
          </label>
          <input
            id="brand"
            name="brand"
            type="text"
            defaultValue={product?.brand ?? ""}
            placeholder="Levis"
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="purchasePrice"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            Purchase price
          </label>
          <input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={formatMoney(product?.purchasePrice)}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly}
            required
          />
        </div>

        <div>
          <label
            htmlFor="sellingPrice"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            Selling price
          </label>
          <input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={formatMoney(product?.sellingPrice)}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly}
            required
          />
        </div>

        <div>
          <label
            htmlFor="currentStock"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            Current stock
          </label>
          <input
            id="currentStock"
            name="currentStock"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.currentStock ?? 0}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly}
            required
          />
        </div>

        <div>
          <label
            htmlFor="reorderLevel"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            Reorder level
          </label>
          <input
            id="reorderLevel"
            name="reorderLevel"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.reorderLevel ?? 0}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly}
            required
          />
        </div>

        <div>
          <label
            htmlFor="size"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            Size
          </label>
          <input
            id="size"
            name="size"
            type="text"
            defaultValue={product?.size ?? ""}
            placeholder="M"
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly}
          />
        </div>

        <div>
          <label
            htmlFor="color"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            Color
          </label>
          <input
            id="color"
            name="color"
            type="text"
            defaultValue={product?.color ?? ""}
            placeholder="Black"
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly}
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="location"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={product?.location ?? ""}
            placeholder="Rack A3"
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly}
          />
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <label
            htmlFor="stockReason"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            Stock change reason
          </label>
          <input
            id="stockReason"
            name="stockReason"
            type="text"
            defaultValue=""
            placeholder={
              mode === "create"
                ? "Opening stock from initial inventory setup"
                : "Adjusted after shelf recount"
            }
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly}
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]"
          >
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={product?.notes ?? ""}
            placeholder="Optional notes for the shop team"
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || readOnly}
          />
        </div>
      </section>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {readOnly ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-soft)] px-4 py-3 text-sm text-[color:var(--muted)]">
          Your role is read-only here, so the form is locked for viewing only.
        </div>
      ) : (
        <button
          type="submit"
          className="ui-button ui-button-primary w-full sm:w-auto"
          disabled={isPending || categories.length === 0}
        >
          {isPending ? "Saving..." : mode === "create" ? "Create product" : "Save changes"}
        </button>
      )}
    </form>
  );
}
