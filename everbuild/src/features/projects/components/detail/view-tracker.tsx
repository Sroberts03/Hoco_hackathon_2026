"use client";

import { useEffect } from "react";
import { trackProjectView } from "../../server/actions";

/** Records one debounced view after the page is actually opened in a browser (not on prefetch). */
export function ViewTracker({ projectId }: { projectId: string }) {
  useEffect(() => {
    trackProjectView(projectId).catch(() => {});
  }, [projectId]);
  return null;
}
