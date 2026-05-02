import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { Shield, Users, MessageSquare, Loader2, ToggleLeft, ToggleRight, Flag, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Add your user ID here to gain admin access
const ADMIN_USER_IDS = (import.meta.env.VITE_ADMIN_USER_IDS ?? "").split(",").filter(Boolean);

interface UserRow {
  id: string;
  display_name: string | null;
  subscription_tier: string;
  beta_tester: boolean;
  operator_level: number;
  created_at: string;
}

interface Feedback {
  id: string;
  user_id: string;
  feedback_type: string;
  description: string;
  app_version: string;
  created_at: string;
}

interface ReportedContent {
  id: string;
  reporter_id: string;
  content_type: string;
  content_id: string;
  reason: string | null;
  reviewed: boolean;
  action_taken: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [reported, setReported] = useState<ReportedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "feedback" | "reported">("users");

  const isAdmin = user && (ADMIN_USER_IDS.includes(user.id) || user.email?.endsWith("@vantara.exe"));

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([fetchUsers(), fetchFeedback(), fetchReported()]).finally(() => setLoading(false));
  }, [isAdmin]);

  async function fetchUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, subscription_tier, beta_tester, operator_level, created_at")
      .order("created_at", { ascending: false });
    setUsers((data ?? []) as UserRow[]);
  }

  async function fetchFeedback() {
    const { data } = await supabase
      .from("beta_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setFeedback((data ?? []) as Feedback[]);
  }

  async function fetchReported() {
    const { data } = await (supabase as any)
      .from("reported_content")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setReported((data ?? []) as ReportedContent[]);
  }

  async function markReviewed(id: string, action: string) {
    await (supabase as any)
      .from("reported_content")
      .update({ reviewed: true, action_taken: action })
      .eq("id", id);
    setReported((prev) => prev.map((r) => r.id === id ? { ...r, reviewed: true, action_taken: action } : r));
  }

  async function toggleBeta(userId: string, current: boolean) {
    await supabase.from("profiles").update({ beta_tester: !current }).eq("id", userId);
    setUsers((u) => u.map((p) => p.id === userId ? { ...p, beta_tester: !current } : p));
  }

  async function banUser(userId: string) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (!error) setUsers((u) => u.filter((p) => p.id !== userId));
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.04)_50%)] bg-[length:100%_4px] opacity-30 pointer-events-none" />
        <Shield size={48} className="text-destructive opacity-50" />
        <p className="font-display text-xl font-bold text-destructive tracking-widest">// ACCESS DENIED</p>
        <p className="text-xs font-mono text-muted-foreground">This terminal requires elevated clearance.</p>
      </div>
    );
  }

  const tierCounts = users.reduce((acc, u) => { acc[u.subscription_tier] = (acc[u.subscription_tier] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div>
      <PageHeader title="ADMIN TERMINAL" subtitle="// RESTRICTED ACCESS" />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "TOTAL OPERATORS", value: users.length },
          { label: "CORE TIER", value: tierCounts["core"] ?? 0 },
          { label: "BETA TESTERS", value: users.filter((u) => u.beta_tester).length },
          { label: "PENDING REPORTS", value: reported.filter((r) => !r.reviewed).length },
        ].map((s) => (
          <HudCard key={s.label} title={s.label}>
            <p className="font-display text-2xl font-bold text-primary">{s.value}</p>
          </HudCard>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-5 border-b border-border">
        <button onClick={() => setTab("users")}
          className={`px-4 py-2 text-xs font-display tracking-wider border-b-2 transition-colors ${tab === "users" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Users size={10} className="inline mr-1" />OPERATORS
        </button>
        <button onClick={() => setTab("feedback")}
          className={`px-4 py-2 text-xs font-display tracking-wider border-b-2 transition-colors ${tab === "feedback" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <MessageSquare size={10} className="inline mr-1" />FEEDBACK
        </button>
        <button onClick={() => setTab("reported")}
          className={`px-4 py-2 text-xs font-display tracking-wider border-b-2 transition-colors flex items-center gap-1 ${tab === "reported" ? "border-destructive text-destructive" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Flag size={10} className="inline" />REPORTED
          {reported.filter((r) => !r.reviewed).length > 0 && (
            <span className="ml-1 min-w-[14px] h-[14px] rounded-full bg-destructive text-[8px] font-bold text-white flex items-center justify-center px-0.5">
              {reported.filter((r) => !r.reviewed).length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : tab === "users" ? (
        <HudCard title={`OPERATORS (${users.length})`} icon={<Users size={14} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="pb-2 pr-4">NAME</th>
                  <th className="pb-2 pr-4">TIER</th>
                  <th className="pb-2 pr-4">LV</th>
                  <th className="pb-2 pr-4">BETA</th>
                  <th className="pb-2 pr-4">JOINED</th>
                  <th className="pb-2">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="py-2 pr-4 font-body">{u.display_name ?? "—"}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-1.5 py-0.5 rounded ${u.subscription_tier === "core" ? "text-primary bg-primary/10" : "text-muted-foreground bg-muted/40"}`}>
                        {u.subscription_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{u.operator_level}</td>
                    <td className="py-2 pr-4">
                      <button onClick={() => toggleBeta(u.id, u.beta_tester)}>
                        {u.beta_tester
                          ? <ToggleRight size={16} className="text-neon-green" />
                          : <ToggleLeft size={16} className="text-muted-foreground" />}
                      </button>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-2">
                      {u.id !== user.id && (
                        <button onClick={() => banUser(u.id)} className="text-destructive text-[10px] hover:underline">BAN</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HudCard>
      ) : tab === "feedback" ? (
        <HudCard title={`BETA FEEDBACK (${feedback.length})`} icon={<MessageSquare size={14} />}>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {feedback.map((f) => (
              <div key={f.id} className="border border-border rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${f.feedback_type === "BUG" ? "bg-destructive/10 text-destructive" : f.feedback_type === "SUGGESTION" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {f.feedback_type}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-body">{f.description}</p>
                <p className="text-[9px] font-mono text-muted-foreground mt-1">v{f.app_version} · {f.user_id.slice(0, 8)}</p>
              </div>
            ))}
          </div>
        </HudCard>
      ) : (
        <HudCard title={`REPORTED CONTENT (${reported.length})`} icon={<Flag size={14} />}>
          {reported.length === 0 ? (
            <p className="text-xs font-mono text-muted-foreground py-4 text-center">No reports filed.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {reported.map((r) => (
                <div key={r.id} className={`border rounded p-3 ${r.reviewed ? "border-border opacity-60" : "border-destructive/30"}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                          {r.content_type}
                        </span>
                        {r.reviewed && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-0.5">
                            <Check size={9} /> REVIEWED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        ID: {r.content_id.slice(0, 16)}... · Reporter: {r.reporter_id.slice(0, 8)}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.reason && (
                    <p className="text-xs font-body text-foreground/80 mb-2">"{r.reason}"</p>
                  )}
                  {r.action_taken && (
                    <p className="text-[10px] font-mono text-muted-foreground mb-2">Action: {r.action_taken}</p>
                  )}
                  {!r.reviewed && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => markReviewed(r.id, "dismissed")}
                        className="px-2.5 py-1 rounded border border-border text-muted-foreground text-[10px] font-mono hover:text-foreground transition-colors"
                      >
                        DISMISS
                      </button>
                      <button
                        onClick={() => markReviewed(r.id, "content_removed")}
                        className="px-2.5 py-1 rounded border border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-mono hover:bg-destructive/20 transition-colors"
                      >
                        REMOVE CONTENT
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </HudCard>
      )}
    </div>
  );
}
