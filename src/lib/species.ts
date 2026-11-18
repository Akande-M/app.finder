import type { Group, Species } from "./types";
import { taxonById, taxonByName, type InatDetail } from "./inat";
import { isVerified, localNames, matchName } from "./gbif";
import { wikiSummary } from "./wiki";

function groupFromKingdom(k?: string): Group {
  if (k === "Plantae") return "plant";
  if (k === "Animalia") return "animal";
  if (k === "Fungi") return "fungus";
  return "other";
}

/**
 * Build a full species profile. Each source is optional:
 * iNaturalist → photos and summary, GBIF → verified taxonomy and local names,
 * Wikipedia → summary in the user's language.
 */
async function assemble(inat: InatDetail | null, name: string, lang: string, signal?: AbortSignal): Promise<Species> {
  const gbif = await matchName(inat?.scientificName ?? name, signal).catch(() => null);
  const verified = isVerified(gbif);
  const [names, wiki] = await Promise.all([
    gbif ? localNames(gbif.usageKey, signal).catch(() => []) : Promise.resolve([]),
    // iNat already returns a summary in the user's locale when one exists; only ask Wikipedia when it doesn't.
    inat?.summary && lang === "en" ? Promise.resolve(null) : wikiSummary(inat?.scientificName ?? name, lang, signal).catch(() => null),
  ]);

  // GBIF is the authority for classification; iNaturalist fills any gaps.
  const taxonomy = { ...(inat?.taxonomy ?? {}) };
  if (gbif && verified) for (const [k, v] of Object.entries(gbif.taxonomy)) if (v) taxonomy[k as keyof typeof taxonomy] = v;

  return {
    scientificName: inat?.scientificName ?? gbif?.canonicalName ?? name,
    commonName: inat?.commonName,
    rank: inat?.rank ?? gbif?.rank,
    group: inat?.group ?? groupFromKingdom(gbif?.taxonomy.kingdom),
    taxonomy,
    photos: inat?.photos ?? [],
    localNames: names,
    summary: wiki?.text ?? inat?.summary,
    wikipediaUrl: wiki?.url ?? inat?.wikipediaUrl,
    inatId: inat?.inatId,
    gbifKey: gbif?.usageKey,
    verified,
    conservationStatus: inat?.conservationStatus,
  };
}

export async function speciesByInatId(id: number, lang: string, signal?: AbortSignal): Promise<Species> {
  const inat = await taxonById(id, lang, signal);
  return assemble(inat, inat.scientificName, lang, signal);
}

export async function speciesByName(name: string, lang: string, signal?: AbortSignal): Promise<Species> {
  const inat = await taxonByName(name, lang, signal).catch(() => null);
  return assemble(inat, name, lang, signal);
}
