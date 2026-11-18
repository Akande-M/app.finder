import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon, X } from "lucide-react";
import { useI18n } from "../i18n";
import { searchTaxa, type FilterKey } from "../lib/inat";
import { clearSearches, recentSearches, rememberSearch } from "../lib/store";
import type { TaxonCard } from "../lib/types";
import { FilterChips, TaxonRow } from "../components/TaxonCards";
import { ErrorNote, Spinner } from "../components/ui";

const FILTERS: FilterKey[] = ["all", "plants", "animals", "fungi", "birds", "mammals", "insects", "reptiles", "fish"];

export default function Search() {
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [filter, setFilter] = useState<FilterKey>((params.get("f") as FilterKey) || "all");
  const [results, setResults] = useState<TaxonCard[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [recent, setRecent] = useState(recentSearches);
  const [attempt, setAttempt] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  // Keep the URL in sync so Back returns to the same search. setParams changes identity on every
  // URL update, so it's read through a ref to avoid re-running the search effect.
  const setParamsRef = useRef(setParams);
  setParamsRef.current = setParams;
  useEffect(() => {
    const term = q.trim();
    const next: Record<string, string> = {};
    if (term) next.q = term;
    if (filter !== "all") next.f = filter;
    setParamsRef.current(next, { replace: true });
  }, [q, filter]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(false);
    const timer = setTimeout(() => {
      searchTaxa(term, filter, lang, ctrl.signal)
        .then(setResults)
        .catch((e) => (e as Error).name !== "AbortError" && setError(true))
        .finally(() => !ctrl.signal.aborted && setLoading(false));
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, filter, lang, attempt]);

  const showingRecent = q.trim().length < 2;

  return (
    <div>
      <div className="sticky top-0 z-20 bg-paper/95 px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-3 backdrop-blur">
        <label className="flex items-center gap-3 rounded-2xl border border-line bg-sheet px-4 py-3 focus-within:border-moss">
          <SearchIcon size={20} className="shrink-0 text-ink-soft" aria-hidden />
          <input
            ref={input}
            type="search"
            enterKeyHint="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search.placeholder")}
            aria-label={t("nav.search")}
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-soft/70 [&::-webkit-search-cancel-button]:hidden"
          />
          {loading ? (
            <Spinner className="text-ink-soft" />
          ) : (
            q && (
              <button onClick={() => (setQ(""), input.current?.focus())} aria-label={t("search.clear")} className="text-ink-soft">
                <X size={18} />
              </button>
            )
          )}
        </label>
        <div className="mt-3">
          <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        </div>
      </div>

      {showingRecent ? (
        <section className="px-5 pt-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[1.05rem] font-semibold">{t("search.recent")}</h2>
            {recent.length > 0 && (
              <button onClick={() => (clearSearches(), setRecent([]))} className="text-sm text-ink-soft hover:text-ink">
                {t("search.clear")}
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-ink-soft">{t("search.empty")}</p>
          ) : (
            <List cards={filter === "all" ? recent : recent.filter((c) => matchesFilter(c, filter))} />
          )}
        </section>
      ) : error ? (
        <div className="pt-3">
          <ErrorNote message={t("err.load")} onRetry={() => setAttempt((n) => n + 1)} />
        </div>
      ) : results && results.length === 0 && !loading ? (
        <p className="px-5 pt-3 text-ink-soft">{t("search.none", { q: q.trim() })}</p>
      ) : results ? (
        <div className="px-5 pt-3">
          <List cards={results} onOpen={(c) => (rememberSearch(c), setRecent(recentSearches()))} />
        </div>
      ) : null}
    </div>
  );
}

function matchesFilter(c: TaxonCard, f: FilterKey) {
  if (f === "plants") return c.group === "plant";
  if (f === "fungi") return c.group === "fungus";
  if (f === "animals") return c.group === "animal";
  return true; // finer animal filters can't be checked from a stored card; show all
}

function List({ cards, onOpen }: { cards: TaxonCard[]; onOpen?: (c: TaxonCard) => void }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-sheet">
      {cards.map((c) => (
        <li key={c.inatId}>
          <TaxonRow card={c} onOpen={() => onOpen?.(c)} />
        </li>
      ))}
    </ul>
  );
}
