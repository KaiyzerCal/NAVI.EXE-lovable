import { useEffect, useState } from "react";

/**
 * Global preference for how Navi skins are rendered everywhere in the app.
 * - "SVG"  → use the animated React/SVG sprite component (getNaviCharacter)
 * - "AI"   → use the AI-generated PNG from Supabase storage (navi-skins bucket)
 *
 * Persisted to localStorage and synced across tabs / components via a custom
 * window event so the toggle on the Navi page updates the Dashboard, Chat, etc.
 */
export type NaviRenderMode = "SVG" | "AI";

const STORAGE_KEY = "navi:renderMode";
const EVENT = "navi-render-mode-change";

function readMode(): NaviRenderMode {
  if (typeof window === "undefined") return "SVG";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "AI" ? "AI" : "SVG";
}

export function useNaviRenderMode(): [NaviRenderMode, (m: NaviRenderMode) => void] {
  const [mode, setMode] = useState<NaviRenderMode>(() => readMode());

  useEffect(() => {
    const onChange = () => setMode(readMode());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = (next: NaviRenderMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(EVENT));
    setMode(next);
  };

  return [mode, update];
}