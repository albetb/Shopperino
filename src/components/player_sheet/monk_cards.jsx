import { useDispatch, useSelector } from 'react-redux';
import TrackerCard from './tracker_card';
import Pill from '../common/Pill';
import {
  onUseClassFeature,
  onResetClassFeature,
} from '../../store/thunks/playerSheetThunks';

/**
 * Stunning fist — a per-day use counter carrying the save DC, which scales
 * with both level and Wisdom and is the number the table actually needs.
 *
 * Ki strike and slow fall have no counter of their own, so they ride along as
 * pills here rather than each taking a card. Both appear only once gained.
 */
export function StunningFistCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const max = player?.getStunningFistMax?.() ?? 0;
  if (max <= 0) return null;

  const kiStrike = player.getKiStrikeTier();
  const slowFall = player.getSlowFallDistance();

  return (
    <TrackerCard
      title="Stunning fist"
      used={player.getClassFeatureUsed('stunningFist')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('stunningFist', delta))}
      onReset={() => dispatch(onResetClassFeature('stunningFist'))}
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="accent" icon="shield_person">
          Fortitude DC {player.getStunningFistDc()}
        </Pill>
        {kiStrike && (
          <Pill tone="accent" icon="auto_awesome">Ki strike: {kiStrike}</Pill>
        )}
        {slowFall > 0 && (
          <Pill tone="success" icon="paragliding">
            Slow fall {slowFall === Infinity ? 'any height' : `${slowFall} ft`}
          </Pill>
        )}
      </div>
      <span className="sh-faint tracker-card-note">
        A stunned target loses its next action, is denied its Dexterity bonus and
        takes −2 AC for a round. One attempt per round, declared before the roll.
      </span>
    </TrackerCard>
  );
}

/**
 * Wholeness of body — a spendable hit point pool, the same shape as the
 * paladin's lay on hands but usable only on the monk themselves.
 */
export function WholenessOfBodyCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const max = player?.getWholenessOfBodyMax?.() ?? 0;
  if (max <= 0) return null;

  return (
    <TrackerCard
      title="Wholeness of body"
      variant="pool"
      unit="hp"
      used={player.getClassFeatureUsed('wholenessOfBody')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('wholenessOfBody', delta))}
      onReset={() => dispatch(onResetClassFeature('wholenessOfBody'))}
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="success" icon="healing">
          {player.getWholenessOfBodyRemaining()} hp to heal
        </Pill>
      </div>
      <span className="sh-faint tracker-card-note">
        Heals the monk alone, in any split across the day.
      </span>
    </TrackerCard>
  );
}
