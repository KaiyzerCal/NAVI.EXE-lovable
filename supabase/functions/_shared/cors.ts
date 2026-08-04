// Centralized CORS handling.
//
// Set the ALLOWED_ORIGINS secret to a comma-separated list of the exact origins
// that should be allowed to call these functions, e.g.:
//   https://navi.yourdomain.com,https://app.yourdomain.com,http://localhost:5173
//
// If ALLOWED_ORIGINS is unset we fall back to "*" so that local/dev setups keep
// working, but you should ALWAYS set it in production. When a concrete allowlist
// is configured, the response echoes back only the caller's origin when it is on
// the list, and otherwise sends the first allowed origin (which effectively
// blocks credentialed cross-origin calls from unknown sites).

const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const BASE_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

/** Build CORS headers appropriate for the requesting origin. */
export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";

  // No allowlist configured -> permissive (dev only).
  if (ALLOWED.length === 0) {
    return { ...BASE_HEADERS, "Access-Control-Allow-Origin": "*" };
  }

  // Allowlist configured -> only echo a matching origin.
  const allowOrigin = ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return {
    ...BASE_HEADERS,
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
  };
}

/** Returns a 204 preflight response, or null if this isn't an OPTIONS request. */
export function handlePreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeadersFor(req) });
  }
  return null;
}
