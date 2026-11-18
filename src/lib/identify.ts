import type { AiResult, ScanRecord } from "./types";
import { speciesByName } from "./species";

export class ScanError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
  }
}

/** Send the photo to our server, then enrich the best guess with real data. */
export async function identify(dataUrl: string, language: string, onStage?: (stage: 1 | 2) => void): Promise<ScanRecord> {
  onStage?.(1);
  const [meta, image] = dataUrl.split(",");
  const mimeType = meta.match(/data:(.*?);/)?.[1] ?? "image/jpeg";

  let res: Response;
  try {
    res = await fetch("/api/identify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image, mimeType, language }),
    });
  } catch {
    throw new ScanError(navigator.onLine ? "network" : "offline");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ScanError(body.error ?? "server", body.message);

  const ai = body as AiResult;
  const record: ScanRecord = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    language,
    image: dataUrl,
    ai,
  };

  const top = ai.isOrganism ? ai.candidates?.[0] : undefined;
  if (top?.scientificName) {
    onStage?.(2);
    try {
      record.species = await speciesByName(top.scientificName, language);
      if (!record.species.commonName) record.species.commonName = top.commonName;
    } catch {
      // Enrichment is best-effort; the AI result alone is still useful.
    }
  }
  return record;
}
