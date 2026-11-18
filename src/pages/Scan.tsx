import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, ScanLine } from "lucide-react";
import { useI18n } from "../i18n";
import type { StringKey } from "../i18n/en";
import { identify, ScanError } from "../lib/identify";
import { saveScan } from "../lib/store";
import { usePhotoPicker } from "../lib/usePhotoPicker";
import { PageHeader } from "../components/ui";

const STEPS: StringKey[] = ["scan.step1", "scan.step2", "scan.step3"];

export default function Scan() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const image = (useLocation().state as { image?: string } | null)?.image;
  const { inputs, openLibrary } = usePhotoPicker();
  const [step, setStep] = useState(0); // 0 = idle, 1..3 = running
  const [error, setError] = useState<string | null>(null);

  // Step 3 ("gathering photos") is part of the same enrichment call as step 2; advance it on a timer for feedback.
  useEffect(() => {
    if (step !== 2) return;
    const id = setTimeout(() => setStep(3), 1100);
    return () => clearTimeout(id);
  }, [step]);

  async function run() {
    if (!image) return;
    setError(null);
    try {
      const record = await identify(image, lang, (s) => setStep(s));
      await saveScan(record);
      navigate(`/scan/${record.id}`, { replace: true });
    } catch (e) {
      const code = e instanceof ScanError ? e.code : "generic";
      const key = `err.${code}` as StringKey;
      setError(t(key) === key ? t("err.generic") : t(key));
      setStep(0);
    }
  }

  if (!image) {
    return (
      <div>
        <PageHeader title={t("scan.title")} back />
        <p className="px-5 text-ink-soft">{t("scan.noImage")}</p>
      </div>
    );
  }

  const running = step > 0;
  return (
    <div>
      {inputs}
      <PageHeader title={t("scan.title")} sub={running ? undefined : t("scan.hint")} back />
      <div className="px-5">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-moss">
          <img src={image} alt={t("result.yourPhoto")} className="max-h-[58dvh] w-full object-contain" />
          {running && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              <div className="scan-sweep h-full w-full border-b-2 border-pollen bg-pollen/10" />
            </div>
          )}
        </div>

        {running ? (
          <ol className="mt-6 space-y-3" aria-live="polite">
            {STEPS.map((key, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <li key={key} className={`flex items-center gap-3 ${done || active ? "text-ink" : "text-ink-soft/60"}`}>
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full border text-xs font-semibold ${
                      done ? "border-moss bg-moss text-paper" : active ? "border-pollen-deep text-ink" : "border-line"
                    }`}
                  >
                    {done ? <Check size={15} aria-hidden /> : n}
                  </span>
                  <span className={active ? "font-semibold" : ""}>{t(key)}</span>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {error && (
              <p role="alert" className="rounded-2xl border border-line bg-sheet p-4 text-sm">
                {error}
              </p>
            )}
            <button
              onClick={run}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-pollen py-4 text-lg font-semibold text-ink shadow-[0_3px_0_var(--color-pollen-deep)] active:translate-y-px active:shadow-none"
            >
              <ScanLine size={22} aria-hidden />
              {error ? t("retry") : t("scan.cta")}
            </button>
            <button onClick={openLibrary} className="py-2 text-sm font-medium text-ink-soft underline-offset-4 hover:underline">
              {t("scan.another")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
