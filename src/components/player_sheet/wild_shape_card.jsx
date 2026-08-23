import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import parse from 'html-react-parser';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import { addCardByLink } from '../../store/slices/appSlice';
import {
  onEnterWildShape,
  onExitWildShape,
  onResetWildShapeUses,
} from '../../store/thunks/playerSheetThunks';
import Card from '../common/Card';
import Pill from '../common/Pill';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import Filigree from '../common/Filigree';
import EmptyState from '../common/EmptyState';
import Icon from '../common/Icon';
import '../../style/wild_shape.css';

const fmtBonus = (n) => `${n >= 0 ? '+' : ''}${n}`;

/**
 * The two wild shape allowances, as card configuration. They share every
 * mechanic — the difference is which pool they spend, which creatures they
 * offer, and that an elemental form uniquely grants the form's supernatural
 * abilities and feats.
 */
const ANIMAL_POOL = {
  key: 'wildShape',
  usesKey: 'wildShape',
  label: 'Wild Shape',
  icon: 'pets',
  isUnlocked: (p) => p.canWildShape(),
  getMax: (p) => p.getWildShapeMax(),
  getUsed: (p) => p.getWildShapeUsed(),
  getRemaining: (p) => p.getWildShapeRemaining(),
  getForms: (p) => p.getWildShapeForms(),
  ownsCurrentForm: (p) => p.isWildShaped() && !p.isElementalShaped(),
  describeLimits: (p) => `${p.getWildShapeTypes().join(' and ')} forms · sizes `
    + `${p.getWildShapeSizes().join(', ') || 'none'} · up to ${p.getWildShapeHdCap()} HD`,
};

const ELEMENTAL_POOL = {
  key: 'elementalWildShape',
  usesKey: 'elementalWildShape',
  label: 'Elemental Shape',
  icon: 'local_fire_department',
  isUnlocked: (p) => p.canElementalWildShape(),
  getMax: (p) => p.getElementalWildShapeMax(),
  getUsed: (p) => p.getElementalWildShapeUsed(),
  getRemaining: (p) => p.getElementalWildShapeRemaining(),
  getForms: (p) => p.getElementalWildShapeForms(),
  ownsCurrentForm: (p) => p.isElementalShaped(),
  describeLimits: (p) => `air, earth, fire and water · sizes `
    + `${p.getElementalWildShapeSizes().join(', ') || 'none'} · up to ${p.getWildShapeHdCap()} HD`,
};

export function WildShapeCard() {
  return <ShapeCard pool={ANIMAL_POOL} />;
}

export function ElementalShapeCard() {
  return <ShapeCard pool={ELEMENTAL_POOL} />;
}

export default WildShapeCard;

/**
 * One wild shape allowance.
 *
 * Out of form the card is a scrollable, name-sorted list of every form this
 * pool currently offers, each linking to its stat block and carrying a
 * transform button. In form it shows what the change did that the stat pills
 * cannot; the numbers themselves land on the sheet directly, glowing green or
 * red against the druid's true form.
 *
 * Only one shape can be held at a time, so while a form from the *other* pool
 * is active this card's transform buttons are disabled rather than hidden —
 * the list still reads as a reference.
 */
