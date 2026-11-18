import { useEffect, useState } from "react";
import { Check, Download } from "lucide-react";
import { LANGUAGES, useI18n } from "../i18n";
import { clearScans, clearSearches } from "../lib/store";
import { PageHeader, Section } from "../components/ui";
import Wordmark from "../components/Wordmark";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function useInstall() {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => window.matchMedia("(display-mode: standalone)").matches);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return {
    installed,
    isIos,
    canPrompt: !!event,
    install: async () => {
      if (!event) return;
      await event.prompt();
      const { outcome } = await event.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setEvent(null);
    },
  };
}

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const install = useInstall();
  const [done, setDone] = useState<string | null>(null);

  async function wipe(which: "scans" | "searches") {
    if (!window.confirm(t("settings.confirm"))) return;
    if (which === "scans") await clearScans();
    else clearSearches();
    setDone(which);
  }

  return (
    <div>
      <PageHeader title={t("settings.title")} />

      <Section title={t("settings.language")}>
        <p className="-mt-1 mb-3 text-sm text-ink-soft">{t("settings.languageHint")}</p>
        <ul role="radiogroup" aria-label={t("settings.language")} className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-sheet">
          {LANGUAGES.map((l) => {
            const on = l.code === lang;
            return (
              <li key={l.code}>
                <button
                  role="radio"
                  aria-checked={on}
                  onClick={() => setLang(l.code)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start hover:bg-paper/60"
                >
                  <span>
                    <span lang={l.code} className={`block ${on ? "font-semibold" : ""}`}>
                      {l.native}
                    </span>
                    {l.native !== l.english && <span className="block text-sm text-ink-soft">{l.english}</span>}
                  </span>
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full border ${on ? "border-moss bg-moss text-paper" : "border-line"}`}
                    aria-hidden
                  >
                    {on && <Check size={15} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title={t("settings.install")} className="mt-9">
        <div className="rounded-2xl border border-line bg-sheet p-4">
          {install.installed ? (
            <p className="text-sm">{t("settings.installed")}</p>
          ) : (
            <>
              <p className="text-sm">{t("settings.installBody")}</p>
              {install.canPrompt ? (
                <button onClick={install.install} className="mt-3 inline-flex items-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-paper">
                  <Download size={16} aria-hidden />
                  {t("settings.installCta")}
                </button>
              ) : install.isIos ? (
                <p className="mt-2 text-sm text-ink-soft">{t("settings.installIos")}</p>
              ) : null}
            </>
          )}
        </div>
      </Section>

      <Section title={t("settings.data")} className="mt-9">
        <p className="-mt-1 mb-3 text-sm text-ink-soft">{t("settings.dataBody")}</p>
        <div className="flex flex-wrap gap-2">
          {(["scans", "searches"] as const).map((w) => (
            <button key={w} onClick={() => wipe(w)} className="rounded-full border border-line bg-sheet px-4 py-2 text-sm font-medium hover:border-moss">
              {done === w ? t("settings.deleted") : t(w === "scans" ? "settings.clearScans" : "settings.clearSearches")}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("settings.about")} className="mt-9">
        <p className="max-w-[60ch] text-sm leading-relaxed text-ink-soft">{t("settings.aboutBody")}</p>
        <p className="mt-4 flex items-baseline gap-2 text-xs text-ink-soft">
          <Wordmark className="text-lg text-moss" />
          0.1.0
        </p>
      </Section>
    </div>
  );
}
