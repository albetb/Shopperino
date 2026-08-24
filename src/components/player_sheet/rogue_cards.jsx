import { useDispatch, useSelector } from 'react-redux';
import Card from '../common/Card';
import Pill from '../common/Pill';
import useCardCollapse from './hooks/useCardCollapse';
import { onSetRogueSpecialAbility } from '../../store/thunks/playerSheetThunks';
import '../../style/rogue_cards.css';

/**
 * Rogue special abilities — one pick at 10th level and every third level after.
 *
 * Each level gets its own dropdown rather than a shared list, because which
 * ability was taken *when* is what the sheet has to remember. An ability
 * already taken at another level is disabled; the "Feat" option is not, since
 * a rogue may trade more than one special ability for a bonus feat.
 *
 * Taking Feat widens the general feat budget by one, so the Feats tab shows the
 * extra slot — the SRD puts no restriction on what that feat may be.
 */
export default function RogueSpecialAbilitiesCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const [collapsed, collapseToggle] = useCardCollapse('rogueSpecialAbilities', 'special abilities');

  const levels = player?.getRogueSpecialAbilityLevels?.() ?? [];
  if (levels.length === 0) return null;

  const options = player.getRogueSpecialAbilityOptions();
  const chosen = player.getRogueSpecialAbilities();
  const featSlots = player.getRogueBonusFeatSlots();

  return (
    <Card
      title="Special abilities"
      className="sh-card--head-spread"
      eyebrow={`${chosen.length} of ${levels.length} chosen`}
      action={collapseToggle}
    >
      {!collapsed && (
        <div className="sh-stack rogue-abilities">
          {levels.map((level) => {
            const current = player.getRogueSpecialAbility(level);
            const description = current ? player.getRogueSpecialAbilityDescription(current) : '';
            return (
              <div key={level} className="rogue-ability-slot">
                <label className="sh-field rogue-ability-field">
                  <span className="sh-label">Level {level}</span>
                  <select
                    className="sh-select"
                    value={current}
                    aria-label={`Special ability gained at level ${level}`}
                    onChange={(e) => dispatch(onSetRogueSpecialAbility(level, e.target.value))}
                  >
                    <option value="">— not chosen —</option>
                    {options.map((option) => {
                      /* Only the named abilities are once-each; the feat
                         option can be taken at more than one level. */
                      const takenElsewhere = option !== 'Feat'
                        && chosen.some((c) => c.ability === option && c.level !== level);
                      return (
                        <option key={option} value={option} disabled={takenElsewhere}>
                          {option === 'Feat' ? 'A feat instead' : option}
                          {takenElsewhere ? ' (already taken)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </label>
                {description && (
                  <p className="sh-faint rogue-ability-description">{description}</p>
                )}
              </div>
            );
          })}

          {featSlots > 0 && (
            <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Pill tone="accent" icon="auto_awesome">
                +{featSlots} feat slot{featSlots === 1 ? '' : 's'} in the Feats tab
              </Pill>
            </div>
          )}

          <span className="sh-faint tracker-card-note">
            One pick at each level, and each named ability only once. Trading a
            pick for a feat may be done more than once.
          </span>
        </div>
      )}
    </Card>
  );
}
