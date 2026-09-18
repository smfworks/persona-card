export function Header() {
  return (
    <header className="mast">
      <div className="mast-brand">
        <span className="mark" aria-hidden="true" />
        <div>
          <p className="eyebrow">SMF Works · Human-AI lab</p>
          <h1>Persona Card</h1>
        </div>
      </div>
      <p className="lede">
        Paste a SOUL.md or system prompt. Print a persona one-pager. Skill
        Card’s twin for agents — name, role, voice, values, boundaries.
      </p>
    </header>
  );
}
