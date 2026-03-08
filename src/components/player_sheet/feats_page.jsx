import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadFile } from '../../lib/loadFile';
import { meetsPrerequisites } from '../../lib/featPrerequisites';
import {
  REPEATABLE_NO_CHOICE,
  REPEATABLE_WITH_CHOICE,
  getChoicesForFeat,
  formatFeatWithChoice,
  getBaseFeatName,
} from '../../lib/featChoices';
import {
  onAddFeat,
  onRemoveFeatAt,
} from '../../store/thunks/playerSheetThunks';
import FeatChoicePopover from './FeatChoicePopover';
import '../../style/menu_cards.css';
import '../../style/App.css';

function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function FeatsPage() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const [collapsed, setCollapsed] = useState(false);
  const [isSelection, setIsSelection] = useState(false);
  const [filterPrereqs, setFilterPrereqs] = useState(false);
  const [popoverState, setPopoverState] = useState(null); // { feat, position }

  const featsData = useMemo(() => loadFile('feats') || [], []);
  const featMap = useMemo(() => {
    const m = {};
    (featsData || []).forEach((f) => {
      if (f?.Name) m[f.Name] = f;
    });
    return m;
  }, [featsData]);

  const playerFeats = useMemo(() => player?.getFeats?.() ?? [], [player]);
  const count = playerFeats.length;
  const max = player?.getFeatPointsMax?.() ?? 1;

  const isAllowedFeat = (featName) => {
    const baseName = getBaseFeatName(featName);
    if (REPEATABLE_NO_CHOICE.includes(baseName)) return true;
    if (REPEATABLE_WITH_CHOICE[baseName]) return true;
    return !playerFeats.includes(featName);
  };

  const availableFeats = useMemo(() => {
    const normalized = new Set(playerFeats.map((f) => getBaseFeatName(f).toLowerCase()));

    return featsData
      .filter((f) => {
        if (!f?.Name) return false;
        const baseName = getBaseFeatName(f.Name);
        const isRepeatable = REPEATABLE_NO_CHOICE.includes(baseName) || REPEATABLE_WITH_CHOICE[baseName];
        if (!isRepeatable && normalized.has(baseName.toLowerCase())) return false;
        if (filterPrereqs && !meetsPrerequisites(f, player)) return false;
        return true;
      })
      .sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
  }, [featsData, playerFeats, filterPrereqs, player]);

  const getRowLabel = (displayFeat) => {
    const baseName = getBaseFeatName(displayFeat);
    if (baseName === 'Extra turning' && count < max) return '[!] Extra turning';
    if (baseName === 'Toughness' && count < max) return '[!] Toughness';
    return displayFeat;
  };

  const handleAddFeat = (featName) => {
    const baseName = getBaseFeatName(featName);
    const choicesAvailable = getChoicesForFeat(baseName, playerFeats);

    if (choicesAvailable.length > 0) {
      setPopoverState({ feat: featName, choices: choicesAvailable });
    } else {
      dispatch(onAddFeat(featName));
    }
  };

  const handleConfirmChoice = (choice) => {
    if (popoverState) {
      const baseName = getBaseFeatName(popoverState.feat);
      const formatted = formatFeatWithChoice(baseName, choice);
      dispatch(onAddFeat(formatted));
      setPopoverState(null);
    }
  };

  const handleRemove = (index) => {
    dispatch(onRemoveFeatAt(index));
  };

  const handleFeatClick = (feat) => {
    if (count >= max && !isAllowedFeat(feat.Name)) {
      return;
    }
    handleAddFeat(feat.Name);
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
      <div className="card card-width-spellbook">
        <div
          className="card-side-div card-expand-div"
          onClick={() => setCollapsed(!collapsed)}
        >
          <h3 className="card-title">
            Feats
            {count > 0 && ` (${count}/${max})`}
          </h3>
          <button type="button" className="collapse-button">
            <span className="material-symbols-outlined">
              {collapsed ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>

        {!collapsed && (
          <>
            <div className="card-content">
              {playerFeats.length === 0 ? (
                <p className="modal-body-muted text-center">No feats selected</p>
              ) : (
                <table className="modal-table">
                  <tbody>
                    {playerFeats.map((displayFeat, idx) => {
                      const feat = featMap[getBaseFeatName(displayFeat)];
                      return (
                        <tr key={idx}>
                          <td className="td-action">
                            <button
                              type="button"
                              className="flat-button smaller btn-cell-muted"
                              onClick={() => handleRemove(idx)}
                              title="Remove feat"
                            >
                              <span className="material-symbols-outlined">close</span>
                            </button>
                          </td>
                          <td className="text-left">
                            <span title={feat?.Description ? stripHtml(feat.Description) : ''}>
                              {getRowLabel(displayFeat)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {count < max && (
              <div className="card-side-div margin-top buttons-row-center">
                <button
                  type="button"
                  className="modern-button small-middle-long3"
                  onClick={() => setIsSelection(!isSelection)}
                  title={isSelection ? 'Hide selection' : 'Add feat'}
                >
                  <span className="material-symbols-outlined">
                    {isSelection ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>
            )}

            {isSelection && count < max && (
              <>
                <hr style={{ width: '90%', marginTop: '0.6rem', marginBottom: '0.6rem' }} />

                <div className="card-content">
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={filterPrereqs}
                        onChange={(e) => setFilterPrereqs(e.target.checked)}
                      />
                      Prerequisites met
                    </label>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--dark-grey)', marginBottom: '0.5rem', textAlign: 'center' }}>
                    {availableFeats.length} available feat{availableFeats.length !== 1 ? 's' : ''}
                  </p>

                  {availableFeats.length === 0 ? (
                    <p className="modal-body-muted text-center">No feats available</p>
                  ) : (
                    <table className="modal-table">
                      <tbody>
                        {availableFeats.map((feat) => {
                          const baseName = getBaseFeatName(feat.Name);
                          const isTaken = playerFeats.some(
                            (f) => getBaseFeatName(f) === baseName
                          );
                          const isDisabled = isTaken && !REPEATABLE_NO_CHOICE.includes(baseName) && !REPEATABLE_WITH_CHOICE[baseName];

                          return (
                            <tr
                              key={feat.Name}
                              style={{
                                opacity: isDisabled ? 0.5 : 1,
                                cursor: isDisabled ? 'default' : 'pointer',
                              }}
                            >
                              <td className="td-action">
                                <button
                                  type="button"
                                  className="flat-button smaller btn-cell-muted"
                                  onClick={() => handleFeatClick(feat)}
                                  disabled={isDisabled}
                                  title={isDisabled ? 'Already selected' : 'Add feat'}
                                >
                                  <span className="material-symbols-outlined">add</span>
                                </button>
                              </td>
                              <td className="text-left">
                                <span
                                  title={feat?.Description ? stripHtml(feat.Description) : ''}
                                  style={{ cursor: isDisabled ? 'default' : 'pointer' }}
                                >
                                  {feat.Name}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {popoverState && (
        <FeatChoicePopover
          position={popoverState.position}
          choices={popoverState.choices}
          featName={popoverState.feat}
          onConfirm={handleConfirmChoice}
          onClose={() => setPopoverState(null)}
        />
      )}
    </div>
  );
}
