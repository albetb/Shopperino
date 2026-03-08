import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCombatPageCardCollapsed,
} from '../../store/slices/playerSheetSlice';
import {
  onAdjustCurrentHp,
  onSetMaxLife,
  onSetSpeedBonus,
  onSetInitiativeBonus,
  onSetFortBonus,
  onSetReflexBonus,
  onSetWillBonus,
} from '../../store/thunks/playerSheetThunks';
import useLongPress from '../hooks/useLongPress';
import { getItemByRef, calculateWeaponAttackBonus, calculateWeaponDamage } from '../../lib/utils';
import SpellLink from '../common/spell_link';
import '../../style/menu_cards.css';
import '../../style/player_sheet.css';
import '../../style/App.css';

const FEEDBACK_DURATION_MS = 5000;

/** Format BAB with iterative attacks: +6 / +1, +11 / +6 / +1, etc. */
function formatBaseAttackBonus(bab) {
  const b = Number(bab) || 0;
  if (b <= 0) return '+0';
  const parts = [];
  for (let k = 0; b - 5 * k >= 1; k += 1) {
    parts.push(`+${b - 5 * k}`);
  }
  return parts.join(' / ');
}

function CombatStatRow({ label, value, editKey, isEditing, onEdit, onSave, bonusValue, onBonusDelta, bonusMin = 0, bonusMax = 99, showDice = false, rowClass = '', step = 1 }) {
  const dispatch = useDispatch();

  const handleSave = useCallback(() => {
    if (editKey === 'speedBonus') dispatch(onSetSpeedBonus(bonusValue));
    else if (editKey === 'initiativeBonus') dispatch(onSetInitiativeBonus(bonusValue));
    else if (editKey === 'fortBonus') dispatch(onSetFortBonus(bonusValue));
    else if (editKey === 'reflexBonus') dispatch(onSetReflexBonus(bonusValue));
    else if (editKey === 'willBonus') dispatch(onSetWillBonus(bonusValue));
    onSave();
  }, [editKey, bonusValue, onSave, dispatch]);

  if (isEditing) {
    return (
      <div className={`combat-page-stat-row combat-page-stat-row-edit ${rowClass}`.trim()}>
        <div className="combat-page-edit-col">
          <button
            type="button"
            className="combat-page-icon-btn"
            onClick={handleSave}
            title="Save"
            aria-label="Save"
          >
            <span className="material-symbols-outlined">check</span>
          </button>
        </div>
        <span className="combat-page-stat-label">{label}</span>
        <div className="combat-page-edit-controls-wrap">
          <div className="ability-edit-row-controls combat-page-edit-controls">
            <button
              type="button"
              className="combat-page-icon-btn"
              onClick={() => onBonusDelta(-step)}
              disabled={bonusValue <= bonusMin}
              aria-label="Decrease"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <div className="level-frame">
              <span className="level-text">{bonusValue}</span>
            </div>
            <button
              type="button"
              className="combat-page-icon-btn"
              onClick={() => onBonusDelta(step)}
              disabled={bonusValue >= bonusMax}
              aria-label="Increase"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`combat-page-stat-row ${rowClass}`.trim()}>
      <div className="combat-page-edit-col">
        <button
          type="button"
          className="combat-page-icon-btn"
          onClick={onEdit}
          title="Edit bonus"
          aria-label="Edit bonus"
        >
          <span className="material-symbols-outlined">edit</span>
        </button>
      </div>
      <span className="combat-page-stat-label">{label}</span>
      <span className="combat-page-stat-value">{value}</span>
      {showDice && (
        <button type="button" className="ability-dice-button" disabled aria-label="Roll">
          <span className="material-symbols-outlined">casino</span>
        </button>
      )}
    </div>
  );
}

