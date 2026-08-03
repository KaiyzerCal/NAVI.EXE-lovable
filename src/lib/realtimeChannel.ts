import { supabase } from "@/integrations/supabase/client";

// supabase.channel(name) returns the *existing* channel object if one with
// that name is already registered client-side — even mid-teardown, since
// removeChannel() unsubscribes asynchronously over the websocket. If an
// effect with a deterministic channel name re-runs before the previous
// channel finishes closing (common right after login: onAuthStateChange
// often fires more than once — INITIAL_SESSION then SIGNED_IN — handing
// useAuth() a new user object each time), the new .on() call lands on an
// already-subscribed channel and throws "cannot add postgres_changes
// callbacks... after subscribe()". This app has no error boundary, so that
// uncaught error blanks the whole page.
//
// Call this before supabase.channel(name) to guarantee a clean slate.
export function removeStaleChannel(name: string) {
  const existing = supabase.getChannels().find((c) => c.topic === `realtime:${name}`);
  if (existing) supabase.removeChannel(existing);
}
