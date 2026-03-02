import React from 'react';
import PropTypes from 'prop-types';

export default function WizardSchoolsCard({
  inst,
  player,
  setOption,
  collapsed,
  toggle,
}) {
  if (!inst || !player) return null;

  const specialized = player.specialized ?? '';
  const forbidden1 = player.forbidden1 ?? '';
  const forbidden2 = player.forbidden2 ?? '';
  const possibleSpecialized = inst.getPossibleSpecialized?.() ?? [];
  const possibleForbidden1 = inst.getPossibleForbidden1?.() ?? [];
  const possibleForbidden2 = inst.getPossibleForbidden2?.() ?? [];

  return (
    <div className={`card card-width-spellbook ${collapsed ? 'collapsed' : ''}`}>
      <div className="card-side-div card-expand-div" onClick={toggle}>
        <h3 className="card-title">Specialized and Forbidden schools</h3>
        <button type="button" className="collapse-button">
          <span className="material-symbols-outlined">
            {collapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>

      {!collapsed && (
        <div className="card-content player-sheet-alignment-card-content">
          <div className="player-sheet-alignment-row">
            <label className="player-sheet-alignment-label">Specialized</label>
            <select
              className="modern-dropdown small-long"
              value={specialized}
              onChange={(e) => setOption('specialized', e.target.value)}
            >
              <option value="">-</option>
              {possibleSpecialized.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="player-sheet-alignment-row">
            <label className="player-sheet-alignment-label">Forbidden</label>
            <select
              className="modern-dropdown small-long"
              value={forbidden1}
              onChange={(e) => setOption('forbidden1', e.target.value)}
            >
              <option value="">-</option>
              {possibleForbidden1.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {specialized !== 'Divination' && (
            <div className="player-sheet-alignment-row">
              <label className="player-sheet-alignment-label">Forbidden 2</label>
              <select
                className="modern-dropdown small-long"
                value={forbidden2}
                onChange={(e) => setOption('forbidden2', e.target.value)}
              >
                <option value="">-</option>
                {possibleForbidden2.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

WizardSchoolsCard.propTypes = {
  inst: PropTypes.object.isRequired,
  player: PropTypes.object.isRequired,
  setOption: PropTypes.func.isRequired,
  collapsed: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
};
