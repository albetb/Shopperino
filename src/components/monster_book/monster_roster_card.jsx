import { useDispatch, useSelector } from 'react-redux';
import Card from '../common/Card';
import Bar from '../common/Bar';
import Pill from '../common/Pill';
import Icon from '../common/Icon';
import IconButton from '../common/IconButton';
import { addCardByLink } from '../../store/slices/appSlice';
import {
  onOpenRosterEntry,
  onRemoveIndividual,
} from '../../store/thunks/monsterBookThunks';
import { MAX_ROSTER_ENTRIES, countIndividuals } from '../../lib/monster/monsterRoster';
import '../../style/monster_book.css';

/**
 * The creatures the master is running right now.
 *
 * The Monster Book used to track exactly one monster: opening a second stat
 * block threw the first one's hit points away, which is the wrong shape for a
 * fight — a fight is rarely one creature. The roster holds up to ten *kinds*,
 * each with its own health bars.
 *
 * **One row per health bar, not one per creature kind.** Eight goblins are
 * eight bars under one heading, because the eight differ only in how hurt they
 * are — everything else about them is shared, and saying it eight times would
 * be eight chances to disagree.
 *
 * It sits above whatever else the tab is showing, so it is equally reachable
 * while browsing the list and while reading one creature's sheet.
 */

/** Which bar colour: the normal gradient, or the red one from 0 down to −10. */
function barVariant(individual) {
  return individual.isDying ? 'danger' : 'hp';
}

export default function MonsterRosterCard() {
  const dispatch = useDispatch();
  const roster = useSelector((state) => state.monsterBook.roster);
  const openIndex = useSelector((state) => state.monsterBook.openIndex);

  if (!roster || roster.length === 0) return null;

  const creatures = countIndividuals(roster);

  return (
    <Card
      title="Roster"
      eyebrow={`${roster.length} / ${MAX_ROSTER_ENTRIES} kinds · ${creatures} creature${creatures === 1 ? '' : 's'}`}
      className="monster-roster"
    >
      <div className="roster-list">
        {roster.map((sheet, entryIndex) => {
          const individuals = sheet.getIndividuals();
          const isOpen = openIndex === entryIndex;
          return (
            <div
              className={`roster-entry${isOpen ? ' is-open' : ''}`}
              key={`${sheet.getRef()}-${entryIndex}`}
            >
              <div className="roster-entry-head">
                <button
                  type="button"
                  className="button-link roster-entry-name"
                  onClick={() => dispatch(addCardByLink({ links: sheet.getRef() }))}
                  title="Show stat block"
                >
                  {sheet.getName()}
                </button>
                <span className="roster-entry-meta">
                  {individuals.length > 1 && (
                    <Pill tone="ghost">&times;{individuals.length}</Pill>
                  )}
                  <IconButton
                    icon="swords"
                    size="sm"
                    onClick={() => dispatch(onOpenRosterEntry(entryIndex))}
                    aria-label={`Open the combat sheet for ${sheet.getName()}`}
                    title="Open combat sheet"
                  />
                </span>
              </div>

              {/* One row per individual. A bar at zero stays here — a dead
                  creature is still on the battlefield until it is cleared
                  away, and the master decides when that is. */}
              {individuals.map((individual) => (
                <div
                  className={`roster-hp${individual.isDying ? ' is-down' : ''}`}
                  key={individual.index}
                >
                  {/* Leading the row rather than trailing it: the delete
                      buttons line up in one column down the left, so a master
                      clearing several creatures is not chasing a target that
                      shifts with the width of each hit-point readout. */}
                  <IconButton
                    icon="close"
                    ghost
                    size="sm"
                    onClick={() => dispatch(onRemoveIndividual(entryIndex, individual.index))}
                    aria-label={
                      individuals.length === 1
                        ? `Remove ${sheet.getName()} from the roster`
                        : `Remove ${sheet.getName()} #${individual.index + 1}`
                    }
                    title={
                      individuals.length === 1
                        ? 'Remove from the roster'
                        : 'Remove this one'
                    }
                  />
                  <span className="sh-faint roster-hp-index">
                    #{individual.index + 1}
                  </span>
                  <Bar value={individual.ratio} variant={barVariant(individual)} />
                  <span className="sh-mono roster-hp-numbers">
                    {individual.currentHp} / {individual.maxHp}
                  </span>
                  {individual.isDying && (
                    <Icon name="skull" size={14} className="sh-faint" />
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
