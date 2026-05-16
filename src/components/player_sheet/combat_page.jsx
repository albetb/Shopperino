import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
};

export default function CombatPage() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet?.player);
  const collapsed = useSelector(state => state.playerSheet?.combatPageCardsCollapsed ?? { player: false, combat: false, items: false });

  const [hpFeedback, setHpFeedback] = useState(null);
  const hpFeedbackTotalRef = useRef(0);
  const [editMaxLife, setEditMaxLife] = useState(false);
  const [tempMaxLife, setTempMaxLife] = useState(10);
  const [editBonus, setEditBonus] = useState(null);
  const [tempBonus, setTempBonus] = useState(0);

  const currentHp = player?.getCurrentHp?.() ?? 0;
  const maxHp = player?.getMaxLife?.() ?? 0;
  const hpRatio = maxHp > 0 ? currentHp / maxHp : 0;

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
    const max = player?.getBaseLifeMax?.() ?? 10;
    const clamped = Math.max(min, Math.min(max, Math.floor(Number(tempMaxLife) || min)));
    dispatch(onSetMaxLife(clamped));
    setEditMaxLife(false);
  }, [player, tempMaxLife, dispatch]);

  const startEditBonus = useCallback(key => {
    if (!player) return;
    setEditBonus(key);
    setTempBonus(Number(player[key]) || 0);
  }, [player]);

  const saveBonus = useCallback(() => {
    if (editBonus && BONUS_THUNK[editBonus]) dispatch(BONUS_THUNK[editBonus](tempBonus));
    setEditBonus(null);
  }, [editBonus, tempBonus, dispatch]);

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
      const item = getItemByRef(w.link)?.raw;
      if (!item) return;
      weapons.push({ slot, name: w.name, link: w.link, weaponItem: item, isTwoHanded: w.twoHanded === true });
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
  const punchAttack = bab + strMod;
  const punchDamage = player.getPunchDamage?.() ?? '1d3';

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
  const characterRace  = player.getRace?.() ?? '';

  const renderBonusEditor = (label, min, max, step = 1) => (
    <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      <span className="sh-eyebrow">{label} bonus</span>
      <Stepper
        value={tempBonus}
        min={min}
        max={max}
        step={step}
        onChange={setTempBonus}
      />
      <IconButton icon="check" size="sm" onClick={saveBonus} aria-label="Save bonus" />
      <IconButton icon="close" ghost size="sm" onClick={() => setEditBonus(null)} aria-label="Cancel" />
    </div>
  );

  const bab_display = formatBaseAttackBonus(bab);

  return (
    <div className="sh-stack" style={{ padding: 'var(--space-4)', paddingBottom: 'var(--space-12)' }}>
      {/* Header card with portrait + identity */}
      <Card padding>
        <div className="sh-row-h" style={{ gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <div className="sh-portrait" aria-hidden="true">
            <Icon name="badge" />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <Filigree>{characterClass || 'No class'} · level {characterLevel}</Filigree>
            <div className="sh-display" style={{ fontSize: 'var(--font-size-2xl)' }}>{characterName || 'Unnamed'}</div>
            <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {characterRace && <Pill>{characterRace}</Pill>}
              <Pill tone="accent">{characterClass} {characterLevel}</Pill>
            </div>
          </div>
        </div>
      </Card>

      {/* HP card */}
      <Card
        title={`${currentHp} / ${maxHp} hp`}
        eyebrow="Hit points"
        action={
          <IconButton
            icon={collapsed.player ? 'expand_more' : 'expand_less'}
            ghost size="sm"
            aria-label="Toggle HP card"
            onClick={() => toggleCard('player')}
          />
        }
      >
        {!collapsed.player && (
          <div className="sh-stack">
            <Bar value={hpRatio} variant="hp" />
            <div className="sh-row-h" style={{ justifyContent: 'space-between', gap: 'var(--space-2)' }}>
              <IconButton icon="remove" {...longPressMinus} aria-label="Decrease HP" />
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
              <IconButton icon="add" {...longPressPlus} aria-label="Increase HP" />
            </div>
            <div className="sh-row-h sh-spread">
              <span className="sh-eyebrow">Base max life</span>
              {editMaxLife ? (
                <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                  <Stepper
                    value={tempMaxLife}
                    min={player.getBaseLifeMin?.() ?? 1}
                    max={player.getBaseLifeMax?.() ?? 99}
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
          </div>
        )}
      </Card>

      {/* Defense pills row (AC / Init / Speed) */}
      <div className="sh-grid-3">
        <StatPill accent label="AC" value={ac} sub={`touch ${acTouch} · flat ${acFlat}`} />
        <StatPill
          label="Init"
          value={totalInitiative >= 0 ? `+${totalInitiative}` : `${totalInitiative}`}
          sub={initiativeBonus !== 0 ? `bonus ${initiativeBonus >= 0 ? '+' : ''}${initiativeBonus}` : null}
        />
        <StatPill label="Speed" value={speedDisplay} sub={speedInfo?.hasReduction ? 'encumbered' : null} />
      </div>

      {/* Saves row */}
      <div className="sh-grid-3">
        <StatPill label="Fort" value={totalFort >= 0 ? `+${totalFort}` : totalFort} sub={fortBonus ? `bonus ${fortBonus >= 0 ? '+' : ''}${fortBonus}` : null} />
        <StatPill label="Ref"  value={totalRef  >= 0 ? `+${totalRef}`  : totalRef}  sub={reflexBonus ? `bonus ${reflexBonus >= 0 ? '+' : ''}${reflexBonus}` : null} />
        <StatPill accent label="Will" value={totalWill >= 0 ? `+${totalWill}` : totalWill} sub={willBonus ? `bonus ${willBonus >= 0 ? '+' : ''}${willBonus}` : null} />
      </div>

      {/* Bonus / speed edit strip */}
      <Card padding>
        <div className="sh-stack">
          <div className="sh-row-h sh-spread">
            <Filigree>Adjust modifiers</Filigree>
            <span className="sh-mono sh-faint" style={{ fontSize: 'var(--font-size-xs)' }}>BAB {bab_display}</span>
          </div>
          {editBonus === null ? (
            <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Pill tone="ghost" icon="edit"><button type="button" className="sh-link-btn" onClick={() => startEditBonus('speedBonus')} style={inlineLinkBtn}>Speed {speedBonus >= 0 ? '+' : ''}{speedBonus}</button></Pill>
              <Pill tone="ghost" icon="edit"><button type="button" className="sh-link-btn" onClick={() => startEditBonus('initiativeBonus')} style={inlineLinkBtn}>Init {initiativeBonus >= 0 ? '+' : ''}{initiativeBonus}</button></Pill>
              <Pill tone="ghost" icon="edit"><button type="button" className="sh-link-btn" onClick={() => startEditBonus('fortBonus')} style={inlineLinkBtn}>Fort {fortBonus >= 0 ? '+' : ''}{fortBonus}</button></Pill>
              <Pill tone="ghost" icon="edit"><button type="button" className="sh-link-btn" onClick={() => startEditBonus('reflexBonus')} style={inlineLinkBtn}>Ref {reflexBonus >= 0 ? '+' : ''}{reflexBonus}</button></Pill>
              <Pill tone="ghost" icon="edit"><button type="button" className="sh-link-btn" onClick={() => startEditBonus('willBonus')} style={inlineLinkBtn}>Will {willBonus >= 0 ? '+' : ''}{willBonus}</button></Pill>
            </div>
          ) : (
            renderBonusEditor(
              editBonus.replace(/Bonus$/, ''),
              editBonus === 'speedBonus' ? 0 : -99,
              99,
              editBonus === 'speedBonus' ? 5 : 1,
            )
          )}
        </div>
      </Card>

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
          equippedWeapons.length === 0 ? (
            <div className="sh-stack">
              <div className="sh-warn-strip"><Icon name="sports_mma" />No weapon equipped — defaulting to punch.</div>
              <div className="sh-row-h" style={{ gap: 'var(--space-3)', justifyContent: 'space-between' }}>
                <span className="sh-display">Punch</span>
                <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                  <Pill tone="accent">{punchAttack >= 0 ? '+' : ''}{punchAttack}</Pill>
                  <Pill>{punchDamage}</Pill>
                </span>
              </div>
            </div>
          ) : (
            <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
              {equippedWeapons.map(w => {
                const ab = calculateWeaponAttackBonus(player, { weaponItem: w.weaponItem, isTwoHanded: w.isTwoHanded });
                const dmg = calculateWeaponDamage(player, { weaponItem: w.weaponItem, isTwoHanded: w.isTwoHanded });
                return (
                  <div key={`${w.link}-${w.slot}`} className="sh-row-h sh-spread" style={{ gap: 'var(--space-3)', borderTop: '1px solid var(--border-soft)', paddingTop: 'var(--space-2)' }}>
                    <SpellLink link={w.link}>
                      <span className="sh-display" style={{ fontSize: 'var(--font-size-lg)' }}>{w.name}</span>
                    </SpellLink>
                    <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <Pill tone="accent">{ab >= 0 ? '+' : ''}{ab}</Pill>
                      <Pill>{dmg}</Pill>
                    </span>
                  </div>
                );
              })}
            </div>
          )
        )}
      </Card>

      {/* AC breakdown */}
      <Card eyebrow="Armor class" title={`AC ${ac}`}>
        <div className="sh-stack" style={{ gap: 'var(--space-1)' }}>
          <Row label="Total" value={ac} accent />
          <Row label="Touch" value={acTouch} />
          <Row label="Flat-footed" value={acFlat} />
        </div>
      </Card>

      {/* Class-specific cards */}
      {(() => {
        const cls = player.getClass?.() ?? '';
        const lvl = player.getLevel?.() ?? 1;
        const cards = [];
        if (cls === 'Druid') {
          cards.push({ key: 'animalCompanion', title: 'Animal companion' });
          if (lvl >= 5) cards.push({ key: 'wildShape', title: 'Wild shape' });
        } else if (cls === 'Cleric') {
          cards.push({ key: 'turnRebukeUndead', title: 'Turn or rebuke undead' });
        } else if (cls === 'Paladin' && lvl >= 4) {
          cards.push({ key: 'turnUndead', title: 'Turn undead' });
        } else if (cls === 'Bard') {
          cards.push({ key: 'bardicMusic', title: 'Bardic music' });
        } else if (cls === 'Ranger' && lvl >= 4) {
          cards.push({ key: 'animalCompanion', title: 'Animal companion' });
        } else if (['Wizard', 'Sorcerer'].includes(cls)) {
          cards.push({ key: 'familiar', title: 'Familiar' });
        }
        return cards.map(({ key, title }) => (
          <Card
            key={key}
            title={title}
            action={
              <IconButton
                icon={collapsed[key] ? 'expand_more' : 'expand_less'}
                ghost size="sm"
                onClick={() => toggleCard(key)}
                aria-label={`Toggle ${title}`}
              />
            }
          >
            {!collapsed[key] && <div className="sh-faint" style={{ fontSize: 'var(--font-size-sm)' }}>Coming soon.</div>}
          </Card>
        ));
      })()}
    </div>
  );
}

const inlineLinkBtn = {
  background: 'transparent',
  border: 0,
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  padding: 0,
};

function Row({ label, value, accent }) {
  return (
    <div className="sh-row-h sh-spread" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-soft)' }}>
      <span className="sh-eyebrow">{label}</span>
      <span className="sh-mono sh-num" style={{ color: accent ? 'var(--accent)' : 'var(--ink)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
