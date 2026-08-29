import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isMobile } from '../../lib/utils';
import {
  getRaceNames,
  getRaceTraits,
  getRaceSummary,
  getAppliedRacialCategories,
} from '../../lib/player/racialTraits';
import { onSetCharacterRace } from '../../store/thunks/playerSheetThunks';
import { setIsPlayerSheetSidebarCollapsed } from '../../store/slices/playerSheetSlice';
import '../../style/menu_cards.css';
import '../../style/race_cards.css';
import { useUnits } from '../hooks/useUnits';

/**
 * The race picker, rendered from [races.json](../../data/races.json).
 *
 * It used to render a hand-typed `RACE_INFO` object of 74 lines living in this
 * file — a third copy of facts races.json already held twice, in its structured
 * keys and in its `traits` prose. Nothing kept the three in step, and this was
 * the copy a player actually read, so a correction to the data never reached
 * the screen. There is one source now.
 *
 * The head carries the facts the sheet computes with — ability modifiers, size,
 * speed — so the card cannot disagree with the numbers on the sheet. The prose
 * below is the `traits` array, and the footer names which categories the sheet
 * applies on its own, so nobody has to guess which lines are already in their
 * totals.
 */

const ABILITY_LABELS = {
  str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha',
};

const signed = (value) => `${value >= 0 ? '+' : ''}${value}`;

/** A list read as a sentence: "a, b and c". */
function asSentence(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function RaceCard({ name, isCurrent, onSelect }) {
  const u = useUnits();
  const [collapsed, setCollapsed] = useState(true);
  const traits = useMemo(() => getRaceTraits(name), [name]);
  const summary = useMemo(() => getRaceSummary(name), [name]);
  const applied = useMemo(() => getAppliedRacialCategories(name), [name]);

  return (
    <div className={`card card-width-spellbook ${collapsed ? 'collapsed' : ''}`}>
      <div className="card-side-div card-expand-div" onClick={() => setCollapsed((v) => !v)}>
        <h3 className="card-title">{name}</h3>
        {/* Readable with the card shut: what a race costs and gives in one
            line is the whole question when choosing one. */}
        <span className="race-card-glance">
          {summary.abilityModifiers.map(({ key, value }) => (
            <span
              key={key}
              className={value > 0 ? 'race-mod is-up' : 'race-mod is-down'}
            >
              {signed(value)} {ABILITY_LABELS[key] ?? key}
            </span>
          ))}
        </span>
        <button type="button" className="collapse-button" aria-label={`Toggle ${name}`}>
          <span className="material-symbols-outlined">
            {collapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>

      {!collapsed && (
        <div className="card-content">
          <div className="race-card-facts">
            {summary.size && <span className="race-fact">{summary.size}</span>}
            {summary.landSpeed > 0 && (
              <span className="race-fact">{u.distance(summary.landSpeed)} speed</span>
            )}
            {summary.favoredClass && (
              <span className="race-fact">favored class: {summary.favoredClass}</span>
            )}
          </div>
          {summary.speedNote && <p className="race-card-note">{u.text(summary.speedNote)}</p>}

          {traits.map((trait) => (
            <p key={trait.name || trait.description} className="text-left">
              {trait.name && <strong>{trait.name}: </strong>}
              {trait.description}
            </p>
          ))}

          {applied.length > 0 && (
            <p className="race-card-applied">
              Applied to your sheet automatically: {asSentence(applied)}.
            </p>
          )}

          <div className="card-side-div buttons-row-center margin-top">
            <button
              type="button"
              className="modern-button small-long"
              onClick={onSelect}
              disabled={isCurrent}
            >
              Select
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RaceCards() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet.player);
  const currentRace = player?.getRace?.() ?? '';
  const races = useMemo(() => getRaceNames(), []);

  const handleSelect = (name) => {
    dispatch(onSetCharacterRace(name));
    if (isMobile()) dispatch(setIsPlayerSheetSidebarCollapsed(true));
  };

  return (
    <div className="player-sheet-race-cards">
      {races.map((name) => (
        <RaceCard
          key={name}
          name={name}
          isCurrent={currentRace === name}
          onSelect={() => handleSelect(name)}
        />
      ))}
    </div>
  );
}
