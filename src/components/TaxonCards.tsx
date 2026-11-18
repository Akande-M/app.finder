import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import type { StringKey } from "../i18n/en";
import type { FilterKey } from "../lib/inat";
import type { TaxonCard } from "../lib/types";
import { GroupTag, LeafArt } from "./ui";

export function FilterChips({ options, value, onChange }: { options: FilterKey[]; value: FilterKey; onChange: (f: FilterKey) => void }) {
  const { t } = useI18n();
  return (
    <div role="radiogroup" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {options.map((f) => {
        const on = f === value;
        return (
          <button
            key={f}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(f)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              on ? "border-moss bg-moss text-paper" : "border-line bg-sheet text-ink hover:border-moss"
            }`}
          >
            {t(`filter.${f}` as StringKey)}
          </button>
        );
      })}
    </div>
  );
}

/** Grid tile for Explore. */
export function TaxonTile({ card }: { card: TaxonCard }) {
  const { t, formatNumber } = useI18n();
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-sheet">
      <div className="relative aspect-square overflow-hidden bg-line">
        {card.photo ? (
          <img src={card.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <LeafArt className="h-full w-full" />
        )}
        <span className="absolute start-2 top-2">
          <GroupTag group={card.group} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 font-semibold leading-snug">{card.commonName ?? <span className="sci">{card.scientificName}</span>}</h3>
        {card.commonName && <p className="sci mt-0.5 line-clamp-1 text-sm text-ink-soft">{card.scientificName}</p>}
        {card.observations ? <p className="mt-1 text-xs text-ink-soft">{t("explore.sightings", { n: formatNumber(card.observations) })}</p> : null}
        <Link
          to={`/species/${card.inatId}`}
          className="mt-auto inline-flex w-fit items-center rounded-full pt-3 text-sm font-semibold text-moss underline-offset-4 hover:underline"
        >
          {t("explore.learnMore")}
          <span className="sr-only">: {card.commonName ?? card.scientificName}</span>
        </Link>
      </div>
    </article>
  );
}

/** Compact row for search results and history. */
export function TaxonRow({ card, onOpen }: { card: TaxonCard; onOpen?: () => void }) {
  return (
    <Link to={`/species/${card.inatId}`} onClick={onOpen} className="flex items-center gap-3 p-3 hover:bg-paper/60">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-line">
        {card.photo && <img src={card.photo.replace("/medium.", "/square.")} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{card.commonName ?? <span className="sci">{card.scientificName}</span>}</p>
        {card.commonName && <p className="sci truncate text-sm text-ink-soft">{card.scientificName}</p>}
      </div>
      <GroupTag group={card.group} />
    </Link>
  );
}
