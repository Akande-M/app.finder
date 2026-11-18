import { useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, CircleHelp, ExternalLink, Lightbulb, TriangleAlert, X } from "lucide-react";
import { LANGUAGES, useI18n } from "../i18n";
import type { StringKey } from "../i18n/en";
import { RANKS, type AiResult, type Group, type Photo, type Species } from "../lib/types";
import { GROUP_COLOR, GroupTag, LeafArt, Section } from "./ui";

interface Props {
  species?: Species;
  ai?: AiResult;
  userImage?: string;
  scannedAt?: number;
}

/** The full profile of one organism. Used for scan results and for Explore/Search detail pages. */
export default function SpeciesView({ species, ai, userImage, scannedAt }: Props) {
  const { t } = useI18n();
  const top = ai?.candidates?.[0];
  const group: Group = species?.group ?? (ai?.group && ai.group !== "none" ? ai.group : "other");
  const commonName = species?.commonName ?? top?.commonName;
  const sciName = species?.scientificName ?? top?.scientificName ?? "";
  const hero = userImage ?? species?.photos[0]?.large;
  const summary = ai?.summary || species?.summary;

  return (
    <article>
      <div className="px-5">
        <div className="overflow-hidden rounded-[1.75rem] bg-moss">
          {hero ? (
            <img src={hero} alt={userImage ? t("result.yourPhoto") : sciName} className="max-h-[52dvh] w-full object-cover" />
          ) : (
            <LeafArt className="aspect-[16/10] w-full" />
          )}
        </div>
      </div>

      <header className="px-5 pt-5">
        <GroupTag group={group} />
        <h1 className="display mt-3 text-[2rem] leading-[1.1]">{commonName ?? <span className="sci">{sciName}</span>}</h1>
        {commonName && <p className="sci mt-1 text-xl text-ink-soft">{sciName}</p>}

        {(top || species) && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {top && (
              <span className="inline-flex items-center gap-2 font-semibold">
                <ConfidenceDial value={top.confidence} />
                {t("result.match", { n: Math.round(top.confidence * 100) })}
              </span>
            )}
            {species?.verified ? (
              <span className="inline-flex items-center gap-1.5 text-plant">
                <BadgeCheck size={17} aria-hidden />
                {t("result.verified")}
              </span>
            ) : ai ? (
              <span className="inline-flex items-center gap-1.5 text-ink-soft">
                <CircleHelp size={17} aria-hidden />
                {t("result.unverified")}
              </span>
            ) : null}
          </div>
        )}
      </header>

      {ai?.safety && (
        <div className="mx-5 mt-5 flex gap-3 rounded-2xl border border-pollen-deep/40 bg-pollen/15 p-4 text-sm">
          <TriangleAlert size={20} className="mt-0.5 shrink-0 text-pollen-deep" aria-hidden />
          <div>
            <p className="font-semibold">{t("detail.safety")}</p>
            <p className="mt-1">{ai.safety}</p>
          </div>
        </div>
      )}

      <SpecimenLabel species={species} sciName={sciName} group={group} ai={ai} scannedAt={scannedAt} />

      <Gallery photos={species?.photos ?? []} />

      {summary && (
        <Section title={t("detail.about")} className="mt-9">
          <p className="max-w-[65ch] leading-relaxed">{summary}</p>
        </Section>
      )}

      {ai && ai.keyFeatures?.length > 0 && (
        <Section title={t("detail.features")} className="mt-8">
          <ul className="max-w-[65ch] space-y-2">
            {ai.keyFeatures.map((f) => (
              <li key={f} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GROUP_COLOR[group] }} />
                <span className="leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {ai && (
        <dl className="mt-8 grid gap-x-6 gap-y-5 px-5 sm:grid-cols-2">
          {(
            [
              ["detail.habitat", ai.habitat],
              ["detail.distribution", ai.distribution],
              ["detail.uses", ai.uses],
            ] as [StringKey, string][]
          )
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm font-semibold text-ink-soft">{t(k)}</dt>
                <dd className="mt-1 leading-relaxed">{v}</dd>
              </div>
            ))}
          {species?.conservationStatus && (
            <div>
              <dt className="text-sm font-semibold text-ink-soft">{t("detail.conservation")}</dt>
              <dd className="mt-1 capitalize">{species.conservationStatus}</dd>
            </div>
          )}
        </dl>
      )}

      {ai?.funFact && (
        <div className="mx-5 mt-8 rounded-2xl bg-moss p-5 text-paper">
          <p className="text-sm font-semibold text-pollen">{t("detail.funFact")}</p>
          <p className="mt-2 leading-relaxed">{ai.funFact}</p>
        </div>
      )}

      <LocalNames species={species} />

      {ai && ai.candidates.length > 1 && (
        <Section title={t("result.alternatives")} className="mt-9">
          <ul className="divide-y divide-line rounded-2xl border border-line bg-sheet">
            {ai.candidates.slice(1).map((c) => (
              <li key={c.scientificName}>
                <Link to={`/search?q=${encodeURIComponent(c.scientificName)}`} className="flex items-center justify-between gap-3 p-3.5 hover:bg-paper/60">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.commonName}</span>
                    <span className="sci block truncate text-sm text-ink-soft">{c.scientificName}</span>
                  </span>
                  <span className="shrink-0 text-sm text-ink-soft">{Math.round(c.confidence * 100)}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {ai?.photoNote && (
        <div className="mx-5 mt-8 flex gap-3 rounded-2xl border border-line p-4 text-sm">
          <Lightbulb size={19} className="mt-0.5 shrink-0 text-pollen-deep" aria-hidden />
          <div>
            <p className="font-semibold">{t("result.photoTip")}</p>
            <p className="mt-1">{ai.photoNote}</p>
          </div>
        </div>
      )}

      <div className="mt-9 flex flex-wrap gap-2 px-5">
        {species?.wikipediaUrl && (
          <ExtLink href={species.wikipediaUrl}>{t("detail.wikipedia")}</ExtLink>
        )}
        {species?.inatId && <ExtLink href={`https://www.inaturalist.org/taxa/${species.inatId}`}>{t("detail.inat")}</ExtLink>}
      </div>

      <p className="mx-5 mt-8 border-t border-line pt-4 text-xs leading-relaxed text-ink-soft">{t("detail.disclaimer")}</p>
    </article>
  );
}

function ConfidenceDial({ value }: { value: number }) {
  const r = 8;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 -rotate-90" aria-hidden>
      <circle cx="10" cy="10" r={r} fill="none" stroke="var(--color-line)" strokeWidth="3" />
      <circle cx="10" cy="10" r={r} fill="none" stroke="var(--color-moss)" strokeWidth="3" strokeDasharray={`${c * value} ${c}`} strokeLinecap="round" />
    </svg>
  );
}

/**
 * The classification laid out like a herbarium specimen label:
 * each rank steps in under its parent, ending at the species.
 */
function SpecimenLabel({ species, sciName, group, ai, scannedAt }: { species?: Species; sciName: string; group: Group; ai?: AiResult; scannedAt?: number }) {
  const { t, lang } = useI18n();
  const tax = species?.taxonomy ?? {};
  const rows = RANKS.filter((r) => tax[r]);
  if (rows.length === 0) return null;
  const date = scannedAt
    ? new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : lang, { dateStyle: "medium" }).format(scannedAt)
    : undefined;

  return (
    <Section title={t("detail.classification")} className="mt-9">
      <div className="relative overflow-hidden rounded-xl border border-line bg-sheet">
        <span className="absolute inset-y-0 start-0 w-1.5" style={{ background: GROUP_COLOR[group] }} aria-hidden />
        <ol className="py-3 ps-6 pe-4">
          {rows.map((rank, i) => {
            const value = tax[rank]!;
            const italic = rank === "genus" || rank === "species";
            const last = i === rows.length - 1;
            return (
              <li key={rank} className="flex items-baseline gap-3 py-1.5">
                <span className="w-[4.75rem] shrink-0 text-[0.72rem] font-semibold text-ink-soft">{t(`rank.${rank}` as StringKey)}</span>
                {/* each rank steps in under its parent, like a key in a field guide */}
                <span className="flex min-w-0 items-baseline gap-1.5" style={{ paddingInlineStart: `${i * 0.55}rem` }}>
                  {i > 0 && <span className="shrink-0 text-line" aria-hidden>└</span>}
                  <span className={`${italic ? "sci" : "font-medium"} ${last ? "text-lg font-semibold" : ""}`}>{value}</span>
                </span>
              </li>
            );
          })}
        </ol>
        {ai && (
          <div className="border-t border-dashed border-line px-6 py-3 text-xs leading-relaxed text-ink-soft">
            <p>
              Det. <span className="sci">{sciName}</span> — {ai.model ?? "Gemini"}
              {date ? `, ${date}` : ""}
            </p>
            {species?.verified && <p>Conf. GBIF Backbone Taxonomy</p>}
          </div>
        )}
      </div>
    </Section>
  );
}

