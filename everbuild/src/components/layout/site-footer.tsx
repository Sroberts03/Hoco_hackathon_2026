import { LogoMark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-accent">
            <LogoMark className="h-4 w-4" />
          </span>
          <span>Everbuild</span>
        </div>
        <p>See what people build instead of reading what they claim.</p>
      </div>
    </footer>
  );
}
