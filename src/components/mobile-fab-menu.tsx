"use client";

import Link from "next/link";
import { useState } from "react";

type MobileFabAction = {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
};

type MobileFabMenuProps = {
  actions: MobileFabAction[];
  label?: string;
};

export function MobileFabMenu({ actions, label = "Quick actions" }: MobileFabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="md:hidden">
      {isOpen ? (
        <button
          type="button"
          aria-label="Close quick actions"
          className="fixed inset-0 z-40 bg-slate-900/16 backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {isOpen ? (
          <div className="ui-fab-sheet">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">
              {label}
            </p>
            <div className="grid gap-2">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  onClick={() => setIsOpen(false)}
                  className={`ui-button ${action.tone === "secondary" ? "ui-button-secondary" : "ui-button-primary"} w-full justify-start`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="ui-fab"
          aria-expanded={isOpen}
          aria-label={label}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="text-xl leading-none">{isOpen ? "-" : "+"}</span>
          <span className="text-sm font-semibold">{isOpen ? "Close" : "Menu"}</span>
        </button>
      </div>
    </div>
  );
}
