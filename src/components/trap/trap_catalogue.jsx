import { useDispatch, useSelector } from 'react-redux';
import { setTrap, setTrapFilters, setIsCatalogueCollapsed } from '../../store/slices/trapSlice';
import { filterTraps, trapTypeLabel, TRAP_TYPES } from '../../lib/trap';

/**
 * The 105 traps the book prints, filtered.
 *
 * Rolling is a poor way to find a specific trap, and these are good content —
 * so the catalogue browses rather than only feeding the roller. Picking one
 * loads it into the sheet, where its parts can be edited exactly like a rolled
 * one: the two routes produce the same shape and the page cannot tell them
 * apart afterwards.
 */
export default function TrapCatalogue() {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.trap.filters);
  const collapsed = useSelector((s) => s.trap.isCatalogueCollapsed);
  const current = useSelector((s) => s.trap.trap);

  const matches = filterTraps(filters);
  const setFilter = (patch) => dispatch(setTrapFilters(patch));

  return (
    <div className={`card trap-card ${collapsed ? 'collapsed' : ''}`}>
      <div
        className="card-side-div card-expand-div"
        onClick={() => dispatch(setIsCatalogueCollapsed(!collapsed))}
      >
        <h3 className="card-title">
          The book&apos;s traps ({matches.length})
        </h3>
        <button className="collapse-button" aria-label={collapsed ? 'Show the catalogue' : 'Hide the catalogue'}>
          <span className="material-symbols-outlined">
            {collapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="trap-filters">
            <input
              className="modern-input"
              placeholder="Trap name"
              value={filters.name}
              onChange={(e) => setFilter({ name: e.target.value })}
              aria-label="Filter by name"
            />
            <select
              className="modern-dropdown"
              value={filters.type}
              onChange={(e) => setFilter({ type: e.target.value })}
              aria-label="Filter by type"
            >
              <option value="">Any kind</option>
              {TRAP_TYPES.map((t) => (
                <option key={t} value={t}>{trapTypeLabel(t)}</option>
              ))}
            </select>
            <label className="trap-field trap-field-inline">
              <span className="trap-field-label">CR</span>
              <input
                className="modern-input trap-number"
                type="number"
                min="1"
                max="10"
                value={filters.minCR}
                onChange={(e) => setFilter({ minCR: Number(e.target.value) || 1 })}
                aria-label="Lowest CR"
              />
              <span className="trap-field-label">to</span>
              <input
                className="modern-input trap-number"
                type="number"
                min="1"
                max="10"
                value={filters.maxCR}
                onChange={(e) => setFilter({ maxCR: Number(e.target.value) || 10 })}
                aria-label="Highest CR"
              />
            </label>
          </div>

          {matches.length === 0 ? (
            <p className="search-hint">Nothing matches those filters.</p>
          ) : (
            <ul className="trap-list">
              {matches.map((t) => (
                <li key={t.ref}>
                  <button
                    type="button"
                    className={'trap-list-row' + (current?.ref === t.ref ? ' is-current' : '')}
                    onClick={() => dispatch(setTrap({ ...t }))}
                  >
                    <span className="trap-list-cr">CR {t.cr}</span>
                    <span className="trap-list-name">{t.name}</span>
                    <span className="trap-list-type">{trapTypeLabel(t.type)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
