import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.naviexe.app',
  appName: 'NAVI.EXE',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0f',
      showSpinner: false,
    },
    // Self-hosted OTA (src/lib/liveUpdate.ts + Supabase Storage
    // 'ota-bundles' bucket) — no Capawesome Cloud account, no
    // subscription. Same setup as mythos-vantara.
    LiveUpdate: {
      appId: 'navi-exe-ota',
      autoDeleteBundles: true,
      autoBlockRolledBackBundles: true,
      readyTimeout: 10000,
    },
  },
};

export default config;
