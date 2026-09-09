import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import parse from 'html-react-parser';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import useCreatureData from '../hooks/useCreatureData';
import { addCardByLink } from '../../store/slices/appSlice';
import {
  onSetFamiliar,
  onClearFamiliar,
  onRenameFamiliar,
  onAdjustFamiliarHp,
  onSetFamiliarMaxLife,
  onSetFamiliarAcBonus,
  onSetFamiliarAcTouchBonus,
  onSetFamiliarAcFlatBonus,
  onSetFamiliarInitBonus,
  onSetFamiliarSpeedBonus,
  onSetFamiliarFortBonus,
  onSetFamiliarReflexBonus,
  onSetFamiliarWillBonus,
  onSetFamiliarAttackOverride,
} from '../../store/thunks/playerSheetThunks';
import { getFamiliarSpecies } from '../../lib/utils';
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
import '../../style/familiar.css';
import { useUnits } from '../hooks/useUnits';
import { t, tx, tName } from '../../lib/i18n';
import { attackName, creatureName } from '../../lib/i18n/creatureText';

/** Single-value bonus thunks keyed by the familiar field they edit. */
const BONUS_THUNK = {
  initBonus: onSetFamiliarInitBonus,
  speedBonus: onSetFamiliarSpeedBonus,
  fortBonus: onSetFamiliarFortBonus,
  reflexBonus: onSetFamiliarReflexBonus,
  willBonus: onSetFamiliarWillBonus,
};

const fmtBonus = (n) => `${n >= 0 ? '+' : ''}${n}`;

