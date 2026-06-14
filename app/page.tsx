import Link from "next/link";
import Image from "next/image";
import {
  DocIcon,
  HomeIcon,
  CalendarIcon,
  KeyIcon,
} from "@/components/icons";
import { BrandLogo } from "@/components/BrandLogo";

const SERVICES = [
  {
    href: "/home",
    Icon: DocIcon,
    title: "Get help with housing forms",
    body: "Answer a few questions out loud, in your language. We fill out the official CalWORKs Homeless Assistance forms for you.",
    cta: "Start now",
  },
  {
    href: "/resources",
    Icon: HomeIcon,
    title: "Find shelters & food banks",
    body: "Nearby shelters, food banks, and public transit across Santa Clara and San Francisco Counties.",
    cta: "Browse resources",
  },
  {
    href: "/feed",
    Icon: CalendarIcon,
    title: "Community events",
    body: "Announcements and upcoming events posted by shelters across both counties.",
    cta: "See what's happening",
  },
  {
    href: "/shelters",
    Icon: KeyIcon,
    title: "Shelter staff",
    body: "Shelter staff: log in with your shelter code to manage participants and review new applicants.",
    cta: "Shelter login",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b border-line bg-brand-tint">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-2xl">
            <BrandLogo className="mb-8 text-navy" />
            <p className="text-sm font-bold uppercase tracking-wide text-brand">
              Santa Clara &amp; San Francisco Counties
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-navy sm:text-5xl">
              Help with your housing assistance, in your language.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink/80">
              housingAId guides you through the official Homeless Assistance
              forms — by voice or text — and points you to nearby shelters, food,
              and transit. Free, private, and available 24/7.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/language"
                className="inline-flex items-center justify-center rounded bg-brand px-7 py-3.5 text-base font-bold text-white transition hover:bg-brand-dark"
              >
                Start now
              </Link>
              <Link
                href="/resources"
                className="inline-flex items-center justify-center rounded border-2 border-brand bg-white px-7 py-3.5 text-base font-bold text-brand transition hover:bg-brand-tint"
              >
                Find resources near me
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold text-navy">How can we help today?</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="group flex flex-col rounded border border-line bg-white p-6 transition hover:border-brand hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded bg-brand-tint text-brand">
                <s.Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-xl font-bold text-navy">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/75">
                {s.body}
              </p>
              <span className="mt-4 text-sm font-bold text-link group-hover:underline">
                {s.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand">
              About HousingAId
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
              We help people move from crisis to connection.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/80">
              HousingAId exists to make housing support easier to reach for
              people who are already carrying too much. We guide residents
              through confusing forms, connect them with nearby shelters and
              services, and give shelter teams a clearer way to support the
              people who come to them.
            </p>
            <p className="mt-4 leading-relaxed text-ink/75">
              We are committed to building tools that are respectful, accessible,
              multilingual, and practical in urgent moments. Our mission is to
              reduce paperwork barriers, protect dignity, and help communities
              respond faster with the resources people need most.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Image
              src="/about/homeless.jpeg"
              alt="A person sitting near belongings on a city sidewalk."
              width={1440}
              height={898}
              className="h-64 w-full rounded object-cover shadow-sm sm:h-72 lg:h-64"
            />
            <Image
              src="/about/homess2.jpg"
              alt="A person receiving help while sitting outdoors."
              width={1900}
              height={1404}
              className="h-64 w-full rounded object-cover shadow-sm sm:h-72 lg:h-64"
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-line bg-brand-tint/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-brand">
              Contact
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
              Get in touch with HousingAId.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink/75">
              For partnerships, shelter coordination, or general questions,
              reach out to our team. These contact details are placeholders for
              the demo.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <a
              href="mailto:staff@housingaid.org"
              className="rounded border border-line bg-white p-5 transition hover:border-brand hover:shadow-sm"
            >
              <div className="text-xs font-bold uppercase tracking-wide text-ink/50">
                Email
              </div>
              <div className="mt-2 text-sm font-bold text-navy">
                staff@housingaid.org
              </div>
            </a>

            <a
              href="tel:+14085550192"
              className="rounded border border-line bg-white p-5 transition hover:border-brand hover:shadow-sm"
            >
              <div className="text-xs font-bold uppercase tracking-wide text-ink/50">
                Phone
              </div>
              <div className="mt-2 text-sm font-bold text-navy">
                (408) 555-0192
              </div>
            </a>

            <a
              href="https://instagram.com/housingaId"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-line bg-white p-5 transition hover:border-brand hover:shadow-sm"
            >
              <div className="text-xs font-bold uppercase tracking-wide text-ink/50">
                Instagram
              </div>
              <div className="mt-2 text-sm font-bold text-navy">
                @housingaId
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Reassurance strip */}
      <section className="border-t border-line bg-brand-tint/50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
          {[
            {
              t: "Answer once",
              d: "Tell us each answer a single time — we reuse it across every form.",
            },
            {
              t: "Stays on your device",
              d: "Your answers live in your browser. Delete everything with one tap.",
            },
            {
              t: "A person can help",
              d: "If anything goes wrong, we point you to someone who can help in person.",
            },
          ].map((f) => (
            <div key={f.t} className="border-l-4 border-brand pl-4">
              <h3 className="text-base font-bold text-navy">{f.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
