import { Fragment, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadFile } from '../../lib/loadFile';
import Player from '../../lib/player';
import { slug } from '../../lib/slugUtils';
import { onSetSkillRanks, onSetSkillBonus } from '../../store/thunks/playerSheetThunks';
import SpellLink from '../common/spell_link';
import Card from '../common/Card';
import Filigree from '../common/Filigree';
import Pill from '../common/Pill';
import StatInfo from '../common/StatInfo';
import Stepper from '../common/Stepper';
import IconButton from '../common/IconButton';
import EmptyState from '../common/EmptyState';
import Icon from '../common/Icon';
import '../../style/skills.css';
import { t, tx, tName } from '../../lib/i18n';

const ABILITY_ORDER = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
const KNOWLEDGE_SUBSKILLS = Player.KNOWLEDGE_SUBSKILLS;
const KNOWLEDGE_SUBSKILL_RE = /^Knowledge \((.+)\)$/;
const abilityIndex = c => {
  const i = ABILITY_ORDER.indexOf(c);
  return i >= 0 ? i : 99;
};
const knowledgeSkillName = sub => `Knowledge (${sub})`;
const skillLabel = name => {
  const m = KNOWLEDGE_SUBSKILL_RE.exec(name);
  return m ? tx('Knowledge ({0})', tName('knowledgeSubskills', m[1])) : tName('skills', name);
};

