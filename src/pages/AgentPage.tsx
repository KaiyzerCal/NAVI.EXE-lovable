import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { Bot, Plus, Loader2, CheckCircle, XCircle, Clock, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePaywall } from "@/hooks/usePaywall";
import { UnlockWithCoreCard } from "@/components/UnlockWithCoreCard";

interface AgentTask {
  id: string;
  title: string;
  description: string | null;
  agent_type: string;
  status: string;
  priority: number;
  result: any;
  created_at: string;
  completed_at: string | null;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending:   { icon: <Clock size={12} />,        color: "text-muted-foreground", label: "QUEUED" },
  running:   { icon: <Loader2 size={12} className="animate-spin" />, color: "text-primary", label: "RUNNING" },
  completed: { icon: <CheckCircle size={12} />,  color: "text-neon-green",      label: "DONE" },
  failed:    { icon: <XCircle size={12} />,      color: "text-destructive",     label: "FAILED" },
};

const AGENT_TYPES = [
  { id: "general",    label: "GENERAL",    desc: "Open-ended research or assistance" },
  { id: "quest",      label: "QUEST",      desc: "Break down and plan a quest" },
  { id: "research",   label: "RESEARCH",   desc: "Gather information on a topic" },
  { id: "scheduler",  label: "SCHEDULER",  desc: "Plan and structure your week" },
];

export default function AgentPage() {
  const { user } = useAuth();
  const paywall = usePaywall();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("general");
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [executingTask, setExecutingTask] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  async function loadTasks() {
    setLoading(true);
    const { data } = await supabase
      .from("agent_tasks")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setTasks(data ?? []);
    setLoading(false);
  }

  async function createTask() {
    if (!newTitle.trim() || !user) return;
    setSubmitting(true);
    const { data } = await supabase
      .from("agent_tasks")
      .insert({
        user_id: user.id,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        agent_type: newType,
        priority: 1,
      })
      .select()
      .single();
    if (data) setTasks((prev) => [data, ...prev]);
    setNewTitle("");
    setNewDesc("");
    setShowCreate(false);
    setSubmitting(false);
  }

  async function executeTask(task: AgentTask) {
    if (!user) return;
    setExecutingTask(task.id);
    await supabase.from("agent_tasks").update({ status: "running" }).eq("id", task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "running" } : t));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/navi-agent-runner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ task_id: task.id }),
      });
      if (res.ok) {
        const result = await res.json();
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "completed", result } : t));
      } else {
        throw new Error(await res.text());
      }
    } catch (e) {
      await supabase.from("agent_tasks").update({ status: "failed" }).eq("id", task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "failed" } : t));
    } finally {
      setExecutingTask(null);
    }
  }

  async function deleteTask(taskId: string) {
    await supabase.from("agent_tasks").delete().eq("id", taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  if (!paywall.loading && !paywall.isElite) {
    return (
      <div>
        <PageHeader title="AGENT FRAMEWORK" subtitle="// AUTONOMOUS TASK EXECUTION" />
        <UnlockWithCoreCard
          title="UNLOCK WITH ELITE"
          description="Agent automation, scheduling, and autonomous task execution. Requires Elite Operator."
          className="mt-4"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="AGENT FRAMEWORK" subtitle="// AUTONOMOUS TASK EXECUTION" />

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus size={12} />
          NEW TASK
        </button>
      </div>

      {showCreate && (
        <HudCard title="QUEUE AGENT TASK" icon={<Bot size={14} />} className="mb-4">
          <div className="flex gap-2 mb-3 flex-wrap">
            {AGENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setNewType(type.id)}
                className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-colors ${newType === type.id ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                title={type.desc}
              >
                {type.label}
              </button>
            ))}
          </div>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task objective..."
            className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-primary/40 mb-2"
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Additional context (optional)..."
            rows={3}
            className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 resize-none mb-3"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
              CANCEL
            </button>
            <button
              onClick={createTask}
              disabled={submitting || !newTitle.trim()}
              className="px-4 py-1.5 rounded border border-primary/50 bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              {submitting ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
              QUEUE TASK
            </button>
          </div>
        </HudCard>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <Bot size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-mono text-muted-foreground text-sm">No tasks queued.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Queue a task to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, i) => {
            const statusConf = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
            const isExpanded = expandedTask === task.id;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <div className={`mt-0.5 shrink-0 ${statusConf.color}`}>{statusConf.icon}</div>
                    <div className="flex-1">
                      <button
                        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                        className="text-sm font-body text-foreground text-left hover:text-primary transition-colors"
                      >
                        {task.title}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                          {task.agent_type.toUpperCase()}
                        </span>
                        <span className={`text-[9px] font-mono ${statusConf.color}`}>{statusConf.label}</span>
                        <span className="text-[9px] font-mono text-muted-foreground">{timeAgo(task.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.status === "pending" && (
                      <button
                        onClick={() => executeTask(task)}
                        disabled={!!executingTask}
                        className="flex items-center gap-1 px-2 py-1 rounded border border-neon-green/40 bg-neon-green/10 text-neon-green text-[9px] font-mono hover:bg-neon-green/20 disabled:opacity-40 transition-colors"
                      >
                        {executingTask === task.id ? <Loader2 size={9} className="animate-spin" /> : <Play size={9} />}
                        {executingTask === task.id ? "..." : "RUN"}
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-[10px] font-mono text-muted-foreground/50 hover:text-destructive transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t border-border">
                    {task.description && (
                      <p className="text-xs font-body text-muted-foreground mb-2">{task.description}</p>
                    )}
                    {task.result ? (
                      <div className="p-3 rounded bg-muted/20 border border-border">
                        <p className="text-[10px] font-mono text-muted-foreground mb-1">RESULT</p>
                        <p className="text-xs font-body text-foreground whitespace-pre-wrap">{typeof task.result === "object" ? (task.result as any).output ?? JSON.stringify(task.result) : String(task.result)}</p>
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {task.status === "pending" ? "Awaiting execution." : "No result yet."}
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
