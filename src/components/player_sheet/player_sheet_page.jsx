import { useSelector } from 'react-redux';
import '../../style/shop_inventory.css';
import RaceCards from './race_cards';
import ClassCards from './class_cards';
import NoteEditor from './note_editor';
import CombatPage from './combat_page';
import PlayerSpellsPage from './player_spells_page';
import SkillsPage from './skills_page';
import InventoryPage from './inventory_page';
import FeatsPage from './feats_page';
import FeaturesPage from './features_page';

export default function PlayerSheetPage() {
  const mainView = useSelector(state => state.playerSheet.mainView ?? 'none');

  const defaultContent = (
    <div className="card card-width-spellbook">
      <p className="text-center">
        Select a character from the lateral sidebar, then open the pages using menu buttons.
      </p>
    </div>
  );

  const content =
    mainView === 'race' ? <RaceCards /> :
    mainView === 'class' ? <ClassCards /> :
    mainView === 'note' ? <NoteEditor /> :
    mainView === 'combat' ? <CombatPage /> :
    mainView === 'playerSpells' ? <PlayerSpellsPage /> :
    mainView === 'skills' ? <SkillsPage /> :
    mainView === 'inventory' ? <InventoryPage /> :
    mainView === 'feats' ? <FeatsPage /> :
    mainView === 'features' ? <FeaturesPage /> :
    defaultContent;
  const text =
    mainView === 'race' ? 'Races' :
    mainView === 'class' ? 'Classes' :
    mainView === 'note' ? 'Notes' :
    mainView === 'combat' ? 'Combat' :
    mainView === 'playerSpells' ? 'Spells' :
    mainView === 'skills' ? 'Skills' :
    mainView === 'inventory' ? 'Inventory' :
    mainView === 'feats' ? 'Feats' :
    mainView === 'features' ? 'Features' :
    'Player sheet';

  return (
    <div className="player-sheet-page">
      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--white)', textAlign: 'center' }}>{text}</p>
      {content}
    </div>
  );
}

