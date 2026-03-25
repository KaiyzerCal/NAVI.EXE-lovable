import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { motion } from "framer-motion";
import { Settings, User, Bell, Database, Shield, Check } from "lucide-react";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const PERSONALITY_MODES = [
  "ANALYTICAL", "GUARDIAN", "HYPE", "SHADOW", "ROGUE", "SAGE",
  "COMPANION", "WILDCARD", "STRATEGIST", "MENTOR",
] as const;

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
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
              value === opt
                ? "bg-primary/10 text-primary border border-primary/40"
                : "bg-muted border border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
            }`}>
            {value === opt && <Check size={10} />}
            {opt.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { profile, updateProfile } = useProfile();

  const parsePersonality = (): NaviPersonalitySettings => {
    try {
      const raw = profile.navi_personality;
      if (raw && raw.startsWith("{")) return JSON.parse(raw);
    } catch {}
    return { encouragement: "High", style: "Direct", humor: "Moderate", formality: "Balanced" };
  };

  const [personality, setPersonality] = useState<NaviPersonalitySettings>(parsePersonality);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [characterClass, setCharacterClass] = useState(profile.character_class || "");

  const [notifications, setNotifications] = useState(profile.notification_settings || {
    questReminders: true,
    streakWarnings: true,
    xpMilestones: false,
    dailySummary: true,
  });

  const updatePersonality = async (updates: Partial<NaviPersonalitySettings>) => {
    const next = { ...personality, ...updates };
    setPersonality(next);
    await updateProfile({ navi_personality: JSON.stringify(next) });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ display_name: displayName, character_class: characterClass || null });
      toast({ title: "Profile saved", description: "Operator profile updated." });
    } finally {
      setSaving(false);
    }
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
              <label className="text-xs font-mono text-muted-foreground block mb-1">CLASS</label>
              <select value={characterClass} onChange={(e) => setCharacterClass(e.target.value)}
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors">
                <option value="">Not assigned</option>
                {MBTI_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <button onClick={saveProfile} disabled={saving}
              className="px-4 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-50">
              {saving ? "SAVING..." : "SAVE PROFILE"}
            </button>
          </div>
        </HudCard>

        {/* Navi Personality Mode */}
        <HudCard title="NAVI PERSONALITY MODE" icon={<Shield size={14} />}>
          <p className="text-[10px] font-mono text-muted-foreground mb-3">SELECT YOUR NAVI'S CORE PERSONALITY</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PERSONALITY_MODES.map((mode) => {
              const current = profile.navi_personality;
              const isSelected = current === mode || (current.startsWith("{") && false);
              return (
                <button key={mode} onClick={() => updateProfile({ navi_personality: mode })}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                    isSelected ? "bg-primary/10 text-primary border border-primary/40" : "bg-muted border border-border text-muted-foreground hover:border-primary/20"
                  }`}>{mode}</button>
              );
            })}
          </div>
        </HudCard>

        {/* Navi Fine-Tuning */}
        <HudCard title="NAVI FINE-TUNING" icon={<Shield size={14} />} glow>
          <p className="text-[10px] font-mono text-muted-foreground mb-4">CHANGES SAVE AUTOMATICALLY</p>
          <div className="space-y-5">
            <OptionRow label="Encouragement Level" description="How much your Navi cheers you on"
              options={ENCOURAGEMENT_OPTIONS} value={personality.encouragement} onChange={(v) => updatePersonality({ encouragement: v })} />
            <OptionRow label="Communication Style" description="How your Navi frames its messages"
              options={STYLE_OPTIONS} value={personality.style} onChange={(v) => updatePersonality({ style: v })} />
            <OptionRow label="Humor" description="How much wit and lightness your Navi brings"
              options={HUMOR_OPTIONS} value={personality.humor} onChange={(v) => updatePersonality({ humor: v })} />
            <OptionRow label="Formality" description="Tone register — casual ally vs professional partner"
              options={FORMALITY_OPTIONS} value={personality.formality} onChange={(v) => updatePersonality({ formality: v })} />
          </div>
        </HudCard>

        {/* Notifications */}
        <HudCard title="NOTIFICATIONS" icon={<Bell size={14} />}>
          <div className="space-y-3">
            {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, enabled]) => {
              const labels: Record<keyof typeof notifications, string> = {
                questReminders: "Quest Reminders",
                streakWarnings: "Streak Warnings",
                xpMilestones: "XP Milestones",
                dailySummary: "Daily Summary",
              };
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-body">{labels[key]}</span>
                  <Switch checked={enabled} onCheckedChange={() => toggleNotif(key)} />
                </div>
              );
            })}
          </div>
        </HudCard>

        {/* Data */}
        <HudCard title="DATA" icon={<Database size={14} />}>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors">
              EXPORT DATA
            </button>
            <button className="px-3 py-2 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono hover:bg-destructive/20 transition-colors">
              RESET PROGRESS
            </button>
          </div>
        </HudCard>
      </div>
    </div>
  );
}
