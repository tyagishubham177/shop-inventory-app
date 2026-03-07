type StatusPillProps = {
  label: string;
  tone?: "ready" | "pending";
};

export function StatusPill({ label, tone = "ready" }: StatusPillProps) {
  const toneClasses =
    tone === "ready"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-amber-100 text-amber-800";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClasses}`}>
      {label}
    </span>
  );
}