function Gallery({ photos }: { photos: Photo[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<Photo | null>(null);
  return (
    <Section title={t("detail.gallery")} className="mt-9">
      {photos.length === 0 ? (
        <p className="text-sm text-ink-soft">{t("detail.noPhotos")}</p>
      ) : (
        <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
          {photos.map((p) => (
            <li key={p.url} className="w-[72%] shrink-0 snap-start sm:w-[44%]">
              <button onClick={() => setOpen(p)} className="block w-full overflow-hidden rounded-2xl bg-line">
                <img src={p.url} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
              </button>
              <p className="mt-1.5 line-clamp-1 text-[0.7rem] text-ink-soft">{p.attribution}</p>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col bg-ink/95 p-4" onClick={() => setOpen(null)}>
          <button className="ms-auto rounded-full p-2 text-paper" aria-label="Close">
            <X size={26} />
          </button>
          <img src={open.large} alt="" className="m-auto max-h-[80dvh] max-w-full rounded-xl object-contain" />
          <p className="mt-3 text-center text-xs text-paper/80">{open.attribution}</p>
        </div>
      )}
    </Section>
  );
}

function LocalNames({ species }: { species?: Species }) {
  const { t, lang } = useI18n();
  const names = species?.localNames ?? [];
  if (names.length === 0) return null;

  // Current language first, then Nigerian languages, then everything else in Settings order.
  const order = [lang, "yo", "ha", "ig", ...LANGUAGES.map((l) => l.code)];
  const byLang = new Map<string, string[]>();
  for (const n of names) byLang.set(n.lang, [...(byLang.get(n.lang) ?? []), n.name]);
  const langs = [...new Set(order)].filter((c) => byLang.has(c));

  return (
    <Section title={t("detail.localNames")} className="mt-9">
      <dl className="divide-y divide-line rounded-2xl border border-line bg-sheet">
        {langs.map((code) => (
          <div key={code} className="flex gap-4 p-3.5">
            <dt className="w-28 shrink-0 text-sm text-ink-soft">{LANGUAGES.find((l) => l.code === code)?.native}</dt>
            <dd className="min-w-0 flex-1" lang={code}>
              {byLang.get(code)!.slice(0, 4).join(", ")}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-sheet px-4 py-2 text-sm font-medium hover:border-moss"
    >
      {children}
      <ExternalLink size={14} aria-hidden />
    </a>
  );
}
