import { useDispatch, useSelector } from 'react-redux';
import Card from '../common/Card';
import Pill from '../common/Pill';
import IconButton from '../common/IconButton';
import EmptyState from '../common/EmptyState';
import { addCardByLink } from '../../store/slices/appSlice';
import { onAddMonsterToRoster } from '../../store/thunks/monsterBookThunks';
import { formatCr } from '../../lib/monster/monsterBook';
import '../../style/monster_book.css';
import { t, tx, tName } from '../../lib/i18n';

/**
 * The search results. The name opens the creature's stat block in the info
 * sidebar — the same thing every other creature link in the app does — while
 * the button beside it **adds the creature to the roster**.
 *
 * It used to open the combat sheet directly, which threw away whatever was
 * already being tracked. Adding a creature that is already on the roster gives
 * it another individual, so an encounter of eight goblins is eight presses of
 * the same button.
 */
export default function MonsterList() {
  const dispatch = useDispatch();
  const results = useSelector((state) => state.monsterBook.results);
  const hasSearched = useSelector((state) => state.monsterBook.hasSearched);

  if (!hasSearched) {
    return (
      <EmptyState
        icon="search"
        title={t('Nothing searched yet')}
        hint={t('Set the filters above and press Search, or Random for a surprise.')}
      />
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon="filter_alt_off"
        title={t('No creature matches')}
        hint={t('Widen the challenge rating, or switch another source back on.')}
      />
    );
  }

  return (
    <Card title={t('Results')} eyebrow={tx('{0} found', results.length)} className="monster-results">
      <div className="monster-list" role="list">
        {results.map((creature) => (
          <div key={creature.ref} className="monster-row" role="listitem">
            <button
              type="button"
              className="button-link monster-row-name"
              onClick={() => dispatch(addCardByLink({ links: creature.ref }))}
              title={t('Show stat block')}
            >
              {creature.name}
            </button>
            <span className="monster-row-meta">
              <span className="sh-faint monster-row-tags">
                {tName('sizes', creature.size)} {tName('creatureTypes', creature.type)}
              </span>
              <Pill tone="accent">{tx('CR {0}', formatCr(creature.challengeRating?.value))}</Pill>
              <IconButton
                icon="add"
                size="sm"
                onClick={() => dispatch(onAddMonsterToRoster(creature.ref))}
                aria-label={tx('Add {0} to the roster', creature.name)}
                title={t('Add to the roster')}
              />
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
