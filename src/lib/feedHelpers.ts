// ============================================================
// FEED HELPERS — callable from any hook or component
// ============================================================
import { supabase } from "@/integrations/supabase/client";

export interface AutoPostParams {
  userId: string;
  display_name: string | null;
  navi_name: string | null;
  character_class: string | null;
  mbti_type: string | null;
  operator_level: number;
  content_type: string;
  content: string;
  metadata?: Record<string, any>;
}

export async function postToFeed(p: AutoPostParams): Promise<void> {
  try {
    await (supabase as any).from("operator_feed").insert({
      operator_id: p.userId,
      display_name: p.display_name,
      navi_name: p.navi_name,
      character_class: p.character_class,
      mbti_type: p.mbti_type,
      operator_level: p.operator_level,
      content_type: p.content_type,
      content: p.content,
      metadata: p.metadata ?? {},
      is_public: true,
      likes: [],
    });
  } catch (err) {
    console.error("[feedHelpers] postToFeed error:", err);
  }
}

// Relative time formatter
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Initials avatar fallback
export function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
