/**
 * Horizontal stat row: Label | bar (filled segment) | value.
 * Used in class cards for Life, Attack, Weapon, Armor, Saves, Abilities, Spells.
 * @param {string} label - e.g. "Life", "Attack"
 * @param {number} filled - number of filled segments (e.g. 3)
 * @param {number} max - total segments (e.g. 5)
 * @param {string} value - text to show right of the bar (e.g. "d8", "high")
 * @param {string} [className] - optional extra class (e.g. "short" for save bars)
 */
export default function StatBar({ label, filled, max, value, className }) {
  const pct = max > 0 ? Math.min(100, Math.round((filled / max) * 100)) : 0;
  return (
    <div className={`player-sheet-stat-bar${className ? ` ${className}` : ''}`}>
      <span className="player-sheet-stat-bar-label">{label}</span>
      <div className="player-sheet-stat-bar-track" role="presentation">
        <div
          className="player-sheet-stat-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="player-sheet-stat-bar-value">{value}</span>
    </div>
  );
}
