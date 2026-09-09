import { useDispatch, useSelector } from 'react-redux';
import { setMasterMode, setStateCurrentTab } from '../../store/slices/appSlice';
import { t } from '../../lib/i18n';
import Filigree from '../common/Filigree';
import Pill from '../common/Pill';
import Icon from '../common/Icon';

/* Same order as the nav list in top_menu.jsx — the two must stay in step, or
   the home grid and the menu disagree about where a tool lives. */
export const TILES = [
  { id: 8, icon: 'menu_book',     title: 'Rules reference', desc: 'Read and search the D&D 3.5 rules, condensed by topic.',   masterOnly: false },
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

  const tiles = TILES.filter(tile => !tile.masterOnly || isMasterMode);

  return (
    <div className="sh-stack sh-home" style={{ padding: 'var(--space-5) 0 var(--space-12)', width: '94%', maxWidth: '54rem', margin: '0 auto' }}>
      <div className="sh-home-hero">
        <Filigree>{isMasterMode ? t('Welcome back, dungeon master') : t('Welcome back, adventurer')}</Filigree>
        <h1 className="sh-display" style={{ fontSize: 'var(--font-size-3xl)', margin: 'var(--space-1) 0' }}>
          {t('Shopperino')}
        </h1>
        <p className="sh-faint sh-home-tagline" style={{ fontSize: 'var(--font-size-sm)' }}>
          {t('A collection of tools for D&D 3.5')}
        </p>
      </div>

      <div className="sh-mode-toggle sh-home-toggle" role="group" aria-label={t('Master / Player mode')}>
        <button type="button" aria-pressed={isMasterMode}  onClick={() => dispatch(setMasterMode(true))}>{t('Master', 'mode')}</button>
        <button type="button" aria-pressed={!isMasterMode} onClick={() => dispatch(setMasterMode(false))}>{t('Player')}</button>
      </div>

      <div className="sh-home-grid">
        {tiles.map(tile => (
          <button
            key={tile.id}
            type="button"
            className={`sh-tile ${tile.primary ? 'sh-tile--master' : ''}`}
            onClick={() => dispatch(setStateCurrentTab(tile.id))}
          >
            <Icon name={tile.icon} />
            <span className="t-name">{t(tile.title)}</span>
            <span className="t-desc">{t(tile.desc)}</span>
            {tile.masterOnly && <Pill tone="accent" className="sh-tile-tag">{t('Master', 'mode')}</Pill>}
          </button>
        ))}
      </div>

      <p className="sh-faint" style={{ fontSize: 'var(--font-size-xs)', textAlign: 'center', marginTop: 'var(--space-6)' }}>
        {t('Bugs or inaccurate descriptions?')}{' '}
        <a
          href="https://github.com/albetb/Shopperino/issues"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent)' }}
        >{t('Open an issue on GitHub.')}</a>
      </p>
    </div>
  );
}
