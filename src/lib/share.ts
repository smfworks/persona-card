import type { PersonaCardModel } from "../types.ts";

const SHARE_URL = "https://github.com/smfworks/persona-card";

export function formatStampTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${dd} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} · ${hh}:${mm} UTC`;
}

export function formatShareText(card: PersonaCardModel): string {
  const lines = [
    `✦ ${card.name}${card.role ? ` · ${card.role}` : ""}`,
    card.tagline || "",
    "",
  ];
  if (card.voice.length) {
    lines.push("VOICE");
    for (const line of card.voice) lines.push(`• ${line}`);
    lines.push("");
  }
  if (card.values.length) {
    lines.push("VALUES");
    for (const line of card.values) lines.push(`• ${line}`);
    lines.push("");
  }
  if (card.must.length || card.mustNot.length) {
    lines.push("BOUNDARIES");
    for (const line of card.must) lines.push(`• Must: ${line}`);
    for (const line of card.mustNot) lines.push(`• Must not: ${line}`);
    lines.push("");
  }
  if (card.tools.length) {
    lines.push(`Focus: ${card.tools.join(" · ")}`);
    lines.push("");
  }
  if (card.signature) {
    lines.push(card.signature);
    lines.push("");
  }
  lines.push("Persona Card · SMF Works", SHARE_URL);
  return lines
    .filter((line, index, all) => !(line === "" && all[index - 1] === ""))
    .join("\n");
}

export function formatCompactStats(card: PersonaCardModel): string {
  const bounds = card.must.length + card.mustNot.length;
  const notes = card.warnings.length;
  return `${card.voice.length} voice · ${card.values.length} values · ${bounds} bounds · ${notes} notes`;
}
