import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/BrandLogo";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col justify-center">
        <div className="mb-10">
          <BrandLogo className="mb-8" />
        </div>

        <div className="mb-3 text-sm font-medium tracking-wide text-neutral-500">
          Santa Clara & San Francisco Counties
        </div>

        <h1 className="text-4xl font-semibold leading-tight text-neutral-900 sm:text-5xl">
          How can we help today?
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-600">
          Choose the experience that fits you.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Link
            href="/home"
            className="group flex flex-col rounded-2xl border border-neutral-300 p-7 transition hover:border-neutral-900 hover:shadow-sm"
          >
            <h2 className="text-2xl font-semibold text-neutral-900">
              I need help
            </h2>
            <p className="mt-2 text-neutral-600">
              Get guided help with housing forms, and find nearby shelters, food
              banks, and public transit.
            </p>
            <span className="mt-5 text-sm font-medium text-blue-700 group-hover:underline">
              Enter →
            </span>
          </Link>

          <Link
            href="/shelters"
            className="group flex flex-col rounded-2xl border border-neutral-300 p-7 transition hover:border-neutral-900 hover:shadow-sm"
          >
            <h2 className="text-2xl font-semibold text-neutral-900">
              I run a shelter
            </h2>
            <p className="mt-2 text-neutral-600">
              Shelter staff: log in with your shelter code to manage participants
              and review new applicants.
            </p>
            <span className="mt-5 text-sm font-medium text-blue-700 group-hover:underline">
              Shelter login →
            </span>
          </Link>
        </div>
      </section>

      <section className="border-t border-neutral-200 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <div className="text-sm font-medium tracking-wide text-neutral-500">
              About HousingAId
            </div>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
              We help people move from crisis to connection.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-neutral-600">
              HousingAId exists to make housing support easier to reach for
              people who are already carrying too much. We guide residents
              through confusing forms, connect them with nearby shelters and
              services, and give shelter teams a clearer way to support the
              people who come to them.
            </p>
            <p className="mt-4 leading-relaxed text-neutral-600">
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
              className="h-64 w-full rounded-2xl object-cover sm:h-72 lg:h-64"
            />
            <Image
              src="/about/homess2.jpg"
              alt="A person receiving help while sitting outdoors."
              width={1900}
              height={1404}
              className="h-64 w-full rounded-2xl object-cover sm:h-72 lg:h-64"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-sm font-medium tracking-wide text-neutral-500">
            Contact
          </div>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
            Get in touch with HousingAId.
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-neutral-600">
            For partnerships, shelter coordination, or general questions, reach
            out to our team. These contact details are placeholders for the demo.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <a
              href="mailto:staff@housingaid.org"
              className="rounded-2xl border border-neutral-200 p-5 transition hover:border-neutral-900"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Email
              </div>
              <div className="mt-2 text-sm font-medium text-neutral-900">
                staff@housingaid.org
              </div>
            </a>

            <a
              href="tel:+14085550192"
              className="rounded-2xl border border-neutral-200 p-5 transition hover:border-neutral-900"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Phone
              </div>
              <div className="mt-2 text-sm font-medium text-neutral-900">
                (408) 555-0192
              </div>
            </a>

            <a
              href="https://instagram.com/housingaId"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-neutral-200 p-5 transition hover:border-neutral-900"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Instagram
              </div>
              <div className="mt-2 text-sm font-medium text-neutral-900">
                @housingaId
              </div>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
