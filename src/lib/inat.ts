import type { Group, Photo, Taxonomy, TaxonCard, Rank } from "./types";
import { RANKS } from "./types";

const API = "https://api.inaturalist.org/v1";

/** iNaturalist taxon IDs used as filters. */
export const FILTERS = {
  all: undefined,
  plants: 47126, // Plantae
  animals: 1, // Animalia
  fungi: 47170, // Fungi
  birds: 3, // Aves
  mammals: 40151,
  insects: 47158,
  reptiles: 26036,
  amphibians: 20978,
  fish: 47178, // Actinopterygii (ray-finned fishes)
  molluscs: 47115,
  spiders: 47119, // Arachnida
} as const;
export type FilterKey = keyof typeof FILTERS;

/** iNaturalist uses region-tagged locales for a few languages. */
export function inatLocale(lang: string): string {
  return lang === "zh" ? "zh-CN" : lang;
}

interface InatPhoto {
  url?: string;
  square_url?: string;
  medium_url?: string;
  large_url?: string;
  attribution?: string;
  license_code?: string | null;
}
interface InatTaxon {
  id: number;
  name: string;
  rank: string;
  preferred_common_name?: string;
  iconic_taxon_name?: string;
  default_photo?: InatPhoto | null;
  taxon_photos?: { photo: InatPhoto }[];
  ancestors?: { name: string; rank: string }[];
  wikipedia_summary?: string | null;
  wikipedia_url?: string | null;
  observations_count?: number;
  conservation_status?: { status_name?: string; status?: string } | null;
}

export function groupFromIconic(iconic?: string): Group {
  if (!iconic) return "other";
  if (iconic === "Plantae") return "plant";
  if (iconic === "Fungi") return "fungus";
  if (["Protozoa", "Chromista", "Bacteria", "Archaea", "Viruses"].includes(iconic)) return "other";
  return "animal"; // Aves, Mammalia, Insecta, Reptilia, Amphibia, Actinopterygii, Mollusca, Arachnida, Animalia
}

function sized(photo: InatPhoto | null | undefined, size: "medium" | "large" | "square"): string | undefined {
  if (!photo) return undefined;
  const key = `${size}_url` as const;
  const direct = photo[key as "medium_url"];
  if (direct) return direct;
  return photo.url?.replace("/square.", `/${size}.`);
}

function toCard(t: InatTaxon, observations?: number): TaxonCard {
  return {
    inatId: t.id,
    scientificName: t.name,
    commonName: t.preferred_common_name,
    rank: t.rank,
    group: groupFromIconic(t.iconic_taxon_name),
    photo: sized(t.default_photo, "medium"),
    observations: observations ?? t.observations_count,
  };
}

async function get<T>(path: string, params: Record<string, string | number | undefined>, signal?: AbortSignal): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") qs.set(k, String(v));
  const res = await fetch(`${API}${path}?${qs}`, { signal });
  if (!res.ok) throw new Error(`iNaturalist ${res.status}`);
  return res.json() as Promise<T>;
}

/** Search the whole iNaturalist taxonomy (millions of species). */
export async function searchTaxa(q: string, filter: FilterKey, lang: string, signal?: AbortSignal): Promise<TaxonCard[]> {
  const data = await get<{ results: InatTaxon[] }>(
    "/taxa/autocomplete",
    { q, taxon_id: FILTERS[filter], per_page: 30, locale: inatLocale(lang), is_active: "true" },
    signal,
  );
  return data.results.map((t) => toCard(t));
}

/** Most-observed species in a group — a good "what's out there" list for Explore. */
export async function popularSpecies(filter: FilterKey, page: number, lang: string, signal?: AbortSignal): Promise<{ items: TaxonCard[]; total: number }> {
  const data = await get<{ results: { count: number; taxon: InatTaxon }[]; total_results: number }>(
    "/observations/species_counts",
    { taxon_id: FILTERS[filter], quality_grade: "research", per_page: 24, page, locale: inatLocale(lang) },
    signal,
  );
  return { items: data.results.map((r) => toCard(r.taxon, r.count)), total: data.total_results };
}

export interface InatDetail {
  inatId: number;
  scientificName: string;
  commonName?: string;
  rank: string;
  group: Group;
  taxonomy: Taxonomy;
  photos: Photo[];
  summary?: string;
  wikipediaUrl?: string;
  conservationStatus?: string;
}

function detailFrom(t: InatTaxon): InatDetail {
  const taxonomy: Taxonomy = {};
  for (const a of t.ancestors ?? []) if ((RANKS as readonly string[]).includes(a.rank)) taxonomy[a.rank as Rank] = a.name;
  if ((RANKS as readonly string[]).includes(t.rank)) taxonomy[t.rank as Rank] = t.name;

  const photos: Photo[] = (t.taxon_photos ?? [])
    .map(({ photo }) => ({
      url: sized(photo, "medium") ?? "",
      large: sized(photo, "large") ?? sized(photo, "medium") ?? "",
      attribution: photo.attribution ?? "iNaturalist",
      license: photo.license_code ?? undefined,
    }))
    .filter((p) => p.url)
    .slice(0, 12);

  return {
    inatId: t.id,
    scientificName: t.name,
    commonName: t.preferred_common_name,
    rank: t.rank,
    group: groupFromIconic(t.iconic_taxon_name),
    taxonomy,
    photos,
    summary: t.wikipedia_summary?.replace(/<[^>]+>/g, "") || undefined,
    wikipediaUrl: t.wikipedia_url ?? undefined,
    conservationStatus: t.conservation_status?.status_name ?? undefined,
  };
}

export async function taxonById(id: number, lang: string, signal?: AbortSignal): Promise<InatDetail> {
  const data = await get<{ results: InatTaxon[] }>(`/taxa/${id}`, { locale: inatLocale(lang) }, signal);
  if (!data.results[0]) throw new Error("Taxon not found");
  return detailFrom(data.results[0]);
}

/** Find the iNaturalist taxon for an exact scientific name, then load its full record. */
export async function taxonByName(name: string, lang: string, signal?: AbortSignal): Promise<InatDetail | null> {
  const data = await get<{ results: InatTaxon[] }>("/taxa", { q: name, per_page: 10, is_active: "true" }, signal);
  const wanted = name.trim().toLowerCase();
  const match = data.results.find((t) => t.name.toLowerCase() === wanted) ?? null;
  if (!match) return null;
  return taxonById(match.id, lang, signal);
}
