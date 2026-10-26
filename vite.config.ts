// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // On Vercel builds (VERCEL=1), emit Vercel-native output; elsewhere keep the default target.
  // Hosted media (/__l5e) and all privileged server work (/api, /_serverFn) run on the Lovable
  // deployment, which holds the server-only keys Vercel cannot have.
  ...(process.env.VERCEL
    ? {
        nitro: {
          preset: "vercel",
          routeRules: {
            "/__l5e/**": { proxy: "https://faith-light-aid.lovable.app/__l5e/**" },
            "/api/**": { proxy: "https://faith-light-aid.lovable.app/api/**" },
            "/_serverFn/**": { proxy: "https://faith-light-aid.lovable.app/_serverFn/**" },
          },
        } as { preset: string },
      }
    : {}),
  vite: {
    resolve: {
      alias: {
        "entities/lib/decode.js": path.resolve(process.cwd(), "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(process.cwd(), "node_modules/entities/lib/encode.js"),
        entities: path.resolve(process.cwd(), "node_modules/entities"),
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
