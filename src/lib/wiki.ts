/** Short Wikipedia summary in the user's language, falling back to English. */
export async function wikiSummary(title: string, lang: string, signal?: AbortSignal): Promise<{ text: string; url: string } | null> {
  const langs = lang === "en" ? ["en"] : [lang, "en"];
  for (const l of langs) {
    try {
      const res = await fetch(`https://${l}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`, { signal });
      if (!res.ok) continue;
      const d = (await res.json()) as { extract?: string; type?: string; content_urls?: { desktop?: { page?: string } } };
      if (d.type === "disambiguation" || !d.extract) continue;
      return { text: d.extract, url: d.content_urls?.desktop?.page ?? `https://${l}.wikipedia.org/wiki/${encodeURIComponent(title)}` };
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
    }
  }
  return null;
}
