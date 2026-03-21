import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { motion } from "framer-motion";
import { Settings, User, Bell, Palette, Database, Shield } from "lucide-react";

export default function SettingsPage() {
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
                defaultValue="Operator"
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">CLASS</label>
              <select className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors">
                <option>Technomancer</option>
                <option>Warrior</option>
                <option>Scholar</option>
                <option>Alchemist</option>
              </select>
            </div>
          </div>
        </HudCard>

        <HudCard title="NAVI PERSONALITY" icon={<Shield size={14} />}>
          <div className="space-y-3">
            {[
              { label: "Encouragement Level", value: "High" },
              { label: "Communication Style", value: "Direct" },
              { label: "Humor", value: "Moderate" },
            ].map((setting) => (
              <div key={setting.label} className="flex items-center justify-between">
                <span className="text-sm font-body">{setting.label}</span>
                <select className="bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground outline-none">
                  <option>Low</option>
                  <option selected={setting.value === "Moderate"}>Moderate</option>
                  <option selected={setting.value === "High"}>High</option>
                  <option selected={setting.value === "Direct"}>Direct</option>
                </select>
              </div>
            ))}
          </div>
        </HudCard>

        <HudCard title="NOTIFICATIONS" icon={<Bell size={14} />}>
          <div className="space-y-3">
            {[
              { label: "Quest Reminders", enabled: true },
              { label: "Streak Warnings", enabled: true },
              { label: "XP Milestones", enabled: false },
              { label: "Daily Summary", enabled: true },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between">
                <span className="text-sm font-body">{n.label}</span>
                <button className={`w-10 h-5 rounded-full relative transition-colors ${
                  n.enabled ? "bg-primary/30" : "bg-muted"
                }`}>
                  <div className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${
                    n.enabled ? "right-0.5 bg-primary" : "left-0.5 bg-muted-foreground"
                  }`} />
                </button>
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
