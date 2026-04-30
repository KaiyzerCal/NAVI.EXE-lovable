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

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("operator_notifications").select("*").eq("operator_id", user.id).order("created_at", { ascending: false }).limit(100);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user?.id]);

  return <div>
    <PageHeader title="NOTIFICATIONS" subtitle="// EVENT INBOX" />
    <HudCard title="INBOX" icon={<Bell size={14} />} glow>
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
