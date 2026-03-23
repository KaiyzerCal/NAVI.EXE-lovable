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
}

const defaults: ProfileData = {
  display_name: null,
  equipped_skin: "NETOP",
  character_class: null,
  mbti_type: null,
  navi_personality: "ANALYTICAL",
  bond_affection: 50,
  bond_trust: 50,
  bond_loyalty: 50,
  navi_level: 1,
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
      if (user) {
        await supabase.from("profiles").update(updates as any).eq("id", user.id);
      }
    },
    [user]
  );

  return { profile, loading, updateProfile };
}
