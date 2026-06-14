import Link from "next/link";

export default function ResidentHome() {
  return (
    <main>
      <section className="border-b border-line bg-brand-tint">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <p className="text-sm font-bold uppercase tracking-wide text-brand">
            Santa Clara County · CalWORKs Homeless Assistance
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-navy sm:text-5xl">
            Get help with your housing assistance forms.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink/80">
            Answer a few simple questions out loud, in your language. We fill out
            the official forms for you, explain anything confusing, and prepare
            them for review — so you only have to answer each question once.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/language"
              className="inline-flex items-center justify-center rounded bg-brand px-7 py-3.5 text-base font-bold text-white transition hover:bg-brand-dark"
            >
              Start
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded border-2 border-brand bg-white px-7 py-3.5 text-base font-bold text-brand transition hover:bg-brand-tint"
            >
              Apply online with a guide
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/resources"
            className="rounded border border-line bg-white p-5 transition hover:border-brand hover:shadow-md"
          >
            <h2 className="text-base font-bold text-navy">
              Nearby shelters, food banks &amp; transit
            </h2>
            <p className="mt-1.5 text-sm text-ink/70">
              Find services near you across both counties.
            </p>
            <span className="mt-3 inline-block text-sm font-bold text-link">
              Browse resources →
            </span>
          </Link>
          <Link
            href="/feed"
            className="rounded border border-line bg-white p-5 transition hover:border-brand hover:shadow-md"
          >
            <h2 className="text-base font-bold text-navy">
              Shelter events &amp; community posts
            </h2>
            <p className="mt-1.5 text-sm text-ink/70">
              See announcements from shelters in your area.
            </p>
            <span className="mt-3 inline-block text-sm font-bold text-link">
              See community →
            </span>
          </Link>
        </div>

        <p className="mt-8 max-w-xl text-sm leading-relaxed text-ink/60">
          Your answers stay on this device. You can delete everything with one
          tap when you are done. If anything goes wrong, we will point you to a
          person who can help.
        </p>
      </section>
    </main>
  );
}
