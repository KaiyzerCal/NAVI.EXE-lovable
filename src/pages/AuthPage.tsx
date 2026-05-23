import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2, ArrowLeft, Mail } from "lucide-react";

type AuthMode = "login" | "register" | "reset";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && !tosAccepted) {
      toast({ title: "Please accept the Terms of Service to continue.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Account created",
          description: "Check your email to verify your account before signing in.",
        });
      }
    } catch (err: any) {
      toast({ title: "Auth Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <Bot size={32} className="text-primary" />
          </div>
          <h1 className="font-display text-2xl text-primary tracking-wider text-glow-cyan">NAVI.EXE</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">// OPERATOR AUTHENTICATION</p>
        </div>

        <div className="bg-card border border-border rounded p-6 border-glow">

          <AnimatePresence mode="wait">
            {/* ── Password Reset ── */}
            {mode === "reset" && (
              <motion.div key="reset" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button onClick={() => { setMode("login"); setResetSent(false); }}
                  className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground mb-4 transition-colors">
                  <ArrowLeft size={12} /> BACK TO LOGIN
                </button>
                <p className="text-sm font-display font-bold text-foreground mb-1">RESET PASSWORD</p>
                <p className="text-[10px] font-mono text-muted-foreground mb-4">Enter your email to receive a reset link.</p>
                {resetSent ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Mail size={28} className="text-primary" />
                    <p className="text-sm font-body text-foreground text-center">Reset link sent — check your inbox.</p>
                    <button onClick={() => { setMode("login"); setResetSent(false); }}
                      className="text-xs font-mono text-primary hover:underline">Back to login</button>
                  </div>
                ) : (
                  <form onSubmit={handleReset} className="space-y-4">
                    <div>
                      <label className="text-xs font-mono text-muted-foreground block mb-1">EMAIL</label>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="operator@email.com"
                        className="w-full bg-muted/50 border border-border rounded px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors" />
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full py-2.5 rounded bg-primary/10 border border-primary/30 text-primary font-display text-sm tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading && <Loader2 size={14} className="animate-spin" />}
                      SEND RESET LINK
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* ── Login / Register ── */}
            {mode !== "reset" && (
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Tabs */}
                <div className="flex mb-6">
                  {(["login", "register"] as const).map((tab, i) => (
                    <button key={tab} onClick={() => setMode(tab)}
                      className={`flex-1 py-2 text-xs font-display tracking-wider border-b-2 transition-colors ${
                        mode === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}>
                      {tab === "login" ? "LOGIN" : "REGISTER"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "register" && (
                    <div>
                      <label className="text-xs font-mono text-muted-foreground block mb-1">CALLSIGN</label>
                      <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                        placeholder="Operator name"
                        className="w-full bg-muted/50 border border-border rounded px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors" />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-mono text-muted-foreground block mb-1">EMAIL</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="operator@email.com"
                      className="w-full bg-muted/50 border border-border rounded px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground block mb-1">PASSWORD</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" minLength={6}
                      className="w-full bg-muted/50 border border-border rounded px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors" />
                  </div>

                  {mode === "login" && (
                    <div className="text-right">
                      <button type="button" onClick={() => setMode("reset")}
                        className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {mode === "register" && (
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={tosAccepted} onChange={e => setTosAccepted(e.target.checked)}
                        className="mt-0.5 accent-primary shrink-0" />
                      <span className="text-[10px] font-mono text-muted-foreground leading-relaxed">
                        I agree to the{" "}
                        <Link to="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link>
                        {" "}and{" "}
                        <Link to="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>
                      </span>
                    </label>
                  )}

                  <button type="submit" disabled={loading || (mode === "register" && !tosAccepted)}
                    className="w-full py-2.5 rounded bg-primary/10 border border-primary/30 text-primary font-display text-sm tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    {mode === "login" ? "AUTHENTICATE" : "INITIALIZE"}
                  </button>
                </form>

                <p className="text-center text-[10px] font-mono text-muted-foreground mt-4">
                  {mode === "login" ? (
                    <>No account? <button onClick={() => setMode("register")} className="text-primary hover:underline">Register</button></>
                  ) : (
                    <>Already an operator? <button onClick={() => setMode("login")} className="text-primary hover:underline">Login</button></>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[9px] font-mono text-muted-foreground/50 mt-4">
          <Link to="/privacy" className="hover:text-muted-foreground">Privacy Policy</Link>
          {" · "}
          <Link to="/terms" className="hover:text-muted-foreground">Terms of Service</Link>
        </p>
      </motion.div>
    </div>
  );
}
