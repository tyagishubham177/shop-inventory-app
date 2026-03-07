import type { ReactNode } from "react";

type SectionCardProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function SectionCard({ eyebrow, title, children }: SectionCardProps) {
  return (
    <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)] backdrop-blur md:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--foreground)]">
        {title}
      </h2>
      <div className="mt-4 text-sm leading-6 text-[color:var(--muted)]">{children}</div>
    </section>
  );
}
