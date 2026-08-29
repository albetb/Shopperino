import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '../common/Card';
import Pill from '../common/Pill';
import Icon from '../common/Icon';
import InfoPopover from '../common/InfoPopover';
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
  /* Which descriptions are open, by level. Local rather than persisted: it is a
     reading position, not a setting, and every slot starts closed so the card
     reads as the list of picks it is. */
  const [openLevels, setOpenLevels] = useState({});
  const toggleLevel = (level) =>
    setOpenLevels((prev) => ({ ...prev, [level]: !prev[level] }));

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
      action={
        <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
          <InfoPopover label="Rogue special abilities">
            <p>
              At 10th level and every third level after, a rogue takes one
              special ability. Each named ability may be taken{' '}
              <b>only once</b>.
            </p>
            <p>
              A pick may be traded for a <b>bonus feat</b> instead, and that
              trade may be made more than once — each one widens the general
              feat budget by a slot, with no restriction on what fills it.
            </p>
          </InfoPopover>
          {collapseToggle}
        </span>
      }
    >
      {!collapsed && (
        <div className="sh-stack rogue-abilities">
          {levels.map((level) => {
            const current = player.getRogueSpecialAbility(level);
            const description = current ? player.getRogueSpecialAbilityDescription(current) : '';
            const open = !!openLevels[level];
            return (
              <div key={level} className="rogue-ability-slot">
                <label className="sh-field rogue-ability-field">
                  {/* The level leads the row as a compact badge: it is the one
                      fixed thing about the slot, and a full "Level 10" label
                      took a third of the row from the choice itself. */}
                  <Pill tone="accent" className="rogue-ability-level">Lv {level}</Pill>
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
                {/* Each description folds away on its own. Six of them open at
                    once is a wall of prose on a card whose job is the picks. */}
                {description && (
                  <>
                    <button
                      type="button"
                      className="rogue-ability-toggle"
                      aria-expanded={open}
                      onClick={() => toggleLevel(level)}
                    >
                      <Icon name={open ? 'expand_less' : 'expand_more'} size={16} />
                      {open ? 'Hide' : 'What it does'}
                    </button>
                    {open && <p className="sh-faint rogue-ability-description">{description}</p>}
                  </>
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
        </div>
      )}
    </Card>
  );
}
