"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { SaleEntry, SalesMode, SalesProductOption } from "@/lib/sales/types";

type SalesEntryFormProps = {
  mode: "create" | "edit";
  sale?: SaleEntry;
  products: SalesProductOption[];
  readOnly?: boolean;
};

type SalesMutationResponse = {
  sale?: {
    id: string;
  };
  sales?: Array<{
    id: string;
  }>;
  error?: string;
  errors?: string[];
};

function formatMoney(value?: number) {
  return typeof value === "number" ? value.toFixed(2) : "0.00";
}

function formatDateTimeLocal(value?: string) {
  const date = value ? new Date(value) : new Date();
  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

export function SalesEntryForm({
  mode,
  sale,
  products,
  readOnly = false,
}: SalesEntryFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleMode, setSaleMode] = useState<SalesMode>(sale?.saleMode ?? "linked");
  const [productId, setProductId] = useState(sale?.productId ?? products[0]?.id ?? "");
  const [productName, setProductName] = useState(
    sale?.saleMode === "manual" ? sale.productNameSnapshot : "",
  );
  const [categoryName, setCategoryName] = useState(
    sale?.saleMode === "manual" ? sale.categoryNameSnapshot ?? "" : "",
  );
  const [brand, setBrand] = useState(sale?.saleMode === "manual" ? sale.brandSnapshot ?? "" : "");
  const [size, setSize] = useState(sale?.saleMode === "manual" ? sale.sizeSnapshot ?? "" : "");
  const [color, setColor] = useState(sale?.saleMode === "manual" ? sale.colorSnapshot ?? "" : "");
  const [quantity, setQuantity] = useState(String(sale?.quantity ?? 1));
  const [unitPrice, setUnitPrice] = useState(() => {
    if (sale?.unitPrice) {
      return formatMoney(sale.unitPrice);
    }

    if (products[0]) {
      return formatMoney(products[0].sellingPrice);
    }

    return "0.00";
  });
  const [soldAt, setSoldAt] = useState(formatDateTimeLocal(sale?.soldAt));
  const [notes, setNotes] = useState(sale?.notes ?? "");

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [productId, products],
  );

  const quantityValue = Number.parseInt(quantity, 10);
  const unitPriceValue = Number.parseFloat(unitPrice);
  const lineTotal =
    Number.isFinite(quantityValue) && Number.isFinite(unitPriceValue)
      ? (quantityValue * unitPriceValue).toFixed(2)
      : "0.00";

  function handleModeChange(nextMode: SalesMode) {
    setSaleMode(nextMode);

    if (nextMode === "linked" && selectedProduct) {
      setUnitPrice(formatMoney(selectedProduct.sellingPrice));
    }
  }

  function handleProductChange(nextProductId: string) {
    setProductId(nextProductId);

    const nextProduct = products.find((product) => product.id === nextProductId);

    if (nextProduct) {
      setUnitPrice(formatMoney(nextProduct.sellingPrice));
    }
  }

  async function handleSubmit() {
    if (readOnly) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const payload = {
      saleMode,
      productId: saleMode === "linked" ? productId : "",
      productName,
      categoryName,
      brand,
      size,
      color,
      quantity,
      unitPrice,
      soldAt,
      notes,
    };

    const endpoint = mode === "create" ? "/api/sales" : `/api/sales/${sale?.id}`;
    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      setIsSubmitting(false);
      setError("Network error while saving the sale. Please retry.");
      return;
    }

    const data = (await response.json().catch(() => ({}))) as SalesMutationResponse;

    if (!response.ok) {
      const validationMessage = data.errors?.join(" ");
      setError(validationMessage ?? data.error ?? "The sales entry could not be saved.");
      setIsSubmitting(false);
      return;
    }

    const nextId = data.sale?.id ?? data.sales?.[0]?.id ?? sale?.id;

    startTransition(() => {
      if (!nextId) {
        router.refresh();
        return;
      }

      router.replace(mode === "create" ? `/sales/${nextId}?created=1` : `/sales/${nextId}?saved=1`);
      router.refresh();
      setIsSubmitting(false);
    });
  }

  return (
    <form
      action={handleSubmit}
      className="grid gap-5 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)] backdrop-blur md:p-6"
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="saleMode" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Sale mode
          </label>
          <select
            id="saleMode"
            name="saleMode"
            value={saleMode}
            onChange={(event) => handleModeChange(event.target.value === "manual" ? "manual" : "linked")}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || isSubmitting || readOnly}
          >
            <option value="linked">Linked to inventory</option>
            <option value="manual">Manual sale</option>
          </select>
        </div>

        <div>
          <label htmlFor="soldAt" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Sold at
          </label>
          <input
            id="soldAt"
            name="soldAt"
            type="datetime-local"
            value={soldAt}
            onChange={(event) => setSoldAt(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || isSubmitting || readOnly}
            required
          />
        </div>
      </section>

      {saleMode === "linked" ? (
        <section className="grid gap-4">
          <div>
            <label htmlFor="productId" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              Linked product
            </label>
            <select
              id="productId"
              name="productId"
              value={productId}
              onChange={(event) => handleProductChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
              disabled={isPending || isSubmitting || readOnly || products.length === 0}
              required
            >
              {products.length === 0 ? <option value="">No active products available</option> : null}
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct ? (
            <div className="grid gap-3 rounded-2xl bg-[color:var(--surface-strong)] p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Category</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">{selectedProduct.categoryName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Stock</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">{selectedProduct.currentStock} available</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Default price</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">INR {formatMoney(selectedProduct.sellingPrice)}</p>
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="productName" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              Product name
            </label>
            <input
              id="productName"
              name="productName"
              type="text"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="Counter sale item"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
              disabled={isPending || isSubmitting || readOnly}
              required={saleMode === "manual"}
            />
          </div>

          <div>
            <label htmlFor="categoryName" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              Category
            </label>
            <input
              id="categoryName"
              name="categoryName"
              type="text"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Optional"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
              disabled={isPending || isSubmitting || readOnly}
            />
          </div>

          <div>
            <label htmlFor="brand" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              Brand
            </label>
            <input
              id="brand"
              name="brand"
              type="text"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder="Optional"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
              disabled={isPending || isSubmitting || readOnly}
            />
          </div>

          <div>
            <label htmlFor="size" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              Size
            </label>
            <input
              id="size"
              name="size"
              type="text"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              placeholder="Optional"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
              disabled={isPending || isSubmitting || readOnly}
            />
          </div>

          <div>
            <label htmlFor="color" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              Color
            </label>
            <input
              id="color"
              name="color"
              type="text"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              placeholder="Optional"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
              disabled={isPending || isSubmitting || readOnly}
            />
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="quantity" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Quantity
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || isSubmitting || readOnly}
            required
          />
        </div>

        <div>
          <label htmlFor="unitPrice" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Unit price
          </label>
          <input
            id="unitPrice"
            name="unitPrice"
            type="number"
            min="0.01"
            step="0.01"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || isSubmitting || readOnly}
            required
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">Line total</p>
          <div className="mt-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-lg font-semibold text-[color:var(--foreground)]">
            INR {lineTotal}
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <label htmlFor="notes" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional sale note for later reference"
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--primary)] focus:ring-4 focus:ring-[color:rgba(15,118,110,0.12)]"
            disabled={isPending || isSubmitting || readOnly}
          />
        </div>
      </section>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {readOnly ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background-soft)] px-4 py-3 text-sm text-[color:var(--muted)]">
          Your role is read-only here, so the sale form is locked for viewing only.
        </div>
      ) : (
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:bg-[color:var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending || isSubmitting || (saleMode === "linked" && products.length === 0)}
        >
          {isSubmitting || isPending ? (mode === "create" ? "Creating sale..." : "Saving correction...") : mode === "create" ? "Create sale" : "Save correction"}
        </button>
      )}
    </form>
  );
}



