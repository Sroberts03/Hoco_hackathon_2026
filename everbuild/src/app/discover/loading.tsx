export default function DiscoverLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10" aria-busy="true">
      <div className="h-7 w-56 animate-pulse rounded bg-surface-2" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-surface-2" />
          ))}
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="h-72 animate-pulse rounded-xl border border-line bg-surface" />
          ))}
        </ul>
      </div>
      <span className="sr-only">Loading projects…</span>
    </main>
  );
}
