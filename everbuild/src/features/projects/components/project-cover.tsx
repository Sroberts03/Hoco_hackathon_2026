import { stableUnitHash } from "@/lib/hash";
import type { ProjectType } from "../lib/constants";

// Neutral generated cover used until a project has an uploaded/auto-generated one.
// Deterministic per project so it never changes between renders.

const PALETTES = [
  ["#24524e", "#86bcb2"],
  ["#3b4a5c", "#9fb3c8"],
  ["#4a4038", "#c2ab92"],
  ["#3f4b3a", "#a9bb98"],
  ["#4b3d4f", "#b8a3bd"],
  ["#2f3e46", "#8fb0bc"],
] as const;

export function ProjectCover({ id, title, type }: { id: string; title: string; type: ProjectType }) {
  const h = (salt: string) => stableUnitHash(`${id}:${salt}`);
  const [bg, fg] = PALETTES[Math.floor(h("palette") * PALETTES.length)];
  const bars = Array.from({ length: 7 }, (_, i) => 18 + Math.round(h(`bar${i}`) * 52));

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: bg }} role="img" aria-label={`${title} cover`}>
      <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        {type === "web_app" ? (
          <g>
            <rect x="22" y="16" width="116" height="70" rx="5" fill="#fff" opacity="0.08" />
            <rect x="22" y="16" width="116" height="10" rx="5" fill="#fff" opacity="0.12" />
            <circle cx="29" cy="21" r="1.6" fill={fg} />
            <circle cx="34.5" cy="21" r="1.6" fill={fg} opacity="0.7" />
            <circle cx="40" cy="21" r="1.6" fill={fg} opacity="0.45" />
            {bars.map((b, i) => (
              <rect key={i} x={32 + i * 14} y={80 - b * 0.7} width="8" height={b * 0.7} rx="1.5" fill={fg} opacity={0.35 + (i % 3) * 0.2} />
            ))}
          </g>
        ) : (
          <g>
            {bars.map((b, i) => (
              <rect key={i} x="0" y={i * 14.3} width={60 + b * 1.4} height="14.3" fill={fg} opacity={0.06 + (i % 3) * 0.05} />
            ))}
            <circle cx="80" cy="50" r="15" fill="#fff" opacity="0.9" />
            <path d="M75 42 L89 50 L75 58 Z" fill={bg} />
          </g>
        )}
      </svg>
    </div>
  );
}
