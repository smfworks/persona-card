import {
  MAX_BOUNDARIES,
  MAX_BULLET_LENGTH,
  MAX_PARSE,
  MAX_TOOLS,
  MAX_VALUES,
  MAX_VOICE,
  PERSONA_SCHEMA,
  type PersonaCardModel,
  type PersonaOverrides,
} from "../types.ts";

type SectionKind =
  | "voice"
  | "values"
  | "boundaries"
  | "must"
  | "mustNot"
  | "tools"
  | "signature"
  | "role"
  | "other";

interface YamlFields {
  [key: string]: string | string[];
}

interface ParsedPersona {
  name: string;
  role: string;
  tagline: string;
  voice: string[];
  values: string[];
  must: string[];
  mustNot: string[];
  tools: string[];
  signature: string | null;
  warnings: string[];
  fromJson: boolean;
}

const EMPTY_PARSED: ParsedPersona = {
  name: "",
  role: "",
  tagline: "",
  voice: [],
  values: [],
  must: [],
  mustNot: [],
  tools: [],
  signature: null,
  warnings: [],
  fromJson: false,
};

function clip(text: string, max: number): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1).trimEnd()}…`;
}

export function uniqueBullets(raw: readonly string[], limit = 12): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const bullet = clip(item.replace(/^\s*[-*•–—]\s*/, ""), MAX_BULLET_LENGTH);
    if (!bullet) continue;
    const key = bullet.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(bullet);
    if (out.length >= limit) break;
  }
  return out;
}

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "persona";
}

export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function cardId(seed: string): string {
  const hex = fnv1a(seed).toString(16).toUpperCase().padStart(8, "0");
  return `PC-${hex.slice(0, 4)}`;
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,;]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return "";
}

function pickList(record: Record<string, unknown>, ...keys: string[]): string[] {
  for (const key of keys) {
    const list = asList(record[key]);
    if (list.length) return list;
  }
  return [];
}

function headingKind(heading: string): SectionKind {
  const stripped = heading
    .replace(/^#{1,6}\s+/, "")
    .replace(/[:\-–]\s*$/, "")
    .trim()
    .toLowerCase();
  if (/^(voice|tone|style|personality|manner|how you speak)\b/.test(stripped)) return "voice";
  if (/^(values?|principles?|beliefs?|ethics)\b/.test(stripped)) return "values";
  if (/^(must\s*not|must-not|never|do\s*not|don't|forbidden)\b/.test(stripped)) return "mustNot";
  if (/^(musts?|always|required|shall)\b/.test(stripped)) return "must";
  if (/^(boundaries|guardrails|constraints|rules|limits)\b/.test(stripped)) return "boundaries";
  if (/^(tools?|domain|focus|capabilities|stack|expertise)\b/.test(stripped)) return "tools";
  if (/^(signature|sign-?off|motto|closing|catchphrase)\b/.test(stripped)) return "signature";
  if (/^(role|title|job|identity)\b/.test(stripped)) return "role";
  return "other";
}

function collectListItems(block: string): string[] {
  const items: string[] = [];
  for (const line of block.split("\n")) {
    const match = line.match(/^\s*(?:\d+[.)]\s+|[-*•–—]\s+|\[[ xX]\]\s+)(.+)$/);
    if (match) {
      const text = match[1]
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
      if (text) items.push(text);
    }
  }
  return items;
}

function proseLines(block: string): string[] {
  const listed = collectListItems(block);
  if (listed.length) return listed;
  return block
    .split(/\n+/)
    .map((line) => line.replace(/^#{1,6}\s+/, "").replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 4 && !/^---+$/.test(line));
}

function isMustNotLine(line: string): boolean {
  return /\b(must not|must-not|mustn't|never|do not|don't|forbidden|prohibit)\b/i.test(line);
}

function isMustLine(line: string): boolean {
  return /\b(must|always|required|shall)\b/i.test(line) && !isMustNotLine(line);
}

function splitBoundaries(lines: string[]): { must: string[]; mustNot: string[] } {
  const must: string[] = [];
  const mustNot: string[] = [];
  for (const line of lines) {
    if (isMustNotLine(line)) mustNot.push(line);
    else if (isMustLine(line)) must.push(line);
    else mustNot.push(line);
  }
  return { must, mustNot };
}

function splitFrontmatter(raw: string): { fields: YamlFields; body: string; hasFrontmatter: boolean } {
  const text = raw.replace(/^\uFEFF/, "");
  if (!text.startsWith("---")) return { fields: {}, body: text, hasFrontmatter: false };
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { fields: {}, body: text, hasFrontmatter: false };

  const fields: YamlFields = {};
  let currentKey: string | null = null;
  for (const line of match[1].split("\n")) {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && currentKey) {
      const existing = fields[currentKey];
      const next = typeof existing === "string" && existing ? [existing] : Array.isArray(existing) ? existing : [];
      next.push(listItem[1].trim().replace(/^["']|["']$/g, ""));
      fields[currentKey] = next;
      continue;
    }
    const kv = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    currentKey = kv[1];
    const value = kv[2].trim().replace(/^["']|["']$/g, "");
    fields[currentKey] = value;
  }
  return { fields, body: match[2], hasFrontmatter: true };
}

function yamlList(fields: YamlFields, ...keys: string[]): string[] {
  for (const key of keys) {
    const value = fields[key];
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value) return asList(value);
  }
  return [];
}

function yamlString(fields: YamlFields, ...keys: string[]): string {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function parseSections(body: string): { heading: string; kind: SectionKind; body: string }[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const sections: { heading: string; kind: SectionKind; body: string }[] = [];
  let current = { heading: "", kind: "other" as SectionKind, body: "" };
  const flush = () => {
    const text = current.body.trim();
    if (current.heading || text) sections.push({ ...current, body: text });
  };
  for (const line of lines) {
    if (/^#{1,6}\s+\S/.test(line)) {
      flush();
      current = { heading: line.trim(), kind: headingKind(line), body: "" };
      continue;
    }
    current.body += (current.body ? "\n" : "") + line;
  }
  flush();
  return sections;
}

function firstHeading(body: string): string | null {
  const match = body.match(/^#{1,6}\s+(\S[^\n]*)$/m);
  return match ? match[1].trim() : null;
}

function firstParagraph(body: string): string | null {
  const parts = body.trim().split(/\n\s*\n/);
  for (const part of parts) {
    if (/^#{1,6}\s+\S[^\n]*$/.test(part.trim())) continue;
    const text = part
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^\s*(?:\d+[.)]\s+|[-*•–—]\s+)/gm, "")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length >= 8) return text;
  }
  return null;
}

function stripSoulPrefix(heading: string): string {
  return heading
    .replace(/^SOUL\.md\s*[—–:-]\s*/i, "")
    .replace(/^SOUL\s*[—–:-]\s*/i, "")
    .replace(/\s*[—–:-]\s*SOUL\.md$/i, "")
    .trim();
}

function extractYouAre(text: string): { name: string; role: string } {
  const namedRole = text.match(
    /\b(?:you are|i am)\s+([A-Z][A-Za-z0-9 .'-]{0,40}?),\s+(?:an?\s+|the\s+)?([^.\n]{3,80})/i,
  );
  if (namedRole) {
    return { name: namedRole[1].trim(), role: namedRole[2].trim().replace(/[.!,;]+$/, "") };
  }
  const nameOnly = text.match(/\b(?:your name is|i'?m called|call me)\s+([A-Z][A-Za-z0-9 .'-]{1,40})/i);
  const roleOnly = text.match(/\b(?:you are|i am)\s+(?:an?\s+|the\s+)([^.\n]{3,80})/i);
  return {
    name: nameOnly ? nameOnly[1].trim().replace(/[.!,;]+$/, "") : "",
    role: roleOnly ? roleOnly[1].trim().replace(/[.!,;]+$/, "") : "",
  };
}

function extractSignature(text: string): string | null {
  // Em/en dash only — ASCII "-" is how markdown bullets start.
  const quoted = text.match(/^[—–]\s+\S[^\n]{3,80}$/m);
  if (quoted) return quoted[0].trim();
  const signOff = text.match(/\b(?:always (?:end|sign off|close) with)\s+["“]?([^"”\n]{4,80})["”]?/i);
  if (signOff) return signOff[1].trim();
  return null;
}

function parseMarkdown(raw: string): ParsedPersona {
  const split = splitFrontmatter(raw);
  const sections = parseSections(split.body);
  const warnings: string[] = [];
  const voice: string[] = yamlList(split.fields, "voice", "tone");
  const values: string[] = yamlList(split.fields, "values", "principles");
  let must: string[] = yamlList(split.fields, "must");
  let mustNot: string[] = yamlList(split.fields, "mustNot", "must_not", "never");
  const tools: string[] = yamlList(split.fields, "tools", "domain");
  let signature = yamlString(split.fields, "signature", "signOff", "sign-off") || null;
  let name = yamlString(split.fields, "name");
  let role = yamlString(split.fields, "role", "title");
  let tagline = yamlString(split.fields, "tagline", "description");

  for (const section of sections) {
    const items = proseLines(section.body);
    if (section.kind === "voice") voice.push(...items);
    else if (section.kind === "values") values.push(...items);
    else if (section.kind === "must") must.push(...items);
    else if (section.kind === "mustNot") mustNot.push(...items);
    else if (section.kind === "tools") tools.push(...items);
    else if (section.kind === "signature") {
      signature = signature || items[0] || section.body.trim() || null;
    } else if (section.kind === "role") {
      if (!role) role = items[0] || "";
      if (!name && /name/i.test(section.heading)) name = items[0] || "";
      if (!tagline && items.length > 1) tagline = items[1];
    } else if (section.kind === "boundaries") {
      const splitRules = splitBoundaries(items);
      must.push(...splitRules.must);
      mustNot.push(...splitRules.mustNot);
    }
  }

  const heading = firstHeading(split.body);
  const youAre = extractYouAre(split.body);
  if (!name) name = youAre.name || (heading ? stripSoulPrefix(heading) : "");
  if (!role) role = youAre.role;
  if (!tagline) {
    const para = firstParagraph(split.body);
    if (para && !/^you are\b/i.test(para)) tagline = para;
    else if (para) tagline = para.replace(/^you are\s+/i, "").replace(/\.$/, "");
  }
  if (!signature) signature = extractSignature(split.body);

  if (!must.length && !mustNot.length) {
    const leftover = split.body
      .split(/(?<=[.!?])\s+|\n+/)
      .map((line) => line.replace(/^\s*[-*•–—]\s*/, "").trim())
      .filter((line) => line.length >= 8);
    const splitRules = splitBoundaries(leftover.filter((line) => isMustLine(line) || isMustNotLine(line)));
    must.push(...splitRules.must);
    mustNot.push(...splitRules.mustNot);
  }

  if (!split.hasFrontmatter && !heading) {
    warnings.push("Freeform paste — headings help Voice / Values / Boundaries land cleanly.");
  }

  return {
    name,
    role,
    tagline,
    voice: uniqueBullets(voice),
    values: uniqueBullets(values),
    must: uniqueBullets(must),
    mustNot: uniqueBullets(mustNot),
    tools: uniqueBullets(tools, MAX_TOOLS),
    signature: signature ? clip(signature, 96) : null,
    warnings,
    fromJson: false,
  };
}

function nestedRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseJsonPersona(record: Record<string, unknown>): ParsedPersona {
  const nested = nestedRecord(record.boundaries);
  const markdown = pickString(record, "markdown", "soul", "prompt", "text");
  const fromMarkdown = markdown ? parseMarkdown(markdown) : { ...EMPTY_PARSED };

  const must = uniqueBullets([
    ...pickList(record, "must"),
    ...asList(nested?.must),
    ...fromMarkdown.must,
  ]);
  const mustNot = uniqueBullets([
    ...pickList(record, "mustNot", "must_not", "never"),
    ...asList(nested?.mustNot),
    ...asList(nested?.must_not),
    ...fromMarkdown.mustNot,
  ]);

  return {
    name: pickString(record, "name") || fromMarkdown.name,
    role: pickString(record, "role", "title") || fromMarkdown.role,
    tagline: pickString(record, "tagline", "description") || fromMarkdown.tagline,
    voice: uniqueBullets([...pickList(record, "voice", "tone"), ...fromMarkdown.voice]),
    values: uniqueBullets([...pickList(record, "values", "principles"), ...fromMarkdown.values]),
    must,
    mustNot,
    tools: uniqueBullets([...pickList(record, "tools", "domain"), ...fromMarkdown.tools], MAX_TOOLS),
    signature:
      pickString(record, "signature", "signOff", "sign-off") || fromMarkdown.signature,
    warnings: fromMarkdown.warnings,
    fromJson: true,
  };
}

export function parsePersona(raw: string): ParsedPersona {
  const source = raw.slice(0, MAX_PARSE).trim();
  if (!source) return { ...EMPTY_PARSED };

  if (source.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(source);
      if (parsed && typeof parsed === "object") {
        return parseJsonPersona(parsed as Record<string, unknown>);
      }
    } catch {
      // Fall through — treat as markdown / freeform.
    }
  }
  return parseMarkdown(source);
}

export function composeCard(
  raw: string,
  overrides: PersonaOverrides = { name: "", role: "", tagline: "" },
  printedAt = new Date(),
): PersonaCardModel | null {
  const trimmed = raw.trim();
  const hasOverrides = Boolean(overrides.name.trim() || overrides.role.trim() || overrides.tagline.trim());
  if (!trimmed && !hasOverrides) return null;

  const parsed = trimmed ? parsePersona(trimmed) : { ...EMPTY_PARSED };
  const warnings = [...parsed.warnings];
  const name = overrides.name.trim() || parsed.name;
  const role = overrides.role.trim() || parsed.role;
  const tagline = overrides.tagline.trim() || parsed.tagline;

  if (!parsed.fromJson) {
    warnings.push("Heuristic parse — approximate. Review Voice / Values / Boundaries before you share.");
  }
  if (!name) warnings.push("Missing name — add a heading, a name field, or an override.");
  if (!role) warnings.push("Missing role — add a title chip or an override.");
  if (!parsed.voice.length) warnings.push("No voice bullets yet.");
  if (!parsed.must.length && !parsed.mustNot.length) {
    warnings.push("No boundaries yet — add ## Boundaries or must / must-not lines.");
  }

  const displayName = name || "Untitled persona";
  const seed = [trimmed, overrides.name, overrides.role, overrides.tagline].join("\n");

  return {
    schema: PERSONA_SCHEMA,
    id: cardId(seed),
    name: clip(displayName, 48),
    role: clip(role, 48),
    tagline: clip(tagline, 160),
    voice: uniqueBullets(parsed.voice, MAX_VOICE),
    values: uniqueBullets(parsed.values, MAX_VALUES),
    must: uniqueBullets(parsed.must, MAX_BOUNDARIES),
    mustNot: uniqueBullets(parsed.mustNot, MAX_BOUNDARIES),
    tools: uniqueBullets(parsed.tools, MAX_TOOLS),
    signature: parsed.signature,
    heuristic: true,
    printedAt: printedAt.toISOString(),
    warnings: uniqueBullets(warnings, 6),
  };
}

export function personaToJson(card: PersonaCardModel): string {
  return `${JSON.stringify(
    {
      schema: card.schema,
      id: card.id,
      name: card.name,
      role: card.role,
      tagline: card.tagline,
      voice: card.voice,
      values: card.values,
      must: card.must,
      mustNot: card.mustNot,
      tools: card.tools,
      signature: card.signature,
      issuedAt: card.printedAt,
      heuristic: true,
    },
    null,
    2,
  )}\n`;
}

export function canExport(card: PersonaCardModel | null): boolean {
  return Boolean(card && card.name && card.name !== "Untitled persona");
}
