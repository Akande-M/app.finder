import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useI18n } from "../i18n";
import { speciesByInatId } from "../lib/species";
import type { Species } from "../lib/types";
import SpeciesView from "../components/SpeciesView";
import { ErrorNote, PageHeader } from "../components/ui";

export default function SpeciesPage() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const [species, setSpecies] = useState<Species | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(
    (signal?: AbortSignal) => {
      setError(false);
      setSpecies(null);
      speciesByInatId(Number(id), lang, signal)
        .then(setSpecies)
        .catch((e) => (e as Error).name !== "AbortError" && setError(true));
    },
    [id, lang],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  return (
    <div>
      <PageHeader back />
      {error ? (
        <ErrorNote message={t("err.load")} onRetry={() => load()} />
      ) : species ? (
        <SpeciesView species={species} />
      ) : (
        <Skeleton />
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse px-5" aria-busy="true">
      <div className="aspect-[16/10] rounded-[1.75rem] bg-line" />
      <div className="mt-6 h-4 w-20 rounded-full bg-line" />
      <div className="mt-4 h-8 w-2/3 rounded-lg bg-line" />
      <div className="mt-3 h-5 w-1/2 rounded-lg bg-line" />
      <div className="mt-10 h-48 rounded-xl bg-line" />
    </div>
  );
}
