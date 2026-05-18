import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { TrendingUp, Plus, X, MessageSquare, Loader2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const RARITIES = ["COMMON", "RARE", "EPIC", "LEGENDARY"] as const;
type Rarity = typeof RARITIES[number];

const RARITY_COLORS: Record<Rarity, string> = {
  COMMON: "text-muted-foreground border-muted-foreground/30",
  RARE: "text-blue-400 border-blue-400/30",
  EPIC: "text-neon-purple border-neon-purple/30",
  LEGENDARY: "text-neon-amber border-neon-amber/30",
};

interface Listing {
  id: string;
  operator_id: string;
  display_name: string;
  created_at: string;
  metadata: {
    item_name: string;
    item_rarity: Rarity;
    asking_for: string;
    codex_ask: number;
    notes: string;
  };
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [form, setForm] = useState({ item_name: "", item_rarity: "COMMON" as Rarity, asking_for: "", codex_ask: 0, notes: "" });

  useEffect(() => { loadListings(); }, [user]);

  const loadListings = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("operator_feed")
      .select("id, operator_id, display_name, created_at, metadata")
      .eq("content_type", "TRADE_LISTING")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);
    const all = (data ?? []) as Listing[];
    setListings(all.filter(l => l.operator_id !== user.id));
    setMyListings(all.filter(l => l.operator_id === user.id));
    setLoading(false);
  };

  const postListing = async () => {
    if (!user || !form.item_name.trim() || !form.asking_for.trim()) return;
    setSubmitting(true);
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
    await supabase.from("operator_feed").insert({
      operator_id: user.id,
      display_name: (profile as any)?.display_name ?? "Operator",
      content_type: "TRADE_LISTING",
      content: `[TRADE] ${form.item_name} (${form.item_rarity})`,
      metadata: { item_name: form.item_name, item_rarity: form.item_rarity, asking_for: form.asking_for, codex_ask: form.codex_ask, notes: form.notes },
      is_public: true,
      likes: [],
    });
    toast({ title: "Listing posted!", description: "Your item is now visible in the marketplace." });
    setForm({ item_name: "", item_rarity: "COMMON", asking_for: "", codex_ask: 0, notes: "" });
    setShowForm(false);
    setSubmitting(false);
    loadListings();
  };

  const removeListing = async (id: string) => {
    await supabase.from("operator_feed").update({ is_public: false }).eq("id", id);
    setMyListings(prev => prev.filter(l => l.id !== id));
    toast({ title: "Listing removed" });
  };

  const contactSeller = async (listing: Listing) => {
    toast({ title: `Opening DM to ${listing.display_name}`, description: "Head to Inbox to send your offer." });
  };

  const ListingCard = ({ listing }: { listing: Listing }) => {
    const m = listing.metadata;
    const rarity = (m?.item_rarity ?? "COMMON") as Rarity;
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg border border-border bg-card">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-sm font-display font-bold text-foreground">{m?.item_name}</p>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${RARITY_COLORS[rarity]}`}>{rarity}</span>
          </div>
          {tab === "mine" && (
            <button onClick={() => removeListing(listing.id)} className="text-muted-foreground hover:text-destructive transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
          <p>WANTS: <span className="text-foreground">{m?.asking_for}</span></p>
          {m?.codex_ask > 0 && <p>OR: <span className="text-primary">{m.codex_ask} Codex Points</span></p>}
          {m?.notes && <p className="text-foreground/60 italic">{m.notes}</p>}
          <p className="pt-1">Listed by <span className="text-foreground">{listing.display_name}</span></p>
        </div>
        {tab === "browse" && (
          <button onClick={() => contactSeller(listing)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors">
            <MessageSquare size={10} />CONTACT SELLER
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div>
      <PageHeader title="MARKETPLACE" subtitle="// OPERATOR TRADING HUB" />

      <div className="flex gap-2 mb-4">
        {(["browse", "mine"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded text-[10px] font-mono transition-colors ${tab === t ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>
            {t === "browse" ? "BROWSE" : `MY LISTINGS (${myListings.length})`}
          </button>
        ))}
        <button onClick={() => setShowForm(v => !v)}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors">
          <Plus size={10} />POST LISTING
        </button>
      </div>

      {showForm && (
        <HudCard title="NEW LISTING" icon={<Package size={14} />}>
          <div className="space-y-2">
            <input value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))}
              placeholder="Item name..." className="w-full bg-muted border border-border rounded px-3 py-2 text-xs font-body text-foreground outline-none focus:border-primary/40" />
            <div className="flex gap-2">
              {RARITIES.map(r => (
                <button key={r} onClick={() => setForm(f => ({ ...f, item_rarity: r }))}
                  className={`px-2 py-1 rounded text-[9px] font-mono border transition-all ${form.item_rarity === r ? `${RARITY_COLORS[r]} bg-current/5` : "border-border text-muted-foreground"}`}>
                  {r}
                </button>
              ))}
            </div>
            <input value={form.asking_for} onChange={e => setForm(f => ({ ...f, asking_for: e.target.value }))}
              placeholder="What do you want in return?" className="w-full bg-muted border border-border rounded px-3 py-2 text-xs font-body text-foreground outline-none focus:border-primary/40" />
            <input type="number" value={form.codex_ask || ""} onChange={e => setForm(f => ({ ...f, codex_ask: Number(e.target.value) }))}
              placeholder="Codex Points ask (optional)..." className="w-full bg-muted border border-border rounded px-3 py-2 text-xs font-body text-foreground outline-none focus:border-primary/40" />
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Additional notes..." rows={2} className="w-full bg-muted border border-border rounded px-3 py-2 text-xs font-body text-foreground outline-none focus:border-primary/40 resize-none" />
            <div className="flex gap-2">
              <button onClick={postListing} disabled={submitting || !form.item_name.trim()}
                className="px-4 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors disabled:opacity-40">
                {submitting ? "POSTING..." : "POST"}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-1.5 rounded bg-muted border border-border text-muted-foreground text-[10px] font-mono">CANCEL</button>
            </div>
          </div>
        </HudCard>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={20} /></div>
      ) : (
        <div className="mt-4">
          {tab === "browse" && (
            listings.length === 0
              ? <p className="text-xs font-mono text-muted-foreground text-center py-12">No listings yet. Be the first to post one.</p>
              : <div className="grid sm:grid-cols-2 gap-3">{listings.map(l => <ListingCard key={l.id} listing={l} />)}</div>
          )}
          {tab === "mine" && (
            myListings.length === 0
              ? <p className="text-xs font-mono text-muted-foreground text-center py-12">No active listings. Post one above.</p>
              : <div className="grid sm:grid-cols-2 gap-3">{myListings.map(l => <ListingCard key={l.id} listing={l} />)}</div>
          )}
        </div>
      )}
    </div>
  );
}
