import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCombatPageCardCollapsed,
} from '../../store/slices/playerSheetSlice';
import {
  onAdjustCurrentHp,
  onSetMaxLife,
  onSetHealthModifier,
  onSetSpeedBonus,
  onSetInitiativeBonus,
  onSetFortBonus,
  onSetReflexBonus,
  onSetWillBonus,
  onSetAcBonus,
  onSetAcTouchBonus,
  onSetAcFlatBonus,
  onSetCharacterPortrait,
  onClearCharacterPortrait,
  onPlayerRest,
} from '../../store/thunks/playerSheetThunks';
import PortraitEditorSheet from './PortraitEditorSheet';
import ConditionsCard from './conditions_card';
import ClassFeatureCards from './class_feature_cards';
import useLongPress from '../hooks/useLongPress';
import { getItemByRef, calculateWeaponAttackBonus, calculateWeaponDamage, applyItemOverrides } from '../../lib/utils';
import SpellLink from '../common/spell_link';
import Card from '../common/Card';
import StatPill from '../common/StatPill';
import Bar from '../common/Bar';
import Pill from '../common/Pill';
import Filigree from '../common/Filigree';
import IconButton from '../common/IconButton';
import Stepper from '../common/Stepper';
import EmptyState from '../common/EmptyState';
import Icon from '../common/Icon';

const FEEDBACK_DURATION_MS = 5000;

function formatBaseAttackBonus(bab) {
  const b = Number(bab) || 0;
  if (b <= 0) return '+0';
  const parts = [];
  for (let k = 0; b - 5 * k >= 1; k += 1) parts.push(`+${b - 5 * k}`);
  return parts.join(' / ');
}

const BONUS_THUNK = {
  speedBonus:      onSetSpeedBonus,
  initiativeBonus: onSetInitiativeBonus,
  fortBonus:       onSetFortBonus,
  reflexBonus:     onSetReflexBonus,
  willBonus:       onSetWillBonus,
  acBonus:         onSetAcBonus,
  acTouchBonus:    onSetAcTouchBonus,
  acFlatBonus:     onSetAcFlatBonus,
};

