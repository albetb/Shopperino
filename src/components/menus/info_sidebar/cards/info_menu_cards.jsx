import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import parse, { domToReact } from 'html-react-parser';
import SpellLink from '../../../common/spell_link';
import { getItemByLink } from '../../../../lib/utils';
import { getEffectById } from '../../../../lib/item/effectsUtils';
import {
  onUpdateInventoryItemMagic,
  onUpdateEquipmentSlotMagic,
} from '../../../../store/thunks/playerSheetThunks';
import EquipBonusControls from '../../../player_sheet/inventory/EquipBonusControls';
import '../../../../style/menu_cards.css';

const HIDDEN_KEYS = new Set(['Short Description', 'id', 'Link', 'editable', 'editKey']);

function composeNameWithEffect(name, effect) {
  const suffixMatch = (name || '').match(/(,perfect|\+[1-5])$/);
  const suffix = suffixMatch ? suffixMatch[1] : '';
  const base = suffixMatch ? name.slice(0, suffixMatch.index) : (name || '');
  const trimmedBase = base.trim();
  const trimmedEffect = (effect || '').trim();
  const joined = trimmedBase ? `${trimmedBase}, ${trimmedEffect}` : trimmedEffect;
  const space = suffix.includes('+') ? ' ' : '';
  return `${joined}${space}${suffix}`;
}

function resolveBaseCard(entry, { applyBonus = true } = {}) {
  if (!entry) return null;
  const link = entry.Link || entry.link;
  if (!link) return null;
  const bonusArg = applyBonus ? (entry.bonus || 0) : 0;
  const cards = getItemByLink(link, bonusArg, null);
  if (!cards.length) return null;
  const card = cards[0];
  const effectIds = Array.isArray(entry.effectIds) ? entry.effectIds : [];
  effectIds.forEach((id) => {
    const effect = getEffectById(id);
    if (!effect) return;
    card.Description = (card.Description || '') + '<p><b>' + effect.Name + '</b></p>' + effect.Description;
    card.Name = composeNameWithEffect(card.Name, effect.Name);
  });
  return card;
}

