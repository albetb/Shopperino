import 'style/carrying_capacity.css';
import { useUnits } from '../../hooks/useUnits';

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
  return Math.round(Number(n) || 0);
}

export default function CarryingCapacityCard({ player, collapsed, setCollapsed }) {
  const u = useUnits();
  if (!player) return null;

  const capacity = player.getCarryingCapacity?.() ?? { light: 0, medium: 0, heavy: 0 };
  const weight = player.getInventoryWeight?.() ?? 0;
  const status = player.getLoadStatus?.() ?? 'none';
  const baseSpeed = player.getBaseSpeed?.() ?? 30;
  const reduced = reducedSpeed(baseSpeed);

  const cap = {
    light:  fmtKg(capacity.light),
    medium: fmtKg(capacity.medium),
    heavy:  fmtKg(capacity.heavy),
  };

  return (
    <div className={`card card-width-spellbook ${collapsed ? 'collapsed' : ''}`}>
      <div
        className="card-side-div card-expand-div"
        onClick={() => setCollapsed((c) => !c)}
      >
        <h3 className="card-title">Carrying capacity</h3>
        <span className="carry-title-readout sh-mono">{u.weight(fmtKg(weight))} / {u.weight(cap.heavy)}</span>
        <button type="button" className="collapse-button" aria-label="Toggle carrying capacity">
          <span className="material-symbols-outlined">
            {collapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>
      {!collapsed && (
        <div className="card-content">
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
              const speed = u.distance(tier === 'light' ? baseSpeed : reduced);
              const active = status === tier;
              return (
                <div
                  key={tier}
                  role="row"
                  className={`carry-row ${active ? 'carry-row--active' : ''}`}
                >
                  <span className="carry-tier-label">{info.label}</span>
                  <span className="sh-mono">{u.weight(cap[tier])}</span>
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
              <span className="sh-mono">{u.weight(cap.heavy)}</span>
            </div>
            <div className="carry-lift-row">
              <span>Lift off ground <span className="sh-faint">(×2)</span></span>
              <span className="sh-mono">{u.weight(fmtKg(capacity.heavy * 2))}</span>
            </div>
            <div className="carry-lift-row">
              <span>Push or drag <span className="sh-faint">(×5)</span></span>
              <span className="sh-mono">{u.weight(fmtKg(capacity.heavy * 5))}</span>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
