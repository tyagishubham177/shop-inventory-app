import type { ReactNode } from "react";

type SectionCardProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ eyebrow, title, children, className = "" }: SectionCardProps) {
  return (
    <section
      className={`rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[var(--shadow)] backdrop-blur sm:p-5 md:p-6 ${className}`.trim()}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)] sm:text-xs">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--foreground)] sm:text-xl">
        {title}
      </h2>
      <div className="mt-4 text-sm leading-6 text-[color:var(--muted)]">{children}</div>
    </section>
  );
}
