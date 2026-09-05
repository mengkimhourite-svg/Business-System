/**
 * Read an image file, downscale it (max side `maxSize`) and return a data URL.
 * Falls back to the raw data URL when canvas is unavailable.
 */
export function fileToDataUrl(file, { maxSize = 512, quality = 0.85, maxBytes = 5 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type || "")) return reject(Object.assign(new Error("Invalid image"), { code: "INVALID" }));
    if (file.size > maxBytes) return reject(Object.assign(new Error("Image too large"), { code: "TOO_LARGE" }));
    const reader = new FileReader();
    reader.onerror = () => reject(Object.assign(new Error("Read failed"), { code: "INVALID" }));
    reader.onload = () => {
      const raw = String(reader.result || "");
      try {
        const img = new Image();
        let settled = false;
        const done = (v) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(v);
        };
        // Safety net: if the image never decodes, fall back to the original data URL
        const timer = setTimeout(() => done(raw), 2500);
        img.onload = () => {
          try {
            const scale = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
            const w = Math.max(1, Math.round((img.width || 1) * scale));
            const h = Math.max(1, Math.round((img.height || 1) * scale));
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext && canvas.getContext("2d");
            if (!ctx) return done(raw);
            ctx.drawImage(img, 0, 0, w, h);
            const keepPng = file.type === "image/png" || file.type === "image/webp";
            done(canvas.toDataURL(keepPng ? "image/png" : "image/jpeg", quality));
          } catch {
            done(raw);
          }
          return undefined;
        };
        img.onerror = () => done(raw);
        img.src = raw;
      } catch {
        resolve(raw);
      }
    };
    reader.readAsDataURL(file);
  });
}
