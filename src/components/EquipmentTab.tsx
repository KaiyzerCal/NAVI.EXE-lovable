import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, Edit2, Trash2, X, Save, Swords, Zap, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import HudCard from "@/components/HudCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SLOTS = ["head", "chest", "hands", "legs", "feet", "weapon", "offhand", "accessory"] as const;
const RARITIES = ["common", "rare", "epic", "legendary"] as const;

const RARITY_COLORS: Record<string, string> = {
  common: "text-muted-foreground",
  rare: "text-primary",
  epic: "text-secondary",
  legendary: "text-neon-amber",
};
const RARITY_BG: Record<string, string> = {
  common: "bg-muted/20",
  rare: "bg-primary/10",
  epic: "bg-secondary/10",
  legendary: "bg-neon-amber/10",
};

interface Equipment {
  id: string;
  name: string;
  description: string;
  slot: string;
  rarity: string;
  stat_bonuses: Record<string, number>;
  is_equipped: boolean;
  obtained_from: string;
}

interface Buff {
  id: string;
  name: string;
  description: string;
  effect_type: string;
  stat_affected: string;
  modifier_value: number;
  duration_hours: number | null;
  source: string;
  expires_at: string | null;
  created_at: string;
}

interface EquipForm {
  name: string;
  description: string;
  slot: string;
  rarity: string;
  statKeys: string[];
  statValues: number[];
}

const defaultEquipForm: EquipForm = { name: "", description: "", slot: "accessory", rarity: "common", statKeys: [""], statValues: [0] };