function ShapeCard({ pool }) {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const collapsed = useSelector((state) => state.playerSheet?.combatPageCardsCollapsed?.[pool.key] ?? false);
  const [query, setQuery] = useState('');

  const forms = useMemo(() => (player ? pool.getForms(player) : []), [player, pool]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? forms.filter((f) => String(f.name).toLowerCase().includes(q)) : forms;
  }, [forms, query]);

  if (!player) return null;
  // Unlocked strictly by level: below it the card does not exist at all.
  if (!pool.isUnlocked(player)) return null;

  const max = pool.getMax(player);
  const used = pool.getUsed(player);
  const remaining = pool.getRemaining(player);
  const overCap = used > max;
  const hours = player.getWildShapeDurationHours();
  const ownsForm = pool.ownsCurrentForm(player);
  // A form from the other pool blocks this one: only one shape at a time.
  const blockedByOther = player.isWildShaped() && !ownsForm;
  const form = player.getWildShapeForm();

  const toggleCollapsed = () =>
    dispatch(setCombatPageCardCollapsed({ key: pool.key, value: !collapsed }));

  const cardAction = (
    <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
      <IconButton
        icon="restart_alt"
        ghost size="sm"
        onClick={() => dispatch(onResetWildShapeUses(pool.usesKey))}
        disabled={used === 0}
        aria-label={`Restore ${pool.label} uses`}
        title="Restore uses to maximum"
      />
      <IconButton
        icon={collapsed ? 'expand_more' : 'expand_less'}
        ghost size="sm"
        onClick={toggleCollapsed}
        aria-label={`Toggle ${pool.label}`}
      />
    </span>
  );

  return (
    <Card
      title={`${pool.label} - ${remaining}/${max} - ${hours}h`}
      className="sh-card--head-spread"
      eyebrow={ownsForm ? form?.name || 'transformed' : 'true form'}
      action={cardAction}
    >
      {!collapsed && (
        <div className="wild-shape-card sh-stack">
          {overCap && (
            <div className="sh-warn-strip">
              <Icon name="warning" />
              {used - max} more transformation{used - max === 1 ? '' : 's'} than the day allows.
            </div>
          )}

          {ownsForm ? (
            <ShapedBody player={player} form={form} dispatch={dispatch} />
          ) : (
            <>
              {blockedByOther && (
                <div className="sh-warn-strip">
                  <Icon name="block" />
                  Already shaped as <b>{form?.name}</b>. Return to your true form
                  first — only one shape at a time.
                </div>
              )}

              {forms.length > 8 && (
                <input
                  type="text"
                  className="sh-input"
                  placeholder="Search forms…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label={`Search ${pool.label} forms`}
                />
              )}

              {filtered.length === 0 ? (
                <EmptyState
                  icon={pool.icon}
                  title={forms.length === 0 ? 'No forms available' : 'Nothing matches'}
                  hint={forms.length === 0
                    ? `Forms are limited to unlocked sizes and ${player.getWildShapeHdCap()} Hit Dice or fewer.`
                    : 'Try clearing the search.'}
                />
              ) : (
                <div className="wild-shape-list" role="list">
                  {filtered.map((creature) => (
                    <div key={creature.ref} className="wild-shape-row" role="listitem">
                      <button
                        type="button"
                        className="button-link wild-shape-name"
                        onClick={() => dispatch(addCardByLink({ links: creature.ref }))}
                        title="Show stat block"
                      >
                        {creature.name}
                      </button>
                      <span className="wild-shape-row-meta">
                        <span className="sh-faint">{creature.size} · {creature.hitDice?.count ?? 0} HD</span>
                        <IconButton
                          icon="change_circle"
                          size="sm"
                          disabled={blockedByOther}
                          onClick={() => dispatch(onEnterWildShape(creature.ref))}
                          aria-label={`Transform into ${creature.name}`}
                          title={blockedByOther
                            ? 'Return to your true form first'
                            : `Transform into ${creature.name}`}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="sh-faint" style={{ fontSize: 'var(--font-size-xs)' }}>
                {pool.describeLimits(player)}. The form must be one you are
                familiar with — that part is the table's call.
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

/** The in-form view: what changed that the stat pills cannot show. */
function ShapedBody({ player, form, dispatch }) {
  const [combatOpen, setCombatOpen] = useState(false);
  const attacks = player.getWildShapeAttacks();
  const specialAttacks = player.getWildShapeSpecialAttacks();
  const specialQualities = player.getWildShapeSpecialQualities();
  const feats = player.getWildShapeFeats();
  const ungained = player.getWildShapeUngainedQualities();
  const modes = player.getWildShapeMovementModes();
  const naturalArmor = player.getWildShapeNaturalArmor();
  const isElemental = player.isElementalShaped();
  const canCast = player.canCastSpells();

  return (
    <>
      <div className="sh-row-h sh-spread" style={{ gap: 'var(--space-2)' }}>
        <button
          type="button"
          className="wild-shape-statblock"
          onClick={() => dispatch(addCardByLink({ links: player.getWildShapeRef() }))}
          title="Show base stat block"
        >
          <Icon name="menu_book" size={16} /> Stat block
        </button>
        <Button variant="primary" icon="undo" onClick={() => dispatch(onExitWildShape())}>
          Return to true form
        </Button>
      </div>

      <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Pill tone="accent" icon="straighten">{form?.size}</Pill>
        {naturalArmor > 0 && <Pill tone="accent" icon="security">+{naturalArmor} natural</Pill>}
        {modes.map(({ mode, speed }) => (
          <Pill key={mode} tone="default" icon="directions_run">{mode} {speed} ft</Pill>
        ))}
      </div>

      {!canCast && (
        <div className="sh-warn-strip">
          <Icon name="auto_fix_off" />
          No speech in this form, so verbal components fail — you cannot cast.
          The Natural Spell feat removes this.
        </div>
      )}

      {attacks.length > 0 && (
        <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
          <Filigree>Natural attacks</Filigree>
          {attacks.map((line) => (
            <div key={line.index} className="sh-row-h sh-spread" style={{ gap: 'var(--space-3)' }}>
              <span className="sh-display" style={{ fontSize: 'var(--font-size-lg)', textTransform: 'capitalize' }}>
                {line.count > 1 ? `${line.count} ` : ''}{line.name}
              </span>
              <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                <Pill tone="accent">{fmtBonus(line.bonus ?? 0)}</Pill>
                {line.damage && <Pill tone="default">{line.damage}</Pill>}
              </span>
            </div>
          ))}
          <div className="sh-faint" style={{ fontSize: 'var(--font-size-xs)' }}>
            Computed with your own base attack bonus and the form's Strength.
            Extra limbs grant no extra attacks.
          </div>
        </div>
      )}

      {(specialAttacks.length > 0 || specialQualities.length > 0 || feats.length > 0) && (
        <div className="sh-stack" style={{ gap: 'var(--space-1)' }}>
          <Filigree>Gained</Filigree>
          <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {specialAttacks.map((s) => <Pill key={`a-${s}`} tone="success">{s}</Pill>)}
            {specialQualities.map((s) => <Pill key={`q-${s}`} tone="success">{s}</Pill>)}
            {feats.map((s) => <Pill key={`f-${s}`} tone="accent" icon="auto_awesome">{s}</Pill>)}
          </div>
          {isElemental && (
            <div className="sh-faint" style={{ fontSize: 'var(--font-size-xs)' }}>
              An elemental form is the exception to the usual rule: you gain all
              of its extraordinary, supernatural and spell-like abilities, and
              its feats, for as long as you hold the shape. Your own creature
              type stays what it was.
            </div>
          )}
        </div>
      )}

      {ungained.length > 0 && (
        <div className="sh-stack" style={{ gap: 'var(--space-1)' }}>
          <Filigree>Not gained</Filigree>
          <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {ungained.map((s) => <Pill key={s} tone="ghost">{s}</Pill>)}
          </div>
          <div className="sh-faint" style={{ fontSize: 'var(--font-size-xs)' }}>
            A form's special <em>qualities</em> never transfer — only its special
            attacks do. Nor do any supernatural or spell-like abilities.
          </div>
        </div>
      )}

      <div className="sh-faint" style={{ fontSize: 'var(--font-size-xs)' }}>
        Your gear has melded into the form and stops functioning, so worn armour
        and shields contribute no AC. The inventory stays editable, and
        everything reappears intact when you change back.
      </div>

      {form?.combat && (
        <div className="sh-stack" style={{ gap: 'var(--space-1)' }}>
          <button
            type="button"
            className="wild-shape-statblock"
            onClick={() => setCombatOpen((v) => !v)}
          >
            <Icon name={combatOpen ? 'expand_less' : 'expand_more'} size={16} />
            Creature notes
          </button>
          {combatOpen && <div className="wild-shape-combat-text">{parse(form.combat)}</div>}
        </div>
      )}
    </>
  );
}