export default function FamiliarCard() {
  const u = useUnits();
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const collapsed = useSelector((state) => state.playerSheet?.combatPageCardsCollapsed?.familiar ?? false);

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

  /* The same "what just changed" readout the player's own hit points get, so a
     hit applied in pieces still reads as one number. */
  const { feedback: hpFeedback, show: showHpFeedback } = useHpFeedback();

  const handleHpDelta = useCallback((delta) => {
    dispatch(onAdjustFamiliarHp(delta));
    showHpFeedback(delta);
  }, [dispatch, showHpFeedback]);

  const longPressPlus = useLongPress(() => handleHpDelta(10), () => handleHpDelta(1), { delay: 400 });
  const longPressMinus = useLongPress(() => handleHpDelta(-10), () => handleHpDelta(-1), { delay: 400 });

  const lvl = player?.getLevel?.() ?? 1;
  /* Species come from the lazily-loaded creature files. */
  const ready = useCreatureData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const species = useMemo(() => getFamiliarSpecies(), [ready]);

  if (!player) return null;

  const familiar = player.getFamiliar?.() ?? null;

  const toggleCollapsed = () =>
    dispatch(setCombatPageCardCollapsed({ key: 'familiar', value: !collapsed }));

  const cardAction = (
    <IconButton
      icon={collapsed ? 'expand_more' : 'expand_less'}
      ghost size="sm"
      onClick={toggleCollapsed}
      aria-label={t('Toggle familiar')}
    />
  );

  // —— No familiar: just the selector ——
  if (!familiar) {
    return (
      <Card title={t('Familiar')} className="sh-card--head-spread" eyebrow={`lv${lvl}`} action={cardAction}>
        {!collapsed && (
          <div className="familiar-card sh-stack">
            <select
              className="familiar-select"
              value=""
              onChange={(e) => { if (e.target.value) dispatch(onSetFamiliar(e.target.value)); }}
              aria-label={t('Select a familiar')}
            >
              <option value="">{t('Select a familiar…')}</option>
              {species.map((s) => (
                <option key={s.ref} value={s.ref}>{`${tName('creatures', s.name)} (${t(s.bonus.text)})`}</option>
              ))}
            </select>
          </div>
        )}
      </Card>
    );
  }

  // —— Familiar selected ——
  const name = familiar.getName();
  const ref = familiar.getRef();
  const maxHp = familiar.getMaxLife();
  const currentHp = familiar.getCurrentHp();
  const isDying = currentHp <= 0;
  const hpRatio = isDying
    ? Math.max(0, Math.min(1, (currentHp + 10) / 10))
    : (maxHp > 0 ? Math.max(0, Math.min(1, currentHp / maxHp)) : 0);
  const hpBarVariant = isDying ? 'danger' : 'hp';
  const plusDisabled = currentHp >= maxHp;
  const minusDisabled = currentHp <= -10;

  const ac = familiar.getArmorClass();
  const acTouch = familiar.getContactAC();
  const acFlat = familiar.getFlatFootedAC();
  const init = familiar.getInitiative();
  const speed = familiar.getSpeed();
  const fort = familiar.getFortSave();
  const reflex = familiar.getReflexSave();
  const will = familiar.getWillSave();
  const attacks = familiar.getAttacks();
  const specials = familiar.getSpecialAbilities();
  const intScore = familiar.getInt();
  const naturalArmorAdj = familiar.getNaturalArmorAdj();
  const speciesBonus = familiar.getSpeciesBonus();
  const combatHtml = familiar.getCombatHtml();

  const startEditName = () => { setTempName(name); setEditingName(true); };
  const saveName = () => { dispatch(onRenameFamiliar(tempName.trim() || name)); setEditingName(false); };

  const startEditMaxLife = () => {
    setTempMaxLife(familiar.maxLife != null ? familiar.maxLife : familiar.getDefaultMaxLife());
    setEditMaxLife(true);
  };
  const saveMaxLife = () => {
    dispatch(onSetFamiliarMaxLife(Math.max(0, Math.floor(Number(tempMaxLife) || 0))));
    setEditMaxLife(false);
  };
  const resetMaxLife = () => { dispatch(onSetFamiliarMaxLife(null)); setEditMaxLife(false); };

  const toggleEditBonus = (key) => {
    if (editBonus === key) { setEditBonus(null); return; }
    setEditBonus(key);
    if (key === 'ac') {
      setTempAc({
        general: Number(familiar.acBonus) || 0,
        touch: Number(familiar.acTouchBonus) || 0,
        flat: Number(familiar.acFlatBonus) || 0,
      });
    } else {
      setTempBonus(Number(familiar[key]) || 0);
    }
  };

  const saveBonus = () => {
    if (!editBonus) return;
    if (editBonus === 'ac') {
      dispatch(onSetFamiliarAcBonus(tempAc.general));
      dispatch(onSetFamiliarAcTouchBonus(tempAc.touch));
      dispatch(onSetFamiliarAcFlatBonus(tempAc.flat));
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
    dispatch(onSetFamiliarAttackOverride(editAtk, { bonus: tempAtk.bonus, damage: tempAtk.damage }));
    setEditAtk(null);
  };
  const resetAtk = (index) => { dispatch(onSetFamiliarAttackOverride(index, null)); setEditAtk(null); };

  const renderBonusEditor = (label, min, max, step = 1) => (
    <Card padding>
      <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <span className="sh-eyebrow">{label}</span>
        <Stepper value={tempBonus} min={min} max={max} step={step} onChange={setTempBonus} />
        <IconButton icon="check" size="sm" onClick={saveBonus} aria-label={t('Save bonus')} style={{ marginLeft: 'auto' }} />
        <IconButton icon="close" ghost size="sm" onClick={() => setEditBonus(null)} aria-label={t('Cancel')} />
      </div>
    </Card>
  );

  const renderAcEditor = () => (
    <Card padding>
      <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
        <Filigree>{t('AC modifiers')}</Filigree>
        {[
          { key: 'general', label: 'General', hint: 'AC + touch + flat' },
          { key: 'touch', label: 'Touch', hint: 'touch only' },
          { key: 'flat', label: 'Flat', hint: 'flat-footed only' },
        ].map(({ key, label, hint }) => (
          <div key={key} className="sh-row-h sh-spread" style={{ gap: 'var(--space-2)' }}>
            <span className="sh-eyebrow">{t(label)} <span className="sh-faint" style={{ textTransform: 'none', letterSpacing: 0 }}>({t(hint)})</span></span>
            <Stepper value={tempAc[key]} min={-99} max={99} onChange={(v) => setTempAc((prev) => ({ ...prev, [key]: v }))} />
          </div>
        ))}
        <div className="sh-row-h" style={{ gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <IconButton icon="check" size="sm" onClick={saveBonus} aria-label={t('Save AC modifiers')} />
          <IconButton icon="close" ghost size="sm" onClick={() => setEditBonus(null)} aria-label={t('Cancel')} />
        </div>
      </div>
    </Card>
  );

  const renderActiveEditor = () => {
    if (editBonus === 'ac') return renderAcEditor();
    if (editBonus === 'initBonus') return renderBonusEditor(t('Init bonus'), -99, 99);
    if (editBonus === 'speedBonus') return renderBonusEditor(t('Speed bonus'), -99, 99, 5);
    if (editBonus === 'fortBonus') return renderBonusEditor(t('Fort bonus'), -99, 99);
    if (editBonus === 'reflexBonus') return renderBonusEditor(t('Ref bonus'), -99, 99);
    if (editBonus === 'willBonus') return renderBonusEditor(t('Will bonus'), -99, 99);
    return null;
  };

  const TOP_ROW = ['ac', 'initBonus', 'speedBonus'];
  const BOTTOM_ROW = ['fortBonus', 'reflexBonus', 'willBonus'];

  return (
    <Card
      title={creatureName(name) || t('Familiar')}
      className="sh-card--head-spread"
      eyebrow={`lv${lvl}`}
      action={cardAction}
    >
      {!collapsed && (
        <div className="familiar-card sh-stack">
          {/* Name row: stat-block link + rename + remove */}
          <div className="sh-row-h sh-spread" style={{ gap: 'var(--space-2)' }}>
            {editingName ? (
              <div className="sh-row-h" style={{ gap: 'var(--space-2)', flex: 1 }}>
                <input
                  type="text"
                  className="familiar-name-input"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  aria-label={t('Familiar name')}
                />
                <IconButton icon="check" size="sm" onClick={saveName} aria-label={t('Save name')} />
                <IconButton icon="close" ghost size="sm" onClick={() => setEditingName(false)} aria-label={t('Cancel')} />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="familiar-combat-toggle"
                  onClick={() => dispatch(addCardByLink({ links: ref }))}
                  title={t('Show base stat block')}
                >
                  <Icon name="menu_book" size={16} /> {t('Stat block')}
                </button>
                <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
                  <IconButton icon="edit" ghost size="sm" onClick={startEditName} aria-label={t('Rename familiar')} />
                  <IconButton icon="delete" ghost size="sm" onClick={() => dispatch(onClearFamiliar())} aria-label={t('Remove familiar')} />
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
                aria-label={hpAdvancedOpen ? t('Hide base max life') : t('Show base max life')}
              />
              <IconButton icon="remove" {...(minusDisabled ? {} : longPressMinus)} disabled={minusDisabled} aria-label={t('Decrease HP')} />
              <div
                className="familiar-hp-readout"
                style={hpFeedback
                  ? { color: hpFeedback.delta >= 0 ? 'var(--success)' : 'var(--danger)' }
                  : undefined}
              >
                {hpFeedback?.text ?? `${currentHp} / ${maxHp}`}
              </div>
              <IconButton icon="add" {...(plusDisabled ? {} : longPressPlus)} disabled={plusDisabled} aria-label={t('Increase HP')} />
            </div>
            {hpAdvancedOpen && (
              <div className="sh-row-h sh-spread">
                <span className="sh-eyebrow">{t('Base max life')}</span>
                {editMaxLife ? (
                  <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                    <Stepper value={tempMaxLife} min={0} max={999} onChange={setTempMaxLife} />
                    <IconButton icon="check" size="sm" onClick={saveMaxLife} aria-label={t('Save max life')} />
                    <IconButton icon="restart_alt" ghost size="sm" onClick={resetMaxLife} aria-label={t('Reset to ½ master HP')} />
                    <IconButton icon="close" ghost size="sm" onClick={() => setEditMaxLife(false)} aria-label={t('Cancel')} />
                  </div>
                ) : (
                  <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                    <span className="sh-mono sh-num sh-muted">
                      {maxHp}{familiar.maxLife == null ? '' : ' *'}
                    </span>
                    <IconButton icon="edit" ghost size="sm" onClick={startEditMaxLife} aria-label={t('Edit max life')} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* What the creature is made of, under how hurt it is. */}
          <CreatureAbilities creature={familiar} />

          {/* Defense pills row */}
          <div className="sh-grid-3">
            <StatPill
              className="sh-stat-pill--sm"
              accent
              label={t('AC')}
              value={ac}
              sub={
                <>
                  <span style={{ display: 'block' }}>{t('touch')} {acTouch}</span>
                  <span style={{ display: 'block' }}>{t('flat')} {acFlat}</span>
                </>
              }
              editing={editBonus === 'ac'}
              onEdit={() => toggleEditBonus('ac')}
            />
            <StatPill
              className="sh-stat-pill--sm"
              label={t('Init')}
              value={fmtBonus(init)}
              sub={familiar.initBonus ? `${t('bonus')} ${fmtBonus(familiar.initBonus)}` : null}
              editing={editBonus === 'initBonus'}
              onEdit={() => toggleEditBonus('initBonus')}
            />
            <StatPill
              className="sh-stat-pill--sm"
              label={t('Speed')}
              value={u.distance(speed)}
              sub={familiar.speedBonus ? `${t('bonus')} ${fmtBonus(familiar.speedBonus)}` : null}
              editing={editBonus === 'speedBonus'}
              onEdit={() => toggleEditBonus('speedBonus')}
            />
          </div>
          {TOP_ROW.includes(editBonus) && renderActiveEditor()}

          {/* Saves row */}
          <div className="sh-grid-3">
            <StatPill
              className="sh-stat-pill--sm"
              label={t('Fort')}
              value={fmtBonus(fort)}
              sub={familiar.fortBonus ? `${t('bonus')} ${fmtBonus(familiar.fortBonus)}` : null}
              editing={editBonus === 'fortBonus'}
              onEdit={() => toggleEditBonus('fortBonus')}
            />
            <StatPill
              className="sh-stat-pill--sm"
              label={t('Ref')}
              value={fmtBonus(reflex)}
              sub={familiar.reflexBonus ? `${t('bonus')} ${fmtBonus(familiar.reflexBonus)}` : null}
              editing={editBonus === 'reflexBonus'}
              onEdit={() => toggleEditBonus('reflexBonus')}
            />
            <StatPill
              className="sh-stat-pill--sm"
              label={t('Will')}
              value={fmtBonus(will)}
              sub={familiar.willBonus ? `${t('bonus')} ${fmtBonus(familiar.willBonus)}` : null}
              editing={editBonus === 'willBonus'}
              onEdit={() => toggleEditBonus('willBonus')}
            />
          </div>
          {BOTTOM_ROW.includes(editBonus) && renderActiveEditor()}

          {/* Attacks */}
          {attacks.length > 0 && (
            <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
              <Filigree>{t('Attacks')}</Filigree>
              {attacks.map((line) => {
                const overridden = !!familiar.overrides?.[line.index];
                const labelName = `${line.count > 1 ? `${line.count} ` : ''}${attackName(line.name)}`;
                if (editAtk === line.index) {
                  return (
                    <Card key={line.index} padding>
                      <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
                        <div className="sh-row-h sh-spread">
                          <span className="sh-eyebrow">{labelName} — {t('attack')}</span>
                          <Stepper value={tempAtk.bonus} min={-50} max={50} onChange={(v) => setTempAtk((p) => ({ ...p, bonus: v }))} />
                        </div>
                        <div className="sh-row-h sh-spread">
                          <span className="sh-eyebrow">{t('Damage')}</span>
                          <input
                            type="text"
                            className="familiar-name-input"
                            value={tempAtk.damage}
                            onChange={(e) => setTempAtk((p) => ({ ...p, damage: e.target.value }))}
                            aria-label={t('Attack damage')}
                          />
                        </div>
                        <div className="sh-row-h" style={{ gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                          {overridden && <IconButton icon="restart_alt" ghost size="sm" onClick={() => resetAtk(line.index)} aria-label={t('Reset attack')} />}
                          <IconButton icon="check" size="sm" onClick={saveAtk} aria-label={t('Save attack')} />
                          <IconButton icon="close" ghost size="sm" onClick={() => setEditAtk(null)} aria-label={t('Cancel')} />
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
                      <IconButton icon="edit" ghost size="sm" onClick={() => startEditAtk(line)} aria-label={`${t('Edit')} ${attackName(line.name)} ${t('attack')}`} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Int + natural armor + per-species master bonus */}
          <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Pill tone="default" icon="psychology">{tx('{0} {1}', t('Int'), intScore)}</Pill>
            <Pill tone="default" icon="shield">{t('Natural armor')} {fmtBonus(naturalArmorAdj)}</Pill>
            {speciesBonus && (
              <Pill tone="success" icon="auto_awesome">
                {t('Master')}: {t(speciesBonus.text)}{speciesBonus.condition ? ` (${t(speciesBonus.condition)})` : ''}
              </Pill>
            )}
          </div>

          {/* Special abilities (clickable → right panel) */}
          {specials.length > 0 && (
            <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
              {specials.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="familiar-ability-btn"
                  onClick={() => dispatch(addCardByLink({ links: `familiarAbility#${slug(s)}` }))}
                  title={t('Show description')}
                >
                  <Pill tone="accent">{tName('creatureAbilities', s)}</Pill>
                </button>
              ))}
            </div>
          )}

          {/* Combat text */}
          {combatHtml && (
            <div className="sh-stack" style={{ gap: 'var(--space-1)' }}>
              <button
                type="button"
                className="familiar-combat-toggle"
                onClick={() => setCombatOpen((v) => !v)}
              >
                <Icon name={combatOpen ? 'expand_less' : 'expand_more'} size={16} />
                {t('Combat')}
              </button>
              {combatOpen && <div className="familiar-combat-text">{parse(u.prose(combatHtml))}</div>}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
