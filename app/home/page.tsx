import Link from "next/link";

export default function ResidentHome() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-neutral-400 hover:text-neutral-700"
      >
        ← Back
      </Link>

      <div className="mb-3 text-sm font-medium tracking-wide text-neutral-500">
        Santa Clara County · CalWORKs Homeless Assistance
      </div>

      <h1 className="text-4xl font-semibold leading-tight text-neutral-900 sm:text-5xl">
        Get help with your housing assistance forms.
      </h1>

      <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-600">
        Answer a few simple questions out loud, in your language. We fill out the
        official forms for you, explain anything confusing, and prepare them for
        review — so you only have to answer each question once.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href="/language"
          className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-8 py-4 text-lg font-medium text-white transition hover:bg-neutral-700"
        >
          Start
        </Link>
        <Link
          href="/apply"
          className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-8 py-4 text-lg font-medium text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
        >
          Apply online with a guide
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 text-base font-medium text-blue-700 underline-offset-2 hover:underline"
        >
          Find nearby shelters, food banks & transit →
        </Link>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-base font-medium text-blue-700 underline-offset-2 hover:underline"
        >
          See shelter events & community posts →
        </Link>
      </div>

      <p className="mt-10 max-w-xl text-sm leading-relaxed text-neutral-500">
        Your answers stay on this device. You can delete everything with one tap
        when you are done. If anything goes wrong, we will point you to a person
        who can help.
      </p>

      <Link
        href="/privacy"
        className="mt-4 inline-block text-sm text-neutral-400 underline-offset-2 hover:text-neutral-700 hover:underline"
      >
        Privacy
      </Link>
    </main>
  );
}
