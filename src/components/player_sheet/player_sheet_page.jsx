import { useSelector } from 'react-redux';
import '../../style/shop_inventory.css';
import RaceCards from './race_cards';
import ClassCards from './class_cards';

export default function PlayerSheetPage() {
  const mainView = useSelector(state => state.playerSheet.mainView ?? 'none');

  const defaultContent = (
    <div className="card">
      <p className="text-center">
        Use the sidebar to create/select a character, then open Race or Class cards with the magnifying glass.
      </p>
    </div>
  );

  const content = mainView === 'race' ? <RaceCards /> : mainView === 'class' ? <ClassCards /> : defaultContent;

  return (
    <div className="player-sheet-page">
      <h1>Player sheet</h1>
      <p className="main-intro">D&D 3.5 character sheet (work in progress).</p>
      {content}
    </div>
  );
}

