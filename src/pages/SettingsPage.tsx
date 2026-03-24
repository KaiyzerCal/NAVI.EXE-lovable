import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { Settings, User, Bell, Shield, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Switch } from "@/components/ui/switch";

const OPERATOR_CLASSES = [
  "Technomancer", "Warrior", "Scholar", "Alchemist",
  "Shadowblade", "Artificer", "Strategist", "Sentinel",
  "Chronomancer", "Beastmaster", "Enchanter", "Vanguard",
];

const NAVI_PERSONALITIES = [
  { value: "ANALYTICAL", label: "Analytical", desc: "Logic-driven, precise" },
  { value: "GUARDIAN", label: "Guardian", desc: "Protective, steady" },
  { value: "HYPE", label: "Hype", desc: "High energy, motivating" },
  { value: "SHADOW", label: "Shadow", desc: "Mysterious, deliberate" },
  { value: "ROGUE", label: "Rogue", desc: "Sharp wit, clever" },
  { value: "SAGE", label: "Sage", desc: "Tactical, optimizing" },
  { value: "COMPANION", label: "Companion", desc: "Empathetic, warm" },
  { value: "CHALLENGER", label: "Challenger", desc: "Pushes limits, competitive" },
  { value: "ARCHITECT", label: "Architect", desc: "Systems thinker, builder" },
  { value: "WILDCARD", label: "Wildcard", desc: "Unpredictable, creative" },
];

const ENCOURAGEMENT_LEVELS = ["Minimal", "Low", "Moderate", "High", "Maximum"];
const COMM_STYLES = ["Blunt", "Direct", "Balanced", "Gentle", "Poetic"];
const HUMOR_LEVELS = ["None", "Dry", "Moderate", "High", "Chaotic"];
const FORMALITY_LEVELS = ["Casual", "Relaxed", "Balanced", "Professional", "Formal"];

export default function SettingsPage() {
  const { profile, updateProfile } = useProfile();
  const [name, setName] = useState("");
  const [notifications, setNotifications] = useState({
    questReminders: true,
    streakWarnings: true,
    xpMilestones: false,
    dailySummary: true,
    levelUps: true,
    bondEvents: false,
  });

  useEffect(() => {
    if (profile.display_name) setName(profile.display_name);
  }, [profile.display_name]);

  const selectClass = "w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors";
  const miniSelect = "bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground outline-none";

  return (
    <div>
      <PageHeader title="SETTINGS" subtitle="// SYSTEM CONFIG" />
      <div className="space-y-4">
        <HudCard title="PROFILE" icon={<User size={14} />}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">OPERATOR NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => updateProfile({ display_name: name })}
                className={selectClass}
              />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">CLASS</label>
              <select
                value={profile.character_class || ""}
                onChange={(e) => updateProfile({ character_class: e.target.value })}
                className={selectClass}
              >
                <option value="">Select Class...</option>
                {OPERATOR_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </HudCard>

        <HudCard title="NAVI PERSONALITY" icon={<Shield size={14} />}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">PERSONALITY MODE</label>
              <select
                value={profile.navi_personality}
                onChange={(e) => updateProfile({ navi_personality: e.target.value })}
                className={selectClass}
              >
                {NAVI_PERSONALITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>
                ))}
              </select>
            </div>
            {[
              { label: "Encouragement", options: ENCOURAGEMENT_LEVELS },
              { label: "Communication Style", options: COMM_STYLES },
              { label: "Humor", options: HUMOR_LEVELS },
              { label: "Formality", options: FORMALITY_LEVELS },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm font-body">{s.label}</span>
                <select className={miniSelect}>
                  {s.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </HudCard>

        <HudCard title="NOTIFICATIONS" icon={<Bell size={14} />}>
          <div className="space-y-3">
            {([
              { key: "questReminders", label: "Quest Reminders" },
              { key: "streakWarnings", label: "Streak Warnings" },
              { key: "xpMilestones", label: "XP Milestones" },
              { key: "dailySummary", label: "Daily Summary" },
              { key: "levelUps", label: "Level Ups" },
              { key: "bondEvents", label: "Bond Events" },
            ] as const).map((n) => (
              <div key={n.key} className="flex items-center justify-between">
                <span className="text-sm font-body">{n.label}</span>
                <Switch
                  checked={notifications[n.key]}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [n.key]: checked }))}
                />
              </div>
            ))}
          </div>
        </HudCard>

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
