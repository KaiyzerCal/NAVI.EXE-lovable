// Search anything in the app, for every surface that talks to the operator.
//
// Ported from mythos-vantara's _shared/appSearch.ts, which solved the same
// problem there: NAVI could only ever see the 5 most recent journal entries
// (out of however many exist) and had no way to reach anything else — no
// quests, no skills, no past conversations, nothing. The core two-phase
// keyword-search algorithm below is unchanged from that implementation; only
// the table registry is NAVI's own.
//
// One real difference from Vantara: NAVI's chat completion is single-shot.
// navi-chat's NAVI_TOOLS array looks like live function-calling, but it is
// only ever invoked AFTER the reply has already been generated (action
// extraction, in the stream's flush step) — a tool call made there can never
// inform the answer being given, the same constraint Vantara's
// mavis-persona-router has for exactly the same reason. So every table here
// is `auto: true` and gets searched on every message automatically; there is
// no on-demand fallback the way Vantara's non-auto scopes have, because
// nothing in this app's request lifecycle could ever call one mid-reply.
//
// The registry's column names are read out of the generated Supabase types,
// not guessed — a wrong name is a silent empty result, not an error.

import {
  buildTsQuery,
  buildTsQueryAll,
  extractTerms,
  rankEntries,
  termOccurs,
} from "./entrySearch.ts";

export interface SearchableTable {
  /** Scope name, and the label shown on a hit. */
  key: string;
  table: string;
  /** The name-ish column. Every table here has one. */
  titleCol: string;
  /** The prose column, when the table has one distinct from the title. */
  bodyCol?: string;
  /** Extra columns worth returning for context. Verified to exist. */
  extraCols?: string[];
  /** Not universal — equipment has no created_at. */
  hasCreatedAt?: boolean;
  /** Always true here — see the file header for why. */
  auto?: boolean;
}

export const SEARCHABLE: SearchableTable[] = [
  { key: "journal",       table: "journal_entries", titleCol: "title",       bodyCol: "content",     extraCols: ["category", "importance"], hasCreatedAt: true, auto: true },
  { key: "quests",        table: "quests",          titleCol: "name",        bodyCol: "description", extraCols: ["type"],                   hasCreatedAt: true, auto: true },
  { key: "skills",        table: "skills",          titleCol: "name",        bodyCol: "description", extraCols: ["category"],               hasCreatedAt: true, auto: true },
  { key: "subskills",     table: "subskills",       titleCol: "name",        bodyCol: "description",                                         hasCreatedAt: true, auto: true },
  { key: "tasks",         table: "agent_tasks",     titleCol: "title",       bodyCol: "description", extraCols: ["status"],                  hasCreatedAt: true, auto: true },
  { key: "achievements",  table: "achievements",    titleCol: "name",        bodyCol: "description", extraCols: ["category"],               hasCreatedAt: true, auto: true },
  { key: "activity",      table: "activity_log",    titleCol: "event_type",  bodyCol: "description",                                         hasCreatedAt: true, auto: true },
  { key: "buffs",         table: "buffs",           titleCol: "name",        bodyCol: "description",                                         hasCreatedAt: true, auto: true },
  { key: "equipment",     table: "equipment",       titleCol: "name",        bodyCol: "description", extraCols: ["slot"] },
  { key: "media",         table: "media",           titleCol: "file_name",   bodyCol: "ai_description",                                      hasCreatedAt: true, auto: true },
  { key: "notifications", table: "notifications",   titleCol: "title",       bodyCol: "body",        extraCols: ["type"],                    hasCreatedAt: true, auto: true },
  { key: "feedback",      table: "beta_feedback",   titleCol: "feedback_type", bodyCol: "description",                                       hasCreatedAt: true, auto: true },
  { key: "conversations", table: "chat_conversations", titleCol: "title",                                                                     hasCreatedAt: true, auto: true },

  // Titleless — content itself is what a hit is called, same pattern as
  // Vantara's memory/mavis_council_memory branches.
  { key: "posts",         table: "social_posts",    titleCol: "content",                                                                     hasCreatedAt: true, auto: true },

  // Conversation history — by row count almost certainly the largest thing
  // here, same reasoning as Vantara's "memory" scope: real, and reachable by
  // nothing else. titleCol is "role" — the table has no name column, so a
  // hit reads "[user]"/"[assistant]" the way memory hits do there.
  { key: "chat",          table: "chat_messages",   titleCol: "role",        bodyCol: "content",                                              hasCreatedAt: true, auto: true },
];

