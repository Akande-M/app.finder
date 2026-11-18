import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, ImageUp } from "lucide-react";
import { useI18n } from "../i18n";
import { usePhotoPicker } from "../lib/usePhotoPicker";
import { listScans } from "../lib/store";
import type { ScanRecord } from "../lib/types";
import { GroupTag, LeafArt, Spinner } from "../components/ui";
import Wordmark from "../components/Wordmark";

/**
 * Real photos for the two action cards: Wikimedia Commons, credited as their licences require.
 * Special:FilePath returns a resized copy, so phones don't download the multi-MB originals.
 */
const COVERS = [
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Swamp_rose-mallow.jpg?width=1280",
    alt: "Swamp rose-mallow (Hibiscus moscheutos) in flower",
    credit: "The Cosmonaut, CC BY-SA 2.5 CA",
    page: "https://commons.wikimedia.org/wiki/File:Swamp_rose-mallow.jpg",
  },
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Hibiscus_rhodanthus.jpg?width=640",
    alt: "Hibiscus rhodanthus flower",
    credit: "Hans Hillewaert, CC BY-SA 4.0",
    page: "https://commons.wikimedia.org/wiki/File:Hibiscus_rhodanthus.jpg",
  },
] as const;

/** Photo with a licence credit; falls back to the drawn leaf if it can't load (e.g. first visit offline). */
function CoverPhoto({ cover, className = "" }: { cover: (typeof COVERS)[number]; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <LeafArt className={`h-full w-full ${className}`} />;
  return (
    <>
      <img src={cover.src} alt={cover.alt} onError={() => setFailed(true)} className={`h-full w-full object-cover ${className}`} />
      <a
        href={cover.page}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-1.5 end-2 max-w-[calc(100%-1rem)] truncate rounded bg-ink/55 px-1.5 py-0.5 text-[0.6rem] text-paper/90 hover:bg-ink/75"
      >
        {cover.credit}
      </a>
    </>
  );
}

export default function Home() {
  const { t } = useI18n();
  const { inputs, busy, openCamera, openLibrary } = usePhotoPicker();
  const [scans, setScans] = useState<ScanRecord[] | null>(null);

  useEffect(() => {
    listScans().then(setScans).catch(() => setScans([]));
  }, []);

  return (
    <div>
      {inputs}
      <header className="px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-5">
        <Wordmark className="text-[1.65rem] text-moss" />
        <h1 className="display mt-4 text-[2.15rem] leading-[1.1]">{t("home.title")}</h1>
        <p className="mt-2 max-w-[44ch] text-ink-soft">{t("home.sub")}</p>
      </header>

      <div className="grid gap-3 px-5 sm:grid-cols-[1.4fr_1fr]">
        {/* Primary action: camera */}
        <article className="overflow-hidden rounded-[1.75rem] bg-moss text-paper">
          <div className="relative aspect-[16/10] overflow-hidden">
            <CoverPhoto cover={COVERS[0]} />
            {/* viewfinder corners: says "camera" without words */}
            <div className="pointer-events-none absolute inset-6 border-paper/90" aria-hidden>
              {["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map((c) => (
                <span key={c} className={`absolute h-7 w-7 rounded-[3px] border-paper/90 ${c}`} />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4 p-5">
            <div className="min-w-[13rem] flex-1">
              <h2 className="text-lg font-semibold">{t("home.scanTitle")}</h2>
              <p className="mt-1 text-sm text-paper/75">{t("home.scanBody")}</p>
            </div>
            <button
              onClick={openCamera}
              disabled={busy}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-pollen px-5 py-3 font-semibold text-ink shadow-[0_2px_0_var(--color-pollen-deep)] active:translate-y-px active:shadow-none disabled:opacity-60"
            >
              {busy ? <Spinner /> : <Camera size={19} aria-hidden />}
              {t("home.scanCta")}
            </button>
          </div>
        </article>

        {/* Secondary action: library */}
        <article className="flex overflow-hidden rounded-[1.75rem] border border-line bg-sheet sm:flex-col">
          <div className="relative w-32 shrink-0 overflow-hidden sm:aspect-[16/10] sm:w-full">
            <CoverPhoto cover={COVERS[1]} />
          </div>
          <div className="flex flex-1 flex-col justify-between gap-3 p-4">
            <div>
              <h2 className="font-semibold">{t("home.uploadTitle")}</h2>
              <p className="mt-1 text-sm text-ink-soft">{t("home.uploadBody")}</p>
            </div>
            <button
              onClick={openLibrary}
              disabled={busy}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-moss px-4 py-2 text-sm font-semibold text-moss hover:bg-moss hover:text-paper disabled:opacity-60"
            >
              <ImageUp size={17} aria-hidden />
              {t("home.uploadCta")}
            </button>
          </div>
        </article>
      </div>

      <section className="mt-9 px-5">
        <h2 className="mb-3 text-[1.05rem] font-semibold">{t("home.recent")}</h2>
        {scans === null ? (
          <Spinner className="text-ink-soft" />
        ) : scans.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-ink-soft">{t("home.empty")}</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-sheet">
            {scans.map((s) => (
              <li key={s.id}>
                <ScanRow scan={s} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ScanRow({ scan }: { scan: ScanRecord }) {
  const { t, lang } = useI18n();
  const top = scan.ai.candidates?.[0];
  const name = scan.species?.commonName ?? top?.commonName ?? t("result.none");
  const sci = scan.species?.scientificName ?? top?.scientificName;
  const group = scan.species?.group ?? (scan.ai.group === "none" ? undefined : scan.ai.group);
  const date = new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : lang, { day: "numeric", month: "short" }).format(scan.createdAt);
  return (
    <Link to={`/scan/${scan.id}`} className="flex items-center gap-3 p-3 hover:bg-paper/60">
      <img src={scan.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{name}</p>
        {sci && <p className="sci truncate text-sm text-ink-soft">{sci}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {group && <GroupTag group={group} />}
        <span className="text-xs text-ink-soft">{date}</span>
      </div>
    </Link>
  );
}
