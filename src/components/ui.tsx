import { ArrowLeft, Bug, Leaf, Sprout, CircleDashed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useI18n } from "../i18n";
import type { Group } from "../lib/types";

export const GROUP_COLOR: Record<Group, string> = {
  plant: "var(--color-plant)",
  animal: "var(--color-animal)",
  fungus: "var(--color-fungus)",
  other: "var(--color-other)",
};

const GROUP_ICON: Record<Group, typeof Leaf> = { plant: Leaf, animal: Bug, fungus: Sprout, other: CircleDashed };

export function GroupTag({ group }: { group: Group }) {
  const { t } = useI18n();
  const Icon = GROUP_ICON[group];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold text-white"
      style={{ background: GROUP_COLOR[group] }}
    >
      <Icon size={12} aria-hidden />
      {t(`group.${group}`)}
    </span>
  );
}

export function PageHeader({ title, sub, back }: { title?: string; sub?: string; back?: boolean }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <header className="px-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-4">
      {back && (
        <button
          onClick={() => (history.length > 1 ? navigate(-1) : navigate("/"))}
          className="-ml-2 mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={18} className="rtl:rotate-180" aria-hidden />
          {t("common.back")}
        </button>
      )}
      {title && <h1 className="display text-[1.9rem] leading-tight">{title}</h1>}
      {sub && <p className="mt-1.5 max-w-[60ch] text-[0.95rem] text-ink-soft">{sub}</p>}
    </header>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="mx-5 rounded-2xl border border-line bg-sheet p-4 text-sm">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded-full bg-moss px-4 py-2 font-semibold text-paper">
          {t("retry")}
        </button>
      )}
    </div>
  );
}

export function Section({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`px-5 ${className}`}>
      <h2 className="mb-3 text-[1.05rem] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** Fallback artwork when no photo is available (offline, or a taxon without photos). */
export function LeafArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden>
      <rect width="200" height="140" fill="var(--color-moss-soft)" />
      <g fill="none" stroke="#e9eee8" strokeOpacity="0.55" strokeWidth="1.4">
        <path d="M30 130 C 50 70, 110 30, 175 25 C 170 90, 110 128, 30 130 Z" />
        <path d="M30 130 L 160 38" />
        {[0.2, 0.35, 0.5, 0.65, 0.8].map((p) => {
          const x = 30 + 130 * p;
          const y = 130 - 92 * p;
          return (
            <g key={p}>
              <path d={`M${x} ${y} q 14 -22 ${10 + 18 * (1 - p)} -30`} />
              <path d={`M${x} ${y} q 22 6 ${26 + 10 * (1 - p)} 18`} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
