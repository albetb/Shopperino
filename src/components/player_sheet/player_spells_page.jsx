import SpellbookTable from '../spellbook/spellbook_table';

export default function PlayerSpellsPage() {
  // Plain flex column with align-items: center so the cards center the same
  // way they do on the main Spellbook tab (which renders directly inside
  // .app-header with align-items: center). No gap here — each card already
  // carries margin-bottom: var(--space-4) via .card-width-spellbook, and
  // stacking the two spacings made the page look uneven.
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 'var(--space-2)',
        paddingBottom: 'var(--space-8)',
      }}
    >
      <SpellbookTable source="player" />
    </div>
  );
}
