import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import { addCardByLink } from '../../store/slices/appSlice';
import { onAddCondition, onRemoveCondition } from '../../store/thunks/playerSheetThunks';
import { getAllConditions, conditionSlug } from '../../lib/utils';
import Card from '../common/Card';
import IconButton from '../common/IconButton';
import BottomSheet from '../common/BottomSheet';
import Button from '../common/Button';
import Stepper from '../common/Stepper';
import Icon from '../common/Icon';
import '../../style/conditions.css';

/* Conditions that need a sub-choice when added. Ability Damaged/Drained
   target a single ability; Energy Drained carries a count of negative
   levels. Everything else is a plain on/off toggle. */
const ABILITY_PARAM = new Set(['Ability Damaged', 'Ability Drained']);
const AMOUNT_PARAM = new Set(['Energy Drained']);

/* Derived from HP and applied automatically (see Player.getHpDerivedConditions).
   These never appear in the picker and can't be removed by hand. */
const HP_DERIVED = new Set(['Dead', 'Dying', 'Disabled']);

/* Pill colouring. Positives are a short hardcoded list; Grappling is the
   one neutral state; everything else reads as a negative (red). */
const POSITIVE = new Set(['Invisible', 'Incorporeal', 'Stable']);
const NEUTRAL = new Set(['Grappling']);

function conditionTone(name) {
  if (POSITIVE.has(name)) return 'positive';
  if (NEUTRAL.has(name)) return 'neutral';
  return 'negative';
}

const ABILITIES = [
  { key: 'Str', label: 'Strength' },
  { key: 'Dex', label: 'Dexterity' },
  { key: 'Con', label: 'Constitution' },
  { key: 'Int', label: 'Intelligence' },
  { key: 'Wis', label: 'Wisdom' },
  { key: 'Cha', label: 'Charisma' },
];

function formatConditionLabel(c) {
  if (c.ability) return `${c.name} · ${c.ability}${Number.isFinite(c.amount) ? ` −${c.amount}` : ''}`;
  if (Number.isFinite(c.amount)) return `${c.name} ×${c.amount}`;
  return c.name;
}

