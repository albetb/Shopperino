import { useDispatch, useSelector } from 'react-redux';
import { setMasterMode, setStateCurrentTab } from '../../store/slices/appSlice';
import Filigree from '../common/Filigree';
import Pill from '../common/Pill';
import Icon from '../common/Icon';

/* Same order as the nav list in top_menu.jsx — the two must stay in step, or
   the home grid and the menu disagree about where a tool lives. */
export const TILES = [
  { id: 4, icon: 'search',        title: 'Search',          desc: 'Browse spells, items, feats and skills in one place.', masterOnly: false },
  { id: 1, icon: 'shopping_cart', title: 'Shop generator',  desc: 'Randomized shops scaled to the player level.',         masterOnly: true  },
  { id: 3, icon: 'paid',          title: 'Loot generator',  desc: 'Randomized loot scaled to the player level.',          masterOnly: true  },
  { id: 6, icon: 'skull',         title: 'Monster book',    desc: 'Browse the bestiary and track one creature in combat.', masterOnly: true  },
  { id: 7, icon: 'crisis_alert',  title: 'Trap generator',  desc: 'Roll a trap to a challenge rating, or open the book\'s 105.', masterOnly: true  },
  { id: 2, icon: 'auto_stories',  title: 'Spellbook',       desc: 'Organize and track learned spells.',                   masterOnly: false },
  { id: 5, icon: 'badge',         title: 'Player sheet',    desc: 'A mostly automatic D&D 3.5 character sheet.',          masterOnly: false, primary: true },
];

export default function MainPage() {
  const dispatch = useDispatch();
  const isMasterMode = useSelector(state => state.app.isMasterMode);

  const tiles = TILES.filter(t => !t.masterOnly || isMasterMode);

  return (
    <div className="sh-stack sh-home" style={{ padding: 'var(--space-5) 0 var(--space-12)', width: '94%', maxWidth: '54rem', margin: '0 auto' }}>
      <div className="sh-home-hero">
        <Filigree>{isMasterMode ? 'Welcome back, dungeon master' : 'Welcome back, adventurer'}</Filigree>
        <h1 className="sh-display" style={{ fontSize: 'var(--font-size-3xl)', margin: 'var(--space-1) 0' }}>
          Shopperino
        </h1>
        <p className="sh-faint sh-home-tagline" style={{ fontSize: 'var(--font-size-sm)' }}>
          A collection of tools for D&amp;D 3.5
        </p>
      </div>

      <div className="sh-mode-toggle sh-home-toggle" role="group" aria-label="Master / Player mode">
        <button type="button" aria-pressed={isMasterMode}  onClick={() => dispatch(setMasterMode(true))}>Master</button>
        <button type="button" aria-pressed={!isMasterMode} onClick={() => dispatch(setMasterMode(false))}>Player</button>
      </div>

      <div className="sh-home-grid">
        {tiles.map(t => (
          <button
            key={t.id}
            type="button"
            className={`sh-tile ${t.primary ? 'sh-tile--master' : ''}`}
            onClick={() => dispatch(setStateCurrentTab(t.id))}
          >
            <Icon name={t.icon} />
            <span className="t-name">{t.title}</span>
            <span className="t-desc">{t.desc}</span>
            {t.masterOnly && <Pill tone="accent" className="sh-tile-tag">Master</Pill>}
          </button>
        ))}
      </div>

      <p className="sh-faint" style={{ fontSize: 'var(--font-size-xs)', textAlign: 'center', marginTop: 'var(--space-6)' }}>
        Bugs or inaccurate descriptions?{' '}
        <a
          href="https://github.com/albetb/Shopperino/issues"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent)' }}
        >Open an issue on GitHub.</a>
      </p>
    </div>
  );
}