export default function EquipmentTab() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [buffs, setBuffs] = useState<Buff[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EquipForm>(defaultEquipForm);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("equipment" as any).select("*").eq("user_id", user.id).order("obtained_at", { ascending: false }),
      supabase.from("buffs" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]).then(([eqRes, buffRes]) => {
      setEquipment((eqRes.data || []) as unknown as Equipment[]);
      setBuffs((buffRes.data || []) as unknown as Buff[]);
    });
  }, [user]);

  const equipped = equipment.filter((e) => e.is_equipped);
  const inventory = equipment.filter((e) => !e.is_equipped);

  const equipItem = async (id: string) => {
    const item = equipment.find((e) => e.id === id);
    if (!item || !user) return;
    // Unequip current item in same slot
    const current = equipped.find((e) => e.slot === item.slot);
    if (current) {
      await supabase.from("equipment" as any).update({ is_equipped: false }).eq("id", current.id);
    }
    await supabase.from("equipment" as any).update({ is_equipped: true }).eq("id", id);
    setEquipment((prev) => prev.map((e) => {
      if (e.id === id) return { ...e, is_equipped: true };
      if (current && e.id === current.id) return { ...e, is_equipped: false };
      return e;
    }));
  };

  const unequipItem = async (id: string) => {
    await supabase.from("equipment" as any).update({ is_equipped: false }).eq("id", id);
    setEquipment((prev) => prev.map((e) => e.id === id ? { ...e, is_equipped: false } : e));
  };

  const openAddForm = () => {
    setForm(defaultEquipForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (item: Equipment) => {
    const keys = Object.keys(item.stat_bonuses);
    const vals = Object.values(item.stat_bonuses);
    setForm({
      name: item.name, description: item.description, slot: item.slot, rarity: item.rarity,
      statKeys: keys.length > 0 ? keys : [""], statValues: vals.length > 0 ? vals : [0],
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const saveEquipment = async () => {
    if (!form.name.trim() || !user) return;
    const bonuses: Record<string, number> = {};
    form.statKeys.forEach((k, i) => { if (k.trim()) bonuses[k.trim()] = form.statValues[i] || 0; });

    if (editingId) {
      await supabase.from("equipment" as any).update({
        name: form.name, description: form.description, slot: form.slot, rarity: form.rarity, stat_bonuses: bonuses,
      }).eq("id", editingId);
      setEquipment((prev) => prev.map((e) => e.id === editingId ? { ...e, name: form.name, description: form.description, slot: form.slot, rarity: form.rarity, stat_bonuses: bonuses } : e));
    } else {
      const { data } = await supabase.from("equipment" as any).insert({
        user_id: user.id, name: form.name, description: form.description, slot: form.slot, rarity: form.rarity, stat_bonuses: bonuses,
      }).select("*").single();
      if (data) setEquipment((prev) => [data as unknown as Equipment, ...prev]);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const deleteEquipment = async (id: string) => {
    await supabase.from("equipment" as any).delete().eq("id", id);
    setEquipment((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  };

  const removeBuff = async (id: string) => {
    await supabase.from("buffs" as any).delete().eq("id", id);
    setBuffs((prev) => prev.filter((b) => b.id !== id));
  };

  const addStatRow = () => {
    setForm((f) => ({ ...f, statKeys: [...f.statKeys, ""], statValues: [...f.statValues, 0] }));
  };

  const removeStatRow = (i: number) => {
    setForm((f) => ({
      ...f,
      statKeys: f.statKeys.filter((_, idx) => idx !== i),
      statValues: f.statValues.filter((_, idx) => idx !== i),
    }));
  };

  const getTimeRemaining = (expiresAt: string | null): string => {
    if (!expiresAt) return "Permanent";
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  // Filter out expired buffs
  const activeBuffs = buffs.filter((b) => !b.expires_at || new Date(b.expires_at).getTime() > Date.now());

  return (
    <div className="space-y-6">
      {/* Equipped Gear */}
      <HudCard title="EQUIPPED GEAR" icon={<Shield size={14} />} glow>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SLOTS.map((slot) => {
            const item = equipped.find((e) => e.slot === slot);
            return (
              <div key={slot} className={`border rounded p-2 ${item ? `${RARITY_BG[item.rarity]} border-border` : "border-dashed border-border/50 bg-muted/10"}`}>
                <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">{slot}</p>
                {item ? (
                  <>
                    <p className={`text-xs font-body font-semibold ${RARITY_COLORS[item.rarity]}`}>{item.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(item.stat_bonuses).map(([k, v]) => (
                        <span key={k} className="text-[9px] font-mono text-neon-green">+{v} {k}</span>
                      ))}
                    </div>
                    <button onClick={() => unequipItem(item.id)} className="text-[9px] font-mono text-muted-foreground hover:text-destructive mt-1">UNEQUIP</button>
                  </>
                ) : (
                  <p className="text-[10px] font-mono text-muted-foreground/50">Empty</p>
                )}
              </div>
            );
          })}
        </div>
      </HudCard>

      {/* Inventory */}
      <HudCard title="INVENTORY" icon={<Swords size={14} />}>
        <div className="flex justify-end mb-3">
          <button onClick={openAddForm} className="flex items-center gap-1 px-3 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors">
            <Plus size={12} /> ADD EQUIPMENT
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
              <div className="border border-border rounded p-3 space-y-2 bg-card">
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Item name..." className="h-8 text-xs" />
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description..." className="h-8 text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.slot} onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))}
                    className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground">
                    {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={form.rarity} onChange={(e) => setForm((f) => ({ ...f, rarity: e.target.value }))}
                    className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground">
                    {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground mb-1">STAT BONUSES</p>
                  {form.statKeys.map((k, i) => (
                    <div key={i} className="flex gap-1 mb-1">
                      <Input value={k} onChange={(e) => { const keys = [...form.statKeys]; keys[i] = e.target.value; setForm((f) => ({ ...f, statKeys: keys })); }}
                        placeholder="Stat name" className="h-7 text-xs flex-1" />
                      <Input type="number" value={form.statValues[i]} onChange={(e) => { const vals = [...form.statValues]; vals[i] = parseInt(e.target.value) || 0; setForm((f) => ({ ...f, statValues: vals })); }}
                        className="h-7 text-xs w-16" />
                      {form.statKeys.length > 1 && (
                        <button onClick={() => removeStatRow(i)} className="text-muted-foreground hover:text-destructive"><X size={12} /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={addStatRow} className="text-[10px] font-mono text-primary hover:underline">+ ADD STAT</button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEquipment} disabled={!form.name.trim()} className="text-xs font-mono"><Save size={10} className="mr-1" /> {editingId ? "UPDATE" : "CREATE"}</Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} className="text-xs font-mono"><X size={10} className="mr-1" /> CANCEL</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {inventory.length === 0 && !showForm ? (
          <p className="text-xs font-mono text-muted-foreground text-center py-6">No items in inventory.</p>
        ) : (
          <div className="space-y-2">
            {inventory.map((item) => (
              <div key={item.id} className={`border rounded p-2 ${RARITY_BG[item.rarity]} border-border`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-body font-semibold ${RARITY_COLORS[item.rarity]}`}>{item.name}</span>
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">{item.slot}</span>
                    <span className={`text-[9px] font-mono uppercase ${RARITY_COLORS[item.rarity]}`}>{item.rarity}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => equipItem(item.id)} className="text-[10px] font-mono text-primary hover:underline">EQUIP</button>
                    <button onClick={() => openEditForm(item)} className="text-muted-foreground hover:text-primary"><Edit2 size={11} /></button>
                    {deleting === item.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deleteEquipment(item.id)} className="text-[9px] font-mono text-destructive">YES</button>
                        <button onClick={() => setDeleting(null)} className="text-[9px] font-mono text-muted-foreground">NO</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleting(item.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
                    )}
                  </div>
                </div>
                {item.description && <p className="text-[10px] font-mono text-muted-foreground">{item.description}</p>}
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(item.stat_bonuses).map(([k, v]) => (
                    <span key={k} className="text-[9px] font-mono text-neon-green">+{v} {k}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </HudCard>

      {/* Active Effects */}
      <HudCard title="ACTIVE EFFECTS" icon={<Zap size={14} />}>
        {activeBuffs.length === 0 ? (
          <p className="text-xs font-mono text-muted-foreground text-center py-4">No active effects.</p>
        ) : (
          <div className="space-y-2">
            {activeBuffs.map((buff) => (
              <div key={buff.id} className={`border rounded p-2 ${buff.effect_type === "buff" ? "border-neon-green/30 bg-neon-green/5" : "border-destructive/30 bg-destructive/5"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {buff.effect_type === "debuff" ? <AlertTriangle size={11} className="text-destructive" /> : <Zap size={11} className="text-neon-green" />}
                    <span className={`text-xs font-body font-semibold ${buff.effect_type === "buff" ? "text-neon-green" : "text-destructive"}`}>{buff.name}</span>
                    <span className={`text-[9px] font-mono uppercase ${buff.effect_type === "buff" ? "text-neon-green" : "text-destructive"}`}>{buff.effect_type}</span>
                  </div>
                  <button onClick={() => removeBuff(buff.id)} className="text-[10px] font-mono text-muted-foreground hover:text-destructive">REMOVE</button>
                </div>
                <div className="flex gap-3 mt-1 text-[10px] font-mono text-muted-foreground">
                  <span>{buff.stat_affected} {buff.modifier_value > 0 ? "+" : ""}{buff.modifier_value}</span>
                  <span>Source: {buff.source}</span>
                  <span>{getTimeRemaining(buff.expires_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </HudCard>
    </div>
  );
}
