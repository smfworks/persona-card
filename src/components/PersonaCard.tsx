import type { PersonaCardModel } from "../types";
import { formatStampTime } from "../lib/share";

interface PersonaCardProps {
  card: PersonaCardModel | null;
}

function barcodeBars(id: string): number[] {
  const bars: number[] = [];
  for (let i = 0; i < 34; i += 1) {
    const code = id.charCodeAt(i % id.length) + i * 13;
    bars.push(1 + (code % 4));
  }
  return bars;
}

export function PersonaCard({ card }: PersonaCardProps) {
  const ready = Boolean(card && card.name && card.name !== "Untitled persona");
  const tone = card ? (ready ? "is-ready" : "is-warn") : "is-empty";

  return (
    <article className={`ticket ${tone}`}>
      <div className="ticket-rail" aria-hidden="true" />
      <header className="ticket-head">
        <div>
          <p className="r-kicker">Agent persona</p>
          <h2>Persona Card</h2>
        </div>
        <p className="ticket-seq">{card?.id ?? "PC-————"}</p>
      </header>

      <div className="perf" aria-hidden="true">
        <span />
      </div>

      <div className="ticket-body">
        <section className="r-hero">
          <div className="persona-head">
            <div>
              <p className="r-label">Name</p>
              <h3>{card?.name ?? "Waiting for a SOUL.md"}</h3>
            </div>
            {card?.role ? <span className="role-chip">{card.role}</span> : null}
          </div>
          <p className="r-summary">
            {card?.tagline || "Paste a persona. Print a card. Share the soul — not the secrets."}
          </p>
        </section>

        {card && card.tools.length > 0 ? (
          <ul className="pill-row" aria-label="Domain focus">
            {card.tools.map((tool) => (
              <li key={tool} className="pill">
                {tool}
              </li>
            ))}
          </ul>
        ) : null}

        <section className="r-block">
          <p className="r-label">Voice</p>
          {card ? (
            card.voice.length ? (
              <ul>
                {card.voice.map((line) => (
                  <li key={line}>
                    <span className="mark-tick">▸</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="r-placeholder">No voice bullets yet — add a ## Voice section.</p>
            )
          ) : (
            <p className="r-placeholder">Tone, cadence, and how the agent speaks.</p>
          )}
        </section>

        <section className="r-block">
          <p className="r-label">Values</p>
          {card ? (
            card.values.length ? (
              <ul>
                {card.values.map((line) => (
                  <li key={line}>
                    <span className="mark-tick">▸</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="r-placeholder">No values yet — add a ## Values section.</p>
            )
          ) : (
            <p className="r-placeholder">What the agent will not trade away.</p>
          )}
        </section>

        <section className="r-block">
          <p className="r-label">Boundaries</p>
          {card && (card.must.length || card.mustNot.length) ? (
            <div className="bound-grid">
              {card.must.length ? (
                <div className="bound-col is-must">
                  <p className="bound-kicker">Must</p>
                  <ul>
                    {card.must.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {card.mustNot.length ? (
                <div className="bound-col is-deny">
                  <p className="bound-kicker">Must not</p>
                  <ul>
                    {card.mustNot.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="r-placeholder">
              {card
                ? "No must / must-not lines yet. The card still prints."
                : "Hard yes and hard no. Pair with Constraint Card if you need a constitution."}
            </p>
          )}
        </section>

        {card?.signature ? (
          <section className="signature">
            <p className="r-label">Signature</p>
            <p className="signature-line">{card.signature}</p>
          </section>
        ) : null}

        {card && card.warnings.length ? (
          <section className="coupon">
            <p className="r-label">Lab note</p>
            {card.warnings.slice(0, 3).map((line) => (
              <p key={line} className="coupon-line">
                {line}
              </p>
            ))}
          </section>
        ) : null}
      </div>

      <div className="perf" aria-hidden="true">
        <span />
      </div>

      <div className="barcode" aria-hidden="true">
        {barcodeBars(card?.id ?? "PC-0000").map((width, index) => (
          <i key={index} style={{ width }} />
        ))}
      </div>

      <footer className="r-foot">
        <p>SMF Works · Persona Card</p>
        <p className="r-link">smfworks.com</p>
        <p className="r-motto">
          {card ? formatStampTime(card.printedAt) : "Lab artifact · not an identity registry"}
        </p>
        <p className="r-motto">Judgment stays human.</p>
      </footer>
    </article>
  );
}
