import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en, { type StringKey, type Strings } from "./en";

export interface Language {
  code: string;
  native: string;
  english: string;
  rtl?: boolean;
}

/** Languages offered in Settings. Add one by creating ./locales/<code>.ts and listing it here. */
export const LANGUAGES: Language[] = [
  { code: "en", native: "English", english: "English" },
  { code: "fr", native: "Français", english: "French" },
  { code: "es", native: "Español", english: "Spanish" },
  { code: "pt", native: "Português", english: "Portuguese" },
  { code: "de", native: "Deutsch", english: "German" },
  { code: "ar", native: "العربية", english: "Arabic", rtl: true },
  { code: "zh", native: "中文", english: "Chinese" },
  { code: "hi", native: "हिन्दी", english: "Hindi" },
  { code: "ru", native: "Русский", english: "Russian" },
  { code: "sw", native: "Kiswahili", english: "Swahili" },
  { code: "yo", native: "Èdè Yorùbá", english: "Yoruba" },
  { code: "ha", native: "Harshen Hausa", english: "Hausa" },
  { code: "ig", native: "Asụsụ Igbo", english: "Igbo" },
];

// Each locale is its own chunk, loaded only when chosen.
const loaders = import.meta.glob<{ default: Partial<Strings> }>("./locales/*.ts");

const STORAGE_KEY = "finder.lang";

function initialLanguage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch {
    /* ignore */
  }
  const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
  return LANGUAGES.some((l) => l.code === browser) ? browser : "en";
}

interface I18n {
  lang: string;
  setLang: (code: string) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  formatNumber: (n: number) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(initialLanguage);
  const [dict, setDict] = useState<Partial<Strings>>({});

  useEffect(() => {
    let cancelled = false;
    const meta = LANGUAGES.find((l) => l.code === lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = meta?.rtl ? "rtl" : "ltr";
    if (lang === "en") {
      setDict({});
      return;
    }
    const load = loaders[`./locales/${lang}.ts`];
    load?.().then((m) => !cancelled && setDict(m.default));
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const setLang = useCallback((code: string) => {
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const nf = new Intl.NumberFormat(lang === "zh" ? "zh-CN" : lang, { notation: "compact" });
    return {
      lang,
      setLang,
      formatNumber: (n) => nf.format(n),
      t: (key, vars) => {
        let s = dict[key] ?? en[key];
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
        return s;
      },
    };
  }, [lang, dict, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
