import { useState } from "react";
import { Shield, Plus, Search, Users, X, Crown, LogOut, Trash2 } from "lucide-react";
import { useGuild, type CreateGuildInput } from "@/hooks/useGuild";
import HudCard from "@/components/HudCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import OperatorProfileSheet from "@/components/OperatorProfileSheet";

const COLOR_SWATCHES = [
  { color: "#6366f1", label: "Purple" },
  { color: "#06b6d4", label: "Cyan" },
  { color: "#10b981", label: "Green" },
  { color: "#f59e0b", label: "Amber" },
  { color: "#ef4444", label: "Red" },
];

interface GuildPanelProps {
  guildId: string | null | undefined;
  onGuildChange: () => void;
}

export default function GuildPanel({ guildId, onGuildChange }: GuildPanelProps) {
  const { guild, members, loading, myRole, createGuild, joinGuild, leaveGuild, updateGuild, disbandGuild, searchGuilds, searchResults, searching } = useGuild(guildId);
  const [mode, setMode] = useState<"idle" | "create" | "search" | "edit">("idle");
  const [form, setForm] = useState<CreateGuildInput>({ name: "", tag: "", description: "", banner_color: "#6366f1" });
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [sheetMemberId, setSheetMemberId] = useState<string | null>(null);

  if (loading) return <HudCard title="GUILD" icon={<Shield size={14} />} glow><Loader2 className="animate-spin text-primary" size={18} /></HudCard>;

  const handleCreate = async () => {
    if (!form.name.trim() || !form.tag.trim()) return;
    setActionLoading(true);
    const id = await createGuild(form);
    setActionLoading(false);
    if (id) { setMode("idle"); setForm({ name: "", tag: "", description: "", banner_color: "#6366f1" }); onGuildChange(); }
  };

  const handleJoin = async (targetId: string) => {
    setActionLoading(true);
    const ok = await joinGuild(targetId);
    setActionLoading(false);
    if (ok) { setMode("idle"); onGuildChange(); }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    await leaveGuild();
    setActionLoading(false);
    onGuildChange();
  };

  const handleDisband = async () => {
    setActionLoading(true);
    await disbandGuild();
    setActionLoading(false);
    onGuildChange();
  };

  const handleUpdate = async () => {
    setActionLoading(true);
    await updateGuild(form);
    setActionLoading(false);
    setMode("idle");
  };

  const guildForm = (
    <div className="space-y-2 mt-2">
      <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Guild name..." maxLength={30}
        className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-body text-foreground outline-none focus:border-primary/40" />
      <input type="text" value={form.tag} onChange={(e) => setForm(f => ({ ...f, tag: e.target.value.toUpperCase().slice(0, 5) }))} placeholder="TAG (3-5 chars)..." maxLength={5}
        className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-body text-foreground outline-none focus:border-primary/40" />
      <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)..." rows={2}
        className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-body text-foreground outline-none focus:border-primary/40 resize-none" />
      <div>
        <p className="text-[10px] font-mono text-muted-foreground mb-1">BANNER COLOR</p>
        <div className="flex gap-2">
          {COLOR_SWATCHES.map(s => (
            <button key={s.color} onClick={() => setForm(f => ({ ...f, banner_color: s.color }))}
              className={`w-7 h-7 rounded-full border-2 transition-all ${form.banner_color === s.color ? "border-foreground scale-110" : "border-transparent"}`}
              style={{ backgroundColor: s.color }} title={s.label} />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={mode === "edit" ? handleUpdate : handleCreate} disabled={actionLoading || !form.name.trim() || !form.tag.trim()}
          className="text-[10px] font-mono">
          {actionLoading ? <Loader2 className="animate-spin" size={12} /> : mode === "edit" ? "SAVE" : "FOUND GUILD"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setMode("idle")} className="text-[10px] font-mono">CANCEL</Button>
      </div>
    </div>
  );

  // STATE A — No guild
  if (!guild) {
    return (
      <HudCard title="GUILD" icon={<Shield size={14} />} glow>
        {mode === "idle" && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-muted-foreground">No guild. Create or join one.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setMode("create")} className="text-[10px] font-mono">
                <Plus size={10} className="mr-1" /> CREATE GUILD
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMode("search")} className="text-[10px] font-mono">
                <Search size={10} className="mr-1" /> JOIN GUILD
              </Button>
            </div>
          </div>
        )}
        {mode === "create" && guildForm}
        {mode === "search" && (
          <div className="space-y-2 mt-2">
            <div className="flex gap-2">
              <input type="text" value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); searchGuilds(e.target.value); }}
                placeholder="Search by name or tag..."
                className="flex-1 bg-muted border border-border rounded px-3 py-1.5 text-xs font-body text-foreground outline-none focus:border-primary/40" />
              <Button variant="ghost" size="sm" onClick={() => setMode("idle")}><X size={12} /></Button>
            </div>
            {searching && <Loader2 className="animate-spin text-primary" size={14} />}
            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="text-[10px] font-mono text-muted-foreground">No guilds found.</p>
            )}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {searchResults.map(g => (
                <div key={g.id} className="flex items-center justify-between bg-muted/30 border border-border rounded px-3 py-2">
                  <div>
                    <p className="text-xs font-body font-semibold">{g.name} <span className="text-[10px] font-mono text-primary">[{g.tag}]</span></p>
                    <p className="text-[10px] font-mono text-muted-foreground"><Users size={9} className="inline mr-0.5" />{g.member_count} members</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleJoin(g.id)} disabled={actionLoading} className="text-[10px] font-mono">JOIN</Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </HudCard>
    );
  }

  // STATE B — Has guild
  return (
    <>
      <HudCard title="GUILD" icon={<Shield size={14} />} glow>
        {mode === "edit" ? guildForm : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: guild.banner_color }} />
              <h3 className="text-sm font-display font-bold text-foreground">{guild.name}</h3>
              <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">[{guild.tag}]</span>
            </div>
            {guild.description && <p className="text-[10px] font-body text-muted-foreground">{guild.description}</p>}
            <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
              <span><Users size={10} className="inline mr-0.5" />{members.length} members</span>
              <span className="flex items-center gap-0.5">
                {myRole === "leader" && <Crown size={10} className="text-accent" />}
                {(myRole || "member").toUpperCase()}
              </span>
            </div>

            {/* Members list — clickable */}
            {members.length > 0 && (
              <div className="space-y-1 pt-1">
                {members.slice(0, 5).map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => setSheetMemberId(m.user_id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all text-left group"
                  >
                    {m.role === "leader" && <Crown size={9} className="text-accent shrink-0" />}
                    <span className="text-[10px] font-mono text-foreground truncate flex-1">
                      {(m as any).display_name || (m as any).user_id?.slice(0, 8) || "Member"}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground/50 opacity-0 group-hover:opacity-100">
                      VIEW
                    </span>
                  </button>
                ))}
                {members.length > 5 && (
                  <p className="text-[9px] font-mono text-muted-foreground pl-2">+{members.length - 5} more</p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {myRole === "leader" && (
                <>
                  <Button variant="outline" size="sm" onClick={() => { setForm({ name: guild.name, tag: guild.tag, description: guild.description, banner_color: guild.banner_color }); setMode("edit"); }} className="text-[10px] font-mono">
                    EDIT
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDisband} disabled={actionLoading} className="text-[10px] font-mono">
                    <Trash2 size={10} className="mr-1" /> DISBAND
                  </Button>
                </>
              )}
              {myRole !== "leader" && (
                <Button variant="outline" size="sm" onClick={handleLeave} disabled={actionLoading} className="text-[10px] font-mono">
                  <LogOut size={10} className="mr-1" /> LEAVE
                </Button>
              )}
            </div>
          </div>
        )}
      </HudCard>

      {sheetMemberId && (
        <OperatorProfileSheet
          operatorId={sheetMemberId}
          isOpen={!!sheetMemberId}
          onClose={() => setSheetMemberId(null)}
        />
      )}
    </>
  );
}
