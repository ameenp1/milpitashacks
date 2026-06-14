import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
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
          <div className="text-3xl">🙋</div>
          <h2 className="mt-4 text-2xl font-semibold text-neutral-900">
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
          <div className="text-3xl">🏠</div>
          <h2 className="mt-4 text-2xl font-semibold text-neutral-900">
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
    </main>
  );
}
