import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  canExport,
  cardId,
  composeCard,
  parsePersona,
  personaToJson,
  slugify,
} from "./parse.ts";

const sampleDir = join(fileURLToPath(new URL(".", import.meta.url)), "../../public/samples");

function loadSample(id: string): string {
  return readFileSync(join(sampleDir, `${id}.json`), "utf8");
}

const SOUL = `# Marlowe

You are a research librarian for a human-AI lab.

## Voice
- Calm, precise, slightly dry
- Lead with the source, then the claim

## Values
- Attribution over speed
- Uncertainty is a feature

## Boundaries
- Must cite every factual claim
- Must not invent citations or page numbers

## Signature
— Marlowe, stacks closed.
`;

describe("slugify / cardId", () => {
  it("emits kebab-case ids", () => {
    assert.equal(slugify("Research Librarian"), "research-librarian");
  });

  it("is deterministic for the same seed", () => {
    assert.equal(cardId("Marlowe"), cardId("Marlowe"));
    assert.match(cardId("Marlowe"), /^PC-[0-9A-F]{4}$/);
  });
});

describe("parsePersona markdown", () => {
  it("extracts SOUL.md Voice / Values / Boundaries headings", () => {
    const parsed = parsePersona(SOUL);
    assert.equal(parsed.name, "Marlowe");
    assert.match(parsed.role, /research librarian/i);
    assert.ok(parsed.voice.some((line) => /calm/i.test(line)));
    assert.ok(parsed.values.some((line) => /attribution/i.test(line)));
    assert.ok(parsed.must.some((line) => /cite/i.test(line)));
    assert.ok(parsed.mustNot.some((line) => /invent citations/i.test(line)));
    assert.match(parsed.signature ?? "", /stacks closed/i);
  });

  it("reads YAML frontmatter overrides", () => {
    const parsed = parsePersona(
      "---\nname: Reed\nrole: Ops dispatcher\ntagline: Stabilize first.\n---\n\n## Voice\n- Short status lines\n",
    );
    assert.equal(parsed.name, "Reed");
    assert.equal(parsed.role, "Ops dispatcher");
    assert.equal(parsed.tagline, "Stabilize first.");
    assert.ok(parsed.voice.some((line) => /status/i.test(line)));
  });
});

describe("sample cards", () => {
  it("research-librarian prints a named persona", () => {
    const card = composeCard(loadSample("research-librarian"), undefined, new Date("2026-09-18T18:00:00Z"));
    assert.ok(card);
    assert.equal(card.schema, "smf.persona-card.v1");
    assert.equal(card.name, "Marlowe");
    assert.equal(card.role, "Research librarian");
    assert.match(card.tagline, /cite the shelf/i);
    assert.ok(card.voice.length >= 2);
    assert.ok(card.values.length >= 2);
    assert.ok(card.must.some((line) => /cite/i.test(line)));
    assert.ok(card.mustNot.some((line) => /invent/i.test(line)));
    assert.ok(card.tools.includes("catalog"));
    assert.equal(card.heuristic, true);
    assert.equal(canExport(card), true);
    assert.match(personaToJson(card), /"schema": "smf.persona-card.v1"/);
  });

  it("code-reviewer keeps merge out of bounds", () => {
    const card = composeCard(loadSample("code-reviewer"));
    assert.ok(card);
    assert.equal(card.name, "Voss");
    assert.ok(card.mustNot.some((line) => /merge/i.test(line)));
  });

  it("ops-dispatcher and teaching-coach load", () => {
    const ops = composeCard(loadSample("ops-dispatcher"));
    const coach = composeCard(loadSample("teaching-coach"));
    assert.equal(ops?.name, "Reed");
    assert.equal(coach?.name, "Inez");
    assert.ok((ops?.must.length ?? 0) >= 1);
    assert.ok((coach?.values.length ?? 0) >= 1);
  });
});

describe("composeCard", () => {
  it("returns null for empty paste", () => {
    assert.equal(composeCard("   "), null);
  });

  it("applies name / role / tagline overrides", () => {
    const card = composeCard(SOUL, { name: "Ada", role: "Lab librarian", tagline: "Ask the shelf." });
    assert.ok(card);
    assert.equal(card.name, "Ada");
    assert.equal(card.role, "Lab librarian");
    assert.equal(card.tagline, "Ask the shelf.");
  });

  it("still prints a card from a freeform system prompt", () => {
    const card = composeCard(
      "You are Voss, a staff code reviewer. You must request tests. You must not merge to main.",
    );
    assert.ok(card);
    assert.equal(card.name, "Voss");
    assert.match(card.role, /code reviewer/i);
    assert.ok(card.mustNot.some((line) => /merge/i.test(line)));
    assert.ok(card.warnings.some((line) => /heuristic/i.test(line)));
  });

  it("is deterministic for the same paste and clock", () => {
    const paste = loadSample("research-librarian");
    const at = new Date("2026-09-18T18:00:00Z");
    assert.deepEqual(composeCard(paste, undefined, at), composeCard(paste, undefined, at));
  });
});