export default function CombatPage() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet?.player);
  const collapsed = useSelector(state => state.playerSheet?.combatPageCardsCollapsed ?? { player: false, combat: false, items: false });

  const [hpFeedback, setHpFeedback] = useState(null);
  const hpFeedbackTotalRef = useRef(0);
  const [portraitOpen, setPortraitOpen] = useState(false);
  const [editMaxLife, setEditMaxLife] = useState(false);
  const [tempMaxLife, setTempMaxLife] = useState(10);
  const [editBonusLife, setEditBonusLife] = useState(false);
  const [tempBonusLife, setTempBonusLife] = useState(0);
  const [hpAdvancedOpen, setHpAdvancedOpen] = useState(false);
  const [editBonus, setEditBonus] = useState(null);
  const [tempBonus, setTempBonus] = useState(0);
  /* AC has three independent fields editable together; the other stats
     only need a single temp value (tempBonus above). */
  const [tempAc, setTempAc] = useState({ general: 0, touch: 0, flat: 0 });

  const currentHp = player?.getCurrentHp?.() ?? 0;
  const maxHp = player?.getMaxLife?.() ?? 0;
  // Two visual modes for the bar:
  //  - currentHp > 0: normal gradient, fill = currentHp / maxHp.
  //  - currentHp ≤ 0: "dying" full-red bar, fill = (currentHp + 10) / 10
  //    so 0 HP is a full red bar and −10 HP is an empty one.
  const isDying = currentHp <= 0;
  const hpRatio = isDying
    ? Math.max(0, Math.min(1, (currentHp + 10) / 10))
    : (maxHp > 0 ? Math.max(0, Math.min(1, currentHp / maxHp)) : 0);
  const hpBarVariant = isDying ? 'danger' : 'hp';

  const handleHpDelta = useCallback(delta => {
    if (!player) return;
    dispatch(onAdjustCurrentHp(delta));
    hpFeedbackTotalRef.current += delta;
    const total = hpFeedbackTotalRef.current;
    setHpFeedback({ text: total >= 0 ? `+${total}` : `${total}`, delta: total });
  }, [player, dispatch]);

  const longPressPlus  = useLongPress(() => handleHpDelta(10),  () => handleHpDelta(1),  { delay: 400 });
  const longPressMinus = useLongPress(() => handleHpDelta(-10), () => handleHpDelta(-1), { delay: 400 });

  useEffect(() => {
    if (!hpFeedback) return undefined;
    const t = setTimeout(() => {
      hpFeedbackTotalRef.current = 0;
      setHpFeedback(null);
    }, FEEDBACK_DURATION_MS);
    return () => clearTimeout(t);
  }, [hpFeedback]);

  const toggleCard = key => dispatch(setCombatPageCardCollapsed({ key, value: !collapsed[key] }));

  const startEditMaxLife = useCallback(() => {
    if (!player) return;
    setTempMaxLife(player.maxLife ?? 10);
    setEditMaxLife(true);
  }, [player]);

  const saveMaxLife = useCallback(() => {
    const min = player?.getBaseLifeMin?.() ?? 1;
    // Per CLAUDE.md: rules are signaled, never enforced. We do NOT clamp to
    // getBaseLifeMax — the UI shows a warning pill below when the value
    // exceeds the theoretical maximum (HD_max × level).
    const value = Math.max(min, Math.floor(Number(tempMaxLife) || min));
    dispatch(onSetMaxLife(value));
    setEditMaxLife(false);
  }, [player, tempMaxLife, dispatch]);

  const startEditBonusLife = useCallback(() => {
    if (!player) return;
    setTempBonusLife(Number(player.healthModifier) || 0);
    setEditBonusLife(true);
  }, [player]);

  const saveBonusLife = useCallback(() => {
    dispatch(onSetHealthModifier(Math.floor(Number(tempBonusLife) || 0)));
    setEditBonusLife(false);
  }, [tempBonusLife, dispatch]);

  const startEditBonus = useCallback(key => {
    if (!player) return;
    setEditBonus(key);
    if (key === 'ac') {
      setTempAc({
        general: Number(player.acBonus) || 0,
        touch:   Number(player.acTouchBonus) || 0,
        flat:    Number(player.acFlatBonus) || 0,
      });
    } else {
      setTempBonus(Number(player[key]) || 0);
    }
  }, [player]);

  /* Pencil button toggles: clicking the active stat's pencil closes the
     editor; clicking a different stat's pencil switches to that one. */
  const toggleEditBonus = useCallback(key => {
    if (editBonus === key) setEditBonus(null);
    else startEditBonus(key);
  }, [editBonus, startEditBonus]);

  const saveBonus = useCallback(() => {
    if (!editBonus) return;
    if (editBonus === 'ac') {
      dispatch(onSetAcBonus(tempAc.general));
      dispatch(onSetAcTouchBonus(tempAc.touch));
      dispatch(onSetAcFlatBonus(tempAc.flat));
    } else if (BONUS_THUNK[editBonus]) {
      dispatch(BONUS_THUNK[editBonus](tempBonus));
    }
    setEditBonus(null);
  }, [editBonus, tempBonus, tempAc, dispatch]);

  // Hooks above the early-return ----------------------------------
  const equipment = player?.getEquipment?.() ?? {};
  const mainHandWeapon = equipment.rh1;
  const offHandWeapon = equipment.lh1;
  const secondaryMainHand = equipment.rh2;
  const secondaryOffHand = equipment.lh2;

  const equippedWeapons = useMemo(() => {
    const weapons = [];
    const pushIf = (slot, w) => {
      if (!w?.link) return;
      /* Shields are equipped in hand slots but don't belong in the
         attack list — their AC contribution shows in the equipment card
         instead. */
      if (/\/(Shield|Specific Shield)\//.test(w.link)) return;
      const rawItem = getItemByRef(w.baseLink || w.link)?.raw;
      if (!rawItem) return;
      const item = applyItemOverrides(rawItem, w.overrides);
      const displayName = w.overrides?.Name ?? w.name;
      weapons.push({ slot, name: displayName, link: w.link, weaponItem: item, isTwoHanded: w.twoHanded === true, itemData: w });
    };
    pushIf('main', mainHandWeapon);
    if (mainHandWeapon?.twoHanded !== true && (!mainHandWeapon || offHandWeapon?.link !== mainHandWeapon.link)) {
      pushIf('offhand', offHandWeapon);
    }
    if (secondaryMainHand?.link && secondaryMainHand.link !== mainHandWeapon?.link) {
      pushIf('secondary-main', secondaryMainHand);
    }
    if (secondaryMainHand?.twoHanded !== true && secondaryOffHand?.link && secondaryOffHand.link !== mainHandWeapon?.link && secondaryOffHand.link !== secondaryMainHand?.link) {
      pushIf('secondary-offhand', secondaryOffHand);
    }
    return weapons;
  }, [mainHandWeapon, offHandWeapon, secondaryMainHand, secondaryOffHand]);

  if (!player) {
    return (
      <div className="sh-stack" style={{ padding: 'var(--space-4)' }}>
        <EmptyState icon="badge" title="No character selected" hint="Pick or create one from the sidebar." />
      </div>
    );
  }

  const speedBonus      = Number(player.speedBonus)      || 0;
  const initiativeBonus = Number(player.initiativeBonus) || 0;
  const fortBonus       = Number(player.fortBonus)       || 0;
  const reflexBonus     = Number(player.reflexBonus)     || 0;
  const willBonus       = Number(player.willBonus)       || 0;

  const bab = player.getBaseAttackBonus?.() ?? 0;
  const strMod = player.getStrMod?.() ?? 0;
  const punchAttack = bab + strMod + (player.getAttackConditionModifier?.() ?? 0);
  const punchDamage = player.getPunchDamage?.() ?? '1d3';

  // Condition-caused deltas for the displayed combat stats (empty when none).
  const condDeltas = player.getConditionStatDeltas?.() ?? {};
  const fmtDelta = (d) => `${d > 0 ? '+' : ''}${d}`;
  const condNote = (d) => (d ? <span className="sh-stat-cond-note" style={{ display: 'block' }}>cond {fmtDelta(d)}</span> : null);
  const withCond = (baseSub, d) => {
    const note = condNote(d);
    if (!note) return baseSub;
    return baseSub != null ? <>{baseSub}{note}</> : note;
  };
  const acCondAffected = !!(condDeltas.ac || condDeltas.acTouch || condDeltas.acFlat);
  const condBaseline = player.getConditionBaseline?.() ?? null;
  const punchAtkAffected = condBaseline ? (condBaseline.getBaseAttackBonus() + condBaseline.getStrMod()) !== punchAttack : false;
  const punchDmgAffected = condBaseline ? condBaseline.getPunchDamage() !== punchDamage : false;

  const speedInfo = player.getArmorSpeedInfo?.();
  const speedDisplay = speedInfo?.hasReduction
    ? `${speedInfo.reducedSpeed} / ${speedInfo.originalSpeed} ft`
    : `${player.getTotalSpeed?.() ?? 30} ft`;

  const totalInitiative = player.getTotalInitiative?.() ?? 0;
  const totalFort = player.getTotalFortitudeSave?.() ?? player.getFortitudeSave?.() ?? 0;
  const totalRef  = player.getTotalReflexSave?.()    ?? player.getReflexSave?.()    ?? 0;
  const totalWill = player.getTotalWillSave?.()      ?? player.getWillSave?.()      ?? 0;
  const ac        = player.getArmorClass?.()    ?? 10;
  const acTouch   = player.getContactAC?.()     ?? 10;
  const acFlat    = player.getFlatFootedAC?.()  ?? 10;

  const characterName  = player.getName?.() ?? '';
  const characterClass = player.getClass?.() ?? '';
  const characterLevel = player.getLevel?.() ?? 1;
  const characterPortrait = player.getPortrait?.() ?? '';

  const renderBonusEditor = (label, min, max, step = 1) => (
    <Card padding>
      <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <span className="sh-eyebrow">{label} bonus</span>
        <Stepper
          value={tempBonus}
          min={min}
          max={max}
          step={step}
          onChange={setTempBonus}
        />
        {/* marginLeft auto pushes the save/cancel pair to the right edge
            of the row, matching the AC editor's footer layout. */}
        <IconButton icon="check" size="sm" onClick={saveBonus} aria-label="Save bonus" style={{ marginLeft: 'auto' }} />
        <IconButton icon="close" ghost size="sm" onClick={() => setEditBonus(null)} aria-label="Cancel" />
      </div>
    </Card>
  );

  const renderAcEditor = () => (
    <Card padding>
      <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
        <Filigree>AC modifiers</Filigree>
        {[
          { key: 'general', label: 'General', hint: 'AC + touch + flat' },
          { key: 'touch',   label: 'Touch',   hint: 'touch only' },
          { key: 'flat',    label: 'Flat',    hint: 'flat-footed only' },
        ].map(({ key, label, hint }) => (
          <div key={key} className="sh-row-h sh-spread" style={{ gap: 'var(--space-2)' }}>
            <span className="sh-eyebrow">{label} <span className="sh-faint" style={{ textTransform: 'none', letterSpacing: 0 }}>({hint})</span></span>
            <Stepper
              value={tempAc[key]}
              min={-99}
              max={99}
              onChange={v => setTempAc(prev => ({ ...prev, [key]: v }))}
            />
          </div>
        ))}
        <div className="sh-row-h" style={{ gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <IconButton icon="check" size="sm" onClick={saveBonus} aria-label="Save AC modifiers" />
          <IconButton icon="close" ghost size="sm" onClick={() => setEditBonus(null)} aria-label="Cancel" />
        </div>
      </div>
    </Card>
  );

  /* Render the inline editor for whichever stat is being edited; placed
     directly below the grid row that contains the active stat. */
  const renderActiveEditor = () => {
    if (editBonus === 'ac') return renderAcEditor();
    if (editBonus === 'speedBonus')      return renderBonusEditor('Speed', 0, 99, 5);
    if (editBonus === 'initiativeBonus') return renderBonusEditor('Init', -99, 99);
    if (editBonus === 'fortBonus')       return renderBonusEditor('Fort', -99, 99);
    if (editBonus === 'reflexBonus')     return renderBonusEditor('Ref',  -99, 99);
    if (editBonus === 'willBonus')       return renderBonusEditor('Will', -99, 99);
    return null;
  };

  const TOP_ROW_KEYS    = ['ac', 'initiativeBonus', 'speedBonus'];
  const BOTTOM_ROW_KEYS = ['fortBonus', 'reflexBonus', 'willBonus'];

  const bab_display = formatBaseAttackBonus(bab);
  const sneakAttackDice = player.getSneakAttackDice?.() ?? 0;

  return (
    <>
    <div
      className="sh-stack combat-page-wrap"
      style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-12)' }}
    >
      {/* Header card with portrait + identity */}
      <Card padding>
        <div className="sh-row-h" style={{ gap: 'var(--space-3)', alignItems: 'stretch' }}>
          <button
            type="button"
            className="sh-portrait"
            onClick={() => setPortraitOpen(true)}
            aria-label={characterPortrait ? 'Change portrait' : 'Add portrait'}
          >
            {characterPortrait
              ? <img src={characterPortrait} alt="" className="sh-portrait-img" />
              : <Icon name="badge" />}
          </button>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <Filigree>{characterClass || 'No class'} · level {characterLevel}</Filigree>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
              <div className="sh-display" style={{ fontSize: 'var(--font-size-2xl)' }}>{characterName || 'Unnamed'}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* HP card */}
      <Card
        title={`${currentHp} / ${maxHp} hp`}
        eyebrow="Hit points"
        action={
          <>
            {/* A day's rest: refreshes spell slots, gnome racial spells and
                every per-day class-feature counter in one action. */}
            <IconButton
              icon="bedtime"
              ghost size="sm"
              aria-label="Rest: refresh spells and class feature uses"
              title="Rest"
              onClick={() => dispatch(onPlayerRest())}
            />
            <IconButton
              icon={collapsed.player ? 'expand_more' : 'expand_less'}
              ghost size="sm"
              aria-label="Toggle HP card"
              onClick={() => toggleCard('player')}
            />
          </>
        }
      >
        {!collapsed.player && (
          <div className="sh-stack">
            <Bar value={hpRatio} variant={hpBarVariant} />
            {condDeltas.maxHp ? (
              <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                <Pill tone="warn" icon="warning">Conditions: {fmtDelta(condDeltas.maxHp)} max HP</Pill>
              </div>
            ) : null}
            {(() => {
              // Disabled buttons still receive pointer events, so the long-press
              // handlers must NOT be wired when the button is in its disabled
              // boundary state (max HP for +, -10 for −). Spreading conditionally
              // is the cleanest way to gate this.
              const plusDisabled  = currentHp >= maxHp;
              const minusDisabled = currentHp <= -10;
              return (
                <div className="sh-row-h" style={{ justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                  <IconButton
                    icon={hpAdvancedOpen ? 'expand_less' : 'expand_more'}
                    ghost size="sm"
                    onClick={() => setHpAdvancedOpen(v => !v)}
                    aria-label={hpAdvancedOpen ? 'Hide advanced HP' : 'Show advanced HP'}
                  />
                  <IconButton
                    icon="remove"
                    {...(minusDisabled ? {} : longPressMinus)}
                    disabled={minusDisabled}
                    aria-label="Decrease HP"
                  />
                  <div style={{
                    flex: 1,
                    textAlign: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--font-size-2xl)',
                    fontVariantNumeric: 'tabular-nums',
                    color: hpFeedback ? (hpFeedback.delta >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--ink)',
                    transition: 'color var(--t-base) var(--ease)',
                  }}>
                    {hpFeedback?.text ?? `${currentHp} / ${maxHp}`}
                  </div>
                  <IconButton
                    icon="add"
                    {...(plusDisabled ? {} : longPressPlus)}
                    disabled={plusDisabled}
                    aria-label="Increase HP"
                  />
                </div>
              );
            })()}
            {hpAdvancedOpen && (
              <>
                <div className="sh-row-h sh-spread">
                  <span className="sh-eyebrow">Base max life</span>
                  {editMaxLife ? (
                    <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <Stepper
                        value={tempMaxLife}
                        min={player.getBaseLifeMin?.() ?? 1}
                        /* Stepper is hard-capped, so use a sentinel high enough
                           to not block house-rule HP. Warning below flags any
                           value above the theoretical PHB max. */
                        max={999}
                        onChange={setTempMaxLife}
                      />
                      <IconButton icon="check" size="sm" onClick={saveMaxLife} aria-label="Save max life" />
                      <IconButton icon="close" ghost size="sm" onClick={() => setEditMaxLife(false)} aria-label="Cancel" />
                    </div>
                  ) : (
                    <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <span className="sh-mono sh-num sh-muted">{player.maxLife ?? maxHp}</span>
                      <IconButton icon="edit" ghost size="sm" onClick={startEditMaxLife} aria-label="Edit max life" />
                    </div>
                  )}
                </div>
                {(() => {
                  const phbMax = player.getBaseLifeMax?.() ?? 0;
                  const current = editMaxLife ? Number(tempMaxLife) : Number(player.maxLife);
                  if (phbMax > 0 && current > phbMax) {
                    return (
                      <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                        <Pill tone="warn" icon="warning">Over PHB max ({phbMax})</Pill>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="sh-row-h sh-spread">
                  <span className="sh-eyebrow">Bonus life</span>
                  {editBonusLife ? (
                    <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <Stepper
                        value={tempBonusLife}
                        min={-99}
                        max={999}
                        onChange={setTempBonusLife}
                      />
                      <IconButton icon="check" size="sm" onClick={saveBonusLife} aria-label="Save bonus life" />
                      <IconButton icon="close" ghost size="sm" onClick={() => setEditBonusLife(false)} aria-label="Cancel" />
                    </div>
                  ) : (
                    <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <span className="sh-mono sh-num sh-muted">{(Number(player.healthModifier) || 0) >= 0 ? '+' : ''}{Number(player.healthModifier) || 0}</span>
                      <IconButton icon="edit" ghost size="sm" onClick={startEditBonusLife} aria-label="Edit bonus life" />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Defense pills row (AC / Init / Speed). Each pill carries its
          own pencil; the matching inline editor renders below the row. */}
      <div className="sh-grid-3">
        <StatPill
          accent
          label="AC"
          value={ac}
          cond={acCondAffected}
          sub={
            <>
              <span style={{ display: 'block' }}>touch {acTouch}</span>
              <span style={{ display: 'block' }}>flat {acFlat}</span>
              {acCondAffected && condNote(condDeltas.ac || 0)}
            </>
          }
          editing={editBonus === 'ac'}
          onEdit={() => toggleEditBonus('ac')}
        />
        <StatPill
          label="Init"
          value={totalInitiative >= 0 ? `+${totalInitiative}` : `${totalInitiative}`}
          cond={!!condDeltas.initiative}
          sub={withCond(initiativeBonus !== 0 ? `bonus ${initiativeBonus >= 0 ? '+' : ''}${initiativeBonus}` : null, condDeltas.initiative || 0)}
          editing={editBonus === 'initiativeBonus'}
          onEdit={() => toggleEditBonus('initiativeBonus')}
        />
        <StatPill
          label="Speed"
          value={speedDisplay}
          cond={!!condDeltas.speed}
          sub={withCond(speedInfo?.hasReduction ? 'encumbered' : (speedBonus !== 0 ? `bonus +${speedBonus}` : null), condDeltas.speed || 0)}
          editing={editBonus === 'speedBonus'}
          onEdit={() => toggleEditBonus('speedBonus')}
        />
      </div>
      {TOP_ROW_KEYS.includes(editBonus) && renderActiveEditor()}

      {/* Saves row */}
      <div className="sh-grid-3">
        <StatPill
          label="Fort"
          value={totalFort >= 0 ? `+${totalFort}` : totalFort}
          cond={!!condDeltas.fort}
          sub={withCond(fortBonus ? `bonus ${fortBonus >= 0 ? '+' : ''}${fortBonus}` : null, condDeltas.fort || 0)}
          editing={editBonus === 'fortBonus'}
          onEdit={() => toggleEditBonus('fortBonus')}
        />
        <StatPill
          label="Ref"
          value={totalRef >= 0 ? `+${totalRef}` : totalRef}
          cond={!!condDeltas.reflex}
          sub={withCond(reflexBonus ? `bonus ${reflexBonus >= 0 ? '+' : ''}${reflexBonus}` : null, condDeltas.reflex || 0)}
          editing={editBonus === 'reflexBonus'}
          onEdit={() => toggleEditBonus('reflexBonus')}
        />
        <StatPill
          label="Will"
          value={totalWill >= 0 ? `+${totalWill}` : totalWill}
          cond={!!condDeltas.will}
          sub={withCond(willBonus ? `bonus ${willBonus >= 0 ? '+' : ''}${willBonus}` : null, condDeltas.will || 0)}
          editing={editBonus === 'willBonus'}
          onEdit={() => toggleEditBonus('willBonus')}
        />
      </div>
      {BOTTOM_ROW_KEYS.includes(editBonus) && renderActiveEditor()}

      {/* Attacks card */}
      <Card
        eyebrow={`BAB ${bab_display}`}
        title="Attacks"
        action={
          <IconButton
            icon={collapsed.combat ? 'expand_more' : 'expand_less'}
            ghost size="sm"
            onClick={() => toggleCard('combat')}
            aria-label="Toggle attacks"
          />
        }
      >
        {!collapsed.combat && (
          <>
          {equippedWeapons.length === 0 ? (
            <div className="sh-stack">
              <div className="sh-warn-strip"><Icon name="sports_mma" />No weapon equipped — defaulting to punch.</div>
              <div className="sh-row-h" style={{ gap: 'var(--space-3)', justifyContent: 'space-between' }}>
                <span className="sh-display">Punch</span>
                <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                  <Pill tone={punchAtkAffected ? 'warn' : 'accent'}>{punchAttack >= 0 ? '+' : ''}{punchAttack}</Pill>
                  <Pill tone={punchDmgAffected ? 'warn' : 'default'}>{punchDamage}</Pill>
                </span>
              </div>
            </div>
          ) : (
            <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
              {equippedWeapons.map((w, idx) => {
                const wd = { weaponItem: w.weaponItem, isTwoHanded: w.isTwoHanded, itemData: w.itemData };
                const ab = calculateWeaponAttackBonus(player, wd);
                const dmg = calculateWeaponDamage(player, wd);
                const atkAffected = (player.getWeaponAttackConditionDelta?.(wd) ?? 0) !== 0;
                const dmgAffected = player.isWeaponDamageConditionAffected?.(wd) ?? false;
                /* Only show the separator border between rows, not above
                   the first weapon (otherwise it visually doubles the
                   Card's own internal padding boundary). */
                const rowStyle = idx === 0
                  ? { gap: 'var(--space-3)' }
                  : { gap: 'var(--space-3)', borderTop: '1px solid var(--border-soft)', paddingTop: 'var(--space-2)' };
                return (
                  <div key={`${w.link}-${w.slot}`} className="sh-row-h sh-spread" style={rowStyle}>
                    <SpellLink link={w.link}>
                      <span className="sh-display" style={{ fontSize: 'var(--font-size-lg)' }}>{w.name}</span>
                    </SpellLink>
                    <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <Pill tone={atkAffected ? 'warn' : 'accent'}>{ab >= 0 ? '+' : ''}{ab}</Pill>
                      <Pill tone={dmgAffected ? 'warn' : 'default'}>{dmg}</Pill>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {sneakAttackDice > 0 && (
            <div
              className="sh-row-h sh-spread"
              style={{
                gap: 'var(--space-3)',
                borderTop: '0.0625rem solid var(--border-soft)',
                paddingTop: 'var(--space-2)',
                marginTop: 'var(--space-2)',
              }}
              title="Applies when the target is denied its Dex bonus or you are flanking (ranged: within 30 ft). Added on a critical hit but never multiplied. No effect on oozes, plants, undead, constructs, incorporeal creatures, or anything immune to critical hits."
            >
              <span className="sh-display">Sneak attack</span>
              <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                <Pill tone="accent">+{sneakAttackDice}d6</Pill>
                <Icon name="info" />
              </span>
            </div>
          )}
          </>
        )}
      </Card>

      {/* Conditions card */}
      <ConditionsCard />

      {/* Class-specific cards — see class_feature_cards.jsx for the registry */}
      <ClassFeatureCards />
    </div>
    <PortraitEditorSheet
      open={portraitOpen}
      onClose={() => setPortraitOpen(false)}
      currentPortrait={characterPortrait}
      onSave={(dataUrl) => { dispatch(onSetCharacterPortrait(dataUrl)); setPortraitOpen(false); }}
      onRemove={() => { dispatch(onClearCharacterPortrait()); setPortraitOpen(false); }}
    />
    </>
  );
}

