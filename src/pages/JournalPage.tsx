import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Calendar, Tag } from "lucide-react";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
  tags: string[];
  xpEarned: number;
}

const entries: JournalEntry[] = [
  {
    id: "1",
    title: "Morning Reflection",
    content: "Good start to the day. Focus session went well — completed 3 pomodoros on the side project. Need to improve evening routine.",
    date: new Date(2026, 2, 21),
    tags: ["reflection", "focus"],
    xpEarned: 10,
  },
  {
    id: "2",
    title: "Breakthrough on API Design",
    content: "Finally figured out the auth flow for the backend. Key insight: keep the token refresh logic server-side.",
    date: new Date(2026, 2, 20),
    tags: ["coding", "insight"],
    xpEarned: 25,
  },
  {
    id: "3",
    title: "Fitness Check-in",
    content: "Hit a new PR on deadlifts. Recovery is improving. Sleep score was 85 last night.",
    date: new Date(2026, 2, 19),
    tags: ["fitness", "health"],
    xpEarned: 10,
  },
  {
    id: "4",
    title: "Weekly Review",
    content: "Completed 5/7 daily quests this week. Epic quest at 30%. Need to allocate more time to reading.",
    date: new Date(2026, 2, 18),
    tags: ["review", "planning"],
    xpEarned: 50,
  },
];

const tagColors: Record<string, string> = {
  reflection: "bg-neon-cyan/10 text-neon-cyan",
  focus: "bg-neon-purple/10 text-neon-purple",
  coding: "bg-neon-amber/10 text-neon-amber",
  insight: "bg-neon-green/10 text-neon-green",
  fitness: "bg-neon-pink/10 text-neon-pink",
  health: "bg-neon-green/10 text-neon-green",
  review: "bg-neon-cyan/10 text-neon-cyan",
  planning: "bg-neon-amber/10 text-neon-amber",
};

export default function JournalPage() {
  return (
    <div>
      <PageHeader title="JOURNAL" subtitle="// VAULT ENTRIES">
        <button className="flex items-center gap-2 px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-sm font-display hover:bg-primary/20 transition-colors">
          <Plus size={14} />
          NEW ENTRY
        </button>
      </PageHeader>

      <div className="space-y-3">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded p-4 hover:border-primary/20 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-display text-sm font-semibold text-foreground">{entry.title}</h3>
              <span className="text-xs font-mono text-neon-green shrink-0">+{entry.xpEarned} XP</span>
            </div>
            <p className="text-sm font-body text-muted-foreground mb-3 line-clamp-2">{entry.content}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {entry.tags.map((tag) => (
                  <span key={tag} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tagColors[tag] || "bg-muted text-muted-foreground"}`}>
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                <Calendar size={10} />
                {entry.date.toLocaleDateString()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
