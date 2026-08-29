import { useDispatch, useSelector } from 'react-redux';
import { setTrap, setTargetCR, setRollType, setIsTrapSidebarCollapsed } from '../../store/slices/trapSlice';
import { rollTrap, TRAP_TYPES, trapTypeLabel } from '../../lib/trap';
import { isMobile } from '../../lib/utils';
import TrapSheet from './trap_sheet';
import TrapCatalogue from './trap_catalogue';
import '../../style/traps.css';

/**
 * The roll controls, repeated inline for a phone.
 *
 * The Loot generator does the same thing: on a narrow screen the sidebar is
 * skipped entirely and its one card lives at the top of the page, because a
 * drawer you have to open to press the only button on the page is a drawer in
 * the way.
 */
export function TrapRollControls() {
  const dispatch = useDispatch();
  const targetCR = useSelector((s) => s.trap.targetCR);
  const rollType = useSelector((s) => s.trap.rollType);

  const roll = () => {
    dispatch(setTrap(rollTrap({ targetCR, type: rollType })));
    if (isMobile()) dispatch(setIsTrapSidebarCollapsed(true));
  };

  return (
    <div className="trap-roll">
      <label className="trap-field">
        <span className="trap-field-label">Challenge Rating</span>
        <input
          className="modern-input trap-number"
          type="number"
          min="1"
          max="10"
          value={targetCR}
          onChange={(e) => dispatch(setTargetCR(e.target.value))}
          aria-label="Target Challenge Rating"
        />
      </label>
      <label className="trap-field">
        <span className="trap-field-label">Kind</span>
        <select
          className="modern-dropdown"
          value={rollType}
          onChange={(e) => dispatch(setRollType(e.target.value))}
          aria-label="Kind of trap"
        >
          <option value="">Any kind</option>
          {TRAP_TYPES.map((t) => (
            <option key={t} value={t}>{trapTypeLabel(t)}</option>
          ))}
        </select>
      </label>
      <button className="modern-button small-long trap-roll-button" onClick={roll}>
        <b>Roll a trap</b>
      </button>
    </div>
  );
}

/**
 * The trap generator.
 *
 * Two routes into the same sheet — roll one to a target CR, or pick one of the
 * book's 105 — and after that they are the same thing: every element is
 * editable and the CR, the price and the Craft DC follow the edit.
 */
export default function TrapPage() {
  const dispatch = useDispatch();
  const trap = useSelector((s) => s.trap.trap);

  return (
    <div className="trap-page">
      {isMobile() && (
        <div className="card trap-card">
          <TrapRollControls />
        </div>
      )}

      <TrapCatalogue />

      {trap
        ? <TrapSheet trap={trap} onChange={(next) => dispatch(setTrap(next))} />
        : (
          <div className="card trap-card trap-empty">
            <span className="material-symbols-outlined trap-empty-icon">crisis_alert</span>
            <p>
              Roll a trap to a Challenge Rating, or open the book&apos;s 105 and
              pick one. Either way every part of it can then be changed, and the
              CR, the market price and the Craft DC follow.
            </p>
          </div>
        )}
    </div>
  );
}
