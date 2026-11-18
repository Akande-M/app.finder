import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Runs the /api/* serverless functions inside `vite dev`, so you don't need
 * the Vercel CLI locally. In production Vercel serves /api/* itself.
 */
function localApi(): Plugin {
  return {
    name: "finder-local-api",
    configureServer(server) {
      server.middlewares.use("/api/identify", async (req, res) => {
        try {
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const mod = await server.ssrLoadModule("/api/identify.ts");
          const request = new Request(`http://localhost${req.originalUrl ?? "/api/identify"}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: req.method === "GET" || req.method === "HEAD" ? undefined : Buffer.concat(chunks),
          });
          const handler = req.method === "OPTIONS" ? mod.OPTIONS : mod.POST;
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "local_api_error", message: String(err) }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Expose .env / .env.local values (e.g. GEMINI_API_KEY) to the local API handler.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    plugins: [
      react(),
      tailwindcss(),
      localApi(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "apple-touch-icon.png"],
        manifest: {
          name: "Finder — identify any living thing",
          short_name: "Finder",
          description: "Photograph a plant, animal or fungus and learn its name, classification and story.",
          theme_color: "#1d3b2f",
          background_color: "#e9eee8",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          categories: ["education", "lifestyle"],
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              // Species photos from iNaturalist (they rarely change)
              urlPattern: /^https:\/\/(inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org|upload\.wikimedia\.org|commons\.wikimedia\.org\/wiki\/Special:FilePath)\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "species-photos",
                expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/(api\.inaturalist\.org|api\.gbif\.org|[a-z-]+\.wikipedia\.org)\/.*/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "species-data",
                expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  };
});
