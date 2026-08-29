import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import parse from 'html-react-parser';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import useCreatureData from '../hooks/useCreatureData';
import { addCardByLink } from '../../store/slices/appSlice';
import {
  onSetCompanion,
  onClearCompanion,
  onRenameCompanion,
  onAdjustCompanionHp,
  onSetCompanionMaxLife,
  onSetCompanionAcBonus,
  onSetCompanionAcTouchBonus,
  onSetCompanionAcFlatBonus,
  onSetCompanionInitBonus,
  onSetCompanionSpeedBonus,
  onSetCompanionFortBonus,
  onSetCompanionReflexBonus,
  onSetCompanionWillBonus,
  onSetCompanionAttackOverride,
} from '../../store/thunks/playerSheetThunks';
import { effectiveCompanionLevel, getSelectableCompanions } from '../../lib/utils';
import { slug } from '../../lib/slugUtils';
import useLongPress from '../hooks/useLongPress';
import useHpFeedback from '../hooks/useHpFeedback';
import CreatureAbilities from './creature_abilities';
import Card from '../common/Card';
import Bar from '../common/Bar';
import Pill from '../common/Pill';
import StatPill from '../common/StatPill';
import Stepper from '../common/Stepper';
import IconButton from '../common/IconButton';
import Filigree from '../common/Filigree';
import Icon from '../common/Icon';
import '../../style/animal_companion.css';

/** Single-value bonus thunks keyed by the companion field they edit. */
const BONUS_THUNK = {
  initBonus: onSetCompanionInitBonus,
  speedBonus: onSetCompanionSpeedBonus,
  fortBonus: onSetCompanionFortBonus,
  reflexBonus: onSetCompanionReflexBonus,
  willBonus: onSetCompanionWillBonus,
};

const fmtBonus = (n) => `${n >= 0 ? '+' : ''}${n}`;

