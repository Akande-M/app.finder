# Finder

Finder is an installable web app (PWA). Photograph a plant, animal or fungus and it shows you:

- the common name and scientific name
- the full classification: kingdom, phylum, class, order, family, genus and species
- reference photos from different angles
- names in other languages, including Yoruba, Hausa and Igbo

Built with React, Vite, TypeScript and Tailwind. There's no login: everything a user does is stored on their device.

## How a scan works

```
photo ──► /api/identify (serverless) ──► Gemini vision (free tier)
              │                                │
              │                      top 3 candidates + description,
              │                      written in the user's language
              ▼
   GBIF species/match  ──► confirms the Latin name exists, gives authoritative taxonomy
   GBIF vernacularNames ─► local names (yor / hau / ibo / …)
   iNaturalist taxa     ─► photos from different angles, with photographer credit
   Wikipedia summary    ─► in the user's language, falls back to English
```

If GBIF can't confirm the AI's name, the result is labelled **"Not confirmed — treat as a suggestion"** rather than being shown as fact. Only the Gemini call needs a key. GBIF, iNaturalist and Wikipedia are free, keyless and called straight from the browser.

## Run locally

```bash
npm install
cp .env.example .env.local      # paste your key from https://aistudio.google.com/apikey
npm run dev                     # http://localhost:5173 (the /api route runs inside Vite)
```

To test on your phone over Wi-Fi, run `npm run dev -- --host`. The camera opens via the file input's `capture` attribute, so plain HTTP on your LAN works for picking photos. Installing as an app needs HTTPS, which means a deployed URL.

## Deploy (Vercel, free)

1. Push this folder to GitHub/GitLab and import it in Vercel. It detects Vite automatically.
2. In Project → Settings → Environment Variables, add `GEMINI_API_KEY`. Optionally add `ALLOWED_ORIGINS=https://your-domain` and `SCANS_PER_MINUTE`.
3. Deploy. `api/identify.ts` becomes a serverless function, and `vercel.json` handles SPA routing.

## Project map

| Path | What it does |
| --- | --- |
| `api/identify.ts` | Serverless proxy to Gemini: keeps the key secret, enforces a JSON schema, basic rate limit |
| `src/lib/identify.ts` | Client scan pipeline (AI → GBIF → iNaturalist → Wikipedia) |
| `src/lib/inat.ts`, `gbif.ts`, `wiki.ts`, `species.ts` | Data sources and merging |
| `src/lib/store.ts` | Scan history (IndexedDB) and search history (localStorage) |
| `src/components/SpeciesView.tsx` | The full species profile, used for both scans and Explore/Search |
| `src/i18n/` | 13 languages; each loads only when chosen. Arabic switches the layout to RTL |
| `vite.config.ts` | PWA manifest, offline caching of species photos/data, local API middleware |

## Known limits — read before launch

- **The free Gemini tier is small and changes without notice.** Google has cut free quotas several times. Plan for tens to a few hundred scans a day per project. When the quota runs out, users see a clear "limit reached" message. To scale, turn on billing (Flash costs fractions of a cent per scan), or set `GEMINI_MODEL` to a cheaper Flash-Lite model.
- **Google may use free-tier prompts to improve its models.** Mention this in your privacy policy, or move to the paid tier.
- **The rate limit is per server instance**, which is best-effort only. For a real launch, back it with Upstash Redis (free tier) or Vercel's firewall rate limiting.
- **The Yoruba, Hausa and Igbo UI translations are machine-drafted.** Get a native speaker to review `src/i18n/locales/{yo,ha,ig}.ts`. GBIF's local-name coverage for these languages is thin for many species, so that section only appears when names exist.
- **iNaturalist API terms**: it allows app use, not scraping, and asks for under ~60 requests/minute. Photos are CC-licensed and the credit is shown under each one; keep that.
- **Safety:** results never say anything is safe to eat or touch, and every profile ends with a warning. Don't remove it.
