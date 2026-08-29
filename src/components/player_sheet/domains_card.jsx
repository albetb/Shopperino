import { useDispatch, useSelector } from 'react-redux';
import parse from 'html-react-parser';
import Card from '../common/Card';
import Pill from '../common/Pill';
import useCardCollapse from './hooks/useCardCollapse';
import { onSetPlayerSpellOption } from '../../store/thunks/playerSheetThunks';
import { loadFile } from '../../lib/loadFile';
import '../../style/domains_card.css';
import { useUnits } from '../hooks/useUnits';

/**
 * Cleric domain granted powers.
 *
 * The granted power each domain confers is a combat-relevant ability the sheet
 * never showed, which is why this card exists. It also picks the domains: it
 * writes the same `domain1` / `domain2` fields as the spellbook's dropdowns and
 * the character-details card, off the same list from the model, so all three
 * stay one setting rather than three. Sending the reader to another tab to
 * fill a gap this card is already showing them was the wrong half of the job.
 *
 * Both slots always render, so an unchosen domain reads as a gap rather than
 * as absent.
 */
export default function DomainsCard() {
  const u = useUnits();
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const [collapsed, collapseToggle] = useCardCollapse('domains', 'domain powers');
  if (player?.getClass?.() !== 'Cleric') return null;

  const powers = loadFile('tables')?.Domains ?? {};
  const slots = [
    { slot: 1, key: 'domain1', label: 'Domain 1', name: player.domain1 ?? '' },
    { slot: 2, key: 'domain2', label: 'Domain 2', name: player.domain2 ?? '' },
  ];

  return (
    <Card
      title="Domain powers"
      className="sh-card--head-spread"
      eyebrow="Granted abilities"
      action={collapseToggle}
    >
      {!collapsed && (
      <div className="sh-stack domains-card">
        {slots.map(({ slot, key, label, name }) => (
          <div key={label} className="domains-card-slot">
            <div className="domains-card-head">
              <span className="domains-card-name">{name || label}</span>
              {!name && <Pill tone="warn">Not chosen</Pill>}
            </div>
            <select
              className="modern-dropdown domains-card-select"
              value={name}
              onChange={(e) => dispatch(onSetPlayerSpellOption(key, e.target.value))}
              aria-label={label}
            >
              <option value="">Select a domain…</option>
              {player.getPossibleDomains(slot).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {name && (
              <div className="domains-card-power">
                {powers[name]
                  ? parse(u.prose(powers[name]))
                  : <span className="sh-faint">No granted power recorded for this domain.</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </Card>
  );
}
