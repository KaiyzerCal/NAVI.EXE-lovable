import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Comma-separated UUID list set at build time — gives instant admin access
// without a network round-trip.
const ENV_ADMIN_IDS = new Set(
  (import.meta.env.VITE_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id: string) => id.trim())
    .filter(Boolean)
);

export function useOwner() {
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!user) { setIsOwner(false); return; }

    // Env var check is instant — no network round-trip needed.
    if (ENV_ADMIN_IDS.has(user.id)) {
      setIsOwner(true);
      return;
    }

    // Fall back to DB role check (handles admins added after build time).
    supabase.rpc("is_admin", { _user_id: user.id }).then(({ data }) => {
      setIsOwner(!!data);
    });
  }, [user]);

  return isOwner;
}
