import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import parse from 'html-react-parser';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import { addCardByLink } from '../../store/slices/appSlice';
import {
  onCallSpecialMount,
  onReleaseSpecialMount,
  onRenameSpecialMount,
  onAdjustSpecialMountHp,
  onSetSpecialMountMaxLife,
  onUseSpecialMountHours,
  onResetSpecialMountHours,
  onSetSpecialMountAcBonus,
  onSetSpecialMountAcTouchBonus,
  onSetSpecialMountAcFlatBonus,
  onSetSpecialMountInitBonus,
  onSetSpecialMountSpeedBonus,
  onSetSpecialMountFortBonus,
  onSetSpecialMountReflexBonus,
  onSetSpecialMountWillBonus,
  onSetSpecialMountAttackOverride,
} from '../../store/thunks/playerSheetThunks';
import useLongPress from '../hooks/useLongPress';
import Card from '../common/Card';
import Bar from '../common/Bar';
import Pill from '../common/Pill';
import StatPill from '../common/StatPill';
import Stepper from '../common/Stepper';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import Filigree from '../common/Filigree';
import Icon from '../common/Icon';
import '../../style/animal_companion.css';

/** Single-value bonus thunks keyed by the mount field they edit. */
const BONUS_THUNK = {
  initBonus: onSetSpecialMountInitBonus,
  speedBonus: onSetSpecialMountSpeedBonus,
  fortBonus: onSetSpecialMountFortBonus,
  reflexBonus: onSetSpecialMountReflexBonus,
  willBonus: onSetSpecialMountWillBonus,
};

const fmtBonus = (n) => `${n >= 0 ? '+' : ''}${n}`;

/**
 * Paladin special mount. Structurally the animal-companion card, minus the
 * creature picker — the mount is fixed by the paladin's size — and plus the
 * daily summoning allowance (2 hours per paladin level).
 *
 * Death is deliberately not tracked: the SRD's 30-day wait has no meaning
 * without a calendar, so losing a mount is just releasing it and calling a new
 * one when the table says so.
 */