export default function CombatPage() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const combatPageCardsCollapsed = useSelector((state) => state.playerSheet?.combatPageCardsCollapsed ?? { player: false, combat: false, items: false });

  const [hpFeedback, setHpFeedback] = useState(null);
  const hpFeedbackTotalRef = useRef(0);
  const [editMaxLife, setEditMaxLife] = useState(false);
  const [tempMaxLife, setTempMaxLife] = useState(10);
  const [editBonus, setEditBonus] = useState(null);
  const [tempBonus, setTempBonus] = useState(0);

  const currentHp = player?.getCurrentHp?.() ?? 0;
  const maxHp = player?.getMaxLife?.() ?? 0;
  const hpPct = maxHp > 0 ? Math.min(100, Math.round((currentHp / maxHp) * 100)) : 0;

  const handleHpDelta = useCallback(
    (delta) => {
      if (!player) return;
      dispatch(onAdjustCurrentHp(delta));
      hpFeedbackTotalRef.current += delta;
      const total = hpFeedbackTotalRef.current;
      const text = total >= 0 ? `+${total}` : `${total}`;
      setHpFeedback({ text, delta: total });
    },
    [player, dispatch]
  );

  const longPressPlus = useLongPress(() => handleHpDelta(10), () => handleHpDelta(1), { delay: 400 });
  const longPressMinus = useLongPress(() => handleHpDelta(-10), () => handleHpDelta(-1), { delay: 400 });

  useEffect(() => {
    if (!hpFeedback) return;
    const t = setTimeout(() => {
      hpFeedbackTotalRef.current = 0;
      setHpFeedback(null);
    }, FEEDBACK_DURATION_MS);
    return () => clearTimeout(t);
  }, [hpFeedback]);

  const handleToggleCard = useCallback(
    (key) => {
      dispatch(setCombatPageCardCollapsed({ key, value: !combatPageCardsCollapsed[key] }));
    },
    [dispatch, combatPageCardsCollapsed]
  );

  const startEditMaxLife = useCallback(() => {
    if (player) {
      setTempMaxLife(player.maxLife ?? 10);
      setEditMaxLife(true);
    }
  }, [player]);

  const saveMaxLife = useCallback(() => {
    const min = player?.getBaseLifeMin?.() ?? 1;
    const max = player?.getBaseLifeMax?.() ?? 10;
    const clamped = Math.max(min, Math.min(max, Math.floor(Number(tempMaxLife) || min)));
    dispatch(onSetMaxLife(clamped));
    setEditMaxLife(false);
  }, [player, tempMaxLife, dispatch]);

  const startEditBonus = useCallback((key) => {
    if (!player) return;
    const val = player[key] ?? 0;
    setEditBonus(key);
    setTempBonus(Number(val) || 0);
  }, [player]);

  const saveBonus = useCallback(() => {
    setEditBonus(null);
  }, []);

  const bonusDelta = useCallback((delta) => {
    const min = editBonus === 'speedBonus' ? 0 : -99;
    const max = 99;
    setTempBonus((v) => Math.max(min, Math.min(max, v + delta)));
  }, [editBonus]);

  // Get equipped weapons (before early return, must be at top level)
  const equipment = player?.getEquipment?.() ?? {};
  const mainHandWeapon = equipment.rh1;
  const offHandWeapon = equipment.lh1;
  const secondaryMainHand = equipment.rh2;
  const secondaryOffHand = equipment.lh2;

  const equippedWeapons = useMemo(() => {
    const weapons = [];

    // Add main hand weapon (set 1)
    if (mainHandWeapon && mainHandWeapon.link) {
      const weaponItem = getItemByRef(mainHandWeapon.link)?.raw;
      if (weaponItem) {
        weapons.push({
          slot: 'main',
          name: mainHandWeapon.name,
          link: mainHandWeapon.link,
          weaponItem,
          isTwoHanded: mainHandWeapon.twoHanded === true,
        });
      }
    }

    // Add off-hand weapon (set 1 - if different from main hand and not two-handed)
    if (offHandWeapon && offHandWeapon.link && mainHandWeapon?.twoHanded !== true && (!mainHandWeapon || offHandWeapon.link !== mainHandWeapon.link)) {
      const weaponItem = getItemByRef(offHandWeapon.link)?.raw;
      if (weaponItem) {
        weapons.push({
          slot: 'offhand',
          name: offHandWeapon.name,
          link: offHandWeapon.link,
          weaponItem,
          isTwoHanded: offHandWeapon.twoHanded === true,
        });
      }
    }

    // Add secondary set main hand (if exists and different from primary)
    if (secondaryMainHand && secondaryMainHand.link && secondaryMainHand.link !== mainHandWeapon?.link) {
      const weaponItem = getItemByRef(secondaryMainHand.link)?.raw;
      if (weaponItem) {
        weapons.push({
          slot: 'secondary-main',
          name: secondaryMainHand.name,
          link: secondaryMainHand.link,
          weaponItem,
          isTwoHanded: secondaryMainHand.twoHanded === true,
        });
      }
    }

    // Add secondary set off hand (if exists and not two-handed secondary main)
    if (secondaryOffHand && secondaryOffHand.link && secondaryMainHand?.twoHanded !== true && secondaryOffHand.link !== mainHandWeapon?.link && secondaryOffHand.link !== secondaryMainHand?.link) {
      const weaponItem = getItemByRef(secondaryOffHand.link)?.raw;
      if (weaponItem) {
        weapons.push({
          slot: 'secondary-offhand',
          name: secondaryOffHand.name,
          link: secondaryOffHand.link,
          weaponItem,
          isTwoHanded: secondaryOffHand.twoHanded === true,
        });
      }
    }

    return weapons;
  }, [mainHandWeapon, offHandWeapon, secondaryMainHand, secondaryOffHand]);

  if (!player) {
    return (
      <div className="player-sheet-features-cards">
        <div className="card card-width-spellbook">
          <p className="modal-body-muted text-center">Select a character to view combat stats.</p>
        </div>
      </div>
    );
  }

  const speedBonus = Number(player.speedBonus) || 0;
  const initiativeBonus = Number(player.initiativeBonus) || 0;
  const fortBonus = Number(player.fortBonus) || 0;
  const reflexBonus = Number(player.reflexBonus) || 0;
  const willBonus = Number(player.willBonus) || 0;

  const bab = player.getBaseAttackBonus?.() ?? 0;
  const strMod = player.getStrMod?.() ?? 0;
  const punchAttack = bab + strMod;
  const punchDamage = player.getPunchDamage?.() ?? '1d3';

  return (
    <div className="player-sheet-features-cards">
      {/* Card 1: Player - HP and stats */}
      <div
        className={`card card-width-spellbook ${combatPageCardsCollapsed.player ? 'collapsed' : ''}`}
      >
        <div
          className="card-side-div card-expand-div"
          onClick={() => handleToggleCard('player')}
        >
          <h3 className="card-title">Character - {currentHp}/{maxHp} hp</h3>
          <button type="button" className="collapse-button">
            <span className="material-symbols-outlined">
              {combatPageCardsCollapsed.player ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!combatPageCardsCollapsed.player && (
          <div className="card-content">
            {/* HP row */}
            <div className="combat-page-hp-section combat-page-row-spaced">
              <div className="combat-page-hp-bar-row">
                <div className="combat-page-hp-bar-track player-sheet-hp-bar-track" role="presentation">
                  <div
                    className="player-sheet-hp-bar-fill"
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
                <span className="combat-page-hp-label">{currentHp}/{maxHp}</span>
              </div>
              <div className="combat-page-hp-row">
                <div className="combat-page-edit-col">
                  <button
                    type="button"
                    className="combat-page-icon-btn combat-page-hp-edit-max"
                    onClick={editMaxLife ? saveMaxLife : startEditMaxLife}
                    title={editMaxLife ? 'Save max life' : 'Edit base max life'}
                    aria-label={editMaxLife ? 'Save' : 'Edit max life'}
                  >
                    <span className="material-symbols-outlined">{editMaxLife ? 'check' : 'edit'}</span>
                  </button>
                </div>
                <div className="combat-page-hp-label-wrap">
                  <span
                    className={`combat-page-hp-feedback ${hpFeedback ? 'visible' : ''}`}
                    style={
                      hpFeedback
                        ? { color: hpFeedback.delta >= 0 ? 'var(--main-t)' : 'var(--red-t, #c44)' }
                        : undefined
                    }
                  >
                    {hpFeedback?.text ?? '\u00A0'}
                  </span>
                </div>
                <div className="combat-page-hp-controls">
                  <button
                    type="button"
                    className="combat-page-icon-btn minus-btn"
                    {...longPressMinus}
                    aria-label="Decrease HP"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <button
                    type="button"
                    className="combat-page-icon-btn"
                    {...longPressPlus}
                    aria-label="Increase HP"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Edit max life (inline, same place when active) */}
            {editMaxLife && (
              <div className="combat-page-stat-row combat-page-row-spaced">
                <div className="combat-page-edit-col" aria-hidden="true" />
                <span className="combat-page-stat-label">Base max</span>
                <div className="combat-page-edit-controls-wrap">
                  <div className="ability-edit-row-controls combat-page-edit-controls combat-page-max-life-controls">
                  <button
                    type="button"
                    className="combat-page-icon-btn"
                    onClick={() => setTempMaxLife((v) => Math.max(player.getBaseLifeMin(), Math.min(player.getBaseLifeMax(), v - 1)))}
                    aria-label="Decrease"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <div className="level-frame">
                    <span className="level-text">{tempMaxLife}</span>
                  </div>
                  <button
                    type="button"
                    className="combat-page-icon-btn"
                    onClick={() => setTempMaxLife((v) => Math.max(player.getBaseLifeMin(), Math.min(player.getBaseLifeMax(), v + 1)))}
                    aria-label="Increase"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                  </div>
                </div>
              </div>
            )}

            <hr className="combat-page-divider combat-page-divider-thin" />

            {/* Speed */}
            {(() => {
              const speedInfo = player.getArmorSpeedInfo?.();
              let speedDisplay;
              if (speedInfo?.hasReduction) {
                speedDisplay = (
                  <>
                    <span className="combat-speed-reduced">{speedInfo.reducedSpeed}ft</span>
                    <span className="combat-speed-original">{speedInfo.originalSpeed}ft</span>
                  </>
                );
              } else {
                speedDisplay = `${player.getTotalSpeed?.() ?? 30} ft`;
              }
              return (
                <CombatStatRow
                  label="Speed"
                  value={speedDisplay}
                  editKey="speedBonus"
                  isEditing={editBonus === 'speedBonus'}
                  onEdit={() => startEditBonus('speedBonus')}
                  onSave={saveBonus}
                  bonusValue={editBonus === 'speedBonus' ? tempBonus : speedBonus}
                  onBonusDelta={bonusDelta}
                  bonusMin={0}
                  bonusMax={99}
                  step={5}
                  rowClass="combat-page-row-spaced"
                />
              );
            })()}

            {/* Initiative */}
            <CombatStatRow
              label="Initiative"
              value={`+${player.getTotalInitiative?.() ?? 0}`}
              editKey="initiativeBonus"
              isEditing={editBonus === 'initiativeBonus'}
              onEdit={() => startEditBonus('initiativeBonus')}
              onSave={saveBonus}
              bonusValue={editBonus === 'initiativeBonus' ? tempBonus : initiativeBonus}
              onBonusDelta={bonusDelta}
              bonusMin={-99}
              bonusMax={99}
              showDice
              rowClass="combat-page-row-spaced"
            />

            <hr className="combat-page-divider combat-page-divider-thin" />

            {/* Saves */}
            <CombatStatRow
              label="Fortitude"
              value={`+${player.getTotalFortitudeSave?.() ?? player.getFortitudeSave?.() ?? 0}`}
              editKey="fortBonus"
              isEditing={editBonus === 'fortBonus'}
              onEdit={() => startEditBonus('fortBonus')}
              onSave={saveBonus}
              bonusValue={editBonus === 'fortBonus' ? tempBonus : fortBonus}
              onBonusDelta={bonusDelta}
              bonusMin={-99}
              bonusMax={99}
              showDice
              rowClass="combat-page-row-spaced"
            />
            <CombatStatRow
              label="Reflex"
              value={`+${player.getTotalReflexSave?.() ?? player.getReflexSave?.() ?? 0}`}
              editKey="reflexBonus"
              isEditing={editBonus === 'reflexBonus'}
              onEdit={() => startEditBonus('reflexBonus')}
              onSave={saveBonus}
              bonusValue={editBonus === 'reflexBonus' ? tempBonus : reflexBonus}
              onBonusDelta={bonusDelta}
              bonusMin={-99}
              bonusMax={99}
              showDice
              rowClass="combat-page-row-spaced"
            />
            <CombatStatRow
              label="Will"
              value={`+${player.getTotalWillSave?.() ?? player.getWillSave?.() ?? 0}`}
              editKey="willBonus"
              isEditing={editBonus === 'willBonus'}
              onEdit={() => startEditBonus('willBonus')}
              onSave={saveBonus}
              bonusValue={editBonus === 'willBonus' ? tempBonus : willBonus}
              onBonusDelta={bonusDelta}
              bonusMin={-99}
              bonusMax={99}
              showDice
              rowClass="combat-page-row-spaced"
            />
          </div>
        )}
      </div>

      {/* Card 2: Combat */}
      <div
        className={`card card-width-spellbook ${combatPageCardsCollapsed.combat ? 'collapsed' : ''}`}
      >
        <div
          className="card-side-div card-expand-div"
          onClick={() => handleToggleCard('combat')}
        >
          <h3 className="card-title">Combat</h3>
          <button type="button" className="collapse-button">
            <span className="material-symbols-outlined">
              {combatPageCardsCollapsed.combat ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!combatPageCardsCollapsed.combat && (
          <div className="card-content">
            <div className="combat-page-ac-row">
              <div className="combat-page-ac-box combat-page-ac-total">
                <div className="combat-page-ac-label">Armor class</div>
                <div className="combat-page-ac-value">{player.getArmorClass?.() ?? 10}</div>
              </div>
              <div className="combat-page-ac-box">
                <div className="combat-page-ac-label">Contact</div>
                <div className="combat-page-ac-value">{player.getContactAC?.() ?? 10}</div>
              </div>
              <div className="combat-page-ac-box">
                <div className="combat-page-ac-label">Flat-footed</div>
                <div className="combat-page-ac-value">{player.getFlatFootedAC?.() ?? 10}</div>
              </div>
            </div>

            <div className="combat-page-stat-row">
              <span className="combat-page-stat-label">Base attack bonus</span>
              <span className="combat-page-stat-value">{formatBaseAttackBonus(bab)}</span>
            </div>

            <hr className="combat-page-divider" />

            <div className="combat-page-attacks">
              {equippedWeapons.length === 0 ? (
                <>
                  <p className="combat-page-no-weapon">No weapon equipped</p>
                  <div className="combat-page-weapon-line combat-page-weapon-line-full">
                    <span className="material-symbols-outlined combat-page-weapon-icon" title="Melee">sports_mma</span>
                    <span className="combat-page-weapon-name">Punch</span>
                    <span className="combat-page-weapon-attack">+{punchAttack}</span>
                    <span className="combat-page-weapon-damage">{punchDamage}</span>
                    <button type="button" className="ability-dice-button" disabled aria-label="Roll">
                      <span className="material-symbols-outlined">casino</span>
                    </button>
                  </div>
                </>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
                  <tbody>
                    {equippedWeapons.map((weapon, idx) => {
                      const attackBonus = calculateWeaponAttackBonus(player, { weaponItem: weapon.weaponItem, isTwoHanded: weapon.isTwoHanded });
                      const damage = calculateWeaponDamage(player, { weaponItem: weapon.weaponItem, isTwoHanded: weapon.isTwoHanded });
                      const isFirstRow = idx === 0;
                      return (
                        <tr key={`${weapon.link}-${weapon.slot}`} style={{ borderTop: isFirstRow ? 'none' : undefined }}>
                          <td style={{ padding: '0.4rem 0.8rem 0.4rem 1rem', textAlign: 'left', border: 'none' }}>
                            <SpellLink link={weapon.link}>
                              <span className="combat-page-weapon-name">{weapon.name}</span>
                            </SpellLink>
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem', textAlign: 'center', minWidth: '3rem', border: 'none' }}>
                            <span className="combat-page-weapon-attack">+{attackBonus}</span>
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem', textAlign: 'left', minWidth: '3rem', border: 'none' }}>
                            <span className="combat-page-weapon-damage">{damage}</span>
                          </td>
                          <td style={{ padding: '0.4rem 0', textAlign: 'center', border: 'none' }}>
                            <button type="button" className="ability-dice-button" disabled aria-label="Roll">
                              <span className="material-symbols-outlined">casino</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Class-specific cards (between Combat and Items) */}
      {(() => {
        const playerClass = player.getClass?.() ?? '';
        const level = player.getLevel?.() ?? 1;
        const cards = [];
        if (playerClass === 'Druid') {
          cards.push({ key: 'animalCompanion', title: 'Animal Companion' });
          if (level >= 5) cards.push({ key: 'wildShape', title: 'Wild Shape' });
        } else if (playerClass === 'Cleric') {
          cards.push({ key: 'turnRebukeUndead', title: 'Turn or Rebuke Undead' });
        } else if (playerClass === 'Paladin' && level >= 4) {
          cards.push({ key: 'turnUndead', title: 'Turn Undead' });
        } else if (playerClass === 'Bard') {
          cards.push({ key: 'bardicMusic', title: 'Bardic Music' });
        } else if (playerClass === 'Ranger' && level >= 4) {
          cards.push({ key: 'animalCompanion', title: 'Animal Companion' });
        } else if (['Wizard', 'Sorcerer'].includes(playerClass)) {
          cards.push({ key: 'familiar', title: 'Familiar' });
        }
        return cards.map(({ key, title }) => (
          <div
            key={key}
            className={`card card-width-spellbook ${combatPageCardsCollapsed[key] ? 'collapsed' : ''}`}
          >
            <div
              className="card-side-div card-expand-div"
              onClick={() => handleToggleCard(key)}
            >
              <h3 className="card-title">{title}</h3>
              <button type="button" className="collapse-button">
                <span className="material-symbols-outlined">
                  {combatPageCardsCollapsed[key] ? 'expand_more' : 'expand_less'}
                </span>
              </button>
            </div>
            {!combatPageCardsCollapsed[key] && (
              <div className="card-content" />
            )}
          </div>
        ));
      })()}

      {/* Card: Items placeholder */}
      <div
        className={`card card-width-spellbook ${combatPageCardsCollapsed.items ? 'collapsed' : ''}`}
      >
        <div
          className="card-side-div card-expand-div"
          onClick={() => handleToggleCard('items')}
        >
          <h3 className="card-title">Items</h3>
          <button type="button" className="collapse-button">
            <span className="material-symbols-outlined">
              {combatPageCardsCollapsed.items ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!combatPageCardsCollapsed.items && (
          <div className="card-content">
            <p className="modal-body-muted text-center">Items placeholder</p>
          </div>
        )}
      </div>
    </div>
  );
}
