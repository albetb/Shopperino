import { useState } from 'react';
import Card from '../../common/Card';
import IconButton from '../../common/IconButton';
import 'style/carrying_capacity.css';

/* Static per-tier effects from equipment.md "Load effects". Speeds are
   handled per-character below (the base depends on race). */
const TIER_INFO = {
  light:  { label: 'Light',  maxDex: '—',  acp: 0,  run: '×4' },
  medium: { label: 'Medium', maxDex: '+3', acp: -3, run: '×4' },
  heavy:  { label: 'Heavy',  maxDex: '+1', acp: -6, run: '×3' },
};

/** Reduced speed by load/medium-heavy armor: 30 ft → 20 ft, 20 ft → 15 ft. */
function reducedSpeed(baseFt) {
  if (baseFt >= 30) return Math.floor(baseFt * 2 / 3);
  if (baseFt >= 20) return Math.floor(baseFt * 3 / 4);
  return baseFt;
}

function fmtKg(n) {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? `${v}` : v.toFixed(1).replace(/\.0$/, '');
}

export default function CarryingCapacityCard({ player }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!player) return null;

  const capacity = player.getCarryingCapacity?.() ?? { light: 0, medium: 0, heavy: 0 };
  const weight = player.getInventoryWeight?.() ?? 0;
  const status = player.getLoadStatus?.() ?? 'none';
  const baseSpeed = player.getBaseSpeed?.() ?? 30;
  const reduced = reducedSpeed(baseSpeed);
  const str = player.getAbilityTotal?.('str') ?? 10;

  const cap = {
    light:  fmtKg(capacity.light),
    medium: fmtKg(capacity.medium),
    heavy:  fmtKg(capacity.heavy),
  };

  return (
    <Card
      className="card-width-spellbook"
      eyebrow={`Carrying capacity · Str ${str}`}
      title={`${fmtKg(weight)} / ${cap.heavy} kg`}
      action={
        <IconButton
          icon={collapsed ? 'expand_more' : 'expand_less'}
          ghost size="sm"
          onClick={() => setCollapsed(c => !c)}
          aria-label="Toggle carrying capacity"
        />
      }
    >
      {!collapsed && (
        <div className="sh-stack" style={{ gap: 'var(--space-3)' }}>
          <div className="carry-table" role="table" aria-label="Load tiers">
            <div className="carry-row carry-row--head" role="row">
              <span role="columnheader">Tier</span>
              <span role="columnheader">Max</span>
              <span role="columnheader" title="Max Dex bonus">Dex</span>
              <span role="columnheader" title="Skill check penalty">ACP</span>
              <span role="columnheader">Run</span>
              <span role="columnheader">Speed</span>
            </div>
            {(['light', 'medium', 'heavy']).map(tier => {
              const info = TIER_INFO[tier];
              const speed = tier === 'light' ? `${baseSpeed} ft` : `${reduced} ft`;
              const active = status === tier;
              return (
                <div
                  key={tier}
                  role="row"
                  className={`carry-row ${active ? 'carry-row--active' : ''}`}
                >
                  <span className="carry-tier-label">{info.label}</span>
                  <span className="sh-mono">{cap[tier]} kg</span>
                  <span className="sh-mono">{info.maxDex}</span>
                  <span className="sh-mono">{info.acp}</span>
                  <span className="sh-mono">{info.run}</span>
                  <span className="sh-mono">{speed}</span>
                </div>
              );
            })}
          </div>

          <div className="carry-lift">
            <div className="carry-lift-row">
              <span>Lift overhead</span>
              <span className="sh-mono">{cap.heavy} kg</span>
            </div>
            <div className="carry-lift-row">
              <span>Lift off ground <span className="sh-faint">(×2)</span></span>
              <span className="sh-mono">{fmtKg(capacity.heavy * 2)} kg</span>
            </div>
            <div className="carry-lift-row">
              <span>Push or drag <span className="sh-faint">(×5)</span></span>
              <span className="sh-mono">{fmtKg(capacity.heavy * 5)} kg</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
