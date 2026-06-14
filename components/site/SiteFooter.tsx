import Link from "next/link";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] =
  [
    {
      heading: "Get Help",
      links: [
        { href: "/home", label: "Housing forms" },
        { href: "/language", label: "Start an application" },
        { href: "/apply", label: "Apply online with a guide" },
      ],
    },
    {
      heading: "In Your Community",
      links: [
        { href: "/resources", label: "Shelters & food banks" },
        { href: "/resources", label: "Public transit" },
        { href: "/feed", label: "Events & announcements" },
      ],
    },
    {
      heading: "For Staff",
      links: [
        { href: "/shelters", label: "Shelter staff login" },
        { href: "/forms", label: "Form library" },
      ],
    },
  ];

export function SiteFooter() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-baseline">
            <span className="text-xl font-extrabold">housing</span>
            <span className="text-xl font-extrabold text-white/80">AId</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Free, multilingual help completing CalWORKs Homeless Assistance
            forms for residents of Santa Clara &amp; San Francisco Counties.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">
              {col.heading}
            </h3>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/85 underline-offset-2 hover:text-white hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Your answers stay on your device. We never store them on a server.
          </span>
          <Link href="/privacy" className="hover:text-white hover:underline">
            Privacy &amp; your information
          </Link>
        </div>
      </div>
    </footer>
  );
}
