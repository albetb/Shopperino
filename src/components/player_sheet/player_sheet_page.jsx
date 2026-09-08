import { useSelector } from 'react-redux';
import { t } from '../../lib/i18n';
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
        {t('Select a character from the lateral sidebar, then open the pages using menu buttons.')}
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
    mainView === 'race' ? t('Races') :
    mainView === 'class' ? t('Classes') :
    mainView === 'note' ? t('Notes') :
    mainView === 'combat' ? t('Combat') :
    mainView === 'playerSpells' ? t('Spells') :
    mainView === 'skills' ? t('Skills') :
    mainView === 'inventory' ? t('Inventory') :
    mainView === 'feats' ? t('Feats') :
    mainView === 'features' ? t('Features') :
    t('Player sheet');

  return (
    <div className={`player-sheet-page ${mainView === 'note' ? 'player-sheet-page--note' : ''}`}>
      {mainView !== 'note' && (
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--white)', textAlign: 'center' }}>{text}</p>
      )}
      {content}
    </div>
  );
}

