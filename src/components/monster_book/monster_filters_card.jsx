import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '../common/Card';
import Button from '../common/Button';
import RangeSlider from '../common/RangeSlider';
import useCreatureData from '../hooks/useCreatureData';
import {
  SOURCES,
  SIZES,
  TERRAINS,
  formatCr,
  isSourceSelected,
  listChallengeRatings,
  listCreatureTypes,
  toggleSource,
} from '../../lib/monster/monsterBook';
import {
  onSetMonsterFilters,
  onSearchMonsters,
  onRandomMonster,
} from '../../store/thunks/monsterBookThunks';
import '../../style/monster_book.css';

/**
 * The monster book's only control surface — one card at the top of the page
 * rather than a sidebar, so the list below it gets the full width.
 */
export default function MonsterFiltersCard() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.monsterBook.filters);

  /* The CR scale is not evenly spaced (1/4, 1/3, 1/2, then 1..27), so the
     slider steps over indices into this list rather than over the numbers. */
  /* Both lists are read off the bestiary, so they stay empty until its chunk
     lands — hence `ready` in the deps rather than a bare []. */
  const ready = useCreatureData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const crValues = useMemo(() => listChallengeRatings(), [ready]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const types = useMemo(() => listCreatureTypes(), [ready]);

  const indexOfCr = (value) => {
    const i = crValues.indexOf(value);
    return i >= 0 ? i : 0;
  };
  const lowIndex = indexOfCr(filters.crMin);
  const highIndex = crValues.indexOf(filters.crMax) >= 0
    ? crValues.indexOf(filters.crMax)
    : crValues.length - 1;

  const set = (patch) => dispatch(onSetMonsterFilters(patch));

  return (
    <Card title="Find a monster" eyebrow="Bestiary" className="monster-filters">
      <div className="sh-stack">
        {/* Which files to search. All three are on by default; the last one
            cannot be switched off, since a search of nothing finds nothing. */}
        <div className="monster-source-row" role="group" aria-label="Creature sources">
          {SOURCES.map((source, index) => {
            const on = isSourceSelected(filters.sourceMask, index);
            return (
              <button
                key={source.key}
                type="button"
                className={['sh-chip', on && 'is-on'].filter(Boolean).join(' ')}
                aria-pressed={on}
                onClick={() => set({ sourceMask: toggleSource(filters.sourceMask, index) })}
              >
                {source.label}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          className="sh-input"
          placeholder="Search by name…"
          value={filters.name}
          aria-label="Monster name"
          onChange={(e) => set({ name: e.target.value })}
        />

        <div className="monster-filter-grid">
          <label className="sh-field">
            <span className="sh-label">Type</span>
            <select
              className="sh-select"
              value={filters.type}
              onChange={(e) => set({ type: e.target.value })}
            >
              <option value="">Any type</option>
              {types.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>

          <label className="sh-field">
            <span className="sh-label">Size</span>
            <select
              className="sh-select"
              value={filters.size}
              onChange={(e) => set({ size: e.target.value })}
            >
              <option value="">Any size</option>
              {SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>

          <label className="sh-field">
            <span className="sh-label">Terrain</span>
            <select
              className="sh-select"
              value={filters.terrain}
              onChange={(e) => set({ terrain: e.target.value })}
            >
              <option value="">Any terrain</option>
              {TERRAINS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
        </div>

        <RangeSlider
          label="Challenge rating"
          min={0}
          max={Math.max(0, crValues.length - 1)}
          low={lowIndex}
          high={highIndex}
          formatValue={(i) => formatCr(crValues[i])}
          onChange={(nextLow, nextHigh) =>
            set({ crMin: crValues[nextLow], crMax: crValues[nextHigh] })}
        />

        <div className="monster-actions">
          <Button variant="primary" icon="search" onClick={() => dispatch(onSearchMonsters())}>
            Search
          </Button>
          <Button variant="ghost" icon="casino" onClick={() => dispatch(onRandomMonster())}>
            Random
          </Button>
        </div>
      </div>
    </Card>
  );
}
