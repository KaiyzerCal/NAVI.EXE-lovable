// Ported from mythos-vantara's equivalent test — same discipline: every
// column name the registry claims is checked against the generated Supabase
// types, because a wrong name is a silent empty result, not an error.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEARCHABLE,
  SEARCHABLE_KEYS,
  selectFor,
  resolveScope,
  formatSearchBlock,
  type AppSearchHit,
} from "../../supabase/functions/_shared/appSearch";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");

describe("the registry", () => {
  it("has unique keys and tables", () => {
    expect(new Set(SEARCHABLE_KEYS).size).toBe(SEARCHABLE.length);
    expect(new Set(SEARCHABLE.map((t) => t.table)).size).toBe(SEARCHABLE.length);
  });

  it("only ever selects columns it declares", () => {
    for (const t of SEARCHABLE) {
      const cols = selectFor(t).split(",");
      expect(cols, `${t.key} must select its id`).toContain("id");
      expect(cols, `${t.key} must select its title column`).toContain(t.titleCol);
      if (t.bodyCol) expect(cols).toContain(t.bodyCol);
      // created_at is NOT universal — equipment lacks it, and requesting it
      // there would break that search.
      expect(cols.includes("created_at")).toBe(!!t.hasCreatedAt);
    }
  });

  it("does not claim created_at on equipment, which lacks it", () => {
    const t = SEARCHABLE.find((x) => x.key === "equipment")!;
    expect(t, "equipment scope missing").toBeTruthy();
    expect(t.hasCreatedAt, "equipment has no created_at column").toBeFalsy();
  });
});

describe("the registry matches the real schema", () => {
  const TYPES = read("src/integrations/supabase/types.ts");

  function columnsOf(table: string): string[] {
    const m = new RegExp(`\\n      ${table}: \\{\\n        Row: \\{\\n(.*?)\\n        \\}\\n`, "s").exec(TYPES);
    if (!m) return [];
    return m[1].split("\n").map((l) => l.trim().split(":")[0].trim()).filter(Boolean);
  }

  it.each(SEARCHABLE.map((t) => [t.key, t] as const))("%s names only real columns", (_key, t) => {
    const cols = columnsOf(t.table);
    expect(cols.length, `no generated type for ${t.table}`).toBeGreaterThan(0);
    expect(cols, `${t.key}: titleCol "${t.titleCol}" does not exist`).toContain(t.titleCol);
    if (t.bodyCol) expect(cols, `${t.key}: bodyCol "${t.bodyCol}" does not exist`).toContain(t.bodyCol);
    for (const ec of t.extraCols ?? []) {
      expect(cols, `${t.key}: extraCol "${ec}" does not exist`).toContain(ec);
    }
    expect(cols, `${t.key} has no user_id; searching it can only ever return nothing`)
      .toContain("user_id");
  });
});

describe("resolveScope", () => {
  it("returns everything for no scope, 'all', or an unrecognised name", () => {
    expect(resolveScope(undefined).length).toBe(SEARCHABLE.length);
    expect(resolveScope("all").length).toBe(SEARCHABLE.length);
    expect(resolveScope("made_up_scope").length).toBe(SEARCHABLE.length);
  });

  it("narrows to a named scope", () => {
    const r = resolveScope("journal");
    expect(r.length).toBe(1);
    expect(r[0].key).toBe("journal");
  });

  it("accepts multiple comma or space separated scopes", () => {
    const r = resolveScope("journal,quests");
    expect(r.map((t) => t.key).sort()).toEqual(["journal", "quests"]);
  });
});

