import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FEEDBACK_TYPES = ["BUG", "SUGGESTION", "OTHER"] as const;

export default function FeedbackWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"BUG" | "SUGGESTION" | "OTHER">("BUG");
  const [desc, setDesc] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user) return null;

  async function submit() {
    if (!desc.trim()) return;
    setSending(true);
    await supabase.from("beta_feedback").insert({
      user_id: user!.id,
      feedback_type: type,
      description: desc.trim(),
    });
    setSending(false);
    setSent(true);
    setTimeout(() => { setOpen(false); setSent(false); setDesc(""); setType("BUG"); }, 1800);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-primary/20 border border-primary/40 text-primary flex items-center justify-center hover:bg-primary/30 transition-all"
        style={{ boxShadow: "0 0 16px rgba(56,189,248,0.15)" }}
        title="Send feedback"
      >
        <MessageSquarePlus size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <motion.div
              className="relative w-full max-w-sm bg-card border border-border rounded-lg p-5 z-10"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-bold text-primary tracking-wider">SEND FEEDBACK</h3>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>

              {sent ? (
                <div className="text-center py-4">
                  <p className="text-neon-green font-mono text-sm">// FEEDBACK RECEIVED</p>
                  <p className="text-xs text-muted-foreground mt-1">Thank you, Operator.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-3">
                    {FEEDBACK_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`px-3 py-1 rounded text-[10px] font-mono border transition-colors ${type === t ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Describe the bug or suggestion..."
                    rows={4}
                    className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 resize-none mb-3"
                  />
                  <button
                    onClick={submit}
                    disabled={sending || !desc.trim()}
                    className="w-full py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    SUBMIT FEEDBACK
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
