// Re-export from context so the hook is consumed from a single shared provider.
// Both AppSidebar and InboxPage call useUnreadMessages(); without the shared
// context, Supabase's channel() dedup returns the same already-subscribed
// channel to the second caller, which throws on the subsequent .on() calls.
export { useUnreadMessages } from "@/contexts/UnreadMessagesContext";