describe("formatSearchBlock", () => {
  it("returns empty string when there was no query", () => {
    expect(formatSearchBlock([], false)).toBe("");
  });

  it("says nothing matched, rather than staying silent, when a query found nothing", () => {
    expect(formatSearchBlock([], true)).toMatch(/nothing.*matches/i);
  });

  it("renders each hit with its kind, title and excerpt", () => {
    const hits: AppSearchHit[] = [
      { kind: "journal", id: "1", title: "Morning routine", excerpt: "Woke up at 6am and ran 3 miles." },
    ];
    const block = formatSearchBlock(hits, true);
    expect(block).toContain("[journal]");
    expect(block).toContain("Morning routine");
    expect(block).toContain("Woke up at 6am");
  });
});

describe("every scope is reachable from navi-chat", () => {
  // The only way anything here reaches a reply: navi-chat's NAVI_TOOLS array
  // is action-extraction that runs AFTER the reply is generated, so a search
  // "tool" would never inform the answer. Retrieval has to be unconditional,
  // injected into the prompt before the completion call — this checks that
  // wiring is actually in place, not just that the registry compiles.
  const CHAT = read("supabase/functions/navi-chat/index.ts");

  it("imports searchAppData and formatSearchBlock from the shared module", () => {
    expect(CHAT).toMatch(/import\s*\{[^}]*searchAppData[^}]*\}\s*from\s*["']\.\.\/_shared\/appSearch\.ts["']/);
  });

  it("calls searchAppData and feeds the result into buildSystemPrompt", () => {
    expect(CHAT).toMatch(/searchAppData\(/);
    expect(CHAT).toMatch(/buildSystemPrompt\([^)]*searchResults/);
  });

  it("shares one embedding call between memory search and app search, rather than paying twice", () => {
    // embedText costs an OpenAI call. Two independent calls for the same
    // lastUserMsg.content in the same turn would double that cost for no
    // benefit — this was a real bug in the first draft of this wiring.
    expect(CHAT).toMatch(/sharedEmbeddingPromise/);
    const embedCalls = [...CHAT.matchAll(/embedText\(lastUserMsg\.content/g)];
    expect(embedCalls.length, "embedText(lastUserMsg.content...) should be called exactly once").toBe(1);
  });
});

describe("semantic search over journal and quests", () => {
  // Same shape as mythos-vantara's equivalent check: the set of tables
  // carrying vectors is stated in two places here (the migration that adds
  // the column and function, and appSearch.ts's EMBEDDED_SCOPES allowlist)
  // — drift between them is silent, so it's checked directly rather than
  // trusted to stay in sync by hand.
  const APP = read("supabase/functions/_shared/appSearch.ts");
  const MIGRATION_DIR = "supabase/migrations";
  const MIGRATIONS = readdirSync(join(ROOT, MIGRATION_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => read(`${MIGRATION_DIR}/${f}`))
    .join("\n");

  it("declares EMBEDDED_SCOPES matching the tables the migration actually embeds", () => {
    const declared = /const EMBEDDED_SCOPES = \[([^\]]+)\]/.exec(APP)?.[1] ?? "";
    const scopes = [...declared.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
    expect(scopes.sort()).toEqual(["journal", "quests"]);

    for (const scope of scopes) {
      expect(MIGRATIONS, `${scope} is in EMBEDDED_SCOPES but the migration doesn't add its embedding column`)
        .toMatch(new RegExp(`ADD COLUMN IF NOT EXISTS embedding vector\\(1536\\)`));
      expect(MIGRATIONS, `${scope} is in EMBEDDED_SCOPES but search_navi_records has no branch for it`)
        .toMatch(new RegExp(`'${scope}'::text`));
    }
  });

  it("calls search_navi_records, not mythos-vantara's match_operator_entries", () => {
    // Easy mistake porting code between the two repos — the RPC name has to
    // match what this repo's migration actually defines.
    expect(APP).toMatch(/search_navi_records/);
    expect(APP).not.toMatch(/match_operator_entries/);
  });

  it("navi-chat passes an embed callback into searchAppData", () => {
    const CHAT = read("supabase/functions/navi-chat/index.ts");
    expect(CHAT).toMatch(/searchAppData\([^)]*embed:/s);
  });
});
