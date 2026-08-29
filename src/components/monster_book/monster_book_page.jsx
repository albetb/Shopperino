import { useSelector } from 'react-redux';
import MonsterFiltersCard from './monster_filters_card';
import MonsterRosterCard from './monster_roster_card';
import MonsterList from './monster_list';
import MonsterSheetView from './monster_sheet';
import '../../style/monster_book.css';

/**
 * The Monster Book tab. Master-only, and with no control sidebar of its own —
 * the filters live in a card at the top of the page, so the list below gets
 * the full width. Creature names still open stat blocks in the info sidebar.
 *
 * **The roster is always on top**, whichever of the two views is showing. It is
 * the list of what is actually in the fight, so it has to be reachable both
 * while looking for the next creature to add and while running one of them —
 * and being in the same place either way is what makes it readable as a whole.
 *
 * An open sheet still replaces the list rather than sitting beside it: in
 * combat the one monster being run needs the room.
 */
export default function MonsterBookPage() {
  const openIndex = useSelector((state) => state.monsterBook.openIndex);
  const isOpen = openIndex != null;

  return (
    <div className="monster-book-page">
      {isOpen ? (
        <>
          <MonsterRosterCard />
          <MonsterSheetView />
        </>
      ) : (
        <>
          <MonsterFiltersCard />
          <MonsterRosterCard />
          <MonsterList />
        </>
      )}
    </div>
  );
}