export default function AnimalCompanionCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const collapsed = useSelector((state) => state.playerSheet?.combatPageCardsCollapsed?.animalCompanion ?? false);

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [hpAdvancedOpen, setHpAdvancedOpen] = useState(false);
  const [editMaxLife, setEditMaxLife] = useState(false);
  const [tempMaxLife, setTempMaxLife] = useState(0);
  const [editBonus, setEditBonus] = useState(null); // 'ac' | field key | null
  const [tempBonus, setTempBonus] = useState(0);
  const [tempAc, setTempAc] = useState({ general: 0, touch: 0, flat: 0 });
  const [combatOpen, setCombatOpen] = useState(false);
  const [editAtk, setEditAtk] = useState(null); // attack line index | null
  const [tempAtk, setTempAtk] = useState({ bonus: 0, damage: '' });

  /* The same "what just changed" readout the player's own hit points get:
     three taps of −1 read as −3 rather than flashing three times, so a hit
     applied in pieces is still legible as one number. */
  const { feedback: hpFeedback, show: showHpFeedback } = useHpFeedback();

  const handleHpDelta = useCallback((delta) => {
    dispatch(onAdjustCompanionHp(delta));
    showHpFeedback(delta);
  }, [dispatch, showHpFeedback]);

  const longPressPlus = useLongPress(() => handleHpDelta(10), () => handleHpDelta(1), { delay: 400 });
  const longPressMinus = useLongPress(() => handleHpDelta(-10), () => handleHpDelta(-1), { delay: 400 });

  const cls = player?.getClass?.() ?? '';
  const lvl = player?.getLevel?.() ?? 1;
  const effLevel = effectiveCompanionLevel({ class: cls, level: lvl });
  /* Companions come from the lazily-loaded creature files. */
  const ready = useCreatureData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectable = useMemo(() => getSelectableCompanions(effLevel), [effLevel, ready]);

  if (!player) return null;

  const companion = player.getCompanion?.() ?? null;

  const toggleCollapsed = () =>
    dispatch(setCombatPageCardCollapsed({ key: 'animalCompanion', value: !collapsed }));

  const cardAction = (
    <IconButton
      icon={collapsed ? 'expand_more' : 'expand_less'}
      ghost size="sm"
      onClick={toggleCollapsed}
      aria-label="Toggle animal companion"
    />
  );

  // —— No companion: just the selector ——
  if (!companion) {
    return (
      <Card title="Animal companion" className="sh-card--head-spread" eyebrow={`lv${effLevel}`} action={cardAction}>
        {!collapsed && (
          <div className="companion-card sh-stack">
            <span className="sh-eyebrow">Effective druid level {effLevel}</span>
            {selectable.length === 0 ? (
              <div className="sh-faint" style={{ fontSize: 'var(--font-size-sm)' }}>
                No companions available at this level yet.
              </div>
            ) : (
              <select
                className="companion-select"
                value=""
                onChange={(e) => { if (e.target.value) dispatch(onSetCompanion(e.target.value)); }}
                aria-label="Select an animal companion"
              >
                <option value="">Select a companion…</option>
                {selectable.map((c) => (
                  <option key={c.ref} value={c.ref}>
                    {c.label}{c.aquatic ? ' (aquatic)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </Card>
    );
  }

  // —— Companion selected ——
  const name = companion.getName();
  const ref = companion.getRef();
  const compEffLevel = companion.getEffectiveLevel();
  const maxHp = companion.getMaxLife();
  const currentHp = companion.getCurrentHp();
  const isDying = currentHp <= 0;
  const hpRatio = isDying
    ? Math.max(0, Math.min(1, (currentHp + 10) / 10))
    : (maxHp > 0 ? Math.max(0, Math.min(1, currentHp / maxHp)) : 0);
  const hpBarVariant = isDying ? 'danger' : 'hp';
  const plusDisabled = currentHp >= maxHp;
  const minusDisabled = currentHp <= -10;

  const ac = companion.getArmorClass();
  const acTouch = companion.getContactAC();
  const acFlat = companion.getFlatFootedAC();
  const init = companion.getInitiative();
  const speed = companion.getSpeed();
  const fort = companion.getFortSave();
  const reflex = companion.getReflexSave();
  const will = companion.getWillSave();
  const attacks = companion.getAttacks();
  const specials = companion.getSpecialAbilities();
  const tricks = companion.getBonusTricks();
  const combatHtml = companion.getCombatHtml();

  const startEditName = () => { setTempName(name); setEditingName(true); };
  const saveName = () => { dispatch(onRenameCompanion(tempName.trim() || name)); setEditingName(false); };

  const startEditMaxLife = () => {
    setTempMaxLife(companion.maxLife != null ? companion.maxLife : companion.getDefaultMaxLife());
    setEditMaxLife(true);
  };
  const saveMaxLife = () => {
    dispatch(onSetCompanionMaxLife(Math.max(0, Math.floor(Number(tempMaxLife) || 0))));
    setEditMaxLife(false);
  };
  const resetMaxLife = () => { dispatch(onSetCompanionMaxLife(null)); setEditMaxLife(false); };

  const toggleEditBonus = (key) => {
    if (editBonus === key) { setEditBonus(null); return; }
    setEditBonus(key);
    if (key === 'ac') {
      setTempAc({
        general: Number(companion.acBonus) || 0,
        touch: Number(companion.acTouchBonus) || 0,
        flat: Number(companion.acFlatBonus) || 0,
      });
    } else {
      setTempBonus(Number(companion[key]) || 0);
    }
  };

  const saveBonus = () => {
    if (!editBonus) return;
    if (editBonus === 'ac') {
      dispatch(onSetCompanionAcBonus(tempAc.general));
      dispatch(onSetCompanionAcTouchBonus(tempAc.touch));
      dispatch(onSetCompanionAcFlatBonus(tempAc.flat));
    } else if (BONUS_THUNK[editBonus]) {
      dispatch(BONUS_THUNK[editBonus](tempBonus));
    }
    setEditBonus(null);
  };

  const startEditAtk = (line) => {
    setEditAtk(line.index);
    setTempAtk({ bonus: Number(line.bonus) || 0, damage: line.damage || '' });
  };
  const saveAtk = () => {
    if (editAtk == null) return;
    dispatch(onSetCompanionAttackOverride(editAtk, { bonus: tempAtk.bonus, damage: tempAtk.damage }));
    setEditAtk(null);
  };
  const resetAtk = (index) => { dispatch(onSetCompanionAttackOverride(index, null)); setEditAtk(null); };

  const renderBonusEditor = (label, min, max, step = 1) => (
    <Card padding>
      <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <span className="sh-eyebrow">{label} bonus</span>
        <Stepper value={tempBonus} min={min} max={max} step={step} onChange={setTempBonus} />
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
          { key: 'touch', label: 'Touch', hint: 'touch only' },
          { key: 'flat', label: 'Flat', hint: 'flat-footed only' },
        ].map(({ key, label, hint }) => (
          <div key={key} className="sh-row-h sh-spread" style={{ gap: 'var(--space-2)' }}>
            <span className="sh-eyebrow">{label} <span className="sh-faint" style={{ textTransform: 'none', letterSpacing: 0 }}>({hint})</span></span>
            <Stepper value={tempAc[key]} min={-99} max={99} onChange={(v) => setTempAc((prev) => ({ ...prev, [key]: v }))} />
          </div>
        ))}
        <div className="sh-row-h" style={{ gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <IconButton icon="check" size="sm" onClick={saveBonus} aria-label="Save AC modifiers" />
          <IconButton icon="close" ghost size="sm" onClick={() => setEditBonus(null)} aria-label="Cancel" />
        </div>
      </div>
    </Card>
  );

  const renderActiveEditor = () => {
    if (editBonus === 'ac') return renderAcEditor();
    if (editBonus === 'initBonus') return renderBonusEditor('Init', -99, 99);
    if (editBonus === 'speedBonus') return renderBonusEditor('Speed', -99, 99, 5);
    if (editBonus === 'fortBonus') return renderBonusEditor('Fort', -99, 99);
    if (editBonus === 'reflexBonus') return renderBonusEditor('Ref', -99, 99);
    if (editBonus === 'willBonus') return renderBonusEditor('Will', -99, 99);
    return null;
  };

  const TOP_ROW = ['ac', 'initBonus', 'speedBonus'];
  const BOTTOM_ROW = ['fortBonus', 'reflexBonus', 'willBonus'];

  return (
    <Card
      title={name || 'Animal companion'}
      className="sh-card--head-spread"
      eyebrow={`lv${compEffLevel}`}
      action={cardAction}
    >
      {!collapsed && (
        <div className="companion-card sh-stack">
          {/* Name row: link to base stat card + rename + remove */}
          <div className="sh-row-h sh-spread" style={{ gap: 'var(--space-2)' }}>
            {editingName ? (
              <div className="sh-row-h" style={{ gap: 'var(--space-2)', flex: 1 }}>
                <input
                  type="text"
                  className="companion-name-input"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  aria-label="Companion name"
                />
                <IconButton icon="check" size="sm" onClick={saveName} aria-label="Save name" />
                <IconButton icon="close" ghost size="sm" onClick={() => setEditingName(false)} aria-label="Cancel" />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="companion-combat-toggle"
                  onClick={() => dispatch(addCardByLink({ links: ref }))}
                  title="Show base stat block"
                >
                  <Icon name="menu_book" size={16} /> Stat block
                </button>
                <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
                  <IconButton icon="edit" ghost size="sm" onClick={startEditName} aria-label="Rename companion" />
                  <IconButton icon="delete" ghost size="sm" onClick={() => dispatch(onClearCompanion())} aria-label="Remove companion" />
                </span>
              </>
            )}
          </div>

          {/* HP bar */}
          <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
            <Bar value={hpRatio} variant={hpBarVariant} />
            <div className="sh-row-h" style={{ justifyContent: 'space-between', gap: 'var(--space-2)' }}>
              <IconButton
                icon={hpAdvancedOpen ? 'expand_less' : 'expand_more'}
                ghost size="sm"
                onClick={() => setHpAdvancedOpen((v) => !v)}
                aria-label={hpAdvancedOpen ? 'Hide base max life' : 'Show base max life'}
              />
              <IconButton icon="remove" {...(minusDisabled ? {} : longPressMinus)} disabled={minusDisabled} aria-label="Decrease HP" />
              <div
                className="companion-hp-readout"
                style={hpFeedback
                  ? { color: hpFeedback.delta >= 0 ? 'var(--success)' : 'var(--danger)' }
                  : undefined}
              >
                {hpFeedback?.text ?? `${currentHp} / ${maxHp}`}
              </div>
              <IconButton icon="add" {...(plusDisabled ? {} : longPressPlus)} disabled={plusDisabled} aria-label="Increase HP" />
            </div>
            {hpAdvancedOpen && (
              <div className="sh-row-h sh-spread">
                <span className="sh-eyebrow">Base max life</span>
                {editMaxLife ? (
                  <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                    <Stepper value={tempMaxLife} min={0} max={999} onChange={setTempMaxLife} />
                    <IconButton icon="check" size="sm" onClick={saveMaxLife} aria-label="Save max life" />
                    <IconButton icon="restart_alt" ghost size="sm" onClick={resetMaxLife} aria-label="Reset to computed" />
                    <IconButton icon="close" ghost size="sm" onClick={() => setEditMaxLife(false)} aria-label="Cancel" />
                  </div>
                ) : (
                  <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                    <span className="sh-mono sh-num sh-muted">
                      {maxHp}{companion.maxLife == null ? '' : ' *'}
                    </span>
                    <IconButton icon="edit" ghost size="sm" onClick={startEditMaxLife} aria-label="Edit max life" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* What the creature is made of, under how hurt it is. */}
          <CreatureAbilities creature={companion} />

          {/* Defense pills row */}
          <div className="sh-grid-3">
            <StatPill
              className="sh-stat-pill--sm"
              accent
              label="AC"
              value={ac}
              sub={
                <>
                  <span style={{ display: 'block' }}>touch {acTouch}</span>
                  <span style={{ display: 'block' }}>flat {acFlat}</span>
                </>
              }
              editing={editBonus === 'ac'}
              onEdit={() => toggleEditBonus('ac')}
            />
            <StatPill
              className="sh-stat-pill--sm"
              label="Init"
              value={fmtBonus(init)}
              sub={companion.initBonus ? `bonus ${fmtBonus(companion.initBonus)}` : null}
              editing={editBonus === 'initBonus'}
              onEdit={() => toggleEditBonus('initBonus')}
            />
            <StatPill
              className="sh-stat-pill--sm"
              label="Speed"
              value={`${speed} ft`}
              sub={companion.speedBonus ? `bonus ${fmtBonus(companion.speedBonus)}` : null}
              editing={editBonus === 'speedBonus'}
              onEdit={() => toggleEditBonus('speedBonus')}
            />
          </div>
          {TOP_ROW.includes(editBonus) && renderActiveEditor()}

          {/* Saves row */}
          <div className="sh-grid-3">
            <StatPill
              className="sh-stat-pill--sm"
              label="Fort"
              value={fmtBonus(fort)}
              sub={companion.fortBonus ? `bonus ${fmtBonus(companion.fortBonus)}` : null}
              editing={editBonus === 'fortBonus'}
              onEdit={() => toggleEditBonus('fortBonus')}
            />
            <StatPill
              className="sh-stat-pill--sm"
              label="Ref"
              value={fmtBonus(reflex)}
              sub={companion.reflexBonus ? `bonus ${fmtBonus(companion.reflexBonus)}` : null}
              editing={editBonus === 'reflexBonus'}
              onEdit={() => toggleEditBonus('reflexBonus')}
            />
            <StatPill
              className="sh-stat-pill--sm"
              label="Will"
              value={fmtBonus(will)}
              sub={companion.willBonus ? `bonus ${fmtBonus(companion.willBonus)}` : null}
              editing={editBonus === 'willBonus'}
              onEdit={() => toggleEditBonus('willBonus')}
            />
          </div>
          {BOTTOM_ROW.includes(editBonus) && renderActiveEditor()}

          {/* Attacks */}
          {attacks.length > 0 && (
            <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
              <Filigree>Attacks</Filigree>
              {attacks.map((line) => {
                const overridden = !!companion.overrides?.[line.index];
                const labelName = `${line.count > 1 ? `${line.count} ` : ''}${line.name}`;
                if (editAtk === line.index) {
                  return (
                    <Card key={line.index} padding>
                      <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
                        <div className="sh-row-h sh-spread">
                          <span className="sh-eyebrow">{labelName} — attack</span>
                          <Stepper value={tempAtk.bonus} min={-50} max={50} onChange={(v) => setTempAtk((p) => ({ ...p, bonus: v }))} />
                        </div>
                        <div className="sh-row-h sh-spread">
                          <span className="sh-eyebrow">Damage</span>
                          <input
                            type="text"
                            className="companion-name-input"
                            value={tempAtk.damage}
                            onChange={(e) => setTempAtk((p) => ({ ...p, damage: e.target.value }))}
                            aria-label="Attack damage"
                          />
                        </div>
                        <div className="sh-row-h" style={{ gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                          {overridden && <IconButton icon="restart_alt" ghost size="sm" onClick={() => resetAtk(line.index)} aria-label="Reset attack" />}
                          <IconButton icon="check" size="sm" onClick={saveAtk} aria-label="Save attack" />
                          <IconButton icon="close" ghost size="sm" onClick={() => setEditAtk(null)} aria-label="Cancel" />
                        </div>
                      </div>
                    </Card>
                  );
                }
                return (
                  <div key={line.index} className="sh-row-h sh-spread" style={{ gap: 'var(--space-3)' }}>
                    <span className="sh-display" style={{ fontSize: 'var(--font-size-lg)', textTransform: 'capitalize' }}>{labelName}</span>
                    <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <Pill tone={overridden ? 'warn' : 'default'}>{fmtBonus(line.bonus ?? 0)}</Pill>
                      {line.damage && <Pill tone={overridden ? 'warn' : 'default'}>{line.damage}</Pill>}
                      <IconButton icon="edit" ghost size="sm" onClick={() => startEditAtk(line)} aria-label={`Edit ${line.name} attack`} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tricks + special abilities */}
          <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="companion-ability-btn"
              onClick={() => dispatch(addCardByLink({ links: 'companionAbility#bonus-tricks' }))}
              title="Show description"
            >
              <Pill tone="default" icon="pets">Bonus tricks: {tricks}</Pill>
            </button>
            {specials.map((s) => (
              <button
                key={s}
                type="button"
                className="companion-ability-btn"
                onClick={() => dispatch(addCardByLink({ links: `companionAbility#${slug(s)}` }))}
                title="Show description"
              >
                <Pill tone="accent">{s}</Pill>
              </button>
            ))}
          </div>

          {/* Combat text */}
          {combatHtml && (
            <div className="sh-stack" style={{ gap: 'var(--space-1)' }}>
              <button
                type="button"
                className="companion-combat-toggle"
                onClick={() => setCombatOpen((v) => !v)}
              >
                <Icon name={combatOpen ? 'expand_less' : 'expand_more'} size={16} />
                Combat
              </button>
              {combatOpen && <div className="companion-combat-text">{parse(combatHtml)}</div>}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
