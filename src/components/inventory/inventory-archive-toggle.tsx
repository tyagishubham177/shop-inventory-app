"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type InventoryArchiveToggleProps = {
  isArchived: boolean;
  productId: string;
};

type InventoryArchiveResponse = {
  error?: string;
};

export function InventoryArchiveToggle({
  isArchived,
  productId,
}: InventoryArchiveToggleProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    const shouldContinue = window.confirm(
      isArchived
        ? "Restore this product to the active inventory list?"
        : "Archive this product so it is hidden from active inventory?",
    );

    if (!shouldContinue) {
      return;
    }

    setError(null);

    const nextAction = isArchived ? "restore" : "archive";
    const response = await fetch(`/api/inventory/${productId}/${nextAction}`, {
      method: "POST",
    });
    const data = (await response.json().catch(() => ({}))) as InventoryArchiveResponse;

    if (!response.ok) {
      setError(data.error ?? "The archive change could not be saved.");
      return;
    }

    startTransition(() => {
      router.replace(`/inventory/${productId}?${isArchived ? "restored=1" : "archived=1"}`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold shadow-[var(--shadow)] transition disabled:cursor-not-allowed disabled:opacity-70 ${
          isArchived
            ? "bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary-strong)]"
            : "bg-amber-100 text-amber-950 hover:bg-amber-200"
        }`}
        disabled={isPending}
      >
        {isPending ? "Saving..." : isArchived ? "Restore product" : "Archive product"}
      </button>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
