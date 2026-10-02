// Browser-only helpers for the new-project modal.

/** PUTs a file to a signed storage URL, reporting whole-number progress. */
export function uploadFile(url: string, file: File, contentType: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", contentType);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

/**
 * Grabs a JPEG frame from a video for its cover, about a second in (or a
 * quarter of the way through short clips). Best effort: resolves null on any
 * failure, and never takes longer than a few seconds.
 */
export function capturePoster(video: File): Promise<File | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(video);
    const el = document.createElement("video");
    const finish = (result: File | null) => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      el.removeAttribute("src");
      resolve(result);
    };
    const timer = setTimeout(() => finish(null), 8000);

    el.muted = true;
    el.playsInline = true;
    el.preload = "auto";
    el.onerror = () => finish(null);
    el.onloadeddata = () => {
      el.currentTime = Math.min(1, (el.duration || 0) / 4);
    };
    el.onseeked = () => {
      const w = el.videoWidth;
      const h = el.videoHeight;
      if (!w || !h) return finish(null);
      const scale = Math.min(1, 1280 / w);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.getContext("2d")?.drawImage(el, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => finish(blob ? new File([blob], "poster.jpg", { type: "image/jpeg" }) : null), "image/jpeg", 0.85);
    };
    el.src = url;
  });
}
