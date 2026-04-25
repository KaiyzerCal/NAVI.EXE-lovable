import { useEffect, useState } from "react";

export type NaviRenderMode = "SVG" | "AI";

const STORAGE_KEY = "navi-render-mode";
const EVENT_NAME = "navi-render-mode-change";

function readMode(): NaviRenderMode {
  if (typeof window === "undefined") return "SVG";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "AI" ? "AI" : "SVG";
}

/**
 * Global, persisted toggle for how Navi skins render across the app.
 * - "SVG": animated sprite components (src/components/navi-characters)
 * - "AI":  AI-generated PNG assets in the navi-skins storage bucket
 */
export function useNaviRenderMode(): [NaviRenderMode, (m: NaviRenderMode) => void] {
  const [mode, setModeState] = useState<NaviRenderMode>(() => readMode());

  useEffect(() => {
    const sync = () => setModeState(readMode());
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setMode = (m: NaviRenderMode) => {
    window.localStorage.setItem(STORAGE_KEY, m);
    setModeState(m);
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  return [mode, setMode];
}