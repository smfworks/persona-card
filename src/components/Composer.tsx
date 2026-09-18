import type { DragEvent } from "react";
import { PASTE_PLACEHOLDER, SAMPLES } from "../data/samples";
import type { PersonaOverrides } from "../types";

interface ComposerProps {
  raw: string;
  overrides: PersonaOverrides;
  sampleId: string | null;
  dragging: boolean;
  onRawChange: (value: string) => void;
  onOverridesChange: (next: PersonaOverrides) => void;
  onSample: (id: string) => void;
  onPickFile: () => void;
  onDragState: (value: boolean) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}

export function Composer({
  raw,
  overrides,
  sampleId,
  dragging,
  onRawChange,
  onOverridesChange,
  onSample,
  onPickFile,
  onDragState,
  onDrop,
}: ComposerProps) {
  const patch = (partial: Partial<PersonaOverrides>) => {
    onOverridesChange({ ...overrides, ...partial });
  };

  return (
    <section
      className={`composer${dragging ? " is-dragging" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        onDragState(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        onDragState(false);
      }}
      onDrop={onDrop}
    >
      <div className="composer-head">
        <h2>SOUL.md</h2>
        <p>Pick a sample, paste a system prompt, or drop a `.md` / JSON persona.</p>
      </div>

      <div className="sample-row" role="list">
        {SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            role="listitem"
            className={sampleId === sample.id ? "chip is-on" : "chip"}
            onClick={() => onSample(sample.id)}
          >
            <span className="chip-top">
              <i className="dot is-playbook" aria-hidden="true" />
              {sample.label}
            </span>
            <small>{sample.blurb}</small>
          </button>
        ))}
      </div>

      <div className="override-row">
        <div>
          <label className="editor-label" htmlFor="name-input">
            Name <span className="opt">(optional)</span>
          </label>
          <input
            id="name-input"
            value={overrides.name}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder="Marlowe"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="editor-label" htmlFor="role-input">
            Role / title <span className="opt">(optional)</span>
          </label>
          <input
            id="role-input"
            value={overrides.role}
            onChange={(event) => patch({ role: event.target.value })}
            placeholder="Research librarian"
            autoComplete="off"
          />
        </div>
        <div className="tagline-field">
          <label className="editor-label" htmlFor="tagline-input">
            Tagline <span className="opt">(optional)</span>
          </label>
          <input
            id="tagline-input"
            value={overrides.tagline}
            onChange={(event) => patch({ tagline: event.target.value })}
            placeholder="Cite the shelf. Invent nothing."
            autoComplete="off"
          />
        </div>
      </div>

      <label className="editor-label" htmlFor="persona-input">
        Persona text
      </label>
      <textarea
        id="persona-input"
        value={raw}
        onChange={(event) => onRawChange(event.target.value)}
        placeholder={PASTE_PLACEHOLDER}
        spellCheck={false}
        autoComplete="off"
      />
      <div className="composer-foot">
        <button type="button" className="text-btn" onClick={onPickFile}>
          Upload SOUL.md
        </button>
        <span>
          {raw.trim() ? `${raw.length.toLocaleString()} chars` : "Client-side only · no API"}
        </span>
      </div>
      <p className="disclaimer">
        Heuristic demo. Approximate extraction — not an identity registry, not
        an audit, not legal advice. Judgment stays human.
      </p>
    </section>
  );
}
