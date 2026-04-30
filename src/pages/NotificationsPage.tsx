import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from("operator_notifications").select("*").eq("operator_id", user.id).order("created_at", { ascending: false }).limit(100);
    if (error) setError(error.message);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    if (!user) return;
    const channel = supabase.channel(`notifications-live-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "operator_notifications", filter: `operator_id=eq.${user.id}` }, (payload) => {
        setItems((prev) => [payload.new, ...prev]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("operator_notifications").update({ read_at: new Date().toISOString() }).eq("operator_id", user.id).is("read_at", null);
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  };

  return <div>
    <PageHeader title="NOTIFICATIONS" subtitle="// EVENT INBOX" />
    <HudCard title="INBOX" icon={<Bell size={14} />} glow>
      <div className="mb-3">
        <button onClick={markAllRead} className="text-[10px] font-mono border border-primary/30 text-primary rounded px-2 py-1">MARK ALL READ</button>
      </div>
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      {loading ? <Loader2 className="animate-spin text-primary" /> : (
        <div className="space-y-2">
          {items.map((n) => <div key={n.id} className="p-3 rounded border border-border bg-card/50">
            <p className="text-sm font-body">{n.title}</p>
            <p className="text-xs text-muted-foreground">{n.body}</p>
          </div>)}
        </div>
      )}
    </HudCard>
  </div>;
}