export const SEARCHABLE_KEYS = SEARCHABLE.map((t) => t.key);

/** Columns to request. Only ever names verified to exist on that table. */
export function selectFor(t: SearchableTable): string {
  const cols = ["id", t.titleCol];
  if (t.bodyCol) cols.push(t.bodyCol);
  if (t.extraCols) cols.push(...t.extraCols);
  if (t.hasCreatedAt) cols.push("created_at");
  return [...new Set(cols)].join(",");
}

/**
 * Which tables a scope refers to.
 *
 * An unrecognised scope resolves to every table rather than to nothing: a
 * caller inventing a scope name should get a slightly-too-broad answer, not
 * a confident "you have nothing about that". With only 15 tables here, "too
 * broad" costs a handful of extra queries, not the fan-out it would at
 * Vantara's scale.
 */
export function resolveScope(scope?: string | null): SearchableTable[] {
  const raw = String(scope ?? "").trim().toLowerCase();
  if (!raw || raw === "auto" || raw === "default" || raw === "all" || raw === "everything" || raw === "*") {
    return SEARCHABLE;
  }
  const wanted = raw.split(/[,\s]+/).filter(Boolean);
  const picked = SEARCHABLE.filter((t) => wanted.includes(t.key) || wanted.includes(t.table));
  return picked.length > 0 ? picked : SEARCHABLE;
}

export interface AppSearchHit {
  kind: string;
  id: string;
  title: string;
  excerpt: string;
  category?: string;
  created_at?: string;
}

/**
 * The supabase client, as much of it as this needs. Typed loosely on
 * purpose — see the identical note in Vantara's appSearch.ts for why a
 * hand-written interface for PostgREST's builder chain does not survive
 * contact with the real client (TS2589).
 */
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryClient = { from(table: string): any };

/** Columns worth having before a row is known to be worth fetching. */
function selectForCandidates(t: SearchableTable): string {
  const cols = ["id", t.titleCol];
  if (t.extraCols?.length) cols.push(t.extraCols[0]);
  if (t.hasCreatedAt) cols.push("created_at");
  return [...new Set(cols)].join(",");
}

interface Candidate {
  t: SearchableTable;
  id: string;
  title: string;
  category?: string;
  created_at?: string;
  titleHits: number;
  bodyHit: boolean;
  allHit: boolean;
}

const SCORE_TITLE_TERM = 3;
const SCORE_ALL_TERMS = 5;
const SCORE_BODY = 1;

function scoreCandidate(c: Candidate): number {
  return c.titleHits * SCORE_TITLE_TERM +
    (c.allHit ? SCORE_ALL_TERMS : 0) +
    (c.bodyHit ? SCORE_BODY : 0);
}

/**
 * Full-text search across the operator's own rows. Same two-phase design as
 * Vantara's version: phase 1 asks which rows match on id/title/date only
 * (cheap), phase 2 fetches full rows for the handful that survived ranking.
 * A failure on one table never fails the search.
 */
