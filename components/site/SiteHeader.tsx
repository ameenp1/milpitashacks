"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

const NAV = [
  { href: "/home", label: "Get Help" },
  { href: "/resources", label: "Resources" },
  { href: "/feed", label: "Community" },
  { href: "/shelters", label: "Shelter Staff" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <header>
      {/* Row 1 — navy utility strip */}
      <div className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs">
          <span className="hidden sm:inline">
            Santa Clara &amp; San Francisco Counties
          </span>
          <span>
            Need help now? Call{" "}
            <a href="tel:211" className="font-semibold underline underline-offset-2">
              211
            </a>{" "}
            — free, 24/7
          </span>
        </div>
      </div>

      {/* Row 2 — white logo + search bar */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
          <BrandLogo compact className="text-navy" />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/resources");
            }}
            className="hidden items-stretch sm:flex"
          >
            <input
              type="search"
              placeholder="Search resources"
              aria-label="Search resources"
              className="w-56 rounded-l-md border border-line border-r-0 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              className="rounded-r-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Search
            </button>
          </form>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="rounded-md border border-line p-2 text-navy md:hidden"
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
          </button>
        </div>
      </div>

      {/* Row 3 — bright blue primary nav */}
      <div className="hidden bg-brand md:block">
        <nav className="mx-auto flex max-w-6xl items-stretch px-2">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark ${
                  active ? "bg-brand-dark" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/language"
            className="ml-auto px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Start an application →
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-b border-line bg-white px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-line px-2 py-3 text-sm font-semibold text-navy last:border-0"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/language"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-md bg-brand px-3 py-3 text-center text-sm font-bold text-white"
          >
            Start an application
          </Link>
        </nav>
      )}
    </header>
  );
}
