import React from 'react';
import PropTypes from 'prop-types';
import { t, tName } from '../../lib/i18n';

export default function DomainDescriptionCard({
  description,
  collapsed,
  toggle,
  showDomainDropdowns,
  inst,
  player,
  setOption,
}) {
  const domain1 = player?.domain1 ?? '';
  const domain2 = player?.domain2 ?? '';
  const possibleDomain1 = inst?.getPossibleDomain1?.() ?? [];
  const possibleDomain2 = inst?.getPossibleDomain2?.() ?? [];

  return (
    <div className={`card card-width-spellbook ${collapsed ? 'collapsed' : ''}`}>
      <div className="card-side-div card-expand-div" onClick={toggle}>
        <h3 className="card-title">{t('Domains')}</h3>
        <button type="button" className="collapse-button">
          <span className="material-symbols-outlined">
            {collapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>

      {!collapsed && (
        <>
          {showDomainDropdowns && (
            <div className="card-content player-sheet-alignment-card-content">
              <div className="player-sheet-alignment-row">
                <label className="player-sheet-alignment-label">{t('Domain 1')}</label>
                <select
                  className="modern-dropdown small-long"
                  value={domain1}
                  onChange={(e) => setOption('domain1', e.target.value)}
                >
                  <option value="">-</option>
                  {possibleDomain1.map((d) => (
                    <option key={d} value={d}>{tName('domains', d)}</option>
                  ))}
                </select>
              </div>
              <div className="player-sheet-alignment-row">
                <label className="player-sheet-alignment-label">{t('Domain 2')}</label>
                <select
                  className="modern-dropdown small-long"
                  value={domain2}
                  onChange={(e) => setOption('domain2', e.target.value)}
                >
                  <option value="">-</option>
                  {possibleDomain2.map((d) => (
                    <option key={d} value={d}>{tName('domains', d)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {description && (
            <div
              className="class-desc"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </>
      )}
    </div>
  );
}

DomainDescriptionCard.propTypes = {
  description: PropTypes.string.isRequired,
  collapsed: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  showDomainDropdowns: PropTypes.bool,
  inst: PropTypes.object,
  player: PropTypes.object,
  setOption: PropTypes.func,
};
