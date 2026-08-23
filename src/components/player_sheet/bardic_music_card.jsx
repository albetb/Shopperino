import { useDispatch, useSelector } from 'react-redux';
import TrackerCard from './tracker_card';
import Pill from '../common/Pill';
import Icon from '../common/Icon';
import {
  onUseClassFeature,
  onResetClassFeature,
} from '../../store/thunks/playerSheetThunks';
import '../../style/bardic_music.css';

/**
 * Bardic music: the day's uses and the full performance list.
 *
 * Locked performances stay on the list with the prerequisite that gates them,
 * so a bard can see what the next rank of Perform buys. Which gate is unmet —
 * level, ranks, or both — is decided by the model.
 */
export default function BardicMusicCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const max = player?.getBardicMusicMax?.() ?? 0;
  if (max <= 0) return null;

  const performances = player.getBardicPerformances();
  const knowledge = player.getBardicKnowledgeBonus();

  return (
    <TrackerCard
      title="Bardic music"
      used={player.getClassFeatureUsed('bardicMusic')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('bardicMusic', delta))}
      onReset={() => dispatch(onResetClassFeature('bardicMusic'))}
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="accent" icon="menu_book">
          Bardic knowledge d20 {knowledge >= 0 ? '+' : ''}{knowledge}
        </Pill>
        <Pill tone="accent" icon="campaign">
          Inspire courage +{player.getInspireCourageBonus()}
        </Pill>
      </div>

      <ul className="bardic-performances">
        {performances.map((p) => (
          <li
            key={p.name}
            className={p.available ? 'bardic-performance' : 'bardic-performance is-locked'}
          >
            <div className="bardic-performance-head">
              <span className="bardic-performance-name">
                {!p.available && <Icon name="lock" size={14} />}
                {p.name}
              </span>
              <span className="bardic-performance-tags">
                {p.saveDc != null && <Pill tone="accent">DC {p.saveDc}</Pill>}
                {!p.meetsLevel && <Pill tone="warn">Level {p.level}</Pill>}
                {!p.meetsRanks && <Pill tone="warn">{p.performRanks} Perform</Pill>}
              </span>
            </div>
            <span className="sh-faint bardic-performance-summary">{p.summary}</span>
          </li>
        ))}
      </ul>
    </TrackerCard>
  );
}
