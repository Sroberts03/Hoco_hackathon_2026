// Illustrative project cards for the landing hero. These are static
// examples, not real listings. The live feed replaces them later.

type Example = {
  title: string;
  type: "Web app" | "Video";
  status: string;
  tags: string[];
  cover: React.ReactNode;
};

const EXAMPLES: Example[] = [
  {
    title: "Pathfinding visualizer",
    type: "Web app",
    status: "Complete",
    tags: ["Algorithms", "JavaScript"],
    cover: <GridCover />,
  },
  {
    title: "Robot arm calibration",
    type: "Video",
    status: "Seeking collaborators",
    tags: ["Robotics", "Computer Vision"],
    cover: <VideoCover />,
  },
  {
    title: "Transit delay dashboard",
    type: "Web app",
    status: "Maintained",
    tags: ["Data Visualization", "Python"],
    cover: <HeatCover />,
  },
  {
    title: "Accessible form kit",
    type: "Web app",
    status: "Maintained",
    tags: ["React", "Accessibility"],
    cover: <FormCover />,
  },
];

export function ExampleGallery() {
  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {EXAMPLES.map((e, i) => (
          <article
            key={e.title}
            className={`overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${
              i % 2 === 1 ? "translate-y-6" : ""
            }`}
          >
            <div className="aspect-[16/10] overflow-hidden border-b border-line">{e.cover}</div>
            <div className="p-3 sm:p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                <span>{e.type}</span>
                <span aria-hidden>·</span>
                <span className="truncate">{e.status}</span>
              </div>
              <h3 className="mt-1 truncate text-sm font-semibold text-ink">{e.title}</h3>
              <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
                {e.tags.map((t) => (
                  <span key={t} className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-10 text-center text-xs text-muted">Example projects</p>
    </div>
  );
}

function GridCover() {
  const cells = Array.from({ length: 12 * 7 }, (_, i) => i);
  const path = new Set([15, 16, 17, 29, 41, 42, 43, 44, 56, 68, 69, 70]);
  const walls = new Set([4, 18, 30, 31, 32, 46, 58, 59, 20, 33, 61, 62]);
  const seen = new Set([3, 14, 27, 28, 40, 53, 54, 55, 57, 67, 71, 45]);
  return (
    <div className="grid h-full w-full grid-cols-12 gap-px bg-line p-px">
      {cells.map((i) => (
        <div
          key={i}
          className={
            path.has(i) ? "bg-amber-500/80" : walls.has(i) ? "bg-ink/70" : seen.has(i) ? "bg-accent-soft" : "bg-surface"
          }
        />
      ))}
    </div>
  );
}

function VideoCover() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#1d2523]">
      <svg viewBox="0 0 160 100" className="absolute inset-0 h-full w-full opacity-60" aria-hidden>
        <path d="M30 80 L60 50 L95 62 L125 30" stroke="#86bcb2" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="30" cy="80" r="5" fill="#86bcb2" />
        <circle cx="60" cy="50" r="4" fill="#86bcb2" />
        <circle cx="95" cy="62" r="4" fill="#86bcb2" />
        <rect x="118" y="23" width="14" height="14" rx="2" fill="none" stroke="#e6eeec" strokeWidth="1.5" />
      </svg>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/90">
        <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3 fill-[#1d2523]" aria-hidden>
          <path d="M2 1 L11 6 L2 11 Z" />
        </svg>
      </span>
    </div>
  );
}

function HeatCover() {
  const rows = 5;
  const cols = 14;
  return (
    <div className="grid h-full w-full gap-[2px] bg-surface p-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: rows * cols }, (_, i) => {
        const h = i % cols;
        const r = Math.floor(i / cols);
        const v = Math.exp(-((h - 3.5) ** 2) / 3) + Math.exp(-((h - 10) ** 2) / 4);
        const a = Math.min(0.9, 0.08 + v * (0.25 + r * 0.14));
        return <div key={i} className="rounded-[2px]" style={{ background: `rgba(180, 70, 55, ${a})` }} />;
      })}
    </div>
  );
}

function FormCover() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-2 bg-surface-2 px-5">
      <div className="h-1.5 w-12 rounded bg-ink/60" />
      <div className="h-5 rounded border border-line bg-surface" />
      <div className="h-1.5 w-16 rounded bg-ink/60" />
      <div className="h-5 rounded border-2 border-danger/70 bg-surface" />
      <div className="h-1.5 w-24 rounded bg-danger/60" />
      <div className="h-5 w-16 rounded bg-accent" />
    </div>
  );
}
