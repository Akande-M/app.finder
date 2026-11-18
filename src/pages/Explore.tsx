import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { popularSpecies, type FilterKey } from "../lib/inat";
import type { TaxonCard } from "../lib/types";
import { FilterChips, TaxonTile } from "../components/TaxonCards";
import { ErrorNote, PageHeader, Spinner } from "../components/ui";

const GROUPS: FilterKey[] = ["plants", "animals", "fungi", "birds", "mammals", "insects", "reptiles", "amphibians", "fish", "molluscs", "spiders"];
const KEY = "finder.exploreGroup";

export default function Explore() {
  const { t, lang } = useI18n();
  const [group, setGroup] = useState<FilterKey>(() => (sessionStorage.getItem(KEY) as FilterKey) || "plants");
  const [items, setItems] = useState<TaxonCard[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    (p: number, signal?: AbortSignal) => {
      setLoading(true);
      setError(false);
      popularSpecies(group, p, lang, signal)
        .then(({ items: next, total }) => {
          setItems((prev) => (p === 1 ? next : [...prev, ...next.filter((n) => !prev.some((x) => x.inatId === n.inatId))]));
          setTotal(total);
          setPage(p);
        })
        .catch((e) => (e as Error).name !== "AbortError" && setError(true))
        .finally(() => !signal?.aborted && setLoading(false));
    },
    [group, lang],
  );

  useEffect(() => {
    sessionStorage.setItem(KEY, group);
    setItems([]);
    const ctrl = new AbortController();
    load(1, ctrl.signal);
    return () => ctrl.abort();
  }, [group, load]);

  return (
    <div>
      <PageHeader title={t("explore.title")} sub={t("explore.sub")} />
      <div className="px-5">
        <FilterChips options={GROUPS} value={group} onChange={setGroup} />
      </div>

      {error && items.length === 0 ? (
        <div className="mt-5">
          <ErrorNote message={t("err.load")} onRetry={() => load(1)} />
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 px-5 sm:grid-cols-3">
          {items.map((c) => (
            <li key={c.inatId} className="flex">
              <TaxonTile card={c} />
            </li>
          ))}
          {loading &&
            items.length === 0 &&
            Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-line" />
            ))}
        </ul>
      )}

      {items.length > 0 && items.length < total && (
        <div className="mt-6 flex justify-center px-5">
          <button
            onClick={() => load(page + 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-moss px-6 py-2.5 font-semibold text-moss hover:bg-moss hover:text-paper disabled:opacity-60"
          >
            {loading && <Spinner />}
            {t("explore.loadMore")}
          </button>
        </div>
      )}
    </div>
  );
}
