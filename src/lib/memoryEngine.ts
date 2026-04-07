// NAVI.EXE Memory Engine — extracts and compresses long-term memories from chat

export interface MemoryItem {
  category: string;
  detail: string;
  importance: number;
}

export interface CompressedMemoryBlock {
  category: string;
  details: string[];
  importance: number;
}

/**
 * Extract potential memories from a user message using pattern matching.
 * Returns up to 3 extracted items per message.
 */
export function extractMemoriesFromMessage(content: string): MemoryItem[] {
  if (!content || content.length < 20) return [];

  const memories: MemoryItem[] = [];
  const patterns = [
    { regex: /\b(want to|need to|planning to|goal is|trying to|working on|hoping to)\s+([^.!?]{10,100})/gi, category: 'goals', importance: 3 },
    { regex: /\b(I (?:like|love|prefer|enjoy|hate|dislike))\s+([^.!?]{5,80})/gi, category: 'preferences', importance: 2 },
    { regex: /\b(I am|I'm|I consider myself)\s+([^.!?]{5,80})/gi, category: 'identity', importance: 3 },
    { regex: /\b(my (?:partner|spouse|friend|family|boss|colleague|brother|sister|mom|dad|wife|husband|girlfriend|boyfriend|daughter|son|dog|cat))\s+([^.!?]{5,100})/gi, category: 'relationships', importance: 3 },
    { regex: /\b(struggling with|having trouble|difficult|hard time with|challenge is)\s+([^.!?]{10,100})/gi, category: 'struggles', importance: 3 },
    { regex: /\b((?:my|the) (?:project|app|business|company|startup|job|work|school|class))\s+([^.!?]{5,100})/gi, category: 'projects', importance: 3 },
    { regex: /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(?:is|was|said|told|asked|wants|called|texted|messaged)/gi, category: 'people', importance: 3 },
    { regex: /\b(?:I live|I'm from|I moved to|I'm in|I'm going to|I visited)\s+([^.!?]{5,80})/gi, category: 'places', importance: 2 },
    { regex: /\b(?:remember|don't forget|important|keep in mind)\s+([^.!?]{10,100})/gi, category: 'important_notes', importance: 4 },
  ];

  for (const p of patterns) {
    let match;
    while ((match = p.regex.exec(content)) !== null) {
      const detail = match[0].trim();
      if (detail.length >= 15 && detail.length <= 200) {
        memories.push({ category: p.category, detail, importance: p.importance });
        if (memories.length >= 3) return memories;
      }
    }
  }

  return memories;
}

/**
 * Compress raw memory rows into category blocks for the system prompt.
 */
export function compressMemories(rows: Array<{ memory_type: string; content: string; importance: number }>): CompressedMemoryBlock[] {
  const blockMap = new Map<string, CompressedMemoryBlock>();

  for (const row of rows) {
    const existing = blockMap.get(row.memory_type);
    if (existing) {
      const isDuplicate = existing.details.some(d =>
        d.toLowerCase().includes(row.content.toLowerCase().substring(0, 30))
      );
      if (!isDuplicate) {
        existing.details.push(row.content);
        existing.importance = Math.max(existing.importance, row.importance);
      }
    } else {
      blockMap.set(row.memory_type, {
        category: row.memory_type,
        details: [row.content],
        importance: row.importance,
      });
    }
  }

  return Array.from(blockMap.values());
}

/**
 * Build a compact text block of long-term memories for injection into the system prompt.
 */
export function buildMemoryContext(blocks: CompressedMemoryBlock[]): string {
  if (blocks.length === 0) return '';

  const lines: string[] = ['[LONG-TERM MEMORY]'];
  const sorted = [...blocks].sort((a, b) => b.importance - a.importance);

  for (const block of sorted) {
    const category = block.category.toUpperCase();
    lines.push(`[${category}]`);

    // Thread summaries get more space but are truncated; snapshots are compact
    const maxDetails = category === 'THREAD_SUMMARY' ? 3 : category === 'NAVI_INSIGHTS' ? 3 : category === 'APP_SNAPSHOT' ? 3 : block.importance >= 3 ? 10 : 5;
    const maxLen = category === 'THREAD_SUMMARY' ? 800 : category === 'NAVI_INSIGHTS' ? 500 : 150;

    for (const detail of block.details.slice(-maxDetails)) {
      lines.push(`- ${detail.substring(0, maxLen)}`);
    }
  }

  return lines.join('\n');
}
