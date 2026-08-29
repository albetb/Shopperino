import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import parse from 'html-react-parser';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import useCreatureData from '../hooks/useCreatureData';
import { addCardByLink } from '../../store/slices/appSlice';
import {
  onEnterWildShape,
  onExitWildShape,
  onResetWildShapeUses,
} from '../../store/thunks/playerSheetThunks';
import Card from '../common/Card';
import Pill from '../common/Pill';
import IconButton from '../common/IconButton';
import Filigree from '../common/Filigree';
import InfoPopover from '../common/InfoPopover';
import EmptyState from '../common/EmptyState';
import Icon from '../common/Icon';
import '../../style/wild_shape.css';

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
/**
 * What this allowance lets the druid become, and what carries across the
 * change. Everything here is fixed by the rules (class-features.md) except the
 * per-pool limits, which the pool config already knows how to describe.
 */
function ShapeRules({ pool, player, hours, max }) {
  const elemental = pool.key === 'elementalWildShape';
  return (
    <>
      <p>
        A standard action, <b>{max} times per day</b>, each lasting up to{' '}
        <b>{hours} hour{hours === 1 ? '' : 's'}</b> — or until you choose to
        change back, which is free. Only one shape at a time.
      </p>
      <p><b>This pool offers:</b> {pool.describeLimits(player)}.</p>
      <p>
        Assuming a form works like <i>polymorph</i>: you take the creature&apos;s
        physical scores, natural attacks, movement modes and natural armor, and
        heal as though you had rested a night. You keep your own hit points,
        Intelligence, Wisdom, Charisma, base attack bonus, saves, skills and
        class features. Your gear melds into the new body and stops working.
      </p>
      {elemental ? (
        <p>
          Elemental forms are the exception to the usual limit: you <b>do</b>{' '}
          gain the elemental&apos;s extraordinary, supernatural and spell-like
          abilities and its feats, while staying your own creature type.
        </p>
      ) : (
        <p>
          You do <b>not</b> gain the animal&apos;s supernatural or spell-like
          abilities — only its extraordinary ones. You cannot speak in form, so
          spells with a verbal component fail unless you have Natural Spell.
        </p>
      )}
    </>
  );
}

function ShapeCard({ pool }) {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const collapsed = useSelector((state) => state.playerSheet?.combatPageCardsCollapsed?.[pool.key] ?? false);
  const [query, setQuery] = useState('');

  /* The forms are creature stat blocks, so recompute when that chunk lands. */
  const ready = useCreatureData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const forms = useMemo(() => (player ? pool.getForms(player) : []), [player, pool, ready]);
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

  /* The title carries the collapse chevron and the `info` button. Restoring the
     day's uses is an action on the counter, so it sits with the counter in the
     body. What the pool allows — types, sizes, the HD cap — used to sit as a
     line of prose under a scrolling list, where it was easy to miss and easy
     to scroll past; it belongs behind the info button with the rest of the
     rules a druid reads once. */
  const cardAction = (
    <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
      <InfoPopover label={pool.label}>
        <ShapeRules pool={pool} player={player} hours={hours} max={max} />
      </InfoPopover>
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
      action={cardAction}
    >
      {!collapsed && (
        <div className="wild-shape-card sh-stack">
          <div className="sh-row-h sh-spread" style={{ gap: 'var(--space-2)' }}>
            <Filigree>{remaining} of {max} left today</Filigree>
            <IconButton
              icon="restart_alt"
              ghost size="sm"
              onClick={() => dispatch(onResetWildShapeUses(pool.usesKey))}
              disabled={used === 0}
              aria-label={`Restore ${pool.label} uses`}
              title="Restore uses to maximum"
            />
          </div>

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
                        {player.getFormDisplayName(creature)}
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

            </>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * The in-form view: what changed that the stat pills cannot show.
 *
 * Deliberately narrow. The form's natural attacks are not listed here — they
 * replace the weapon list in the attacks card, which is where a player looks
 * for something to swing. Nor is what the form fails to grant: a list of
 * abilities you do not have is noise on a card you read mid-fight.
 */
function ShapedBody({ player, form, dispatch }) {
  const [combatOpen, setCombatOpen] = useState(false);
  const specialAttacks = player.getWildShapeSpecialAttacks();
  const specialQualities = player.getWildShapeSpecialQualities();
  const feats = player.getWildShapeFeats();
  /* The mode the sheet's Speed stat already reports is dropped here — the
     pills are for the ones that stat cannot show (swim, climb, a slower fly). */
  const primary = player.getPrimaryMovement();
  const modes = player.getWildShapeMovementModes()
    .filter(({ mode }) => mode !== primary.mode);
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
        <button
          type="button"
          className="wild-shape-revert"
          onClick={() => dispatch(onExitWildShape())}
          title="Return to true form"
        >
          <Icon name="undo" size={14} />
          True form
        </button>
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
