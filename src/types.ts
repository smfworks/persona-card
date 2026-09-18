export const PERSONA_SCHEMA = "smf.persona-card.v1" as const;

export interface PersonaOverrides {
  name: string;
  role: string;
  tagline: string;
}

export interface PersonaCardModel {
  schema: typeof PERSONA_SCHEMA;
  id: string;
  name: string;
  role: string;
  tagline: string;
  voice: string[];
  values: string[];
  must: string[];
  mustNot: string[];
  tools: string[];
  signature: string | null;
  heuristic: true;
  printedAt: string;
  warnings: string[];
}

export interface SampleMeta {
  id: string;
  file: string;
  label: string;
  blurb: string;
}

export const EMPTY_OVERRIDES: PersonaOverrides = {
  name: "",
  role: "",
  tagline: "",
};

export const MAX_VOICE = 5;
export const MAX_VALUES = 5;
export const MAX_BOUNDARIES = 4;
export const MAX_TOOLS = 6;
export const MAX_BULLET_LENGTH = 140;
export const MAX_PARSE = 80_000;
