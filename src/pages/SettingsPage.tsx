import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { motion, AnimatePresence } from "framer-motion";
import { User, Bell, Database, Shield, Check, Sun, Moon, BellRing, BellOff, AlertTriangle, Loader2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

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
  const { user, signOut } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
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
  const push = usePushNotifications();

  // Sync local state FROM profile once it loads from Supabase
  useEffect(() => {
    if (loading) return;
    setDisplayName(profile.display_name ?? "");
    setNaviName(profile.navi_name ?? "NAVI");
    setUsername(profile.username ?? "");
    setPersonality(parsePersonality(profile.navi_personality));
    if (profile.notification_settings) setNotifications((prev) => ({ ...prev, ...profile.notification_settings }));
  }, [loading, profile.display_name]); // re-sync when profile loads

  // Validate username uniqueness with debounce
  useEffect(() => {
    if (usernameDebounce.current) clearTimeout(usernameDebounce.current);
    const trimmed = username.trim();
    if (!trimmed || trimmed === (profile.username ?? "")) {
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

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      updateProfile({ notification_settings: { ...profile.notification_settings, ...next } });
      return next;
    });
  };

  const [exporting, setExporting] = useState(false);
  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [{ data: quests }, { data: journal }, { data: skills }] = await Promise.all([
        supabase.from("quests").select("*").eq("user_id", user.id),
        supabase.from("journal_entries").select("*").eq("user_id", user.id),
        supabase.from("skills" as any).select("*").eq("user_id", user.id),
      ]);
      const payload = { exported_at: new Date().toISOString(), profile, quests, journal, skills };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `navi-exe-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Export ready", description: "Your data has been downloaded." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");
      const { error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      toast({ title: "Account deleted", description: "Your account and data have been permanently removed." });
      await signOut();
    } catch (e: any) {
      toast({ title: "Deletion failed", description: e.message || "Please try again or contact support.", variant: "destructive" });
      setDeleting(false);
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
              {!usernameError && !checkingUsername && username.trim() && username.trim() !== (profile.username ?? "") && (
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
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
            <div>
              <p className="text-sm font-body">Push Notifications</p>
              <p className="text-[10px] font-mono text-muted-foreground max-w-xs">
                {push.supported
                  ? "Get streak alerts, quest reminders, and nudges from your Navi even when the app is closed."
                  : "Not supported in this browser."}
              </p>
              {push.error && <p className="text-[10px] font-mono text-destructive mt-1">{push.error}</p>}
            </div>
            {push.supported && (
              <button
                disabled={push.checking}
                onClick={() => (push.subscribed ? push.unsubscribe() : push.subscribe())}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-mono transition-colors disabled:opacity-50 ${
                  push.subscribed
                    ? "bg-muted border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                    : "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
                }`}
              >
                {push.subscribed ? <><BellOff size={12} /> DISABLE</> : <><BellRing size={12} /> ENABLE</>}
              </button>
            )}
          </div>
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
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {exporting ? <Loader2 size={12} className="animate-spin" /> : null}
              {exporting ? "EXPORTING..." : "EXPORT DATA"}
            </button>
          </div>
          <div className="flex gap-3 mt-3 pt-3 border-t border-border">
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">TERMS OF SERVICE</a>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">PRIVACY POLICY</a>
          </div>
        </HudCard>

        {/* Danger Zone */}
        <HudCard title="DANGER ZONE" icon={<AlertTriangle size={14} />}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-body">Delete Account</p>
              <p className="text-[10px] font-mono text-muted-foreground max-w-sm">
                Permanently deletes your account and all associated data — quests, journal entries,
                chat history, messages, guild/party memberships, and uploaded media. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="shrink-0 px-3 py-2 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono hover:bg-destructive/20 transition-colors"
            >
              DELETE ACCOUNT
            </button>
          </div>
        </HudCard>
      </div>

      {/* Delete account confirmation modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-destructive/40 rounded-lg p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-destructive" />
                  <h3 className="font-display font-bold text-sm text-destructive tracking-wider">DELETE ACCOUNT</h3>
                </div>
                <button onClick={() => !deleting && setDeleteModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs font-body text-muted-foreground mb-4 leading-relaxed">
                This permanently deletes your account, profile, quests, journal entries, chat and message
                history, guild/party memberships, and uploaded files. There is no way to recover this
                data afterward.
              </p>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                Type <span className="text-destructive font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={deleting}
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-destructive/50 transition-colors mb-4 disabled:opacity-50"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                  className="flex-1 py-2 rounded border border-border text-muted-foreground text-xs font-mono hover:text-foreground transition-colors disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  className="flex-1 py-2 rounded bg-destructive/20 border border-destructive/50 text-destructive text-xs font-mono hover:bg-destructive/30 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : null}
                  {deleting ? "DELETING..." : "PERMANENTLY DELETE"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

