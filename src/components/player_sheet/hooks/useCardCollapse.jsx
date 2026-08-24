import { useDispatch, useSelector } from 'react-redux';
import { setCombatPageCardCollapsed } from '../../../store/slices/playerSheetSlice';
import IconButton from '../../common/IconButton';

/**
 * Collapse state for one combat-page card, plus the chevron that toggles it.
 *
 * Every card on the page collapses, and each one reads the same slice of
 * `combatPageCardsCollapsed`, so the wiring lives here rather than being
 * repeated per card. `key` must be listed in COMBAT_PAGE_CARD_KEYS — both in
 * the slice and in lib/storage.js — or the state will not persist.
 *
 * @param {string} key the card's key in `combatPageCardsCollapsed`
 * @param {string} label used for the button's accessible name
 * @returns {[boolean, React.ReactNode]} the collapsed flag and the toggle button
 */
export default function useCardCollapse(key, label) {
  const dispatch = useDispatch();
  const collapsed = useSelector(
    (state) => state.playerSheet?.combatPageCardsCollapsed?.[key] ?? false
  );
  const toggle = (
    <IconButton
      icon={collapsed ? 'expand_more' : 'expand_less'}
      ghost
      size="sm"
      onClick={() => dispatch(setCombatPageCardCollapsed({ key, value: !collapsed }))}
      aria-label={`Toggle ${label}`}
    />
  );
  return [collapsed, toggle];
}
