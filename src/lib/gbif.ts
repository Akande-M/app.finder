import type { LocalName, Taxonomy } from "./types";

const API = "https://api.gbif.org/v1";

/** GBIF stores vernacular names with ISO 639-2/3 codes. */
const GBIF_LANG: Record<string, string> = {
  eng: "en", fra: "fr", spa: "es", por: "pt", deu: "de", ara: "ar", zho: "zh",
  hin: "hi", rus: "ru", swa: "sw", yor: "yo", hau: "ha", ibo: "ig",
};

export interface GbifMatch {
  usageKey: number;
  scientificName: string;
  canonicalName?: string;
  rank?: string;
  matchType: "EXACT" | "FUZZY" | "HIGHERRANK" | "NONE";
  confidence: number;
  taxonomy: Taxonomy;
}

interface RawMatch {
  usageKey?: number;
  scientificName?: string;
  canonicalName?: string;
  rank?: string;
  matchType?: GbifMatch["matchType"];
  confidence?: number;
  kingdom?: string; phylum?: string; class?: string; order?: string; family?: string; genus?: string; species?: string;
}

/** Check a name against the GBIF Backbone Taxonomy. Returns null if GBIF does not know it. */
export async function matchName(name: string, signal?: AbortSignal): Promise<GbifMatch | null> {
  const res = await fetch(`${API}/species/match?${new URLSearchParams({ name, verbose: "false" })}`, { signal });
  if (!res.ok) throw new Error(`GBIF ${res.status}`);
  const m = (await res.json()) as RawMatch;
  if (!m.usageKey || !m.matchType || m.matchType === "NONE") return null;
  return {
    usageKey: m.usageKey,
    scientificName: m.scientificName ?? name,
    canonicalName: m.canonicalName,
    rank: m.rank?.toLowerCase(),
    matchType: m.matchType,
    confidence: m.confidence ?? 0,
    taxonomy: {
      kingdom: m.kingdom, phylum: m.phylum, class: m.class, order: m.order,
      family: m.family, genus: m.genus, species: m.species,
    },
  };
}

/** A GBIF match counts as verification only if it's an exact/fuzzy hit at genus level or finer. */
export function isVerified(m: GbifMatch | null): boolean {
  if (!m) return false;
  if (m.matchType === "HIGHERRANK") return false;
  return m.confidence >= 80 && ["species", "subspecies", "variety", "form", "genus"].includes(m.rank ?? "");
}

/** Common names in the app's languages, de-duplicated. */
export async function localNames(usageKey: number, signal?: AbortSignal): Promise<LocalName[]> {
  const res = await fetch(`${API}/species/${usageKey}/vernacularNames?limit=300`, { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as { results: { vernacularName: string; language?: string }[] };
  const seen = new Set<string>();
  const out: LocalName[] = [];
  for (const r of data.results) {
    const lang = r.language ? GBIF_LANG[r.language] : undefined;
    if (!lang) continue;
    const key = `${lang}:${r.vernacularName.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ lang, name: r.vernacularName });
  }
  return out;
}
