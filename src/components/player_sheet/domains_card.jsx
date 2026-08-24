import { useSelector } from 'react-redux';
import parse from 'html-react-parser';
import Card from '../common/Card';
import Pill from '../common/Pill';
import useCardCollapse from './hooks/useCardCollapse';
import { loadFile } from '../../lib/loadFile';
import '../../style/domains_card.css';

/**
 * Cleric domain granted powers.
 *
 * Choosing the two domains and their spell slots already works in the
 * spellbook; what was missing is the granted power each domain confers, which
 * is a combat-relevant ability the sheet never showed. Both slots always
 * render so an unchosen domain reads as a gap rather than as absent.
 */
export default function DomainsCard() {
  const player = useSelector((state) => state.playerSheet?.player);
  const [collapsed, collapseToggle] = useCardCollapse('domains', 'domain powers');
  if (player?.getClass?.() !== 'Cleric') return null;

  const powers = loadFile('tables')?.Domains ?? {};
  const slots = [
    { label: 'Domain 1', name: player.domain1 ?? '' },
    { label: 'Domain 2', name: player.domain2 ?? '' },
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
        {slots.map(({ label, name }) => (
          <div key={label} className="domains-card-slot">
            <div className="domains-card-head">
              <span className="domains-card-name">{name || label}</span>
              {!name && <Pill tone="warn">Not chosen</Pill>}
            </div>
            {name ? (
              <div className="domains-card-power">
                {powers[name]
                  ? parse(powers[name])
                  : <span className="sh-faint">No granted power recorded for this domain.</span>}
              </div>
            ) : (
              <span className="sh-faint domains-card-power">
                Pick this domain in the spellbook to see its granted power.
              </span>
            )}
          </div>
        ))}
      </div>
      )}
    </Card>
  );
}