export default function InfoMenuCards({ cardsData, closeCard }) {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);

  const [cardStates, setCardStates] = useState(
    cardsData.map((_, idx) => ({ id: idx, collapsed: idx !== 0 }))
  );
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [editMasterwork, setEditMasterwork] = useState(false);
  const [editBonus, setEditBonus] = useState(0);
  const [editEffectIds, setEditEffectIds] = useState([]);
  const [editEntryLink, setEditEntryLink] = useState('');

  useEffect(() => {
    setCardStates(
      cardsData.map((_, idx) => ({ id: idx, collapsed: idx !== 0 }))
    );
    setEditingIdx(null);
    setEditValues({});
    setEditMasterwork(false);
    setEditBonus(0);
    setEditEffectIds([]);
    setEditEntryLink('');
  }, [cardsData]);

  const toggleCard = (id) => {
    setCardStates((states) =>
      states.map((s) => (s.id === id ? { ...s, collapsed: !s.collapsed } : s))
    );
  };

  const getEntryForEditKey = (editKey) => {
    if (!editKey || !player) return null;
    if (editKey.kind === 'inventory') return player.getInventory?.()[editKey.idx];
    if (editKey.kind === 'equipment') return player.getEquipment?.()[editKey.slot];
    return null;
  };

  const startEdit = (idx, data) => {
    const entry = getEntryForEditKey(data.editKey);
    const rawBase = entry ? (resolveBaseCard(entry, { applyBonus: false }) || {}) : {};
    const overrideMap = (entry?.overrides && typeof entry.overrides === 'object') ? entry.overrides : {};
    const initial = {};
    Object.keys(data).forEach((k) => {
      if (HIDDEN_KEYS.has(k)) return;
      if (overrideMap[k] !== undefined) {
        initial[k] = String(overrideMap[k]);
      } else {
        const baseVal = rawBase[k];
        initial[k] = baseVal === undefined || baseVal === null ? '' : String(baseVal);
      }
    });
    if (initial.Description === undefined) initial.Description = overrideMap.Description ?? (rawBase.Description ?? '');
    setEditValues(initial);
    setEditMasterwork(!!entry?.masterwork);
    setEditBonus(Math.max(0, Math.min(5, Number(entry?.bonus) || 0)));
    setEditEffectIds(Array.isArray(entry?.effectIds) ? [...entry.effectIds] : []);
    setEditEntryLink(entry ? (entry.Link || entry.link || '') : '');
    setEditingIdx(idx);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditValues({});
    setEditMasterwork(false);
    setEditBonus(0);
    setEditEffectIds([]);
    setEditEntryLink('');
  };

  const saveEdit = (data) => {
    if (!data?.editKey || !player) {
      cancelEdit();
      return;
    }
    const editKey = data.editKey;
    const entry = getEntryForEditKey(editKey);
    if (!entry) {
      cancelEdit();
      return;
    }
    const rawBase = resolveBaseCard(entry, { applyBonus: false }) || {};
    const overrides = {};
    Object.entries(editValues).forEach(([k, v]) => {
      const baseVal = rawBase[k];
      const baseStr = baseVal === undefined || baseVal === null ? '' : String(baseVal);
      if (v !== baseStr) overrides[k] = v;
    });
    const magic = { masterwork: editMasterwork, bonus: editBonus, effectIds: editEffectIds, overrides };
    if (editKey.kind === 'inventory') {
      dispatch(onUpdateInventoryItemMagic(editKey.idx, magic));
    } else {
      dispatch(onUpdateEquipmentSlotMagic(editKey.slot, magic));
    }
    cancelEdit();
  };

  const descriptionOptions = {
    replace: (domNode) => {
      if (domNode.name === 'table') {
        const { style, ...rest } = domNode.attribs || {};
        return (
          <div className="description-table-wrapper">
            <table {...rest}>
              {domToReact(domNode.children, descriptionOptions)}
            </table>
          </div>
        );
      }
      if (
        domNode.name === 'a' &&
        domNode.attribs?.href
      ) {
        const href = domNode.attribs.href;
        let link = null;
        if (href && href.includes('abilitiesAndConditions#')) {
          link = href;
        } else if (href && href.includes('#')) {
          link = href;
        } else if (href && href.startsWith('#')) {
          link = href.slice(1);
        } else if (href && !href.includes('://')) {
          link = href;
        }
        if (link) {
          return (
            <SpellLink key={href} link={link}>
              {domToReact(domNode.children, descriptionOptions)}
            </SpellLink>
          );
        }
      }
    }
  };

  return (
    <div className="cards">
      {cardsData.map((data, idx) => {
        const state = cardStates.find((s) => s.id === idx) || { collapsed: idx !== 0 };
        const isEditing = editingIdx === idx;
        const editableValue = isEditing ? (editValues.Name ?? '') : null;
        const title = isEditing ? (editableValue || 'Edit') : (data.Name || `Card ${idx + 1}`);
        return (
          <div key={idx} className={`card ${state.collapsed ? 'collapsed' : ''}`}>
            <div className="card-side-div card-expand-div">
              <h3 className="card-title" onClick={() => !isEditing && toggleCard(idx)}>{title}</h3>
              <div className="card-actions">
                {data.editable && !isEditing && (
                  <button
                    type="button"
                    className="card-edit-button"
                    title="Edit"
                    onClick={() => startEdit(idx, data)}
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                )}
                {isEditing && (
                  <>
                    <button
                      type="button"
                      className="card-edit-button"
                      title="Save"
                      onClick={() => saveEdit(data)}
                    >
                      <span className="material-symbols-outlined">check</span>
                    </button>
                    <button
                      type="button"
                      className="card-edit-button"
                      title="Cancel"
                      onClick={cancelEdit}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </>
                )}
                {!isEditing && (
                  <button className="close-button" onClick={() => closeCard(data)}>
                    <span className="material-symbols-outlined">close_small</span>
                  </button>
                )}
                {!isEditing && (
                  <button className="collapse-button" onClick={() => toggleCard(idx)}>
                    <span className="material-symbols-outlined">
                      {state.collapsed ? 'expand_more' : 'expand_less'}
                    </span>
                  </button>
                )}
              </div>
            </div>
            {!state.collapsed && (
              <div className="card-content">
                {isEditing && editEntryLink && (
                  <div className="info-card-row info-card-edit-row info-card-edit-row--block">
                    <EquipBonusControls
                      itemLink={editEntryLink}
                      masterwork={editMasterwork}
                      bonus={editBonus}
                      effectIds={editEffectIds}
                      onChange={(patch) => {
                        if (patch.masterwork !== undefined) setEditMasterwork(patch.masterwork);
                        if (patch.bonus !== undefined) {
                          setEditBonus(patch.bonus);
                          if (patch.bonus === 0 && patch.effectIds === undefined) setEditEffectIds([]);
                          if (patch.bonus > 0) setEditMasterwork(true);
                        }
                        if (patch.effectIds !== undefined) setEditEffectIds(patch.effectIds);
                      }}
                    />
                  </div>
                )}
                {(() => {
                  const renderKeys = isEditing
                    ? (() => {
                        const ordered = [];
                        Object.keys(data).forEach((k) => {
                          if (!HIDDEN_KEYS.has(k) && !ordered.includes(k)) ordered.push(k);
                        });
                        Object.keys(editValues).forEach((k) => {
                          if (!HIDDEN_KEYS.has(k) && !ordered.includes(k)) ordered.push(k);
                        });
                        const descIdx = ordered.indexOf('Description');
                        if (descIdx >= 0 && descIdx !== ordered.length - 1) {
                          ordered.splice(descIdx, 1);
                          ordered.push('Description');
                        }
                        return ordered;
                      })()
                    : Object.keys(data).filter((k) => !HIDDEN_KEYS.has(k));
                  return renderKeys.map((key) => {
                    const value = isEditing ? (editValues[key] ?? '') : data[key];
                    if (isEditing) {
                      if (key === 'Description') {
                        return (
                          <div key={key} className="info-card-row info-card-edit-row info-card-edit-row--block">
                            <textarea
                              className="info-card-input info-card-textarea"
                              value={value}
                              rows={5}
                              onChange={(e) =>
                                setEditValues((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              placeholder={key}
                            />
                          </div>
                        );
                      }
                      if (key === 'Name') {
                        return (
                          <div key={key} className="info-card-row info-card-edit-row">
                            <input
                              type="text"
                              className="info-card-input"
                              value={value}
                              onChange={(e) =>
                                setEditValues((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              placeholder={key}
                            />
                          </div>
                        );
                      }
                      return (
                        <div key={key} className="info-card-row info-card-edit-row">
                          <span className="info-key info-card">{key}: </span>
                          <input
                            type="text"
                            className="info-card-input"
                            value={value}
                            onChange={(e) =>
                              setEditValues((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                          />
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="info-card-row">
                        {['Name', 'Description'].includes(key) ? null : (
                          <span className="info-key info-card">{key}: </span>
                        )}
                        {key === 'Description' ? (
                          <div className="info-value info-card description-content">
                            {parse(value, descriptionOptions)}
                          </div>
                        ) : ['Name'].includes(key) ? null : (
                          <span className="info-value info-card">{value}</span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

InfoMenuCards.propTypes = {
  cardsData: PropTypes.arrayOf(PropTypes.object).isRequired,
  closeCard: PropTypes.func.isRequired
};

InfoMenuCards.defaultProps = {
  cardsData: []
};
