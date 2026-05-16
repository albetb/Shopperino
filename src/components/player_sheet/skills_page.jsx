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
import Stepper from '../common/Stepper';
import IconButton from '../common/IconButton';
import EmptyState from '../common/EmptyState';
import Icon from '../common/Icon';
import '../../style/skills.css';

const ABILITY_ORDER = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
const KNOWLEDGE_SUBSKILLS = Player.KNOWLEDGE_SUBSKILLS;
const abilityIndex = c => {
  const i = ABILITY_ORDER.indexOf(c);
  return i >= 0 ? i : 99;
};
const knowledgeSkillName = sub => `Knowledge (${sub})`;

export default function SkillsPage() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [sortDesc, setSortDesc] = useState(false);

  const rawSkills = useMemo(() => {
    const list = loadFile('skills');
    return (Array.isArray(list) ? list.filter(s => s?.Name) : [])
      .filter(s => s.Name !== 'Speak Language');
  }, []);

  const knowledgeBase = useMemo(() => rawSkills.find(s => s.Name === 'Knowledge'), [rawSkills]);

  const isClassSkill = skillName => player?.isClassSkill?.(skillName) ?? false;

  const sortedSkills = useMemo(() => {
    const arr = [...rawSkills];
    const cmpName = (a, b) => a.Name.localeCompare(b.Name);
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

  if (!player) {
    return (
      <div className="sh-stack" style={{ padding: 'var(--space-4)' }}>
        <EmptyState icon="person_play" title="No character selected" hint="Pick or create one from the sidebar." />
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
    const ranks = player.getSkillRanks?.(skill.Name) ?? 0;
    const bonus = player.getSkillBonus?.(skill.Name) ?? 0;
    const maxRanks = player.getMaxSkillRanks?.(skill.Name) ?? 0;
    const isOverLimit = ranks > maxRanks;
    const link = `skills#${slug(skill.Name)}`;
    const step = isClass ? 1 : 1; // Stepper integer steps; half-ranks handled by stepper step 1
    const ranksStep = isClass ? 1 : 1;
    return (
      <div
        key={skill.Name}
        className={`sh-skill-row ${isOverLimit ? 'is-overlimit' : ''}`}
      >
        <span className={`sh-skill-dot ${isClass ? 'is-class' : ''}`} aria-hidden="true" />
        <div className="sh-skill-name-col">
          <SpellLink link={link}>
            <span className={skill.TrainedOnly ? 'sh-skill-name sh-skill-name--trained' : 'sh-skill-name'}>
              {skill.Name}
            </span>
          </SpellLink>
          <span className="sh-skill-meta">
            <span className="sh-mono sh-faint">{skill.Characteristic ?? '—'}</span>
            {!isClass && <span className="sh-faint"> · cross-class</span>}
            {skill.ArmorPenalty && (
              <Pill tone="ghost" icon="shield">{skill.Name === 'Swim' ? 'ACP ×2' : 'ACP'}</Pill>
            )}
            {isOverLimit && <Pill tone="warn" icon="warning">over cap</Pill>}
          </span>
        </div>
        {isEditing ? (
          <>
            <div className="sh-skill-edit-col">
              <span className="sh-eyebrow">Ranks</span>
              <Stepper value={ranks} min={0} max={maxRanks} step={ranksStep} onChange={v => setRanks(skill.Name, v)} />
            </div>
            <div className="sh-skill-edit-col">
              <span className="sh-eyebrow">Bonus</span>
              <Stepper value={bonus} min={0} max={99} step={step} onChange={v => setBonus(skill.Name, v)} />
            </div>
          </>
        ) : (
          <span className={`sh-skill-total sh-mono sh-num ${isOverLimit ? 'sh-warn-text' : ''}`}>
            {total >= 0 ? `+${total}` : total}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="sh-stack" style={{ padding: 'var(--space-4)', paddingBottom: 'var(--space-12)' }}>
      <div className="sh-row-h sh-spread">
        <div>
          <Filigree>Skills</Filigree>
          <div className="sh-display" style={{ fontSize: 'var(--font-size-2xl)' }}>Trained & natural</div>
        </div>
        <div className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
          <Pill tone={overCap ? 'warn' : 'accent'}>{usedPoints} / {totalPoints} ranks</Pill>
          <IconButton
            ghost size="sm"
            icon={isEditing ? 'check' : 'edit'}
            onClick={() => setIsEditing(v => !v)}
            aria-label={isEditing ? 'Done editing' : 'Edit skills'}
            title={isEditing ? 'Done' : 'Edit ranks & bonuses'}
          />
        </div>
      </div>

      {overCap && (
        <div className="sh-warn-strip">
          <Icon name="warning" />
          You've spent more skill points than your character has.
        </div>
      )}

      {!isEditing && (
        <div className="sh-row-h" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button type="button" className="sh-chip" onClick={() => handleSort('name')}    aria-pressed={sortBy === 'name'}>Sort by name</button>
          <button type="button" className="sh-chip" onClick={() => handleSort('ability')} aria-pressed={sortBy === 'ability'}>Ability</button>
          <button type="button" className="sh-chip" onClick={() => handleSort('value')}   aria-pressed={sortBy === 'value'}>Total</button>
          <button type="button" className="sh-chip" onClick={() => handleSort('armor')}   aria-pressed={sortBy === 'armor'}>Armor penalty</button>
        </div>
      )}

      <Card padding={false}>
        <div className="sh-skill-list">
          {sortedSkills.map(skill => {
            if (skill.Name === 'Knowledge') {
              return (
                <Fragment key="Knowledge-group">
                  <div className="sh-skill-group-head">
                    <Icon name="auto_stories" />
                    <span>Knowledge ({knowledgeBase?.Characteristic ?? 'Int'})</span>
                  </div>
                  {KNOWLEDGE_SUBSKILLS.map(sub => {
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
            }
            return renderSkillRow(skill);
          })}
        </div>
      </Card>
    </div>
  );
}
