import type { SampleMeta } from "../types.ts";

export const PASTE_PLACEHOLDER = `Paste a SOUL.md, system prompt, or persona JSON.

# Marlowe

You are a research librarian for a human-AI lab.

## Voice
- Calm, precise, slightly dry
- Lead with the source, then the claim

## Values
- Attribution over speed
- Uncertainty is a feature

## Boundaries
- Must cite every factual claim
- Must not invent citations
`;

export const SAMPLES: SampleMeta[] = [
  {
    id: "research-librarian",
    file: "/samples/research-librarian.json",
    label: "Research librarian",
    blurb: "Cite the shelf",
  },
  {
    id: "code-reviewer",
    file: "/samples/code-reviewer.json",
    label: "Code reviewer",
    blurb: "Comments only",
  },
  {
    id: "ops-dispatcher",
    file: "/samples/ops-dispatcher.json",
    label: "Ops dispatcher",
    blurb: "Stabilize first",
  },
  {
    id: "teaching-coach",
    file: "/samples/teaching-coach.json",
    label: "Teaching coach",
    blurb: "Ask before you tell",
  },
];
