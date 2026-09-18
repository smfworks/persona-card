# Persona Card

Paste a `SOUL.md` / system prompt / agent persona → get a **pretty shareable persona one-pager** (PNG + copy text).

Skill Card’s twin for agents (not skills): **name, role, voice, values, boundaries, signature line.**

**Paste a soul. Print a card. Share the persona — not the secrets.**

[![MIT License](https://img.shields.io/badge/license-MIT-00D4FF?labelColor=0A0F1F)](LICENSE)

SMF Works viral kit:

1. **[Paste → Skill](https://github.com/smfworks/paste-to-skill)** — create
2. **[Skill Lint](https://github.com/smfworks/skill-lint)** — grade / fix
3. **[Skill Card](https://github.com/smfworks/skill-card)** — present the playbook
4. **Persona Card (this)** — present the agent
5. **[Agent Contract](https://github.com/smfworks/agent-contract)** — roles, success, stop
6. **[Constraint Card](https://github.com/smfworks/constraint-card)** — standing constitution
7. **[Refuse Card](https://github.com/smfworks/refuse-card)** — the gate
8. **[Tool Permit](https://github.com/smfworks/tool-permit)** — GO / ALLOWLIST
9. **[Agent Receipt](https://github.com/smfworks/agent-receipt)** — what ran

Also in the kit: [Context Budget](https://github.com/smfworks/context-budget), [Redact Before Share](https://github.com/smfworks/redact-before-share).

## Why a persona card?

Agent work dies in 400-line `SOUL.md` files nobody will screenshot. A card is small enough to post and specific enough to reuse: the name, the role, how it speaks, what it values, and where it stops.

It is a lab artifact, not an identity registry. **Heuristic demo. Not an audit. Not legal advice. Judgment stays human.**

## Quickstart

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build
npm run preview
npm test
```

Node 20+ (22 recommended). Client-side only — no auth, no backend, no API keys, no secrets.

## Use it

1. Pick **Research librarian**, **Code reviewer**, **Ops dispatcher**, or **Teaching coach**, or paste a `SOUL.md` / system prompt.
2. Optional overrides: **name**, **role/title**, **tagline**.
3. The card renders immediately (under a second).
4. **Download PNG**, **Copy share text**, or **Copy JSON**. **Reset** clears the compositor.

Load a sample with `?sample=research-librarian` (also `code-reviewer`, `ops-dispatcher`, `teaching-coach`).

The parser is **heuristic**. Approximate is OK. Review Voice / Values / Boundaries before you share.

## What lands on the card

| Zone | Source |
| --- | --- |
| Name | Frontmatter `name`, first heading, or `You are X, a …` |
| Role chip | Frontmatter `role` / `title`, or the `You are a …` clause |
| Tagline | Frontmatter `tagline` / `description`, or the opening paragraph |
| Voice | `## Voice` (or Tone / Style) |
| Values | `## Values` (or Principles) |
| Boundaries | `## Boundaries` split into must / must-not |
| Focus chips | `tools` / `domain` |
| Signature | `## Signature` or a closing em-dash line |
| Footer | **SMF Works · Persona Card** |
| Lab note | Heuristic disclaimer, missing name/role/voice/bounds |

Markdown headings that look like a SOUL.md (`## Voice`, `## Values`, `## Boundaries`) are first-class. JSON matching [`public/schema/persona-card.schema.json`](public/schema/persona-card.schema.json) skips the guesswork.

## Samples

Shipped in [`public/samples/`](public/samples/):

| File | Persona |
| --- | --- |
| `research-librarian.json` | Marlowe — cite the shelf, invent nothing |
| `code-reviewer.json` | Voss — comments only, the human merges |
| `ops-dispatcher.json` | Reed — stabilize first, humans page out |
| `teaching-coach.json` | Inez — ask before you tell |

## Input / output schema

Canonical JSON Schema: [`public/schema/persona-card.schema.json`](public/schema/persona-card.schema.json)

Minimal persona:

```json
{
  "name": "Marlowe",
  "role": "Research librarian",
  "tagline": "Cite the shelf. Invent nothing.",
  "voice": ["Calm, precise, slightly dry"],
  "values": ["Attribution over speed"],
  "must": ["Cite every factual claim"],
  "mustNot": ["Invent citations"]
}
```

Printed output (what the card represents):

| Field | Notes |
| --- | --- |
| `schema` | `smf.persona-card.v1` |
| `id` | `PC-xxxx` serial |
| `name` | Display name |
| `role` | Role / title chip |
| `tagline` | One-liner |
| `voice` | Tone bullets |
| `values` | Standing principles |
| `must` / `mustNot` | Boundaries |
| `tools` | Optional domain chips |
| `signature` | Optional footer line |
| `heuristic` | Always `true` — this is a demo printer |

Aliases accepted on ingest: `title` / `description` / `tone` / `principles` / `must_not` / `never` / `domain` / `signOff` / `markdown` / `soul` / `prompt`.

## Host a demo

Static files from `npm run build` (output: `dist/`).

Or Docker:

```bash
docker build -t persona-card .
docker run --rm -p 8080:80 persona-card
```

Then open [http://localhost:8080](http://localhost:8080).

## Stack

Vite + React + TypeScript. Parsing is client-side (no model, no keys). PNG export via `html-to-image`. Fonts: Inter, Space Grotesk, JetBrains Mono. Palette: navy `#0A0F1F`, cyan `#00D4FF`, ember `#ea580c`.

## Built by SMF Works

[SMF Works](https://smfworks.com) is a human-AI research lab. We publish what we learn, ship open agent tools, and install stacks on hardware you own.

Intelligence is abundant. Judgment is the product.

- Lab: [smfworks.com](https://smfworks.com)
- GitHub: [github.com/smfworks](https://github.com/smfworks)
- X: [@MichaelGannotti](https://x.com/MichaelGannotti)
- Twin: [Skill Card](https://github.com/smfworks/skill-card) — the playbook
- Twin: [Agent Contract](https://github.com/smfworks/agent-contract) — the agreement
- Twin: [Constraint Card](https://github.com/smfworks/constraint-card) — the constitution

MIT licensed. No medical or legal claims. This is a shareable card, not an audit, not an identity registry, and not a hosted agent.

## License

[MIT](LICENSE) © 2026 SMF Works
