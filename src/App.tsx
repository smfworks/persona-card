import { SAMPLES } from "./data/samples";
import { canExport, composeCard, personaToJson, slugify } from "./lib/parse";
import { cardToPngBlob, copyText, downloadBlob } from "./lib/exportImage";
import { formatCompactStats, formatShareText } from "./lib/share";
import { EMPTY_OVERRIDES, type PersonaCardModel, type PersonaOverrides } from "./types";
import { Actions } from "./components/Actions";
import { Composer } from "./components/Composer";
import { Header } from "./components/Header";
import { PersonaCard } from "./components/PersonaCard";
import { SisterStrip } from "./components/SisterStrip";
import { HandoffBanner } from "./components/HandoffBanner";
import { Toast } from "./components/Toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";

export default function App() {
  const [raw, setRaw] = useState("");
  const [overrides, setOverrides] = useState<PersonaOverrides>(EMPTY_OVERRIDES);
  const [card, setCard] = useState<PersonaCardModel | null>(null);
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<"png" | "share" | "json" | null>(null);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        setCard(composeCard(raw, overrides));
      } catch {
        setCard(null);
        showToast("Could not parse that paste.");
      }
    }, 80);
    return () => window.clearTimeout(handle);
  }, [raw, overrides, showToast]);

  const loadSample = useCallback(
    async (id: string) => {
      const sample = SAMPLES.find((item) => item.id === id);
      if (!sample) return;
      try {
        const response = await fetch(sample.file);
        if (!response.ok) throw new Error("missing sample");
        const text = await response.text();
        setRaw(text.trim());
        setOverrides(EMPTY_OVERRIDES);
        setSampleId(id);
      } catch {
        showToast("Could not load that sample.");
      }
    },
    [showToast],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sample = params.get("sample");
    if (sample) void loadSample(sample);
    const shot = params.get("shot");
    if (shot === "card" || shot === "og") {
      document.body.classList.add(`shot-${shot}`);
    }
  }, [loadSample]);

  const onFile = useCallback(async (file: File) => {
    const text = await file.text();
    setSampleId(null);
    setRaw(text);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files[0];
      if (!file) return;
      const name = file.name.toLowerCase();
      if (
        !name.endsWith(".md") &&
        !name.endsWith(".markdown") &&
        !name.endsWith(".txt") &&
        !name.endsWith(".json")
      ) {
        showToast("Drop a .md, SOUL.md, or JSON file.");
        return;
      }
      void onFile(file);
    },
    [onFile, showToast],
  );

  const reset = useCallback(() => {
    setRaw("");
    setOverrides(EMPTY_OVERRIDES);
    setCard(null);
    setSampleId(null);
    showToast("Cleared.");
  }, [showToast]);

  const exportable = canExport(card);

  const withFrame = useCallback(async () => {
    const node = frameRef.current;
    if (!node || !exportable || !card) throw new Error("Nothing to print yet.");
    node.classList.add("is-exporting");
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    try {
      return await cardToPngBlob(node);
    } finally {
      node.classList.remove("is-exporting");
    }
  }, [exportable, card]);

  const downloadPng = useCallback(async () => {
    if (!card || !exportable) return;
    setBusy("png");
    try {
      const blob = await withFrame();
      downloadBlob(blob, `persona-card-${slugify(card.name)}.png`);
      showToast("PNG downloaded.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "PNG export failed.");
    } finally {
      setBusy(null);
    }
  }, [card, exportable, showToast, withFrame]);

  const copyShare = useCallback(async () => {
    if (!card || !exportable) return;
    setBusy("share");
    try {
      await copyText(formatShareText(card));
      showToast("Share text copied.");
    } catch {
      showToast("Could not copy share text.");
    } finally {
      setBusy(null);
    }
  }, [card, exportable, showToast]);

  const copyJson = useCallback(async () => {
    if (!card || !exportable) return;
    setBusy("json");
    try {
      await copyText(personaToJson(card));
      showToast("JSON copied.");
    } catch {
      showToast("Could not copy JSON.");
    } finally {
      setBusy(null);
    }
  }, [card, exportable, showToast]);

  const live = useMemo(() => {
    if (!card) return "Waiting for a SOUL.md";
    return `${card.name} · ${card.warnings.length ? `${card.warnings.length} notes` : "ready"}`;
  }, [card]);

  return (
    <div className="page">
      <div className="ambient" aria-hidden="true" />
      <Header />
      <SisterStrip current="persona-card" payload={raw} />
      <HandoffBanner onPaste={(text) => { setRaw(text); setSampleId(null); }} />
      <main className="layout">
        <Composer
          raw={raw}
          overrides={overrides}
          sampleId={sampleId}
          dragging={dragging}
          onRawChange={(value) => {
            setSampleId(null);
            setRaw(value);
          }}
          onOverridesChange={(next) => {
            setSampleId(null);
            setOverrides(next);
          }}
          onSample={(id) => void loadSample(id)}
          onPickFile={() => fileRef.current?.click()}
          onDragState={setDragging}
          onDrop={onDrop}
        />
        <section className="stage" aria-label="Persona card">
          <p className="sr-only" aria-live="polite">
            {live}
          </p>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept=".md,.markdown,.txt,.json,text/markdown,text/plain,application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
              event.target.value = "";
            }}
          />
          <div className="stage-scroll">
            <div ref={frameRef} className="export-frame">
              <PersonaCard card={card} />
            </div>
          </div>
          {card ? <p className="stage-stats">{formatCompactStats(card)}</p> : null}
          <Actions
            disabled={!exportable}
            busy={busy}
            onDownload={() => void downloadPng()}
            onCopyShare={() => void copyShare()}
            onCopyJson={() => void copyJson()}
            onReset={reset}
          />
        </section>
      </main>
      <footer className="site-foot">
        <p>Persona Card · SMF Works</p>
        <p>
          Twin:{" "}
          <a href="https://github.com/smfworks/skill-card" rel="noreferrer" target="_blank">
            Skill Card
          </a>
          {" — the playbook · "}
          <a href="https://github.com/smfworks/agent-contract" rel="noreferrer" target="_blank">
            Agent Contract
          </a>
          {" — the agreement · "}
          <a href="https://github.com/smfworks/constraint-card" rel="noreferrer" target="_blank">
            Constraint Card
          </a>
          {" — the constitution."}
        </p>
        <p>Intelligence is abundant. Judgment is the product.</p>
        <p>
          MIT · Built by{" "}
          <a href="https://smfworks.com" rel="noreferrer" target="_blank">
            SMF Works
          </a>
          {" · "}
          <a href="https://github.com/smfworks/persona-card" rel="noreferrer" target="_blank">
            GitHub
          </a>
          {" · "}
          <a href="https://x.com/MichaelGannotti" rel="noreferrer" target="_blank">
            @MichaelGannotti
          </a>
        </p>
        <p className="fineprint">
          No secrets, no monetization, no medical or legal advice. A shareable
          persona card is not an identity registry, not an audit, and not a
          substitute for human review.
        </p>
      </footer>
      <Toast message={toast} />
    </div>
  );
}