export default function SkillsPage() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [sortDesc, setSortDesc] = useState(false);
  const [classOnly, setClassOnly] = useState(false);
  const [knowledgeCollapsed, setKnowledgeCollapsed] = useState(false);
  const [collapsedAbilities, setCollapsedAbilities] = useState(() => new Set());
  const toggleAbility = ab => setCollapsedAbilities(prev => {
    const next = new Set(prev);
    if (next.has(ab)) next.delete(ab); else next.add(ab);
    return next;
  });

  const rawSkills = useMemo(() => {
    const list = loadFile('skills');
    return (Array.isArray(list) ? list.filter(s => s?.Name) : [])
      .filter(s => s.Name !== 'Speak Language');
  }, []);

  const knowledgeBase = useMemo(() => rawSkills.find(s => s.Name === 'Knowledge'), [rawSkills]);

  const isClassSkill = skillName => player?.isClassSkill?.(skillName) ?? false;

  const sortedSkills = useMemo(() => {
    const arr = [...rawSkills];
    /* Compared on the name the reader can see, not the English one behind it:
       an Italian list sorted in English order files Ascoltare under L. */
    const cmpName = (a, b) => skillLabel(a.Name).localeCompare(skillLabel(b.Name));
    if (sortBy === 'armor') {
      arr.sort((a, b) => {
        const va = a.ArmorPenalty ? 1 : 0;
        const vb = b.ArmorPenalty ? 1 : 0;
        if (va !== vb) return sortDesc ? vb - va : va - vb;
        return cmpName(a, b) || abilityIndex(a.Characteristic) - abilityIndex(b.Characteristic);
      });
    } else if (sortBy === 'name') {
      arr.sort((a, b) => {
        const v = sortDesc ? -cmpName(a, b) : cmpName(a, b);
        return v || abilityIndex(a.Characteristic) - abilityIndex(b.Characteristic);
      });
    } else if (sortBy === 'ability') {
      arr.sort((a, b) => {
        const v = sortDesc
          ? abilityIndex(b.Characteristic) - abilityIndex(a.Characteristic)
          : abilityIndex(a.Characteristic) - abilityIndex(b.Characteristic);
        return v || cmpName(a, b);
      });
    } else if (sortBy === 'value') {
      arr.sort((a, b) => {
        const ta = a.Name === 'Knowledge' ? 0 : (player?.getSkillTotal?.(a.Name) ?? 0);
        const tb = b.Name === 'Knowledge' ? 0 : (player?.getSkillTotal?.(b.Name) ?? 0);
        const v = sortDesc ? ta - tb : tb - ta;
        return v || cmpName(a, b) || abilityIndex(a.Characteristic) - abilityIndex(b.Characteristic);
      });
    } else {
      arr.sort((a, b) => cmpName(a, b) || abilityIndex(a.Characteristic) - abilityIndex(b.Characteristic));
    }
    return arr;
  }, [rawSkills, sortBy, sortDesc, player]);

  // Class-only filter: drop non-class skills; keep Knowledge in the list only
  // if at least one of its sub-skills is a class skill.
  const displayedSkills = useMemo(() => {
    if (!classOnly) return sortedSkills;
    return sortedSkills.filter(s => {
      if (s.Name === 'Knowledge') {
        return KNOWLEDGE_SUBSKILLS.some(sub => isClassSkill(knowledgeSkillName(sub)));
      }
      return isClassSkill(s.Name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedSkills, classOnly, player]);

  if (!player) {
    return (
      <div className="sh-stack" style={{ padding: 'var(--space-4)' }}>
        <EmptyState icon="person_play" title={t('No character selected')} hint={t('Pick or create one from the sidebar.')} />
      </div>
    );
  }

  const usedPoints = player.getUsedSkillPoints?.() ?? 0;
  const totalPoints = player.getTotalSkillPoints?.() ?? 0;
  const overCap = usedPoints > totalPoints;

  const handleSort = column => {
    if (sortBy === column) setSortDesc(d => !d);
    else { setSortBy(column); setSortDesc(false); }
  };

  const setRanks = (skillName, next) => {
    const isClass = isClassSkill(skillName);
    const max = player.getMaxSkillRanks(skillName);
    const clamped = Math.max(0, Math.min(max, isClass ? Math.round(next) : Math.round(next * 2) / 2));
    dispatch(onSetSkillRanks(skillName, clamped));
  };
  const setBonus = (skillName, next) => {
    dispatch(onSetSkillBonus(skillName, Math.max(0, Math.min(99, Math.round(Number(next) || 0)))));
  };

  const renderSkillRow = skill => {
    const isClass = isClassSkill(skill.Name);
    const total = player.getSkillTotal?.(skill.Name) ?? 0;
    const condDelta = player.getSkillConditionDelta?.(skill.Name) ?? 0;
    const ranks = player.getSkillRanks?.(skill.Name) ?? 0;
    const bonus = player.getSkillBonus?.(skill.Name) ?? 0;
    const maxRanks = player.getMaxSkillRanks?.(skill.Name) ?? 0;
    const isOverLimit = ranks > maxRanks;
    const link = `skills#${slug(skill.Name)}`;
    const step = isClass ? 1 : 1; // Stepper integer steps; half-ranks handled by stepper step 1
    const ranksStep = isClass ? 1 : 1;
    /* Ranks and the key ability are what a skill is *made of*, so a row with
       only those has nothing worth explaining and gets no button. Anything
       else — a racial bonus, a feat, a familiar, the armor check penalty, a
       manual bonus, a condition — earns one, and the whole list is shown then,
       because the reader wants the ranks and the ability in the sum too. */
    const skillRows = player.getSkillContributions?.(skill.Name) ?? [];
    const skillNotes = player.getSituationalContributions?.(`skill:${skill.Name}`) ?? [];
    /* A situational note also earns the button — Trapfinding changes what a
       Search roll may attempt without changing the number — and once the box
       is open the sum belongs in it too, so the same gate feeds both lists. */
    const beyondTheBasics = skillNotes.length > 0
      || skillRows.some(c => c.source !== 'ranks' && c.source !== 'ability');
    const info = (
      <StatInfo
        label={skillLabel(skill.Name)}
        value={total}
        contributions={beyondTheBasics ? skillRows : []}
        situational={skillNotes}
      />
    );

    const meta = (
      <span className="sh-skill-meta">
        {info}
        <span className="sh-mono sh-faint">{skill.Characteristic ? t(skill.Characteristic) : '—'}</span>
        {!isClass && <span className="sh-faint"> · {t('cross-class')}</span>}
        {skill.ArmorPenalty && (
          <Pill tone="ghost" icon="shield">{skill.Name === 'Swim' ? t('ACP ×2') : t('ACP')}</Pill>
        )}
        {isOverLimit && <Pill tone="warn" icon="warning">{t('over cap')}</Pill>}
      </span>
    );

    if (isEditing) {
      // Edit-mode layout:
      //   Top line: skill name · ability (no class/cross-class/ACP labels)
      //   Bottom line: ranks stepper + bonus stepper (compact size)
      return (
        <div
          key={skill.Name}
          className={`sh-skill-row sh-skill-row--edit ${isOverLimit ? 'is-overlimit' : ''}`}
        >
          <span className={`sh-skill-dot ${isClass ? 'is-class' : ''}`} aria-hidden="true" />
          <div className="sh-skill-edit-body">
            <div className="sh-skill-edit-name-line">
              <SpellLink link={link}>
                <span className={skill.TrainedOnly ? 'sh-skill-name sh-skill-name--trained' : 'sh-skill-name'}>
                  {skillLabel(skill.Name)}
                </span>
              </SpellLink>
              <span className="sh-faint sh-skill-edit-ability">— {skill.Characteristic ? t(skill.Characteristic) : '—'}</span>
              {isOverLimit && <Pill tone="warn" icon="warning">{t('over cap')}</Pill>}
            </div>
            <div className="sh-skill-edit-steppers">
              <Stepper size="sm" value={ranks} min={0} max={maxRanks} step={ranksStep} onChange={v => setRanks(skill.Name, v)} />
              <Stepper size="sm" value={bonus} min={0} max={99}        step={step}     onChange={v => setBonus(skill.Name, v)} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={skill.Name}
        className={`sh-skill-row ${isOverLimit ? 'is-overlimit' : ''}`}
      >
        <span className={`sh-skill-dot ${isClass ? 'is-class' : ''}`} aria-hidden="true" />
        <div className="sh-skill-name-col">
          <SpellLink link={link}>
            <span className={skill.TrainedOnly ? 'sh-skill-name sh-skill-name--trained' : 'sh-skill-name'}>
              {skillLabel(skill.Name)}
            </span>
          </SpellLink>
          {meta}
        </div>
        <span
          className={[
            'sh-skill-total sh-mono sh-num',
            isOverLimit ? 'sh-warn-text' : '',
            condDelta ? 'sh-skill-total--cond' : '',
            condDelta > 0 ? 'sh-skill-total--up' : '',
            condDelta < 0 ? 'sh-skill-total--down' : '',
          ].filter(Boolean).join(' ')}
          title={condDelta ? tx('Temporary effects: {0}', `${condDelta > 0 ? '+' : ''}${condDelta}`) : undefined}
        >
          {total >= 0 ? `+${total}` : total}
          {condDelta ? <span className="sh-skill-cond-note">{condDelta > 0 ? '+' : ''}{condDelta}</span> : null}
        </span>
      </div>
    );
  };

  return (
    <div className="sh-stack" style={{ width: '100%', padding: 'var(--space-4)', paddingBottom: 'var(--space-12)', boxSizing: 'border-box' }}>
      <div className="sh-row-h sh-spread">
        <div>
          <Filigree>{t('Skills')}</Filigree>
          <div className="sh-display" style={{ fontSize: 'var(--font-size-2xl)' }}>{t('Trained & natural')}</div>
        </div>
        <Pill tone={overCap ? 'warn' : 'accent'}>{tx('{0} / {1} ranks', usedPoints, totalPoints)}</Pill>
      </div>

      {overCap && (
        <div className="sh-warn-strip">
          <Icon name="warning" />
          {t("You've spent more skill points than your character has.")}
        </div>
      )}

      <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
        <IconButton
          ghost size="sm"
          icon={isEditing ? 'check' : 'edit'}
          onClick={() => setIsEditing(v => !v)}
          aria-label={isEditing ? t('Done editing') : t('Edit skills')}
          title={isEditing ? t('Done') : t('Edit ranks & bonuses')}
        />
        {isEditing ? (
          <button
            type="button"
            className="sh-chip"
            onClick={() => setClassOnly(v => !v)}
            aria-pressed={classOnly}
            title={t('Show only skills that are class skills for this character')}
          >
            {classOnly ? `✓ ${t('Only class skills')}` : t('Only class skills')}
          </button>
        ) : (
          <div className="sh-skill-sort">
            {/* Three ways to read the same list, so they are one control on one
                line. Each says only what it sorts by — the words "sort by" were
                two thirds of the first chip and none of the other two. */}
            <button type="button" className="sh-chip" onClick={() => handleSort('name')}    aria-pressed={sortBy === 'name'}>{t('Name')}</button>
            <button type="button" className="sh-chip" onClick={() => handleSort('ability')} aria-pressed={sortBy === 'ability'}>{t('Ability')}</button>
            <button type="button" className="sh-chip" onClick={() => handleSort('value')}   aria-pressed={sortBy === 'value'}>{t('Total')}</button>
          </div>
        )}
      </div>

      <Card padding={false}>
        <div className="sh-skill-list">
          {isEditing && (
            <div className="sh-skill-row sh-skill-row--head">
              <span className="sh-skill-dot" aria-hidden="true" style={{ visibility: 'hidden' }} />
              <div className="sh-skill-edit-body sh-skill-edit-body--head">
                <span className="sh-eyebrow sh-skill-head-skill">{t('Skill')}</span>
                <div className="sh-skill-edit-steppers">
                  <span className="sh-eyebrow sh-skill-head-label">{t('Ranks')}</span>
                  <span className="sh-eyebrow sh-skill-head-label">{t('Bonus')}</span>
                </div>
              </div>
            </div>
          )}
          {isEditing && (
            <div className="sh-skill-sticky-pill">
              <Pill tone={overCap ? 'warn' : 'accent'}>{tx('{0} / {1} ranks', usedPoints, totalPoints)}</Pill>
            </div>
          )}
          {(() => {
            const renderKnowledge = () => {
              const subskills = classOnly
                ? KNOWLEDGE_SUBSKILLS.filter(sub => isClassSkill(knowledgeSkillName(sub)))
                : KNOWLEDGE_SUBSKILLS;
              return (
                <Fragment key="Knowledge-group">
                  <button
                    type="button"
                    className="sh-skill-group-head sh-skill-group-head--button"
                    onClick={() => setKnowledgeCollapsed(v => !v)}
                    aria-expanded={!knowledgeCollapsed}
                  >
                    <Icon name="auto_stories" />
                    <span>{tx('Knowledge ({0})', t(knowledgeBase?.Characteristic ?? 'Int'))}</span>
                    <span className="sh-skill-group-head-spacer" />
                    <Icon name={knowledgeCollapsed ? 'expand_more' : 'expand_less'} />
                  </button>
                  {!knowledgeCollapsed && subskills.map(sub => {
                    const name = knowledgeSkillName(sub);
                    return renderSkillRow({
                      Name: name,
                      Characteristic: knowledgeBase?.Characteristic ?? 'Int',
                      TrainedOnly: knowledgeBase?.TrainedOnly,
                      ArmorPenalty: false,
                      _displayName: sub.charAt(0).toUpperCase() + sub.slice(1),
                    });
                  })}
                </Fragment>
              );
            };

            const renderOne = (skill) => skill.Name === 'Knowledge' ? renderKnowledge() : renderSkillRow(skill);

            if (sortBy !== 'ability') {
              return displayedSkills.map(renderOne);
            }

            // Group by Characteristic when sorted by ability.
            const groups = [];
            const byKey = new Map();
            for (const skill of displayedSkills) {
              const ab = skill.Characteristic || '—';
              if (!byKey.has(ab)) {
                const g = { ability: ab, skills: [] };
                byKey.set(ab, g);
                groups.push(g);
              }
              byKey.get(ab).skills.push(skill);
            }
            return groups.map(({ ability, skills }) => {
              const mod = player?.getModifier?.(ability.toLowerCase()) ?? 0;
              const isCollapsed = collapsedAbilities.has(ability);
              return (
                <Fragment key={`ability-${ability}`}>
                  <button
                    type="button"
                    className="sh-skill-group-head sh-skill-group-head--button"
                    onClick={() => toggleAbility(ability)}
                    aria-expanded={!isCollapsed}
                  >
                    <span>{t(ability)}</span>
                    <span className="sh-faint" style={{ fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
                      {mod >= 0 ? `+${mod}` : mod}
                    </span>
                    <span className="sh-skill-group-head-spacer" />
                    <Icon name={isCollapsed ? 'expand_more' : 'expand_less'} />
                  </button>
                  {!isCollapsed && skills.map(renderOne)}
                </Fragment>
              );
            });
          })()}
        </div>
      </Card>
    </div>
  );
}
