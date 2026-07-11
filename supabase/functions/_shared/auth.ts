import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export interface AuthedUser {
  id: string;
  email: string | null;
}

/**
 * Extracts and verifies the Supabase JWT from the request's Authorization
 * header. Returns the authenticated user, or null if the token is missing or
 * invalid. NEVER trust a user id supplied in the request body — always derive
 * it from here.
 */
export async function getAuthedUser(req: Request): Promise<AuthedUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/** A service-role client for privileged reads/writes inside a function. */
export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * Verifies the caller is authenticated AND holds the 'owner' role in
 * public.user_roles. Returns the user on success, or null otherwise.
 */
export async function requireOwner(req: Request): Promise<AuthedUser | null> {
  const user = await getAuthedUser(req);
  if (!user) return null;

  const admin = serviceClient();
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (error || !data) return null;
  return user;
}
