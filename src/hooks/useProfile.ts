import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProfileData {
  display_name: string | null;
  equipped_skin: string;
  character_class: string | null;
  mbti_type: string | null;
  navi_personality: string;
  bond_affection: number;
  bond_trust: number;
  bond_loyalty: number;
  navi_level: number;
  navi_name: string;
  xp_total: number;
  current_streak: number;
  longest_streak: number;
  user_navi_description: string | null;
  last_active: string | null;
  subclass: string | null;
  operator_level: number;
  operator_xp: number;
  onboarding_done: boolean;
  perception: number;
  luck: number;
  codex_points: number;
  cali_coins: number;
  notification_settings: {
    questReminders: boolean;
    streakWarnings: boolean;
    xpMilestones: boolean;
    dailySummary: boolean;
  };
  subscription_tier: string;
  daily_message_count: number;
  message_count_reset_date: string;
}

const defaults: ProfileData = {
  display_name: null,
  equipped_skin: "NETOP",
  character_class: null,
  mbti_type: null,
  navi_personality: "GUARDIAN",
  bond_affection: 50,
  bond_trust: 50,
  bond_loyalty: 50,
  navi_level: 1,
  navi_name: "NAVI",
  xp_total: 0,
  current_streak: 0,
  longest_streak: 0,
  user_navi_description: null,
  last_active: null,
  subclass: null,
  operator_level: 1,
  operator_xp: 0,
  onboarding_done: false,
  perception: 10,
  luck: 10,
  codex_points: 0,
  cali_coins: 0,
  notification_settings: {
    questReminders: true,
    streakWarnings: true,
    xpMilestones: false,
    dailySummary: true,
  },
  subscription_tier: "free",
  daily_message_count: 0,
  message_count_reset_date: new Date().toISOString().slice(0, 10),
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as any);
        setLoading(false);
      });
  }, [user]);

  const updateProfile = useCallback(
    async (updates: Partial<ProfileData>) => {
      setProfile((p) => ({ ...p, ...updates }));
      if (user && Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates as any).eq("id", user.id);
      }
    },
    [user]
  );

  const refetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) setProfile(data as any);
  }, [user]);

  return { profile, loading, updateProfile, refetchProfile };
}
