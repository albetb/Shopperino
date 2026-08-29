import { useSelector } from 'react-redux';
import SpellLink from '../common/spell_link';
import { slug } from '../../lib/slugUtils';
import { ATTACK_ACTION_GROUPS } from '../../lib/player/featEffects';
import '../../style/action_feats.css';

/**
 * The feats that grant an **action**, at the foot of the attacks card.
 *
 * Sixteen feats used to reach the sheet nowhere at all. The feat audit was
 * right that they have no number to move — *Cleave* changes no total — but
 * that was read as "no presence", so a character who had taken *Whirlwind
 * attack* had nothing anywhere to remind them of it. These pills are a memory
 * aid, not a rules display: they compute nothing and they claim nothing.
 *
 * **Three labelled groups rather than one row**, because a character with
 * feats in more than one of them wants to find the relevant three at a glance
 * rather than read eight. A group with nothing in it is not drawn at all, so a
 * pure melee character sees one line and no empty headings.
 *
 * Which feat belongs to which group is `ACTION_FEAT_GROUPS` in
 * [featEffects.js](../../lib/player/featEffects.js). Tapping a pill opens the
 * feat in the info sidebar, the same as every other feat link on the sheet.
 */

const GROUP_LABEL = {
  melee: 'melee',
  ranged: 'ranged',
  mounted: 'mounted',
};

export default function ActionFeatsRow() {
  const player = useSelector((state) => state.playerSheet?.player);

  const groups = ATTACK_ACTION_GROUPS
    .map((group) => ({ group, feats: player?.getActionFeats?.(group) ?? [] }))
    .filter(({ feats }) => feats.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="action-feats">
      <span className="sh-eyebrow">Actions</span>
      {groups.map(({ group, feats }) => (
        <div className="action-feats-group" key={group}>
          <span className="sh-faint action-feats-label">{GROUP_LABEL[group]}</span>
          <div className="action-feats-pills">
            {feats.map((feat) => (
              <SpellLink key={feat.name} link={`feats#${slug(feat.name)}`}>
                <span className="action-feat-pill" title={feat.description}>
                  {feat.name}
                </span>
              </SpellLink>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The same thing for the two casting feats, on the spellbook page.
 *
 * *Improved counterspell* and *Eschew materials* both change how a spell is
 * cast rather than what it does, so they belong beside the spells rather than
 * beside the sword. Same pills, no group labels — with only two possible
 * entries there is nothing to group.
 */
export function SpellcastingActionFeats() {
  const player = useSelector((state) => state.playerSheet?.player);
  const feats = player?.getActionFeats?.('spellbook') ?? [];
  if (feats.length === 0) return null;

  return (
    /* Same wrapper as the arcane-failure note above it: the spells page is a
       centred column of fixed-width cards, and a bare div would sit narrow. */
    <div className="card card-width-spellbook action-feats action-feats--inline">
      <span className="sh-eyebrow">Casting</span>
      <div className="action-feats-pills">
        {feats.map((feat) => (
          <SpellLink key={feat.name} link={`feats#${slug(feat.name)}`}>
            <span className="action-feat-pill" title={feat.description}>
              {feat.name}
            </span>
          </SpellLink>
        ))}
      </div>
    </div>
  );
}
