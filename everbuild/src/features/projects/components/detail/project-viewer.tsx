"use client";

import { useRef } from "react";
import type { ProjectType } from "../../lib/constants";

type Props = {
  title: string;
  type: ProjectType;
  hostedAppUrl: string | null;
  videoUrl: string | null;
  posterUrl: string | null;
};

/**
 * Runs the project in place. Web apps load in an iframe with
 * sandbox="allow-scripts" and no allow-same-origin: the app gets an opaque
 * origin and can't reach Everbuild's cookies, storage, or DOM.
 */
export function ProjectViewer({ title, type, hostedAppUrl, videoUrl, posterUrl }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);

  if (type === "video" && videoUrl) {
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-black">
        <video controls preload="metadata" playsInline poster={posterUrl ?? undefined} className="aspect-video w-full" src={videoUrl}>
          Your browser can&apos;t play this video.
        </video>
      </div>
    );
  }

  if (type === "web_app" && hostedAppUrl) {
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-3 py-2 text-xs text-muted">
          <span className="flex items-center gap-2">
            <span className="flex gap-1" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
            </span>
            Running in a sandbox on Everbuild
          </span>
          <span className="flex items-center gap-3">
            <button type="button" onClick={() => frameRef.current?.requestFullscreen?.()} className="hover:text-ink">
              Full screen
            </button>
            <a href={hostedAppUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              Open in new tab ↗
            </a>
          </span>
        </div>
        <div ref={frameRef} className="bg-white">
          <iframe
            src={hostedAppUrl}
            title={`${title} (interactive demo)`}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            loading="lazy"
            className="block aspect-[16/10] w-full border-0 [:fullscreen_&]:h-screen"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex aspect-[16/9] flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface text-center">
      <p className="font-medium">No demo uploaded yet</p>
      <p className="mt-1 max-w-xs text-sm text-muted">
        {type === "video" ? "This video hasn't been uploaded." : "This web app's files haven't been uploaded."}
      </p>
    </div>
  );
}
