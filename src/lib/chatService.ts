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

export async function loadMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function saveMessage(
  conversationId: string,
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<string> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ conversation_id: conversationId, user_id: userId, role, content })
    .select("id")
    .single();

  if (error) throw error;

  // Update conversation timestamp
  await supabase
    .from("chat_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data!.id;
}
