import SpellbookTable from '../spellbook/spellbook_table';

export default function PlayerSpellsPage() {
  return (
    <div className="sh-stack" style={{ width: '100%', padding: 'var(--space-4)', paddingBottom: 'var(--space-12)' }}>
      <SpellbookTable source="player" />
    </div>
  );
}
