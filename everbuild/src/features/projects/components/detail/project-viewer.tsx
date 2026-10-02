"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import sdk from "@stackblitz/sdk";
import { buttonClass } from "@/components/ui";
import type { ProjectType } from "../../lib/constants";
import { gitHubUrl, stackBlitzEditorUrl } from "../../lib/github";

type Props = {
  title: string;
  type: ProjectType;
  hostedAppUrl: string | null;
  githubRepo: string | null;
  videoUrl: string | null;
  posterUrl: string | null;
};

/**
 * Runs the project in place. Uploaded web apps load in an iframe with
 * sandbox="allow-scripts" and no allow-same-origin: the app gets an opaque
 * origin and can't reach Everbuild's cookies, storage, or DOM. GitHub web apps
 * boot in a StackBlitz embed on stackblitz.com, which is already a separate
 * origin; it isn't sandboxed because WebContainers need service workers and
 * storage on their own origin.
 */
export function ProjectViewer({ title, type, hostedAppUrl, githubRepo, videoUrl, posterUrl }: Props) {
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
    let embedUrl = hostedAppUrl;

    // Transform standard GitHub import URLs into StackBlitz embed URLs
    if (embedUrl.includes("stackblitz.com/github/")) {
      embedUrl = embedUrl.replace("stackblitz.com/github/", "stackblitz.com/edit/github/");
    }

    // Ensure embed query parameters are attached
    if (!embedUrl.includes("embed=1")) {
      embedUrl += embedUrl.includes("?") ? "&embed=1" : "?embed=1";
    }

    return (
      <AppFrame label="Running in a sandbox on Everbuild" links={[{ href: hostedAppUrl, label: "Open in new tab ↗" }]}>
        <iframe
          src={embedUrl}
          title={`${title} (interactive demo)`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          allow="cross-origin-isolated; clipboard-write; autoplay"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          className="block aspect-[16/10] w-full border-0 [:fullscreen_&]:h-screen"
        />
      </AppFrame>
    );
  }

  if (type === "web_app" && githubRepo) return <GitHubApp title={title} repo={githubRepo} />;

  return (
    <div className="flex aspect-[16/9] flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface text-center">
      <p className="font-medium">No demo uploaded yet</p>
      <p className="mt-1 max-w-xs text-sm text-muted">
        {type === "video" ? "This video hasn't been uploaded." : "This web app's files haven't been uploaded."}
      </p>
    </div>
  );
}

/** Waits for a click before booting: StackBlitz installs dependencies in the tab, which is heavy. */
function GitHubApp({ title, repo }: { title: string; repo: string }) {
  const [running, setRunning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: gitHubUrl(repo), label: "Source ↗" },
    { href: stackBlitzEditorUrl(repo), label: "Open in StackBlitz ↗" },
  ];

  useEffect(() => {
    if (running && containerRef.current) {
      sdk.embedGithubProject(containerRef.current, repo, {
        height: 500,
        terminalHeight: 40,
      });
    }
  }, [running, repo]);

  return (
    <AppFrame label={running ? "Running in your browser with StackBlitz" : `github.com/${repo}`} links={links}>
      {running ? (
        <div ref={containerRef} className="block aspect-[16/10] w-full border-0 [:fullscreen_&]:h-screen" />
      ) : (
        <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 bg-surface px-6 text-center text-ink">
          <button type="button" onClick={() => setRunning(true)} className={buttonClass("primary", "lg")}>
            ▶ Run project
          </button>
          <p className="max-w-sm text-sm text-muted">
            Installs and starts this repo in your browser. The first load can take up to a minute.
          </p>
        </div>
      )}
    </AppFrame>
  );
}

function AppFrame({ label, links, children }: { label: string; links: { href: string; label: string }[]; children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-3 py-2 text-xs text-muted">
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex shrink-0 gap-1" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
          </span>
          <span className="truncate">{label}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={() => frameRef.current?.requestFullscreen?.()} className="hover:text-ink">
            Full screen
          </button>
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              {l.label}
            </a>
          ))}
        </span>
      </div>
      <div ref={frameRef} className="bg-white">
        {children}
      </div>
    </div>
  );
}