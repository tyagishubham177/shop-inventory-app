import Link from "next/link";
import type { ReactNode } from "react";

type ActionLinkProps = {
  href: string;
  children: ReactNode;
  muted?: boolean;
};

export function ActionLink({ href, children, muted = false }: ActionLinkProps) {
  const colorStyle = {
    color: muted ? "var(--foreground)" : "#ffffff",
  } as const;

  return (
    <Link
      href={href}
      style={colorStyle}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background-soft)] ${
        muted
          ? "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)]"
          : "border-transparent bg-[color:var(--primary)] shadow-[var(--shadow)] hover:bg-[color:var(--primary-strong)]"
      }`}
    >
      {children}
    </Link>
  );
}

