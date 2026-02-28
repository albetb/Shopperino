import { useSelector } from 'react-redux';
import '../../style/shop_inventory.css';
import RaceCards from './race_cards';
import ClassCards from './class_cards';
import NoteEditor from './note_editor';

export default function PlayerSheetPage() {
  const mainView = useSelector(state => state.playerSheet.mainView ?? 'none');
  const playerName = useSelector(state => state.playerSheet.player.name ?? '');

  const defaultContent = (
    <div className="card">
      <p className="text-center">
        Use the sidebar to create/select a character, then open Race or Class cards with the magnifying glass.
      </p>
    </div>
  );

  const content =
    mainView === 'race' ? <RaceCards /> :
    mainView === 'class' ? <ClassCards /> :
    mainView === 'note' ? <NoteEditor /> :
    defaultContent;
  const text =
    mainView === 'race' ? "Races" :
    mainView === 'class' ? "Classes" :
    mainView === 'note' ? "Notes" :
    defaultContent;

  return (
    <div className="player-sheet-page">
      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--white)', textAlign: 'center' }}>{text}</p>
      {content}
    </div>
  );
}

