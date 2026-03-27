import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { motion } from "framer-motion";
import { User, Bell, Database, Shield, Check, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

const ENCOURAGEMENT_OPTIONS = ["Low", "Moderate", "High"] as const;
const STYLE_OPTIONS = ["Casual", "Direct", "Poetic", "Technical"] as const;
const HUMOR_OPTIONS = ["None", "Low", "Moderate", "High"] as const;
const FORMALITY_OPTIONS = ["Chill", "Balanced", "Professional"] as const;

type EncouragementLevel = typeof ENCOURAGEMENT_OPTIONS[number];
type StyleLevel = typeof STYLE_OPTIONS[number];
type HumorLevel = typeof HUMOR_OPTIONS[number];
type FormalityLevel = typeof FORMALITY_OPTIONS[number];

interface NaviPersonalitySettings {
  encouragement: EncouragementLevel;
  style: StyleLevel;
  humor: HumorLevel;
  formality: FormalityLevel;
}

const DEFAULT_PERSONALITY: NaviPersonalitySettings = {
  encouragement: "High",
  style: "Direct",
  humor: "Moderate",
  formality: "Balanced",
};

function parsePersonality(raw: string | null | undefined): NaviPersonalitySettings {
  if (!raw) return DEFAULT_PERSONALITY;
  try {
    if (raw.startsWith("{")) return { ...DEFAULT_PERSONALITY, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PERSONALITY;
}

function OptionRow<T extends string>({
  label, description, options, value, onChange,
}: {
  label: string; description: string; options: readonly T[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-sm font-body">{label}</p>
        <p className="text-[10px] font-mono text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => (
          <button key={opt} onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${value === opt ? "bg-primary/10 text-primary border border-primary/40" : "bg-muted border border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"}`}>
            {value === opt && <Check size={10} />}
            {opt.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { profile, updateProfile, loading } = useProfile();
  const { theme, setTheme } = useTheme();
  const [personality, setPersonality] = useState<NaviPersonalitySettings>(DEFAULT_PERSONALITY);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [naviName, setNaviName] = useState("");
  const [notifications, setNotifications] = useState({
    questReminders: true, streakWarnings: true, xpMilestones: false, dailySummary: true,
  });

  // Sync local state FROM profile once it loads from Supabase
  // Without this, useState initializer runs before profile is fetched
  useEffect(() => {
    if (loading) return;
    setDisplayName(profile.display_name ?? "");
    setNaviName(profile.navi_name ?? "NAVI");
    setPersonality(parsePersonality(profile.navi_personality));
  }, [loading, profile.display_name]); // re-sync when profile loads

  const updatePersonality = async (updates: Partial<NaviPersonalitySettings>) => {
    const next = { ...personality, ...updates };
    setPersonality(next);
    await updateProfile({ navi_personality: JSON.stringify(next) });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ display_name: displayName.trim() || null, navi_name: naviName.trim() || "NAVI" });
      toast({ title: "Profile saved", description: "Changes persisted to database." });
    } finally {
      setSaving(false);
    }
  };

  const toggleNotif = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      <PageHeader title="SETTINGS" subtitle="// SYSTEM CONFIG" />
      <div className="space-y-4">

        {/* Profile */}
        <HudCard title="PROFILE" icon={<User size={14} />}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">OPERATOR NAME</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">NAVI NAME</label>
              <input type="text" value={naviName} onChange={(e) => setNaviName(e.target.value)}
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">CLASS</label>
              <div className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-muted-foreground">
                {profile.character_class || "Not assigned — take the MBTI quiz on the Character page"}
              </div>
            </div>
            <button onClick={saveProfile} disabled={saving}
              className="px-4 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-50">
              {saving ? "SAVING..." : "SAVE PROFILE"}
            </button>
          </div>
        </HudCard>

        {/* Navi Personality */}
        <HudCard title="NAVI PERSONALITY" icon={<Shield size={14} />} glow>
          <p className="text-[10px] font-mono text-muted-foreground mb-4">CHANGES SAVE AUTOMATICALLY</p>
          <div className="space-y-5">
            <OptionRow label="Encouragement Level" description="How much your Navi cheers you on" options={ENCOURAGEMENT_OPTIONS} value={personality.encouragement} onChange={(v) => updatePersonality({ encouragement: v })} />
            <OptionRow label="Communication Style" description="How your Navi frames its messages" options={STYLE_OPTIONS} value={personality.style} onChange={(v) => updatePersonality({ style: v })} />
            <OptionRow label="Humor" description="How much wit and lightness your Navi brings" options={HUMOR_OPTIONS} value={personality.humor} onChange={(v) => updatePersonality({ humor: v })} />
            <OptionRow label="Formality" description="Casual ally vs professional partner" options={FORMALITY_OPTIONS} value={personality.formality} onChange={(v) => updatePersonality({ formality: v })} />
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-[10px] font-mono text-muted-foreground">
              ACTIVE: {personality.encouragement} · {personality.style} · {personality.humor} · {personality.formality}
            </p>
          </div>
        </HudCard>

        {/* Notifications */}
        <HudCard title="NOTIFICATIONS" icon={<Bell size={14} />}>
          <div className="space-y-3">
            {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, enabled]) => {
              const labels: Record<keyof typeof notifications, string> = { questReminders: "Quest Reminders", streakWarnings: "Streak Warnings", xpMilestones: "XP Milestones", dailySummary: "Daily Summary" };
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-body">{labels[key]}</span>
                  <button onClick={() => toggleNotif(key)} className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? "bg-primary/30" : "bg-muted"}`}>
                    <div className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${enabled ? "right-0.5 bg-primary" : "left-0.5 bg-muted-foreground"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </HudCard>

        {/* Data */}
        <HudCard title="DATA" icon={<Database size={14} />}>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors">EXPORT DATA</button>
            <button className="px-3 py-2 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono hover:bg-destructive/20 transition-colors">RESET PROGRESS</button>
          </div>
        </HudCard>
      </div>
    </div>
  );
}

