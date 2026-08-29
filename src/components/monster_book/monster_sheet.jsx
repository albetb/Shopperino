import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import parse from 'html-react-parser';
import Card from '../common/Card';
import Bar from '../common/Bar';
import Pill from '../common/Pill';
import StatPill from '../common/StatPill';
import Stepper from '../common/Stepper';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import Filigree from '../common/Filigree';
import Icon from '../common/Icon';
import useLongPress from '../hooks/useLongPress';
import useHpFeedback from '../hooks/useHpFeedback';
import { addCardByLink } from '../../store/slices/appSlice';
import {
  onAdjustMonsterHp,
  onCloseMonsterSheet,
  onResetMonsterHp,
  onAddIndividual,
  onRemoveIndividual,
  onSetMonsterBonus,
  onSetMonsterMaxLife,
} from '../../store/thunks/monsterBookThunks';
import { MAX_INDIVIDUALS } from '../../lib/monster/monsterRoster';
import '../../style/menu_cards.css';
import '../../style/monster_book.css';
import AugmentSummoningNote from '../common/AugmentSummoningNote';

const fmt = (n) => `${n >= 0 ? '+' : ''}${n}`;
const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABELS = { str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha' };

/* The adjustable stats, and where each one's editor sits. One bonus per stat:
   a master saying "+2 AC" means harder to hit, however you attack it. */
const TOP_ROW = ['ac', 'initiative', 'speed'];
const BOTTOM_ROW = ['fort', 'reflex', 'will'];
const BONUS_LABEL = {
  ac: 'AC', initiative: 'Init', speed: 'Speed',
  fort: 'Fort', reflex: 'Ref', will: 'Will',
};

/**
 * One individual's hit points: bar, the same big −/readout/+ the player sheet
 * uses, and a delete.
 *
 * A component rather than a loop body because each row owns hooks — its own
 * long-press timers and its own feedback readout — and hooks cannot be created
 * inside a map. Which is the right shape anyway: the rows are independent, and
 * hurting the third goblin should not flash a number on the first.
 */
function MonsterHpRow({ individual, count, name, onAdjust, onRemove }) {
  const { feedback, show } = useHpFeedback();

  const handle = useCallback((delta) => {
    onAdjust(delta, individual.index);
    show(delta);
  }, [onAdjust, show, individual.index]);

  const longPressPlus = useLongPress(() => handle(10), () => handle(1), { delay: 400 });
  const longPressMinus = useLongPress(() => handle(-10), () => handle(-1), { delay: 400 });

  const plusDisabled = individual.currentHp >= individual.maxHp;
  const minusDisabled = individual.currentHp <= -10;

  return (
    <div className={`monster-hp-row${individual.isDying ? ' is-down' : ''}`}>
      {/* The number is only worth showing when there is more than one of them. */}
      {count > 1 && (
        <span className="sh-faint monster-hp-index">#{individual.index + 1}</span>
      )}
      <div className="monster-hp-main">
        <Bar value={individual.ratio} variant={individual.isDying ? 'danger' : 'hp'} />
        <div className="sh-row-h monster-hp-controls">
          <IconButton
            icon="remove"
            {...(minusDisabled ? {} : longPressMinus)}
            disabled={minusDisabled}
            aria-label={count > 1 ? `Decrease HP of #${individual.index + 1}` : 'Decrease HP'}
          />
          <div
            className="monster-hp-readout"
            style={{
              color: feedback ? (feedback.delta >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--ink)',
              transition: 'color var(--t-base) var(--ease)',
            }}
          >
            {feedback?.text ?? `${individual.currentHp} / ${individual.maxHp}`}
          </div>
          <IconButton
            icon="add"
            {...(plusDisabled ? {} : longPressPlus)}
            disabled={plusDisabled}
            aria-label={count > 1 ? `Increase HP of #${individual.index + 1}` : 'Increase HP'}
          />
        </div>
      </div>
      <IconButton
        icon="close"
        ghost
        size="sm"
        onClick={() => onRemove(individual.index)}
        aria-label={count === 1
          ? `Remove ${name} from the roster`
          : `Remove ${name} #${individual.index + 1}`}
        title={count === 1 ? 'Remove from the roster' : 'Remove this one'}
      />
    </div>
  );
}

/**
 * One monster, laid out as the player sheet's combat tab so a master reads the
 * two the same way: hit points with a bar and steppers, a defence row, a saves
 * row, then attacks. Every number comes from the MonsterSheet model.
 *
 * **One entry, many individuals.** Everything on this sheet except the hit
 * points is shared by every creature of this kind in the fight — a master
 * ruling "these goblins are all +2 AC" says it once, and the health card grows
 * a row per goblin instead.
 */
export default function MonsterSheetView() {
  const dispatch = useDispatch();
  const roster = useSelector((state) => state.monsterBook.roster);
  const openIndex = useSelector((state) => state.monsterBook.openIndex);
  const sheet = openIndex == null ? null : roster[openIndex];

  const [editBonus, setEditBonus] = useState(null);
  const [tempBonus, setTempBonus] = useState(0);
  const [hpAdvancedOpen, setHpAdvancedOpen] = useState(false);
  const [editMaxLife, setEditMaxLife] = useState(false);
  const [tempMaxLife, setTempMaxLife] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);

  /* Each health row owns its own readout and timers, so the adjust call is
     all this level has to hand down. */
  const adjustHp = useCallback((delta, individualIndex) => {
    dispatch(onAdjustMonsterHp(delta, individualIndex));
  }, [dispatch]);

  if (!sheet) return null;

  const maxHp = sheet.getMaxLife();
  const individuals = sheet.getIndividuals();
  const atIndividualCap = individuals.length >= MAX_INDIVIDUALS;

  const attacks = sheet.getAttacks();
  const specialAttacks = sheet.getSpecialAttacks();
  const specialQualities = sheet.getSpecialQualities();
  const feats = sheet.getFeats();
  const skills = sheet.getSkills();

  /* Back to full health, every individual at once — the point of the button is
     reusing the entry on the next fight rather than nursing one creature. */
  const anyDamage = individuals.some((i) => i.damage > 0);

  const toggleEditBonus = (key) => {
    if (editBonus === key) { setEditBonus(null); return; }
    setEditBonus(key);
    setTempBonus(sheet.getBonus(key));
  };

  const saveBonus = () => {
    if (!editBonus) return;
    dispatch(onSetMonsterBonus(editBonus, tempBonus));
    setEditBonus(null);
  };

  const startEditMaxLife = () => {
    setTempMaxLife(maxHp);
    setEditMaxLife(true);
  };
  const saveMaxLife = () => {
    dispatch(onSetMonsterMaxLife(tempMaxLife));
    setEditMaxLife(false);
  };
  const resetMaxLife = () => {
    dispatch(onSetMonsterMaxLife(null));
    setEditMaxLife(false);
  };

  const renderBonusEditor = () => (
    <Card padding>
      <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <span className="sh-eyebrow">{BONUS_LABEL[editBonus]} bonus</span>
        <Stepper
          value={tempBonus}
          min={-99}
          max={99}
          step={editBonus === 'speed' ? 5 : 1}
          onChange={setTempBonus}
        />
        <IconButton icon="check" size="sm" onClick={saveBonus} aria-label="Save bonus" style={{ marginLeft: 'auto' }} />
        <IconButton icon="close" ghost size="sm" onClick={() => setEditBonus(null)} aria-label="Cancel" />
      </div>
    </Card>
  );

  const bonusSub = (key, extra = null) => {
    const bonus = sheet.getBonus(key);
    if (!bonus) return extra;
    const note = <span className="monster-bonus-note" style={{ display: 'block' }}>{fmt(bonus)}</span>;
    return extra != null ? <>{extra}{note}</> : note;
  };

  return (
    <div className="sh-stack monster-sheet">
      {/* Identity header — the back link out of the sheet lives here. */}
      <Card padding>
        <div className="monster-sheet-head">
          <Button
            className="monster-sheet-back"
            variant="ghost"
            icon="arrow_back"
            onClick={() => dispatch(onCloseMonsterSheet())}
          >
            Back
          </Button>
          <div className="monster-sheet-identity">
            <Filigree>{sheet.getSizeAndType()}</Filigree>
            <div className="sh-display" style={{ fontSize: 'var(--font-size-2xl)' }}>
              {sheet.getName()}
            </div>
          </div>
          <span className="sh-row-h monster-sheet-meta" style={{ gap: 'var(--space-2)' }}>
            <Pill tone="accent">CR {sheet.getChallengeRating()}</Pill>
            <IconButton
              icon="menu_book"
              ghost size="sm"
              onClick={() => dispatch(addCardByLink({ links: sheet.getRef() }))}
              aria-label="Show full stat block"
              title="Full stat block"
            />
          </span>
        </div>
      </Card>

      {/* Health — one row per individual of this kind, each with the same
          controls the player sheet uses. The plus in the header adds another
          creature; the x on a row removes one, and removing the last takes the
          whole entry off the roster with it. */}
      <Card
        title={individuals.length === 1
          ? `${individuals[0].currentHp} / ${maxHp} hp`
          : `${individuals.length} creatures`}
        className="sh-card--head-spread"
        eyebrow="Health"
        action={
          <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
            <IconButton
              icon="restart_alt"
              ghost size="sm"
              onClick={() => dispatch(onResetMonsterHp())}
              disabled={!anyDamage}
              aria-label="Back to full health"
              title="Every one of them back to full"
            />
            <IconButton
              icon="add"
              ghost size="sm"
              onClick={() => dispatch(onAddIndividual(openIndex))}
              disabled={atIndividualCap}
              aria-label={`Add another ${sheet.getName()}`}
              title={atIndividualCap
                ? `${MAX_INDIVIDUALS} is as many as one entry holds`
                : 'Add another one of these'}
            />
          </span>
        }
      >
        <div className="sh-stack">
          <div className="monster-hp-rows">
            {individuals.map((individual) => (
              <MonsterHpRow
                key={individual.index}
                individual={individual}
                count={individuals.length}
                name={sheet.getName()}
                onAdjust={adjustHp}
                onRemove={(i) => dispatch(onRemoveIndividual(openIndex, i))}
              />
            ))}
          </div>
          <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Pill tone="ghost">{sheet.getHitDiceLine()}</Pill>
            {individuals.length > 1 && (
              <Pill tone="ghost">
                {individuals.filter((i) => !i.isDying).length} still up
              </Pill>
            )}
            <IconButton
              icon={hpAdvancedOpen ? 'expand_less' : 'expand_more'}
              ghost size="sm"
              onClick={() => setHpAdvancedOpen((v) => !v)}
              aria-label={hpAdvancedOpen ? 'Hide max hp' : 'Show max hp'}
            />
          </div>
          {hpAdvancedOpen && (
            <div className="sh-row-h sh-spread">
              <span className="sh-eyebrow">Max hit points</span>
              {editMaxLife ? (
                <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                  <Stepper value={tempMaxLife} min={1} max={999} onChange={setTempMaxLife} />
                  <IconButton icon="check" size="sm" onClick={saveMaxLife} aria-label="Save max hp" />
                  <IconButton icon="restart_alt" ghost size="sm" onClick={resetMaxLife} aria-label="Back to the printed average" />
                  <IconButton icon="close" ghost size="sm" onClick={() => setEditMaxLife(false)} aria-label="Cancel" />
                </div>
              ) : (
                <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                  <span className="sh-mono sh-num sh-muted">
                    {maxHp}{sheet.maxLife == null ? '' : ' *'}
                  </span>
                  <IconButton icon="edit" ghost size="sm" onClick={startEditMaxLife} aria-label="Edit max hp" />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Abilities — the same two-row grid the player sheet's sidebar uses, so a
          master reads the two the same way. Directly under health because it
          is what the next die roll usually asks for. */}
      <Card title="Abilities" className="sh-card--head-spread">
        <div className="ability-grid ability-grid-labels">
          {ABILITY_KEYS.map((key) => (
            <div key={key} className="ability-grid-cell ability-label-cell">
              {ABILITY_LABELS[key]}
            </div>
          ))}
        </div>
        <div className="ability-grid ability-grid-scores">
          {ABILITY_KEYS.map((key) => {
            const score = sheet.getAbilities()[key];
            const mod = sheet.getAbilityMod(key);
            return (
              <div key={key} className="ability-grid-cell ability-score-cell">
                <div>{score ?? '—'}</div>
                <div className="ability-modifier">{mod == null ? '—' : fmt(mod)}</div>
              </div>
            );
          })}
        </div>
        {/* A summoned creature is stronger than its entry says, and nothing
            here can know one was summoned — so the note states the arithmetic
            and leaves the printed scores alone. */}
        <AugmentSummoningNote />
      </Card>

      {/* Defence row */}
      <div className="sh-grid-3">
        <StatPill
          accent
          label="AC"
          value={sheet.getArmorClass()}
          sub={
            <>
              <span style={{ display: 'block' }}>touch {sheet.getTouchAc()}</span>
              <span style={{ display: 'block' }}>flat {sheet.getFlatFootedAc()}</span>
              {bonusSub('ac')}
            </>
          }
          editing={editBonus === 'ac'}
          onEdit={() => toggleEditBonus('ac')}
        />
        <StatPill
          label="Init"
          value={fmt(sheet.getInitiative())}
          sub={bonusSub('initiative')}
          editing={editBonus === 'initiative'}
          onEdit={() => toggleEditBonus('initiative')}
        />
        <StatPill
          label="Speed"
          value={`${sheet.getSpeed()} ft`}
          sub={bonusSub('speed')}
          editing={editBonus === 'speed'}
          onEdit={() => toggleEditBonus('speed')}
        />
      </div>
      {TOP_ROW.includes(editBonus) && renderBonusEditor()}

      {/* Saves row */}
      <div className="sh-grid-3">
        <StatPill
          label="Fort"
          value={fmt(sheet.getFortitudeSave())}
          sub={bonusSub('fort')}
          editing={editBonus === 'fort'}
          onEdit={() => toggleEditBonus('fort')}
        />
        <StatPill
          label="Ref"
          value={fmt(sheet.getReflexSave())}
          sub={bonusSub('reflex')}
          editing={editBonus === 'reflex'}
          onEdit={() => toggleEditBonus('reflex')}
        />
        <StatPill
          label="Will"
          value={fmt(sheet.getWillSave())}
          sub={bonusSub('will')}
          editing={editBonus === 'will'}
          onEdit={() => toggleEditBonus('will')}
        />
      </div>
      {BOTTOM_ROW.includes(editBonus) && renderBonusEditor()}

      {/* Attacks */}
      <Card title="Attacks" eyebrow={sheet.getBaseAttackGrapple()} className="sh-card--head-spread">
        <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
          {attacks.length === 0 ? (
            <div className="sh-faint">{sheet.getAttackLine() || 'This creature has no attacks.'}</div>
          ) : attacks.map((line, idx) => (
            <div
              key={line.index}
              className="sh-row-h sh-spread"
              style={idx === 0
                ? { gap: 'var(--space-3)' }
                : { gap: 'var(--space-3)', borderTop: '1px solid var(--border-soft)', paddingTop: 'var(--space-2)' }}
            >
              <span className="sh-display" style={{ fontSize: 'var(--font-size-lg)', textTransform: 'capitalize' }}>
                {line.count > 1 ? `${line.count} ` : ''}{line.name}
              </span>
              <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                {/* Crush and tail sweep are rolled against, not for: they show
                    the save that avoids them where the others show a bonus. */}
                {line.save ? (
                  <Pill tone="warn">
                    {line.save.dc ? `${line.save.ability} DC ${line.save.dc}` : `${line.save.ability} save`}
                  </Pill>
                ) : (
                  <Pill tone={line.type === 'secondary' ? 'default' : 'accent'}>{fmt(line.bonus ?? 0)}</Pill>
                )}
                {line.damage && <Pill tone="default">{line.damage}</Pill>}
              </span>
            </div>
          ))}
          <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {sheet.getSpaceReach() && (
              <Pill tone="ghost" icon="straighten">{sheet.getSpaceReach()}</Pill>
            )}
            {sheet.getSpeedLine() && (
              <Pill tone="ghost" icon="directions_run">{sheet.getSpeedLine()}</Pill>
            )}
          </div>
        </div>
      </Card>

      {/* What the creature can do that is not an attack roll */}
      {(specialAttacks.length > 0 || specialQualities.length > 0) && (
        <Card title="Special" className="sh-card--head-spread">
          <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
            {specialAttacks.length > 0 && (
              <div className="sh-stack" style={{ gap: 'var(--space-1)' }}>
                <Filigree>Attacks</Filigree>
                <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {specialAttacks.map((s) => <Pill key={s} tone="accent">{s}</Pill>)}
                </div>
              </div>
            )}
            {specialQualities.length > 0 && (
              <div className="sh-stack" style={{ gap: 'var(--space-1)' }}>
                <Filigree>Qualities</Filigree>
                <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {specialQualities.map((s) => <Pill key={s} tone="success">{s}</Pill>)}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Reference detail — collapsed by default: useful, but not what you
          read while the initiative count is moving. */}
      <Card
        title="Details"
        className="sh-card--head-spread"
        action={
          <IconButton
            icon={notesOpen ? 'expand_less' : 'expand_more'}
            ghost size="sm"
            onClick={() => setNotesOpen((v) => !v)}
            aria-label="Toggle details"
          />
        }
      >
        {notesOpen && (
          <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
            {skills.length > 0 && (
              <div><span className="sh-eyebrow">Skills</span>
                <div className="sh-faint monster-detail-text">{skills.join(', ')}</div></div>
            )}
            {feats.length > 0 && (
              <div><span className="sh-eyebrow">Feats</span>
                <div className="sh-faint monster-detail-text">{feats.join(', ')}</div></div>
            )}
            <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {sheet.getAlignment() && <Pill tone="ghost">{sheet.getAlignment()}</Pill>}
              {sheet.getEnvironment() && <Pill tone="ghost" icon="park">{sheet.getEnvironment()}</Pill>}
              {sheet.getTreasure() && <Pill tone="ghost" icon="paid">{sheet.getTreasure()}</Pill>}
            </div>
            {sheet.getOrganization() && (
              <div><span className="sh-eyebrow">Organization</span>
                <div className="sh-faint monster-detail-text">{sheet.getOrganization()}</div></div>
            )}
            {sheet.getCombatHtml() && (
              <div className="monster-detail-prose">
                <Filigree>Combat</Filigree>
                {parse(sheet.getCombatHtml())}
              </div>
            )}
          </div>
        )}
      </Card>

      {!sheet.isValid() && (
        <div className="sh-warn-strip">
          <Icon name="warning" />
          This creature is no longer in the data files.
        </div>
      )}
    </div>
  );
}
