import { createStore, get, set, del, values, clear } from "idb-keyval";
import type { ScanRecord, TaxonCard } from "./types";

/** Scans live in IndexedDB on the device (photos are too big for localStorage). */
const scans = createStore("finder", "scans");

export async function saveScan(r: ScanRecord) {
  await set(r.id, r, scans);
}
export async function getScan(id: string) {
  return get<ScanRecord>(id, scans);
}
export async function listScans(): Promise<ScanRecord[]> {
  const all = await values<ScanRecord>(scans);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}
export async function deleteScan(id: string) {
  await del(id, scans);
}
export async function clearScans() {
  await clear(scans);
}

/** Search history is small, so it stays in localStorage. */
const SEARCH_KEY = "finder.recentSearches";
const MAX_RECENT = 20;

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function safeWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or disabled — history is a convenience, not critical */
  }
}

export function recentSearches(): TaxonCard[] {
  return safeRead<TaxonCard[]>(SEARCH_KEY, []);
}
export function rememberSearch(card: TaxonCard) {
  const next = [card, ...recentSearches().filter((c) => c.inatId !== card.inatId)].slice(0, MAX_RECENT);
  safeWrite(SEARCH_KEY, next);
}
export function clearSearches() {
  safeWrite(SEARCH_KEY, []);
}
