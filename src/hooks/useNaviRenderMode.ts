import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
 *
 * Persistence strategy:
 * - Local: localStorage gives an instant, synchronous initial value so the
 *   correct mode renders on first paint (no SVG flash before AI loads).
 * - Remote: the value is mirrored to profiles.navi_render_mode so the choice
 *   follows the user across devices and full app reinstalls.
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

  // Hydrate from the user's profile on mount so the choice persists across
  // devices / fresh installs (where localStorage is empty).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("profiles")
        .select("navi_render_mode")
        .eq("id", uid)
        .maybeSingle();
      if (cancelled) return;
      const remote = (data as any)?.navi_render_mode;
      if (remote === "SVG" || remote === "AI") {
        const local = window.localStorage.getItem(STORAGE_KEY);
        if (local !== remote) {
          window.localStorage.setItem(STORAGE_KEY, remote);
          setModeState(remote);
          window.dispatchEvent(new Event(EVENT_NAME));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setMode = (m: NaviRenderMode) => {
    window.localStorage.setItem(STORAGE_KEY, m);
    setModeState(m);
    window.dispatchEvent(new Event(EVENT_NAME));
    // Fire-and-forget mirror to the user's profile so it persists per-account.
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      await supabase
        .from("profiles")
        .update({ navi_render_mode: m } as any)
        .eq("id", uid);
    })();
  };

  return [mode, setMode];
}