export default function SpecialMountCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const collapsed = useSelector((state) => state.playerSheet?.combatPageCardsCollapsed?.specialMount ?? false);

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [hpAdvancedOpen, setHpAdvancedOpen] = useState(false);
  const [editMaxLife, setEditMaxLife] = useState(false);
  const [tempMaxLife, setTempMaxLife] = useState(0);
  const [editBonus, setEditBonus] = useState(null);
  const [tempBonus, setTempBonus] = useState(0);
  const [tempAc, setTempAc] = useState({ general: 0, touch: 0, flat: 0 });
  const [combatOpen, setCombatOpen] = useState(false);
  const [editAtk, setEditAtk] = useState(null);
  const [tempAtk, setTempAtk] = useState({ bonus: 0, damage: '' });

  const handleHpDelta = useCallback((delta) => {
    dispatch(onAdjustSpecialMountHp(delta));
  }, [dispatch]);

  const longPressPlus = useLongPress(() => handleHpDelta(10), () => handleHpDelta(1), { delay: 400 });
  const longPressMinus = useLongPress(() => handleHpDelta(-10), () => handleHpDelta(-1), { delay: 400 });

  if (!player) return null;

  const grantedAt = player.getSpecialMountLevel?.() ?? 0;
  if (grantedAt === 0) return null;

  const mount = player.getSpecialMount?.() ?? null;
  const available = player.canHaveSpecialMount?.() ?? false;

  const toggleCollapsed = () =>
    dispatch(setCombatPageCardCollapsed({ key: 'specialMount', value: !collapsed }));

  const cardAction = (
    <IconButton
      icon={collapsed ? 'expand_more' : 'expand_less'}
      ghost size="sm"
      onClick={toggleCollapsed}
      aria-label="Toggle special mount"
    />
  );

  // —— No mount bonded yet ——
  if (!mount) {
    return (
      <Card title="Special mount" className="sh-card--head-spread" eyebrow={`lv${grantedAt}`} action={cardAction}>
        {!collapsed && (
          <div className="companion-card sh-stack">
            {available ? (
              <>
                <div className="sh-faint" style={{ fontSize: 'var(--font-size-sm)' }}>
                  Calling the mount is a full-round action. It arrives as a
                  magical beast bonded to you, and its statistics advance with
                  your paladin level.
                </div>
                <Button variant="primary" icon="pets" onClick={() => dispatch(onCallSpecialMount())}>
                  Call your mount
                </Button>
              </>
            ) : (
              <div className="sh-faint" style={{ fontSize: 'var(--font-size-sm)' }}>
                A paladin calls their special mount at level {grantedAt}.
              </div>
            )}
          </div>
        )}
      </Card>
    );
  }

  // —— Mount bonded ——
  const name = mount.getName();
  const ref = mount.getRef();
  const maxHp = mount.getMaxLife();
  const currentHp = mount.getCurrentHp();
  const isDying = currentHp <= 0;
  const hpRatio = isDying
    ? Math.max(0, Math.min(1, (currentHp + 10) / 10))
    : (maxHp > 0 ? Math.max(0, Math.min(1, currentHp / maxHp)) : 0);
  const plusDisabled = currentHp >= maxHp;
  const minusDisabled = currentHp <= -10;

  const ac = mount.getArmorClass();
  const acTouch = mount.getContactAC();
  const acFlat = mount.getFlatFootedAC();
  const init = mount.getInitiative();
  const speed = mount.getSpeed();
  const fort = mount.getFortSave();
  const reflex = mount.getReflexSave();
  const will = mount.getWillSave();
  const attacks = mount.getAttacks();
  const specials = mount.getSpecialAbilities();
  const combatHtml = mount.getCombatHtml();
  const intelligence = mount.getIntelligence();
  const bonusHD = mount.getBonusHD();
  const totalHD = mount.getTotalHD();
  const spellResistance = mount.getSpellResistance();

  const hoursMax = mount.getSummonHoursMax();
  const hoursUsed = mount.getSummonHoursUsed();
  const hoursLeft = mount.getSummonHoursRemaining();
  const hoursOverCap = mount.isSummonOverCap();

  const startEditName = () => { setTempName(name); setEditingName(true); };
  const saveName = () => { dispatch(onRenameSpecialMount(tempName.trim() || name)); setEditingName(false); };

  const startEditMaxLife = () => {
    setTempMaxLife(mount.maxLife != null ? mount.maxLife : mount.getDefaultMaxLife());
    setEditMaxLife(true);
  };
  const saveMaxLife = () => {
    dispatch(onSetSpecialMountMaxLife(Math.max(0, Math.floor(Number(tempMaxLife) || 0))));
    setEditMaxLife(false);
  };
  const resetMaxLife = () => { dispatch(onSetSpecialMountMaxLife(null)); setEditMaxLife(false); };

  const toggleEditBonus = (key) => {
    if (editBonus === key) { setEditBonus(null); return; }
    setEditBonus(key);
    if (key === 'ac') {
      setTempAc({
        general: Number(mount.acBonus) || 0,
        touch: Number(mount.acTouchBonus) || 0,
        flat: Number(mount.acFlatBonus) || 0,
      });
    } else {
      setTempBonus(Number(mount[key]) || 0);
    }
  };

  const saveBonus = () => {
    if (!editBonus) return;
    if (editBonus === 'ac') {
      dispatch(onSetSpecialMountAcBonus(tempAc.general));
      dispatch(onSetSpecialMountAcTouchBonus(tempAc.touch));
      dispatch(onSetSpecialMountAcFlatBonus(tempAc.flat));
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
    dispatch(onSetSpecialMountAttackOverride(editAtk, { bonus: tempAtk.bonus, damage: tempAtk.damage }));
    setEditAtk(null);
  };
  const resetAtk = (index) => { dispatch(onSetSpecialMountAttackOverride(index, null)); setEditAtk(null); };

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
            <span className="sh-eyebrow">
              {label}{' '}
              <span className="sh-faint" style={{ textTransform: 'none', letterSpacing: 0 }}>({hint})</span>
            </span>
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
      title={name || 'Special mount'}
      className="sh-card--head-spread"
      eyebrow={`${totalHD} HD · Int ${intelligence}`}
      action={cardAction}
    >
      {!collapsed && (
        <div className="companion-card sh-stack">
          {/* Name row: link to base stat card + rename + release */}
          <div className="sh-row-h sh-spread" style={{ gap: 'var(--space-2)' }}>
            {editingName ? (
              <div className="sh-row-h" style={{ gap: 'var(--space-2)', flex: 1 }}>
                <input
                  type="text"
                  className="companion-name-input"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  aria-label="Mount name"
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
                  <IconButton icon="edit" ghost size="sm" onClick={startEditName} aria-label="Rename mount" />
                  <IconButton icon="delete" ghost size="sm" onClick={() => dispatch(onReleaseSpecialMount())} aria-label="Release mount" />
                </span>
              </>
            )}
          </div>

          {/* Summoning allowance: 2 hours per paladin level, per day */}
          <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
            <div className="sh-row-h sh-spread">
              <Filigree>Summoning</Filigree>
              <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                <Pill tone={hoursOverCap ? 'warn' : 'accent'} icon={hoursOverCap ? 'warning' : 'schedule'}>
                  {hoursLeft} of {hoursMax} h left
                </Pill>
                <IconButton
                  icon="restart_alt" ghost size="sm"
                  onClick={() => dispatch(onResetSpecialMountHours())}
                  disabled={hoursUsed === 0}
                  aria-label="Reset summoning hours"
                />
              </span>
            </div>
            <div className="sh-row-h" style={{ gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <IconButton
                icon="remove" size="sm"
                onClick={() => dispatch(onUseSpecialMountHours(-1))}
                disabled={hoursUsed === 0}
                aria-label="Give back an hour"
              />
              <span className="sh-mono sh-num sh-muted">{hoursUsed} h used</span>
              <IconButton
                icon="add" size="sm"
                onClick={() => dispatch(onUseSpecialMountHours(1))}
                aria-label="Spend an hour"
              />
            </div>
          </div>

          {/* HP bar */}
          <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
            <Bar value={hpRatio} variant={isDying ? 'danger' : 'hp'} />
            <div className="sh-row-h" style={{ justifyContent: 'space-between', gap: 'var(--space-2)' }}>
              <IconButton
                icon={hpAdvancedOpen ? 'expand_less' : 'expand_more'}
                ghost size="sm"
                onClick={() => setHpAdvancedOpen((v) => !v)}
                aria-label={hpAdvancedOpen ? 'Hide base max life' : 'Show base max life'}
              />
              <IconButton icon="remove" {...(minusDisabled ? {} : longPressMinus)} disabled={minusDisabled} aria-label="Decrease HP" />
              <div className="companion-hp-readout">{currentHp} / {maxHp}</div>
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
                      {maxHp}{mount.maxLife == null ? '' : ' *'}
                    </span>
                    <IconButton icon="edit" ghost size="sm" onClick={startEditMaxLife} aria-label="Edit max life" />
                  </div>
                )}
              </div>
            )}
          </div>

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
              sub={mount.initBonus ? `bonus ${fmtBonus(mount.initBonus)}` : null}
              editing={editBonus === 'initBonus'}
              onEdit={() => toggleEditBonus('initBonus')}
            />
            <StatPill
              className="sh-stat-pill--sm"
              label="Speed"
              value={`${speed} ft`}
              sub={mount.speedBonus ? `bonus ${fmtBonus(mount.speedBonus)}` : null}
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
              sub={mount.fortBonus ? `bonus ${fmtBonus(mount.fortBonus)}` : null}
              editing={editBonus === 'fortBonus'}
              onEdit={() => toggleEditBonus('fortBonus')}
            />
            <StatPill
              className="sh-stat-pill--sm"
              label="Ref"
              value={fmtBonus(reflex)}
              sub={mount.reflexBonus ? `bonus ${fmtBonus(mount.reflexBonus)}` : null}
              editing={editBonus === 'reflexBonus'}
              onEdit={() => toggleEditBonus('reflexBonus')}
            />
            <StatPill
              className="sh-stat-pill--sm"
              label="Will"
              value={fmtBonus(will)}
              sub={mount.willBonus ? `bonus ${fmtBonus(mount.willBonus)}` : null}
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
                const overridden = !!mount.overrides?.[line.index];
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
                      <Pill tone={overridden ? 'warn' : 'accent'}>{fmtBonus(line.bonus ?? 0)}</Pill>
                      {line.damage && <Pill tone={overridden ? 'warn' : 'default'}>{line.damage}</Pill>}
                      <IconButton icon="edit" ghost size="sm" onClick={() => startEditAtk(line)} aria-label={`Edit ${line.name} attack`} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Advancement summary + special abilities */}
          <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Pill tone="default" icon="add_circle">+{bonusHD} HD</Pill>
            <Pill tone="default" icon="psychology">Int {intelligence}</Pill>
            {spellResistance > 0 && <Pill tone="accent" icon="shield">SR {spellResistance}</Pill>}
            {specials.map((s) => <Pill key={s} tone="accent">{s}</Pill>)}
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
