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
 * Druid wild shape.
 *
 * Out of form the card is a scrollable, name-sorted list of every animal the
 * druid may currently assume — size unlocked, Hit Dice within her level — each
 * linking to its stat block and carrying a transform button.
 *
 * In form it shows what the change did that the stat pills cannot: the natural
 * attacks, the movement modes, the special attacks gained, and the special
 * qualities pointedly *not* gained. The numbers themselves land on the sheet
 * directly, glowing green or red against the druid's true form.
 */
export default function WildShapeCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const collapsed = useSelector((state) => state.playerSheet?.combatPageCardsCollapsed?.wildShape ?? false);
  const [query, setQuery] = useState('');

  const forms = useMemo(() => player?.getWildShapeForms?.() ?? [], [player]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? forms.filter((f) => String(f.name).toLowerCase().includes(q)) : forms;
  }, [forms, query]);

  if (!player) return null;
  if (!player.canWildShape?.()) return null;

  const max = player.getWildShapeMax();
  const used = player.getWildShapeUsed();
  const remaining = player.getWildShapeRemaining();
  const overCap = used > max;
  const hours = player.getWildShapeDurationHours();
  const shaped = player.isWildShaped();
  const form = player.getWildShapeForm();
  const missingTiers = player.getWildShapeMissingTiers();

  const toggleCollapsed = () =>
    dispatch(setCombatPageCardCollapsed({ key: 'wildShape', value: !collapsed }));

  const cardAction = (
    <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
      <IconButton
        icon="restart_alt"
        ghost size="sm"
        onClick={() => dispatch(onResetWildShapeUses())}
        disabled={used === 0}
        aria-label="Restore wild shape uses"
        title="Restore uses to maximum"
      />
      <IconButton
        icon={collapsed ? 'expand_more' : 'expand_less'}
        ghost size="sm"
        onClick={toggleCollapsed}
        aria-label="Toggle wild shape"
      />
    </span>
  );

  return (
    <Card
      title={`Wild Shape - ${remaining}/${max} - ${hours}h`}
      className="sh-card--head-spread"
      eyebrow={shaped ? form?.name || 'transformed' : 'true form'}
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

          {shaped ? (
            <ShapedBody player={player} form={form} dispatch={dispatch} />
          ) : (
            <>
              {forms.length > 8 && (
                <input
                  type="text"
                  className="sh-input"
                  placeholder="Search forms…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search wild shape forms"
                />
              )}

              {filtered.length === 0 ? (
                <EmptyState
                  icon="pets"
                  title={forms.length === 0 ? 'No forms available' : 'Nothing matches'}
                  hint={forms.length === 0
                    ? `Forms are limited to unlocked sizes and ${player.getWildShapeHdCap()} Hit Dice or fewer.`
                    : 'Try clearing the search.'}
                />
              ) : (
                <div className="wild-shape-list" role="list">
                  {filtered.map((animal) => (
                    <div key={animal.ref} className="wild-shape-row" role="listitem">
                      <button
                        type="button"
                        className="button-link wild-shape-name"
                        onClick={() => dispatch(addCardByLink({ links: animal.ref }))}
                        title="Show stat block"
                      >
                        {animal.name}
                      </button>
                      <span className="wild-shape-row-meta">
                        <span className="sh-faint">{animal.size} · {animal.hitDice?.count ?? 0} HD</span>
                        <IconButton
                          icon="change_circle"
                          size="sm"
                          onClick={() => dispatch(onEnterWildShape(animal.ref))}
                          aria-label={`Transform into ${animal.name}`}
                          title={`Transform into ${animal.name}`}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="sh-faint" style={{ fontSize: 'var(--font-size-xs)' }}>
                {player.getWildShapeTypes().join(' and ')} forms ·
                {' '}sizes {player.getWildShapeSizes().join(', ') || 'none'} ·
                {' '}up to {player.getWildShapeHdCap()} HD. The form must be one
                you are familiar with — that part is the table's call.
              </div>

              {missingTiers.map((t) => (
                <div key={t.tier} className="sh-faint" style={{ fontSize: 'var(--font-size-xs)' }}>
                  {t.tier} form is unlocked at level {t.level} but is not listed here:
                  {' '}it {t.reason}.
                </div>
              ))}
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
  const ungained = player.getWildShapeUngainedQualities();
  const modes = player.getWildShapeMovementModes();
  const naturalArmor = player.getWildShapeNaturalArmor();
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
          No speech in animal form, so verbal components fail — you cannot cast.
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

      {specialAttacks.length > 0 && (
        <div className="sh-stack" style={{ gap: 'var(--space-1)' }}>
          <Filigree>Gained</Filigree>
          <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {specialAttacks.map((s) => <Pill key={s} tone="success">{s}</Pill>)}
          </div>
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