export async function searchAppData(
  sb: QueryClient,
  userId: string,
  query: string,
  opts: { scope?: string | null; limit?: number; candidateCap?: number } = {},
): Promise<AppSearchHit[]> {
  const terms = extractTerms(query);
  const orQuery = buildTsQuery(query);
  if (!orQuery) return [];
  const andQuery = buildTsQueryAll(query);

  const tables = resolveScope(opts.scope);
  const limit = opts.limit ?? 8;
  const candidateCap = opts.candidateCap ?? 200;

  type Probe = { t: SearchableTable; kind: "title" | "body" | "all"; rows: Record<string, unknown>[] };

  const probes: Promise<Probe>[] = [];
  for (const t of tables) {
    const cols = selectForCandidates(t);
    const run = (kind: "title" | "body" | "all", col: string, q: string) => {
      let builder = sb.from(t.table).select(cols).eq("user_id", userId)
        .textSearch(col, q, { type: "websearch" });
      if (t.hasCreatedAt) builder = builder.order("created_at", { ascending: false });
      probes.push(
        Promise.resolve(builder.limit(candidateCap))
          .then((r: { data?: unknown[] }) => ({
            t, kind, rows: (r.data ?? []) as Record<string, unknown>[],
          }))
          .catch(() => ({ t, kind, rows: [] as Record<string, unknown>[] })),
      );
    };
    run("title", t.titleCol, orQuery);
    if (t.bodyCol) {
      run("body", t.bodyCol, orQuery);
      if (terms.length > 1) run("all", t.bodyCol, andQuery);
    }
  }

  const settled = await Promise.all(probes);

  const byKey = new Map<string, Candidate>();
  for (const { t, kind, rows } of settled) {
    for (const row of rows) {
      const key = `${t.key}:${String(row.id ?? "")}`;
      let c = byKey.get(key);
      if (!c) {
        const title = String(row[t.titleCol] ?? "") || "(untitled)";
        c = {
          t,
          id: String(row.id ?? ""),
          title,
          category: t.extraCols?.length ? String(row[t.extraCols[0]] ?? "") || undefined : undefined,
          created_at: t.hasCreatedAt ? String(row.created_at ?? "") || undefined : undefined,
          titleHits: terms.filter((term) => termOccurs(term, title.toLowerCase())).length,
          bodyHit: false,
          allHit: false,
        };
        byKey.set(key, c);
      }
      if (kind === "body") c.bodyHit = true;
      if (kind === "all") c.allHit = true;
    }
  }

  const shortlist = [...byKey.values()]
    .sort((a, b) => {
      const d = scoreCandidate(b) - scoreCandidate(a);
      if (d !== 0) return d;
      return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
    })
    .slice(0, Math.max(0, limit));

  if (shortlist.length === 0) return [];

  const wanted = new Map<string, { t: SearchableTable; ids: string[] }>();
  for (const c of shortlist) {
    const e = wanted.get(c.t.key) ?? { t: c.t, ids: [] };
    e.ids.push(c.id);
    wanted.set(c.t.key, e);
  }

  const fetched = await Promise.all(
    [...wanted.values()].map(({ t, ids }) =>
      Promise.resolve(sb.from(t.table).select(selectFor(t)).eq("user_id", userId).in("id", ids))
        .then((r: { data?: unknown[] }) => ({ t, rows: (r.data ?? []) as Record<string, unknown>[] }))
        .catch(() => ({ t, rows: [] as Record<string, unknown>[] })),
    ),
  );

  const full = fetched.flatMap(({ t, rows }) =>
    rows.map((row) => ({
      id: `${t.key}:${String(row.id ?? "")}`,
      kind: t.key,
      title: String(row[t.titleCol] ?? "") || "(untitled)",
      content: t.bodyCol ? String(row[t.bodyCol] ?? "") : "",
      category: t.extraCols?.length ? String(row[t.extraCols[0]] ?? "") || undefined : undefined,
      created_at: t.hasCreatedAt ? String(row.created_at ?? "") || undefined : undefined,
    })),
  );

  return rankEntries(full, terms, limit).map((r) => ({
    kind: r.kind,
    id: String(r.id).slice(String(r.kind).length + 1),
    title: r.title,
    excerpt: String(r.content ?? "").slice(0, 300),
    category: r.category,
    created_at: r.created_at,
  }));
}

/** The prompt block. Empty string when there is nothing worth adding. */
export function formatSearchBlock(hits: AppSearchHit[], hadQuery: boolean): string {
  if (!hadQuery) return "";
  if (hits.length === 0) {
    return "RELEVANT RECORDS: nothing in the operator's data matches this message.\n";
  }
  const lines = hits.map((h) =>
    `  • [${h.kind}] "${h.title}"${h.category ? ` [${h.category}]` : ""}` +
    `${h.created_at ? ` (${h.created_at.slice(0, 10)})` : ""}` +
    `${h.excerpt ? ` — ${h.excerpt}` : ""}`,
  );
  return (
    "RELEVANT RECORDS (matched against what the operator just said, searched across their FULL data — " +
    "not only the recent items listed elsewhere in this prompt):\n" +
    lines.join("\n") + "\n"
  );
}
