import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Lovable Cloud publishable values. These are safe to ship in the client bundle
// (RLS protects the data) and act as build-time fallbacks so the published
// production build never ends up with an undefined Supabase URL/key.
const FALLBACK_SUPABASE_URL = "https://fjkkcrmhptrzobajjsqg.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqa2tjcm1ocHRyem9iYWpqc3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTE3MTEsImV4cCI6MjA4OTY4NzcxMX0.X3NlDLT6Jh-AayP1qiA882SH0PiFOjf1TYEkE66qzr0";
const FALLBACK_SUPABASE_PROJECT_ID = "fjkkcrmhptrzobajjsqg";

// Web Push VAPID public key. Public by design (it ships in the client bundle and
// is sent to the push service); the matching private key lives only in edge
// function secrets. Fallback ensures production builds without a .env still work.
const FALLBACK_VAPID_PUBLIC_KEY =
  "BCWXBuNfqMJI3h_NMr1VM68JVBy0HPyz95HCzl9qIx1wOqsNLS7mC-0yb1qsRv0qfYFkhQRtYybcxY-EB2fQJiI";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY
    ),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
      env.VITE_SUPABASE_PROJECT_ID || FALLBACK_SUPABASE_PROJECT_ID
    ),
    "import.meta.env.VITE_VAPID_PUBLIC_KEY": JSON.stringify(
      env.VITE_VAPID_PUBLIC_KEY || FALLBACK_VAPID_PUBLIC_KEY
    ),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-motion": ["framer-motion"],
          "vendor-sentry": ["@sentry/react"],
        },
      },
    },
  },
  };
});
