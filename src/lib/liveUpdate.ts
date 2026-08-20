// Self-hosted OTA updates via @capawesome/capacitor-live-update — no
// Capgo/Appflow account, no subscription. Bundles are plain zips of `dist/`
// hosted in the 'ota-bundles' Supabase Storage bucket (public read), pushed
// by .github/workflows/ota-release.yml on every release. Native-only:
// there's nothing to "update" in a browser tab, it just serves the latest
// deploy already. Same setup as mythos-vantara's src/lib/liveUpdate.ts.
import { Capacitor } from "@capacitor/core";
import { LiveUpdate } from "@capawesome/capacitor-live-update";

const MANIFEST_URL = "https://fjkkcrmhptrzobajjsqg.supabase.co/storage/v1/object/public/ota-bundles/manifest.json";

interface OtaManifest {
  version: string;
  url: string;
  checksum: string; // SHA-256 hex, computed by CI at upload time
}

/**
 * Checks for a newer bundle and stages it. Safe to call unconditionally at
 * startup — no-ops immediately on web. Failures (offline, bad manifest,
 * flaky download) are swallowed: the app just keeps running on whatever
 * bundle is already installed rather than blocking startup on a network call.
 *
 * Deliberately does NOT call reload() here. This must run in the background
 * after the app has already rendered — calling it before render (like the
 * original version of this function did) means every native launch pays for
 * a manifest fetch, and a live reload() firing mid-session while
 * AppDataContext's hooks are still starting up produces "renders, but data
 * never loads" — the reload wipes whatever was mid-fetch, and a stale
 * service-worker cache-first response served across the swap can leave the
 * new page's own fetches stalled too. setNextBundle() is documented by the
 * plugin to apply "on reload() or restarting the app"; the plugin's own
 * constructor promotes a staged bundle at native process start independent
 * of this JS running at all, so a full close-and-reopen still picks it up,
 * without ever interrupting a live session. (Same fix as mythos-vantara's
 * liveUpdate.ts, commits #173/#175.)
 */
export async function checkForUpdate(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const res = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) return;
    const manifest = (await res.json()) as OtaManifest;
    if (!manifest?.version || !manifest?.url || !manifest?.checksum) return;

    const [current, next] = await Promise.all([LiveUpdate.getCurrentBundle(), LiveUpdate.getNextBundle()]);
    if (current.bundleId === manifest.version) return; // already running latest
    if (next.bundleId === manifest.version) return; // already staged for next restart

    try {
      await LiveUpdate.downloadBundle({ url: manifest.url, bundleId: manifest.version, checksum: manifest.checksum });
    } catch {
      // Already downloaded from an earlier check that never got restarted
      // into (ERROR_BUNDLE_EXISTS) — fine, still (re)stage it below.
    }
    await LiveUpdate.setNextBundle({ bundleId: manifest.version });
  } catch {
    // Offline, malformed manifest, download failure, etc. — not fatal,
    // the app continues on its current bundle.
  }
}

/**
 * Confirms the app booted successfully on whatever bundle is currently
 * active. Must be called after a real render, not before — if this never
 * fires (crash on startup), readyTimeout expires and the plugin
 * auto-rolls-back to the last known-good bundle on next launch.
 */
export async function confirmBootSuccess(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const result = await LiveUpdate.ready();
    if (result.rollback) {
      console.warn("[liveUpdate] Previous bundle failed to boot — rolled back to", result.currentBundleId);
    }
  } catch {
    // Nothing to do if this fails — worst case is the timeout rolls back
    // on its own.
  }
}

/**
 * The bundle the app is currently running, for display.
 *
 * OTA failures are all swallowed by design (see checkForUpdate), which is
 * correct — a flaky manifest fetch should never block startup. The cost is
 * that there is no way to tell, from a running device, whether a fix has
 * actually landed. That ambiguity has now blocked debugging the NAVI chat
 * problem twice: a symptom that looks like broken code is indistinguishable
 * from an old bundle that never got promoted.
 *
 * Returns a short id for the running bundle, "builtin" when running the APK's
 * own assets with no OTA applied, or null on web where the concept does not
 * apply.
 */
export async function getRunningBundleLabel(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const current = await LiveUpdate.getCurrentBundle();
    const id = current?.bundleId;
    // The plugin reports the built-in assets as "public" (or undefined on some
    // versions) when no OTA bundle has been promoted.
    if (!id || id === "public") return "builtin";
    return id.slice(0, 12);
  } catch {
    return "unknown";
  }
}
