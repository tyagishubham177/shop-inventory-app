import Link from "next/link";
import type { ReactNode } from "react";

type ActionLinkProps = {
  href: string;
  children: ReactNode;
  muted?: boolean;
  className?: string;
};

export function ActionLink({ href, children, muted = false, className = "" }: ActionLinkProps) {
  return (
    <Link
      href={href}
      className={`ui-button ${muted ? "ui-button-secondary" : "ui-button-primary"} ${className}`.trim()}
    >
      {children}
    </Link>
  );
}
