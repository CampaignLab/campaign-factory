"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Awake-style pill nav: brand first, pill links, backdrop blur.
const LINKS = [
  { href: "/factory", label: "Factory Builder" },
  { href: "/gallery", label: "Campaign Gallery" },
  { href: "/operations", label: "Operations" },
];

export function SiteNav() {
  const path = usePathname() || "/";
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-7">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image
            src="/campaign-factory-logo.png"
            alt="Campaign Factory"
            width={32}
            height={32}
            priority
            className="h-7 w-7 shrink-0 dark:invert"
          />
          <span className="text-base font-semibold tracking-tight sm:text-[1.05rem]">Campaign Factory</span>
          <span className="hidden text-xs font-normal text-muted-foreground md:inline">
            UK local &amp; public-policy campaigns
          </span>
        </Link>
        <nav aria-label="Primary" className="flex w-full flex-wrap gap-1 rounded-[1.25rem] bg-foreground/[0.05] p-1 sm:w-auto sm:shrink-0 sm:rounded-full">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs transition-colors sm:px-4 sm:py-1.5 sm:text-sm ${
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
