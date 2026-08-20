import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function getOrCreateConversation(userId: string): Promise<string> {
  // Get most recent conversation
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (data) return data.id;

  // Create new conversation
  const { data: newConv, error: createError } = await supabase
    .from("chat_conversations")
    .insert({ user_id: userId, title: "MAVIS Session" })
    .select("id")
    .single();

  if (createError) throw createError;
  return newConv!.id;
}

/**
 * How many past messages to load into the view.
 *
 * This query had no limit at all, so it returned every message a conversation
 * had ever accumulated — and MavisChat then sent that whole array to navi-chat
 * on every single request. Both the render cost and the prompt grew without
 * bound for the life of the thread.
 *
 * Newest-first with a limit, then reversed, so the cap keeps the RECENT
 * messages. Ordering ascending with a limit would have pinned the view to the
 * oldest ones instead.
 */
const HISTORY_LIMIT = 200;

export async function loadMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) throw error;
  return ((data ?? []) as ChatMessage[]).reverse();
}

/** How long a message write may take before we give up on it. */
const SAVE_TIMEOUT_MS = 10_000;

export async function saveMessage(
  conversationId: string,
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<string> {
  // Bounded: this used to be able to hang indefinitely on a stalled mobile
  // connection, and the caller awaited it before rendering anything.
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ conversation_id: conversationId, user_id: userId, role, content })
    .select("id")
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
    .single();

  if (error) throw error;

  // Bump the conversation's ordering timestamp. Deliberately not awaited: it
  // only affects which conversation sorts first in the list, and making the
  // caller wait on a second round-trip to persist one message is what made
  // sending feel stuck. A failure here is not worth surfacing.
  void supabase
    .from("chat_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
    .then(({ error: touchError }) => {
      if (touchError) console.warn("[chat] conversation timestamp not updated:", touchError.message);
    });

  return data!.id;
}
