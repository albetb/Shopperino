import SpellbookTable from '../spellbook/spellbook_table';
import '../../style/menu_cards.css';

export default function PlayerSpellsPage() {
  return (
    <div style={{ width: '100%vw', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
      <SpellbookTable source="player" />
    </div>
  );
}
