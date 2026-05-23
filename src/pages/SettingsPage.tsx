import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { motion } from "framer-motion";
import { User, Bell, Database, Shield, Check, Sun, Moon, Download, Mail, Trash2, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { profile, updateProfile, profileLoading: loading } = useAppData();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [personality, setPersonality] = useState<NaviPersonalitySettings>(DEFAULT_PERSONALITY);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [naviName, setNaviName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notifications, setNotifications] = useState({
    questReminders: true, streakWarnings: true, xpMilestones: false, dailySummary: true,
  });
  const [emailPrefs, setEmailPrefs] = useState({ dailySummary: false, streakWarning: true, weeklyReport: false });
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndStart, setDndStart] = useState("22:00");
  const [dndEnd, setDndEnd] = useState("08:00");
  const [exportingData, setExportingData] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [subscribingPush, setSubscribingPush] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Sync local state FROM profile once it loads from Supabase
  useEffect(() => {
    if (loading) return;
    setDisplayName(profile.display_name ?? "");
    setNaviName(profile.navi_name ?? "NAVI");
    setUsername((profile as any).username ?? "");
    setPersonality(parsePersonality(profile.navi_personality));
    const saved = (profile as any).notification_settings;
    if (saved && typeof saved === "object") {
      setNotifications((prev) => ({ ...prev, ...saved }));
      if (saved.dnd_enabled !== undefined) setDndEnabled(!!saved.dnd_enabled);
      if (saved.dnd_start) setDndStart(saved.dnd_start);
      if (saved.dnd_end) setDndEnd(saved.dnd_end);
    }
    if ((profile as any).email_preferences) {
      setEmailPrefs((prev) => ({ ...prev, ...(profile as any).email_preferences }));
    }
  }, [loading, profile.display_name]); // re-sync when profile loads

  // Validate username uniqueness with debounce
  useEffect(() => {
    if (usernameDebounce.current) clearTimeout(usernameDebounce.current);
    const trimmed = username.trim();
    if (!trimmed || trimmed === ((profile as any).username ?? "")) {
      setUsernameError(null);
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
      setUsernameError("3–20 chars, letters/numbers/underscores only");
      return;
    }
    setCheckingUsername(true);
    usernameDebounce.current = setTimeout(async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("username", trimmed)
        .neq("id", user?.id ?? "")
        .maybeSingle();
      setUsernameError(data ? "Username already taken" : null);
      setCheckingUsername(false);
    }, 400);
    return () => { if (usernameDebounce.current) clearTimeout(usernameDebounce.current); };
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePersonality = async (updates: Partial<NaviPersonalitySettings>) => {
    const next = { ...personality, ...updates };
    setPersonality(next);
    await updateProfile({ navi_personality: JSON.stringify(next) });
  };

  const saveProfile = async () => {
    if (usernameError || checkingUsername) return;
    setSaving(true);
    try {
      const trimmedUsername = username.trim() || null;
      await updateProfile({
        display_name: displayName.trim() || null,
        navi_name: naviName.trim() || "NAVI",
        username: trimmedUsername,
      } as any);
      toast({ title: "Profile saved", description: "Changes persisted to database." });
    } finally {
      setSaving(false);
    }
  };

  const toggleNotif = async (key: keyof typeof notifications) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    await updateProfile({ notification_settings: next } as any);
  };

  const toggleEmailPref = async (key: keyof typeof emailPrefs) => {
    const next = { ...emailPrefs, [key]: !emailPrefs[key] };
    setEmailPrefs(next);
    await updateProfile({ email_preferences: next } as any);
  };

  const saveDnd = async (enabled: boolean, start: string, end: string) => {
    await updateProfile({ notification_settings: { ...notifications, dnd_enabled: enabled, dnd_start: start, dnd_end: end } } as any);
  };

  // Check push notification support and current subscription state
  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setPushSupported(supported);
    if (!supported) return;
    setPushPermission(Notification.permission);
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setPushSubscribed(!!sub);
    }).catch(() => {});
  }, []);

  const handlePushSubscribe = useCallback(async () => {
    if (!user) return;
    setSubscribingPush(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission !== "granted") {
        toast({ title: "Notifications blocked", description: "Enable notifications in your browser settings.", variant: "destructive" });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast({ title: "Push not configured", description: "VAPID key is missing.", variant: "destructive" });
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });
      await supabase.from("push_subscriptions" as any).upsert({ user_id: user.id, subscription: sub.toJSON() });
      setPushSubscribed(true);
      toast({ title: "Notifications enabled", description: "NAVI will send you push alerts." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubscribingPush(false);
    }
  }, [user]);

  const handlePushUnsubscribe = useCallback(async () => {
    if (!user) return;
    setSubscribingPush(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await supabase.from("push_subscriptions" as any).delete().eq("user_id", user.id);
      setPushSubscribed(false);
      toast({ title: "Notifications disabled" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubscribingPush(false);
    }
  }, [user]);

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== "DELETE") return;
    setDeletingAccount(true);
    try {
      // Delete all user data from tables
      await Promise.all([
        supabase.from("quests").delete().eq("user_id", user.id),
        supabase.from("journal_entries").delete().eq("user_id", user.id),
        supabase.from("navi_core_memory" as any).delete().eq("user_id", user.id),
        supabase.from("navi_memories" as any).delete().eq("user_id", user.id),
        supabase.from("operator_feed" as any).delete().eq("operator_id", user.id),
        supabase.from("notifications" as any).delete().eq("user_id", user.id),
        supabase.from("buffs" as any).delete().eq("user_id", user.id),
        supabase.from("skills" as any).delete().eq("user_id", user.id),
      ]);
      // Mark profile as deleted and sign out (auth record removed by admin function)
      await supabase.from("profiles").update({ display_name: "[deleted]", navi_name: "[deleted]" } as any).eq("id", user.id);
      await supabase.functions.invoke("delete-account", {}).catch(() => {}); // best-effort
      await supabase.auth.signOut();
      toast({ title: "Account deleted", description: "Your data has been permanently removed." });
    } catch (err: any) {
      toast({ title: "Error deleting account", description: err.message, variant: "destructive" });
      setDeletingAccount(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setExportingData(true);
    try {
      const [{ data: quests }, { data: entries }] = await Promise.all([
        supabase.from("quests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("journal_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      const toCSV = (rows: any[], cols: string[]) => {
        const header = cols.join(",");
        const body = (rows ?? []).map((r) =>
          cols.map((c) => {
            const v = r[c] ?? "";
            const s = Array.isArray(v) ? v.join(";") : String(v);
            return `"${s.replace(/"/g, '""')}"`;
          }).join(",")
        );
        return [header, ...body].join("\n");
      };

      const questCols = ["id", "name", "type", "completed", "progress", "total", "xp_reward", "created_at", "updated_at"];
      const journalCols = ["id", "title", "content", "tags", "xp_earned", "created_at", "updated_at"];
      const csv = `QUESTS\n${toCSV(quests ?? [], questCols)}\n\nJOURNAL ENTRIES\n${toCSV(entries ?? [], journalCols)}`;

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `navi-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: "Your data has been downloaded." });
    } finally {
      setExportingData(false);
    }
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
              <label className="text-xs font-mono text-muted-foreground block mb-1">USERNAME <span className="opacity-50">(@handle)</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm pointer-events-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="your_handle"
                  maxLength={20}
                  className={`w-full bg-muted border rounded pl-7 pr-3 py-2 text-sm font-body text-foreground outline-none transition-colors ${usernameError ? "border-destructive/60 focus:border-destructive" : "border-border focus:border-primary/40"}`}
                />
              </div>
              {usernameError && <p className="text-[10px] font-mono text-destructive mt-1">{usernameError}</p>}
              {checkingUsername && <p className="text-[10px] font-mono text-muted-foreground mt-1">Checking availability...</p>}
              {!usernameError && !checkingUsername && username.trim() && username.trim() !== ((profile as any).username ?? "") && (
                <p className="text-[10px] font-mono text-green-400 mt-1">@{username.trim()} is available</p>
              )}
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
            <button onClick={saveProfile} disabled={saving || !!usernameError || checkingUsername}
              className="px-4 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-50">
              {saving ? "SAVING..." : "SAVE PROFILE"}
            </button>
          </div>
        </HudCard>

        {/* Theme */}
        <HudCard title="APPEARANCE" icon={<Sun size={14} />}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body">Theme Mode</p>
              <p className="text-[10px] font-mono text-muted-foreground">Switch between dark and light mode</p>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              {theme === "dark" ? "LIGHT MODE" : "DARK MODE"}
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
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-body">Do Not Disturb</p>
                <p className="text-[10px] font-mono text-muted-foreground">Silence all notifications during set hours</p>
              </div>
              <button onClick={() => { const next = !dndEnabled; setDndEnabled(next); saveDnd(next, dndStart, dndEnd); }} className={`w-10 h-5 rounded-full relative transition-colors ${dndEnabled ? "bg-primary/30" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${dndEnabled ? "right-0.5 bg-primary" : "left-0.5 bg-muted-foreground"}`} />
              </button>
            </div>
            {dndEnabled && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-muted-foreground">FROM</span>
                <input type="time" value={dndStart} onChange={(e) => { setDndStart(e.target.value); saveDnd(dndEnabled, e.target.value, dndEnd); }}
                  className="bg-muted border border-border rounded px-2 py-1 text-foreground outline-none focus:border-primary/40" />
                <span className="text-muted-foreground">TO</span>
                <input type="time" value={dndEnd} onChange={(e) => { setDndEnd(e.target.value); saveDnd(dndEnabled, dndStart, e.target.value); }}
                  className="bg-muted border border-border rounded px-2 py-1 text-foreground outline-none focus:border-primary/40" />
              </div>
            )}
          </div>
        </HudCard>

        {/* Email Digest */}
        <HudCard title="EMAIL DIGEST" icon={<Mail size={14} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body">Daily Summary Email</p>
                <p className="text-[10px] font-mono text-muted-foreground">Morning recap of your streak, active quests, and XP</p>
              </div>
              <button onClick={() => toggleEmailPref("dailySummary")} className={`w-10 h-5 rounded-full relative transition-colors ${emailPrefs.dailySummary ? "bg-primary/30" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${emailPrefs.dailySummary ? "right-0.5 bg-primary" : "left-0.5 bg-muted-foreground"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body">Streak Warning</p>
                <p className="text-[10px] font-mono text-muted-foreground">Reminder before your streak breaks at midnight</p>
              </div>
              <button onClick={() => toggleEmailPref("streakWarning")} className={`w-10 h-5 rounded-full relative transition-colors ${emailPrefs.streakWarning ? "bg-primary/30" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${emailPrefs.streakWarning ? "right-0.5 bg-primary" : "left-0.5 bg-muted-foreground"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body">Weekly Report</p>
                <p className="text-[10px] font-mono text-muted-foreground">Your progress summary every Monday morning</p>
              </div>
              <button onClick={() => toggleEmailPref("weeklyReport")} className={`w-10 h-5 rounded-full relative transition-colors ${emailPrefs.weeklyReport ? "bg-primary/30" : "bg-muted"}`}>
                <div className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${emailPrefs.weeklyReport ? "right-0.5 bg-primary" : "left-0.5 bg-muted-foreground"}`} />
              </button>
            </div>
          </div>
        </HudCard>

        {/* Push Notifications */}
        {pushSupported && (
          <HudCard title="PUSH NOTIFICATIONS" icon={<Bell size={14} />}>
            <div className="space-y-3">
              <p className="text-xs font-mono text-muted-foreground">
                Receive NAVI alerts even when the app is closed — streak warnings, quest reminders, and level-up events.
              </p>
              {pushPermission === "denied" ? (
                <p className="text-xs font-mono text-destructive">
                  Notifications are blocked in your browser. Enable them in browser settings to use this feature.
                </p>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={pushSubscribed ? handlePushUnsubscribe : handlePushSubscribe}
                    disabled={subscribingPush}
                    className={`px-4 py-2 rounded border text-xs font-mono transition-colors disabled:opacity-50 flex items-center gap-2 ${
                      pushSubscribed
                        ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                    }`}
                  >
                    {subscribingPush && <Loader2 size={12} className="animate-spin" />}
                    {pushSubscribed ? "DISABLE PUSH ALERTS" : "ENABLE PUSH ALERTS"}
                  </button>
                  {pushSubscribed && (
                    <span className="text-[10px] font-mono text-primary">● ACTIVE</span>
                  )}
                </div>
              )}
            </div>
          </HudCard>
        )}

        {/* Data */}
        <HudCard title="DATA" icon={<Database size={14} />}>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleExportData} disabled={exportingData}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-50">
              <Download size={12} />
              {exportingData ? "EXPORTING..." : "EXPORT DATA"}
            </button>
          </div>
        </HudCard>

        {/* Legal */}
        <HudCard title="LEGAL" icon={<Shield size={14} />}>
          <div className="flex gap-3 flex-wrap">
            <a href="/privacy" target="_blank" rel="noopener"
              className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
              <ExternalLink size={11} /> Privacy Policy
            </a>
            <a href="/terms" target="_blank" rel="noopener"
              className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
              <ExternalLink size={11} /> Terms of Service
            </a>
          </div>
        </HudCard>

        {/* Danger Zone */}
        <HudCard title="DANGER ZONE" icon={<AlertTriangle size={14} className="text-destructive" />}>
          {!showDeleteConfirm ? (
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono hover:bg-destructive/20 transition-colors">
                <Trash2 size={12} /> DELETE ACCOUNT
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded border border-destructive/30 bg-destructive/5">
                <p className="text-xs font-mono text-destructive font-bold mb-1">⚠ THIS CANNOT BE UNDONE</p>
                <p className="text-[10px] font-mono text-muted-foreground">All quests, journal entries, AI memories, currency, and progress will be permanently deleted.</p>
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted-foreground block mb-1">Type <span className="text-destructive font-bold">DELETE</span> to confirm</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-muted border border-destructive/30 rounded px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-destructive transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deletingAccount}
                  className="flex items-center gap-1.5 px-3 py-2 rounded bg-destructive/20 border border-destructive/50 text-destructive text-xs font-mono hover:bg-destructive/30 transition-colors disabled:opacity-40">
                  {deletingAccount ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  {deletingAccount ? "DELETING..." : "CONFIRM DELETE"}
                </button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  className="px-3 py-2 rounded bg-muted border border-border text-muted-foreground text-xs font-mono hover:text-foreground transition-colors">
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </HudCard>
      </div>
    </div>
  );
}

