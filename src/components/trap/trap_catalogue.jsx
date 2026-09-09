import { useDispatch, useSelector } from 'react-redux';
import { t, tx } from '../../lib/i18n';
import { trapName, trapTerm } from '../../lib/i18n/trapText';
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

  /* The name filter is applied here rather than in `filterTraps`, so it can
     read both languages: a reader typing *lame* is looking for the Blade Trap,
     and the model has no business knowing what language they are typing in. */
  const needle = String(filters.name || '').trim().toLowerCase();
  const matches = filterTraps({ ...filters, name: '' }).filter((trap) => (
    !needle
    || trap.name.toLowerCase().includes(needle)
    || trapName(trap.name).toLowerCase().includes(needle)
  ));
  const setFilter = (patch) => dispatch(setTrapFilters(patch));

  return (
    <div className={`card trap-card ${collapsed ? 'collapsed' : ''}`}>
      <div
        className="card-side-div card-expand-div"
        onClick={() => dispatch(setIsCatalogueCollapsed(!collapsed))}
      >
        <h3 className="card-title">
          {tx("The book's traps ({0})", matches.length)}
        </h3>
        <button className="collapse-button" aria-label={collapsed ? t('Show the catalogue') : t('Hide the catalogue')}>
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
              placeholder={t('Trap name')}
              value={filters.name}
              onChange={(e) => setFilter({ name: e.target.value })}
              aria-label={t('Filter by name')}
            />
            <select
              className="modern-dropdown"
              value={filters.type}
              onChange={(e) => setFilter({ type: e.target.value })}
              aria-label={t('Filter by type')}
            >
              <option value="">{t('Any kind')}</option>
              {TRAP_TYPES.map((type) => (
                <option key={type} value={type}>{trapTerm(trapTypeLabel(type))}</option>
              ))}
            </select>
            <label className="trap-field trap-field-inline">
              <span className="trap-field-label">{t('CR')}</span>
              <input
                className="modern-input trap-number"
                type="number"
                min="1"
                max="10"
                value={filters.minCR}
                onChange={(e) => setFilter({ minCR: Number(e.target.value) || 1 })}
                aria-label={t('Lowest CR')}
              />
              <span className="trap-field-label">{t('to', 'range')}</span>
              <input
                className="modern-input trap-number"
                type="number"
                min="1"
                max="10"
                value={filters.maxCR}
                onChange={(e) => setFilter({ maxCR: Number(e.target.value) || 10 })}
                aria-label={t('Highest CR')}
              />
            </label>
          </div>

          {matches.length === 0 ? (
            <p className="search-hint">{t('Nothing matches those filters.')}</p>
          ) : (
            <ul className="trap-list">
              {matches.map((trap) => (
                <li key={trap.ref}>
                  <button
                    type="button"
                    className={'trap-list-row' + (current?.ref === trap.ref ? ' is-current' : '')}
                    onClick={() => dispatch(setTrap({ ...trap }))}
                  >
                    <span className="trap-list-cr">{t('CR')} {trap.cr}</span>
                    <span className="trap-list-name">{trapName(trap.name)}</span>
                    <span className="trap-list-type">{trapTerm(trapTypeLabel(trap.type))}</span>
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
