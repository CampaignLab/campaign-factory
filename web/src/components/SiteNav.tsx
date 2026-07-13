"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Fixed pill nav from the awake prototype: brand left, pill links, backdrop blur.
const LINKS = [
  { href: "/", label: "New campaign" },
  { href: "/wall", label: "Campaign Gallery" },
];

export function SiteNav() {
  const path = usePathname() || "/";
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 sm:px-7">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-[1.05rem] font-semibold tracking-tight">Campaign Factory</span>
          <span className="hidden text-xs font-normal text-muted-foreground md:inline">
            UK local &amp; public-policy campaigns
          </span>
        </Link>
        <nav className="flex gap-1 rounded-full bg-foreground/[0.05] p-1">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors sm:px-4 ${
                  active ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/[0.07]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
