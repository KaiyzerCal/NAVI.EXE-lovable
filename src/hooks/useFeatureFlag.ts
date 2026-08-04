import { useState, useEffect } from "react";
import { getFeatureFlags, type FeatureFlags } from "@/lib/featureFlags";

export function useFeatureFlag<K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] {
  const [value, setValue] = useState<FeatureFlags[K]>(() => getFeatureFlags()[flag]);

  useEffect(() => {
    const handler = () => setValue(getFeatureFlags()[flag]);
    window.addEventListener("navi_flags_changed", handler);
    return () => window.removeEventListener("navi_flags_changed", handler);
  }, [flag]);

  return value;
}
