export type Group = "plant" | "animal" | "fungus" | "other";

export const RANKS = ["kingdom", "phylum", "class", "order", "family", "genus", "species"] as const;
export type Rank = (typeof RANKS)[number];
export type Taxonomy = Partial<Record<Rank, string>>;

export interface Photo {
  url: string; // medium size, for grids
  large: string; // large size, for the gallery
  attribution: string;
  license?: string;
}

export interface LocalName {
  name: string;
  lang: string; // app language code, e.g. "yo"
}

/** Everything we know about one taxon, merged from iNaturalist, GBIF and Wikipedia. */
export interface Species {
  scientificName: string;
  commonName?: string;
  rank?: string;
  group: Group;
  taxonomy: Taxonomy;
  photos: Photo[];
  localNames: LocalName[];
  summary?: string;
  wikipediaUrl?: string;
  inatId?: number;
  gbifKey?: number;
  /** True when GBIF confirmed the scientific name exists in the global checklist. */
  verified: boolean;
  conservationStatus?: string;
}

export interface AiCandidate {
  scientificName: string;
  commonName: string;
  rank: string;
  confidence: number;
}

export interface AiResult {
  isOrganism: boolean;
  group: Group | "none";
  candidates: AiCandidate[];
  summary: string;
  keyFeatures: string[];
  habitat: string;
  distribution: string;
  uses: string;
  safety: string;
  funFact: string;
  photoNote: string;
  model?: string;
}

export interface ScanRecord {
  id: string;
  createdAt: number;
  language: string;
  image: string; // compressed data URL of the user's own photo
  ai: AiResult;
  species?: Species;
}

/** Lightweight card shape used in Explore, Search and history lists. */
export interface TaxonCard {
  inatId: number;
  scientificName: string;
  commonName?: string;
  rank?: string;
  group: Group;
  photo?: string;
  observations?: number;
}
