import { useDispatch, useSelector } from 'react-redux';
import TrackerCard from './tracker_card';
import SpellLink from '../common/spell_link';
import { getFeatureSpell } from '../../lib/player/featureSpells';
import Pill from '../common/Pill';
import Icon from '../common/Icon';
import {
  onUseClassFeature,
  onResetClassFeature,
} from '../../store/thunks/playerSheetThunks';
import '../../style/bardic_music.css';

/**
 * Bardic music: the day's uses and the performances the bard's level has
 * unlocked.
 *
 * A performance still out of reach on Perform ranks stays on the list with the
 * rank that gates it, since that is something the bard can act on. One gated
 * only by level is filtered out by the model — it arrives on its own.
 */
export default function BardicMusicCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const max = player?.getBardicMusicMax?.() ?? 0;
  if (max <= 0) return null;

  const performances = player.getBardicPerformances();
  const knowledge = player.getBardicKnowledgeBonus();
  const inspireCourage = player.getInspireCourageBonus();

  return (
    <TrackerCard
      title="Bardic music"
      collapseKey="bardicMusic"
      used={player.getClassFeatureUsed('bardicMusic')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('bardicMusic', delta))}
      onReset={() => dispatch(onResetClassFeature('bardicMusic'))}
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="accent" icon="menu_book">
          Bardic knowledge d20 {knowledge >= 0 ? '+' : ''}{knowledge}
        </Pill>
      </div>

      <ul className="bardic-performances">
        {performances.map((p) => {
          /* Inspire courage is the one performance whose strength scales, so
             its bonus rides in the row's own tag strip rather than as a
             separate pill detached from the entry it describes. */
          const isInspireCourage = /^inspire courage$/i.test(p.name);
          /* Suggestion, mass suggestion and song of freedom are spells wearing
             a performance's name — link straight to the stat block, since that
             is where the save and the duration are. */
          const spell = getFeatureSpell(p.name);
          return (
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
                  {spell && (
                    <Pill tone="ghost" icon="auto_stories">
                      <SpellLink link={spell.link}>{spell.name}</SpellLink>
                    </Pill>
                  )}
                  {isInspireCourage && <Pill tone="accent">+{inspireCourage}</Pill>}
                  {p.saveDc != null && <Pill tone="accent">DC {p.saveDc}</Pill>}
                  {!p.meetsRanks && <Pill tone="warn">{p.performRanks} Perform</Pill>}
                </span>
              </div>
              <span className="sh-faint bardic-performance-summary">{p.summary}</span>
            </li>
          );
        })}
      </ul>
    </TrackerCard>
  );
}
