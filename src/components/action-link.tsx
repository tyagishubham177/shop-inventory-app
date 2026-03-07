import Link from "next/link";
import type { ReactNode } from "react";

type ActionLinkProps = {
  href: string;
  children: ReactNode;
  muted?: boolean;
};

export function ActionLink({ href, children, muted = false }: ActionLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5 ${
        muted
          ? "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)]"
          : "border-transparent bg-[color:var(--primary)] text-white shadow-[var(--shadow)]"
      }`}
    >
      {children}
    </Link>
  );
}
