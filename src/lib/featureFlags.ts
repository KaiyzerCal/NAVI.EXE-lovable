export interface FeatureFlags {
  enableAgentExecution: boolean;
  enableMarketplace: boolean;
  enableSeasonPass: boolean;
  enableChallenges: boolean;
  enableGuildVault: boolean;
  enableVoiceInput: boolean;
  debugMode: boolean;
}

const DEFAULTS: FeatureFlags = {
  enableAgentExecution: true,
  enableMarketplace: true,
  enableSeasonPass: true,
  enableChallenges: true,
  enableGuildVault: true,
  enableVoiceInput: true,
  debugMode: false,
};

function readLocalOverrides(): Partial<FeatureFlags> {
  try {
    const raw = localStorage.getItem("navi_feature_flags");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getFeatureFlags(): FeatureFlags {
  return { ...DEFAULTS, ...readLocalOverrides() };
}

export function setFeatureFlag<K extends keyof FeatureFlags>(flag: K, value: FeatureFlags[K]): void {
  const current = readLocalOverrides();
  localStorage.setItem("navi_feature_flags", JSON.stringify({ ...current, [flag]: value }));
  window.dispatchEvent(new Event("navi_flags_changed"));
}

export function resetFeatureFlags(): void {
  localStorage.removeItem("navi_feature_flags");
  window.dispatchEvent(new Event("navi_flags_changed"));
}