export default function ConditionsCard() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet?.player);
  const collapsed = useSelector(state => state.playerSheet?.combatPageCardsCollapsed?.conditions ?? false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  /* When set, the picker shows the sub-choice step for this condition
     instead of the list. */
  const [config, setConfig] = useState(null); // { name, ability, amount }

  const derived = player?.getHpDerivedConditions?.() ?? [];
  const manual = player?.getConditions?.() ?? [];
  // Conditions selectable in the picker — derived ones are excluded.
  const allConditions = useMemo(
    () => getAllConditions().filter(c => !HP_DERIVED.has(c.name)),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allConditions;
    return allConditions.filter(c => c.name.toLowerCase().includes(q));
  }, [allConditions, query]);

  if (!player) return null;

  const total = derived.length + manual.length;

  const toggleCollapsed = () =>
    dispatch(setCombatPageCardCollapsed({ key: 'conditions', value: !collapsed }));

  const openPicker = () => {
    setQuery('');
    setConfig(null);
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setConfig(null);
    setQuery('');
  };

  const openDescription = name =>
    dispatch(addCardByLink({ links: `abilitiesAndConditions#${conditionSlug(name)}` }));

  const removeCondition = c => dispatch(onRemoveCondition(c.name, c.ability ?? null));

  /* True when the condition can no longer be added (all variants taken). */
  const isExhausted = name => {
    if (ABILITY_PARAM.has(name)) {
      return ABILITIES.every(a => player.hasCondition(name, a.key));
    }
    return player.hasCondition(name);
  };

  const pickCondition = name => {
    if (ABILITY_PARAM.has(name)) {
      const firstFree = ABILITIES.find(a => !player.hasCondition(name, a.key));
      setConfig({ name, ability: firstFree?.key ?? 'Str', amount: 1 });
      return;
    }
    if (AMOUNT_PARAM.has(name)) {
      setConfig({ name, ability: null, amount: 1 });
      return;
    }
    dispatch(onAddCondition({ name }));
  };

  const confirmConfig = () => {
    if (!config) return;
    const cond = { name: config.name, amount: config.amount };
    if (config.ability) cond.ability = config.ability;
    dispatch(onAddCondition(cond));
    setConfig(null); // back to the list so more can be added
  };

  const isAbilityConfig = config && ABILITY_PARAM.has(config.name);

  const renderPill = (c, { removable }) => (
    <span className={`cond-pill cond-pill--${conditionTone(c.name)}`} key={`${c.name}:${c.ability ?? ''}`}>
      <button
        type="button"
        className="cond-pill-label"
        onClick={() => openDescription(c.name)}
        title="Show description"
      >
        {formatConditionLabel(c)}
      </button>
      {removable ? (
        <button
          type="button"
          className="cond-pill-x"
          onClick={() => removeCondition(c)}
          aria-label={`Remove ${c.name}`}
        >
          <Icon name="close" size={12} />
        </button>
      ) : (
        <span className="cond-pill-auto" title="Applied automatically from HP">
          <Icon name="deceased" size={12} />
        </span>
      )}
    </span>
  );

  return (
    <Card
      title="Conditions"
      eyebrow={total ? `${total} active` : null}
      action={
        <IconButton
          icon={collapsed ? 'expand_more' : 'expand_less'}
          ghost size="sm"
          onClick={toggleCollapsed}
          aria-label="Toggle conditions"
        />
      }
    >
      {!collapsed && (
        <div className="cond-wrap">
          {total > 0 && (
            <div className="cond-pills">
              {derived.map(c => renderPill(c, { removable: false }))}
              {manual.map(c => renderPill(c, { removable: true }))}
            </div>
          )}

          <div className="cond-add-row">
            <Button variant="ghost" icon="add" onClick={openPicker}>Add condition</Button>
          </div>
        </div>
      )}

      <BottomSheet
        open={pickerOpen}
        onClose={closePicker}
        title={config ? config.name : 'Add condition'}
        eyebrow="Conditions"
        subheader={config ? null : (
          <input
            type="text"
            className="sh-input"
            placeholder="Search conditions…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        )}
      >
        {config ? (
          <div className="cond-config">
            {isAbilityConfig && (
              <div className="cond-config-block">
                <span className="sh-eyebrow">Ability</span>
                <div className="cond-chips">
                  {ABILITIES.map(a => {
                    const taken = player.hasCondition(config.name, a.key);
                    const on = config.ability === a.key;
                    return (
                      <button
                        type="button"
                        key={a.key}
                        className={['sh-chip', on && 'is-on'].filter(Boolean).join(' ')}
                        disabled={taken}
                        onClick={() => setConfig(prev => ({ ...prev, ability: a.key }))}
                        title={taken ? 'Already active' : a.label}
                      >
                        {a.key}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="cond-config-block">
              <span className="sh-eyebrow">{isAbilityConfig ? 'Points' : 'Negative levels'}</span>
              <Stepper
                value={config.amount}
                min={1}
                max={30}
                onChange={v => setConfig(prev => ({ ...prev, amount: v }))}
              />
            </div>
            <div className="cond-config-actions">
              <Button variant="ghost" icon="arrow_back" onClick={() => setConfig(null)}>Back</Button>
              <Button variant="primary" icon="check" onClick={confirmConfig}>Add</Button>
            </div>
          </div>
        ) : (
          <div className="cond-list">
            {filtered.length === 0 ? (
              <div className="sh-faint" style={{ padding: 'var(--space-3)' }}>No matches.</div>
            ) : (
              filtered.map(c => {
                const exhausted = isExhausted(c.name);
                return (
                  <button
                    type="button"
                    key={c.slug}
                    className="cond-list-item"
                    disabled={exhausted}
                    onClick={() => pickCondition(c.name)}
                  >
                    <span className="cond-list-name">
                      {c.name}
                      {exhausted && <Icon name="check" size={14} />}
                      {(ABILITY_PARAM.has(c.name) || AMOUNT_PARAM.has(c.name)) && !exhausted && (
                        <Icon name="tune" size={14} />
                      )}
                    </span>
                    <span className="cond-list-desc">{c.description}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </BottomSheet>
    </Card>
  );
}
