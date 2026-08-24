import { useDispatch, useSelector } from 'react-redux';
import Card from '../common/Card';
import Pill from '../common/Pill';
import Icon from '../common/Icon';
import IconButton from '../common/IconButton';
import SpellLink from '../common/spell_link';
import { slug } from '../../lib/slugUtils';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import { onSetCombatStyle } from '../../store/thunks/playerSheetThunks';
import '../../style/favored_enemy.css';

/**
 * Ranger combat style.
 *
 * The rules make the choice permanent, so the card presents it as a decision
 * rather than a setting: before choosing it offers the options, after choosing
 * it lists what the style has granted. It can still be cleared — a misclick
 * would otherwise stick to the character forever, and nothing here is enforced.
 * The granted feats come without their prerequisites and are charged to
 * neither feat budget.
 */
export default function CombatStyleCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const collapsed = useSelector(
    (state) => state.playerSheet?.combatPageCardsCollapsed?.combatStyle ?? false
  );
  if (!player?.canChooseCombatStyle?.()) return null;

  const style = player.getCombatStyle();
  const feats = player.getCombatStyleFeats();
  const suppressed = player.isCombatStyleSuppressed();

  return (
    <Card
      title="Combat style"
      className="sh-card--head-spread"
      eyebrow={style ? 'Permanent choice' : `Choose at level ${player.getCombatStyleChoiceLevel()}`}
      action={
        <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
          {style && (
            <IconButton
              icon="restart_alt"
              ghost size="sm"
              onClick={() => dispatch(onSetCombatStyle(''))}
              title="Clear the chosen style"
              aria-label="Clear combat style"
            />
          )}
          <IconButton
            icon={collapsed ? 'expand_more' : 'expand_less'}
            ghost size="sm"
            onClick={() => dispatch(setCombatPageCardCollapsed({ key: 'combatStyle', value: !collapsed }))}
            aria-label="Toggle combat style"
          />
        </span>
      }
    >
      {collapsed ? null : (
      <div className="sh-stack favored-enemy">
        {!style ? (
          <>
            <span className="sh-faint favored-enemy-empty">
              Pick one. The choice is permanent, and each style grants its feats
              free of their usual prerequisites.
            </span>
            <div className="favored-enemy-add">
              <select
                className="sh-select"
                value=""
                aria-label="Combat style"
                onChange={(e) => { if (e.target.value) dispatch(onSetCombatStyle(e.target.value)); }}
              >
                <option value="">Choose a combat style…</option>
                {player.getCombatStyleOptions().map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="favored-enemy-entry">
              <span className="favored-enemy-name">{style}</span>
              <span className="favored-enemy-actions">
                <Pill tone={suppressed ? 'warn' : 'success'} icon={suppressed ? 'warning' : 'check'}>
                  {suppressed ? 'Suppressed' : 'Active'}
                </Pill>
              </span>
            </div>

            {suppressed && (
              <div className="sh-warn-strip">
                <Icon name="shield" />
                Combat style benefits apply only in light armor or none.
              </div>
            )}

            <ul className="favored-enemy-list">
              {feats.map(({ level, feat }) => (
                <li key={feat} className="favored-enemy-entry">
                  <SpellLink link={`feats#${slug(feat)}`}>
                    <span className="favored-enemy-name">{feat}</span>
                  </SpellLink>
                  <span className="favored-enemy-actions">
                    <Pill tone="ghost">Level {level}</Pill>
                  </span>
                </li>
              ))}
            </ul>

            <span className="sh-faint favored-enemy-empty">
              These feats are granted by the class. They cost nothing from either
              feat budget and ignore their normal prerequisites.
            </span>
          </>
        )}
      </div>
      )}
    </Card>
  );
}
