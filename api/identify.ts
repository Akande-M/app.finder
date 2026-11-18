/**
 * POST /api/identify
 * Body: { image: string (base64, no data: prefix), mimeType: string, language: string }
 *
 * Sends the photo to Google Gemini (free tier) and returns structured candidates.
 * The key stays on the server. The client then verifies the top candidate
 * against GBIF before showing it as confirmed.
 */

const MAX_IMAGE_BYTES = 3_000_000; // ~3 MB of base64 after client-side compression
const hits = new Map<string, number[]>(); // per-instance, best-effort rate limit

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", fr: "French", es: "Spanish", pt: "Portuguese", de: "German",
  ar: "Arabic", zh: "Simplified Chinese", hi: "Hindi", ru: "Russian", sw: "Swahili",
  yo: "Yoruba (with correct tone marks and underdots)", ha: "Hausa (with hooked letters ɓ ɗ ƙ where correct)",
  ig: "Igbo (with correct dotted vowels)",
};

const SCHEMA = {
  type: "OBJECT",
  properties: {
    isOrganism: { type: "BOOLEAN", description: "true only if a living organism (or clear part of one) is the subject" },
    group: { type: "STRING", enum: ["plant", "animal", "fungus", "other", "none"] },
    candidates: {
      type: "ARRAY",
      description: "Most likely identifications, best first. Max 3.",
      items: {
        type: "OBJECT",
        properties: {
          scientificName: { type: "STRING", description: "Accepted Latin binomial, or genus if species is uncertain. Never invent names." },
          commonName: { type: "STRING", description: "Common name in the requested language" },
          rank: { type: "STRING", enum: ["species", "genus", "family", "order", "class"] },
          confidence: { type: "NUMBER", description: "0 to 1, be honest and conservative" },
        },
        required: ["scientificName", "commonName", "rank", "confidence"],
      },
    },
    summary: { type: "STRING", description: "2-3 sentence overview" },
    keyFeatures: { type: "ARRAY", items: { type: "STRING" }, description: "3-5 visible identifying features" },
    habitat: { type: "STRING" },
    distribution: { type: "STRING", description: "Native range and where it is commonly found" },
    uses: { type: "STRING", description: "Ecological role or human uses. Never give eating or medicinal instructions." },
    safety: { type: "STRING", description: "Known toxicity, venom, allergy or invasive-species concerns. Empty string if none known." },
    funFact: { type: "STRING" },
    photoNote: { type: "STRING", description: "If the photo limits accuracy (blurry, far away, missing flowers), say what angle would help. Else empty." },
  },
  required: ["isOrganism", "group", "candidates", "summary", "keyFeatures", "habitat", "distribution", "uses", "safety", "funFact", "photoNote"],
};

function json(body: unknown, status = 200, origin = "*") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": origin,
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}

function allowedOrigin(request: Request): string | null {
  const list = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = request.headers.get("origin");
  if (list.length === 0) return origin ?? "*";
  if (!origin) return list[0]; // same-origin requests may omit Origin
  return list.includes(origin) ? origin : null;
}

function rateLimited(ip: string): boolean {
  const limit = Number(process.env.SCANS_PER_MINUTE ?? 6);
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= limit) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export function OPTIONS(request: Request) {
  const origin = allowedOrigin(request);
  return json({}, origin ? 204 : 403, origin ?? "null");
}

export async function POST(request: Request) {
  const origin = allowedOrigin(request);
  if (!origin) return json({ error: "forbidden_origin" }, 403, "null");

  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: "missing_key", message: "GEMINI_API_KEY is not set on the server." }, 500, origin);

  const ip = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (rateLimited(ip)) return json({ error: "rate_limited" }, 429, origin);

  let body: { image?: string; mimeType?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_request", message: "Body must be JSON." }, 400, origin);
  }
  const { image, mimeType = "image/jpeg", language = "en" } = body;
  if (!image || typeof image !== "string") return json({ error: "bad_request", message: "Missing image." }, 400, origin);
  if (image.length > MAX_IMAGE_BYTES) return json({ error: "image_too_large" }, 413, origin);
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(mimeType)) return json({ error: "bad_request", message: "Unsupported image type." }, 400, origin);

  const langName = LANGUAGE_NAMES[language] ?? "English";
  const prompt = [
    "You are an expert field biologist identifying organisms from a single photo.",
    "Identify the main living organism in the image. Consider plants, animals (including insects, birds, fish, reptiles, mammals), fungi, lichens and other organisms.",
    "Be conservative: if you cannot tell the species, give the genus or family and lower the confidence. Never invent a scientific name.",
    "If there is no organism (e.g. a car, a person's face, a screenshot), set isOrganism=false, group='none' and return an empty candidates list.",
    `Write every descriptive field (commonName, summary, keyFeatures, habitat, distribution, uses, safety, funFact, photoNote) in ${langName}.`,
    "scientificName must always stay in Latin.",
    "Never tell the user that something is safe to eat, touch or use as medicine.",
  ].join("\n");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ inline_data: { mime_type: mimeType, data: image } }, { text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: SCHEMA },
      }),
    });
  } catch (err) {
    return json({ error: "upstream_unreachable", message: String(err) }, 502, origin);
  }

  if (upstream.status === 429) return json({ error: "quota_exceeded" }, 429, origin);
  if (!upstream.ok) {
    const detail = await upstream.text();
    return json({ error: "upstream_error", status: upstream.status, message: detail.slice(0, 500) }, 502, origin);
  }

  const data = await upstream.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text;
  if (!text) return json({ error: "empty_response" }, 502, origin);

  try {
    return json({ ...JSON.parse(text), model }, 200, origin);
  } catch {
    return json({ error: "unparseable_response" }, 502, origin);
  }
}
