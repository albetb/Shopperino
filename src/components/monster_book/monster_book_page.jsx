import { useSelector } from 'react-redux';
import MonsterFiltersCard from './monster_filters_card';
import MonsterList from './monster_list';
import MonsterSheetView from './monster_sheet';
import '../../style/monster_book.css';

/**
 * The Monster Book tab. Master-only, and with no control sidebar of its own —
 * the filters live in a card at the top of the page, so the list below gets
 * the full width. Creature names still open stat blocks in the info sidebar.
 *
 * An open sheet replaces the list rather than sitting beside it: in combat the
 * one monster being run is all that matters, and the sheet needs the room.
 */
export default function MonsterBookPage() {
  const sheet = useSelector((state) => state.monsterBook.sheet);

  return (
    <div className="monster-book-page">
      {sheet ? (
        <MonsterSheetView />
      ) : (
        <>
          <MonsterFiltersCard />
          <MonsterList />
        </>
      )}
    </div>
  );
}
