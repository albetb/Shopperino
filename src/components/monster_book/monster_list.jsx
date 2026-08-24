import { useDispatch, useSelector } from 'react-redux';
import Card from '../common/Card';
import Pill from '../common/Pill';
import IconButton from '../common/IconButton';
import EmptyState from '../common/EmptyState';
import { addCardByLink } from '../../store/slices/appSlice';
import { onOpenMonsterSheet } from '../../store/thunks/monsterBookThunks';
import { formatCr } from '../../lib/monster/monsterBook';
import '../../style/monster_book.css';

/**
 * The search results. The name opens the creature's stat block in the info
 * sidebar — the same thing every other creature link in the app does — while
 * the button beside it opens the combat sheet in the page.
 */
export default function MonsterList() {
  const dispatch = useDispatch();
  const results = useSelector((state) => state.monsterBook.results);
  const hasSearched = useSelector((state) => state.monsterBook.hasSearched);

  if (!hasSearched) {
    return (
      <EmptyState
        icon="search"
        title="Nothing searched yet"
        hint="Set the filters above and press Search, or Random for a surprise."
      />
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon="filter_alt_off"
        title="No creature matches"
        hint="Widen the challenge rating, or switch another source back on."
      />
    );
  }

  return (
    <Card title="Results" eyebrow={`${results.length} found`} className="monster-results">
      <div className="monster-list" role="list">
        {results.map((creature) => (
          <div key={creature.ref} className="monster-row" role="listitem">
            <button
              type="button"
              className="button-link monster-row-name"
              onClick={() => dispatch(addCardByLink({ links: creature.ref }))}
              title="Show stat block"
            >
              {creature.name}
            </button>
            <span className="monster-row-meta">
              <span className="sh-faint monster-row-tags">
                {creature.size} {creature.type}
              </span>
              <Pill tone="accent">CR {formatCr(creature.challengeRating?.value)}</Pill>
              <IconButton
                icon="swords"
                size="sm"
                onClick={() => dispatch(onOpenMonsterSheet(creature.ref))}
                aria-label={`Open the combat sheet for ${creature.name}`}
                title="Open combat sheet"
              />
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
