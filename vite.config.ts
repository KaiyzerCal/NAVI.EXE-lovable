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
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
