import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadFile } from '../../lib/loadFile';
import Player from '../../lib/player';
import { slug } from '../../lib/slugUtils';
import { onSetSkillRanks, onSetSkillBonus } from '../../store/thunks/playerSheetThunks';
import SpellLink from '../common/spell_link';
import '../../style/menu_cards.css';
import '../../style/App.css';

const ABILITY_ORDER = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
const KNOWLEDGE_SUBSKILLS = Player.KNOWLEDGE_SUBSKILLS;

function getAbilityIndex(char) {
  const i = ABILITY_ORDER.indexOf(char);
  return i >= 0 ? i : 99;
}

function knowledgeSkillName(sub) {
  return `Knowledge (${sub})`;
}

export default function SkillsPage() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet.player);
  const [collapsed, setCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState(null); // null = default (name then ability)
  const [sortDesc, setSortDesc] = useState(false);

  const rawSkills = useMemo(() => {
    const list = loadFile('skills');
    const arr = Array.isArray(list) ? list.filter((s) => s && s.Name) : [];
    return arr.filter((s) => s.Name !== 'Speak Language');
  }, []);

  const knowledgeBase = useMemo(() => rawSkills.find((s) => s.Name === 'Knowledge'), [rawSkills]);

  const isClassSkill = (skillName) => player?.isClassSkill?.(skillName) ?? false;

  const sortedSkills = useMemo(() => {
    const arr = [...rawSkills];
    if (sortBy === 'armor') {
      arr.sort((a, b) => {
        const va = a.ArmorPenalty ? 1 : 0;
        const vb = b.ArmorPenalty ? 1 : 0;
        if (va !== vb) return sortDesc ? vb - va : va - vb;
        const na = a.Name.localeCompare(b.Name);
        if (na !== 0) return na;
        return getAbilityIndex(a.Characteristic) - getAbilityIndex(b.Characteristic);
      });
    } else if (sortBy === 'name') {
      arr.sort((a, b) => {
        const cmp = a.Name.localeCompare(b.Name);
        const v = sortDesc ? -cmp : cmp;
        if (v !== 0) return v;
        return getAbilityIndex(a.Characteristic) - getAbilityIndex(b.Characteristic);
      });
    } else if (sortBy === 'ability') {
      arr.sort((a, b) => {
        const ia = getAbilityIndex(a.Characteristic);
        const ib = getAbilityIndex(b.Characteristic);
        const v = sortDesc ? ib - ia : ia - ib;
        if (v !== 0) return v;
        return a.Name.localeCompare(b.Name);
      });
    } else if (sortBy === 'value') {
      arr.sort((a, b) => {
        const ta = a.Name === 'Knowledge' ? 0 : (player?.getSkillTotal?.(a.Name) ?? 0);
        const tb = b.Name === 'Knowledge' ? 0 : (player?.getSkillTotal?.(b.Name) ?? 0);
        const v = sortDesc ? ta - tb : tb - ta;
        if (v !== 0) return v;
        const na = a.Name.localeCompare(b.Name);
        if (na !== 0) return na;
        return getAbilityIndex(a.Characteristic) - getAbilityIndex(b.Characteristic);
      });
    } else {
      // default: name then ability
      arr.sort((a, b) => {
        const na = a.Name.localeCompare(b.Name);
        if (na !== 0) return na;
        return getAbilityIndex(a.Characteristic) - getAbilityIndex(b.Characteristic);
      });
    }
    return arr;
  }, [rawSkills, sortBy, sortDesc, player]);

  const usedPoints = player?.getUsedSkillPoints?.() ?? 0;
  const totalPoints = player?.getTotalSkillPoints?.() ?? 0;
  const level = player?.getLevel?.() ?? 1;

  const handleSort = (column) => {
    if (column === 'dice') return;
    if (sortBy === column) {
      setSortDesc((d) => !d);
    } else {
      setSortBy(column);
      setSortDesc(false);
    }
  };

  const handleRanksChange = (skillName, delta) => {
    const isClass = isClassSkill(skillName);
    const current = player.getSkillRanks(skillName);
    const max = player.getMaxSkillRanks(skillName);
    let next;
    if (isClass) {
      next = Math.round((current + delta) * 2) / 2;
      next = Math.min(max, Math.max(0, Math.round(next)));
    } else {
      next = current + delta;
      next = Math.min(max, Math.max(0, Math.round(next * 2) / 2));
    }
    dispatch(onSetSkillRanks(skillName, next));
  };

  const handleBonusChange = (skillName, delta) => {
    const current = player.getSkillBonus(skillName);
    const next = Math.min(99, Math.max(0, current + delta));
    dispatch(onSetSkillBonus(skillName, next));
  };

  return (
    <div className="player-sheet-features-cards">
      <div className={`card card-width-spellbook ${collapsed ? 'collapsed' : ''}`}>
        <div className="card-side-div card-expand-div" onClick={() => setCollapsed((c) => !c)}>
          <h3 className="card-title">Skills</h3>
          <button type="button" className="collapse-button">
            <span className="material-symbols-outlined">
              {collapsed ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!collapsed && (
          <div className="card-content">
            <div className={`player-sheet-skills-header ${isEditing ? 'player-sheet-skills-header-edit' : ''}`}>
              {!isEditing && (
                <p className="player-sheet-skills-used">
                  Used: {usedPoints}/{totalPoints}
                </p>
              )}
              <button
                type="button"
                className="levels-button small-middle"
                onClick={() => setIsEditing((e) => !e)}
                title={isEditing ? 'Save and close' : 'Edit skills'}
                aria-label={isEditing ? 'Save' : 'Edit'}
              >
                <span className="material-symbols-outlined">{isEditing ? 'check' : 'edit'}</span>
              </button>
            </div>

            {isEditing && (
              <div className="player-sheet-skills-used-fixed" aria-live="polite">
                Used: {usedPoints}/{totalPoints}
              </div>
            )}

            {!isEditing ? (
              <div className="player-sheet-skills-table-wrap">
                <table className="player-sheet-skills-table">
                  <thead>
                    <tr>
                      <th
                        className="player-sheet-skills-th player-sheet-skills-th-armor"
                        onClick={() => handleSort('armor')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleSort('armor')}
                      >
                        <span className="material-symbols-outlined player-sheet-skills-armor-icon" aria-hidden>shield</span>
                      </th>
                      <th
                        className="player-sheet-skills-th player-sheet-skills-th-name"
                        onClick={() => handleSort('name')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleSort('name')}
                      >
                        Name
                      </th>
                      <th
                        className="player-sheet-skills-th player-sheet-skills-th-ability"
                        onClick={() => handleSort('ability')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleSort('ability')}
                      >
                        <span className="player-sheet-skills-th-label-long">Ability</span>
                        <span className="player-sheet-skills-th-label-short">Ab.</span>
                      </th>
                      <th
                        className="player-sheet-skills-th player-sheet-skills-th-value"
                        onClick={() => handleSort('value')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleSort('value')}
                      >
                        <span className="player-sheet-skills-th-label-long">Value</span>
                        <span className="player-sheet-skills-th-label-short">#</span>
                      </th>
                      <th className="player-sheet-skills-th player-sheet-skills-th-dice">
                        <span className="material-symbols-outlined" aria-hidden>casino</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSkills.map((skill) => {
                      if (skill.Name === 'Knowledge') {
                        return (
                          <React.Fragment key="Knowledge-group">
                            <tr className="player-sheet-skills-row-knowledge-header">
                              <td className="player-sheet-skills-td-armor" />
                              <td className="player-sheet-skills-td-name" colSpan={3}>
                                <span className="player-sheet-skill-knowledge-header">Knowledge</span>
                              </td>
                              <td className="player-sheet-skills-td-dice" />
                            </tr>
                            {KNOWLEDGE_SUBSKILLS.map((sub) => {
                              const skillName = knowledgeSkillName(sub);
                              const total = player?.getSkillTotal?.(skillName) ?? 0;
                              const link = `skills#${slug(skillName)}`;
                              return (
                                <tr
                                  key={skillName}
                                  className={isClassSkill(skillName) ? 'player-sheet-skills-row-class' : ''}
                                >
                                  <td className="player-sheet-skills-td-armor" />
                                  <td className="player-sheet-skills-td-name player-sheet-skills-td-knowledge-sub">
                                    <SpellLink link={link}>
                                      <span className="player-sheet-skill-knowledge-sub">{sub.charAt(0).toUpperCase() + sub.slice(1)}</span>
                                    </SpellLink>
                                  </td>
                                  <td className="player-sheet-skills-td-ability">
                                    <em>{knowledgeBase?.Characteristic ?? 'Int'}</em>
                                  </td>
                                  <td className="player-sheet-skills-td-value">{total}</td>
                                  <td className="player-sheet-skills-td-dice">
                                    <button type="button" className="ability-dice-button" disabled aria-label="Roll">
                                      <span className="material-symbols-outlined">casino</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      }
                      const total = player?.getSkillTotal?.(skill.Name) ?? 0;
                      const link = `skills#${slug(skill.Name)}`;
                      return (
                        <tr
                          key={skill.Name}
                          className={isClassSkill(skill.Name) ? 'player-sheet-skills-row-class' : ''}
                        >
                          <td className="player-sheet-skills-td-armor">
                            {skill.Name === 'Swim' ? (
                              <span className="player-sheet-skills-armor-x2" title="Armor penalty x2">x2</span>
                            ) : skill.ArmorPenalty ? (
                              <span className="material-symbols-outlined player-sheet-skills-armor-penalty" title="Armor penalty">shield</span>
                            ) : null}
                          </td>
                          <td className="player-sheet-skills-td-name">
                            <SpellLink link={link}>
                              <span className={skill.TrainedOnly ? 'player-sheet-skill-name-bold' : ''}>
                                {skill.Name}
                              </span>
                            </SpellLink>
                          </td>
                          <td className="player-sheet-skills-td-ability">
                            <em>{skill.Characteristic ?? ''}</em>
                          </td>
                          <td className="player-sheet-skills-td-value">{total}</td>
                          <td className="player-sheet-skills-td-dice">
                            <button type="button" className="ability-dice-button" disabled aria-label="Roll">
                              <span className="material-symbols-outlined">casino</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="player-sheet-skills-table-wrap player-sheet-skills-edit">
                <table className="player-sheet-skills-table">
                  <thead>
                    <tr>
                      <th className="player-sheet-skills-th player-sheet-skills-th-name">Name</th>
                      <th className="player-sheet-skills-th player-sheet-skills-th-ranks">Ranks</th>
                      <th className="player-sheet-skills-th player-sheet-skills-th-bonus">Bonus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSkills.map((skill) => {
                      if (skill.Name === 'Knowledge') {
                        return (
                          <React.Fragment key="Knowledge-group-edit">
                            <tr className="player-sheet-skills-row-knowledge-header">
                              <td className="player-sheet-skills-td-name" colSpan={3}>
                                <span className="player-sheet-skill-knowledge-header">Knowledge</span>
                              </td>
                            </tr>
                            {KNOWLEDGE_SUBSKILLS.map((sub) => {
                              const skillName = knowledgeSkillName(sub);
                              const ranks = player?.getSkillRanks?.(skillName) ?? 0;
                              const bonus = player?.getSkillBonus?.(skillName) ?? 0;
                              const maxRanks = player?.getMaxSkillRanks?.(skillName) ?? 0;
                              const link = `skills#${slug(skillName)}`;
                              const step = isClassSkill(skillName) ? 1 : 0.5;
                              return (
                                <tr
                                  key={skillName}
                                  className={isClassSkill(skillName) ? 'player-sheet-skills-row-class' : ''}
                                >
                                  <td className="player-sheet-skills-td-name player-sheet-skills-td-knowledge-sub">
                                    <SpellLink link={link}>
                                      <span className="player-sheet-skill-knowledge-sub">{sub.charAt(0).toUpperCase() + sub.slice(1)}</span>
                                    </SpellLink>
                                  </td>
                                  <td className="player-sheet-skills-td-ranks">
                                    <div className="player-sheet-skills-ranks-cell">
                                      <div className="levels-div">
                                        <button
                                          type="button"
                                          className="levels-button small"
                                          onClick={() => handleRanksChange(skillName, -step)}
                                          disabled={ranks <= 0}
                                          aria-label="Decrease ranks"
                                        >
                                          <span className="material-symbols-outlined">remove</span>
                                        </button>
                                        <div className="level-frame">
                                          <span className="level-text">{ranks}</span>
                                        </div>
                                        <button
                                          type="button"
                                          className="levels-button small"
                                          onClick={() => handleRanksChange(skillName, step)}
                                          disabled={ranks >= maxRanks}
                                          aria-label="Increase ranks"
                                        >
                                          <span className="material-symbols-outlined">add</span>
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="player-sheet-skills-td-bonus">
                                    <div className="levels-div">
                                      <button
                                        type="button"
                                        className="levels-button small"
                                        onClick={() => handleBonusChange(skillName, -1)}
                                        disabled={bonus <= 0}
                                        aria-label="Decrease bonus"
                                      >
                                        <span className="material-symbols-outlined">remove</span>
                                      </button>
                                      <div className="level-frame">
                                        <span className="level-text">{bonus}</span>
                                      </div>
                                      <button
                                        type="button"
                                        className="levels-button small"
                                        onClick={() => handleBonusChange(skillName, 1)}
                                        disabled={bonus >= 99}
                                        aria-label="Increase bonus"
                                      >
                                        <span className="material-symbols-outlined">add</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      }
                      const ranks = player?.getSkillRanks?.(skill.Name) ?? 0;
                      const bonus = player?.getSkillBonus?.(skill.Name) ?? 0;
                      const maxRanks = player?.getMaxSkillRanks?.(skill.Name) ?? 0;
                      const link = `skills#${slug(skill.Name)}`;
                      const step = isClassSkill(skill.Name) ? 1 : 0.5;
                      return (
                        <tr
                          key={skill.Name}
                          className={isClassSkill(skill.Name) ? 'player-sheet-skills-row-class' : ''}
                        >
                          <td className="player-sheet-skills-td-name">
                            <SpellLink link={link}>
                              <span className={skill.TrainedOnly ? 'player-sheet-skill-name-bold' : ''}>
                                {skill.Name}
                              </span>
                            </SpellLink>
                          </td>
                          <td className="player-sheet-skills-td-ranks">
                            <div className="player-sheet-skills-ranks-cell">
                              <div className="levels-div">
                                <button
                                  type="button"
                                  className="levels-button small"
                                  onClick={() => handleRanksChange(skill.Name, -step)}
                                  disabled={ranks <= 0}
                                  aria-label="Decrease ranks"
                                >
                                  <span className="material-symbols-outlined">remove</span>
                                </button>
                                <div className="level-frame">
                                  <span className="level-text">{ranks}</span>
                                </div>
                                <button
                                  type="button"
                                  className="levels-button small"
                                  onClick={() => handleRanksChange(skill.Name, step)}
                                  disabled={ranks >= maxRanks}
                                  aria-label="Increase ranks"
                                >
                                  <span className="material-symbols-outlined">add</span>
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="player-sheet-skills-td-bonus">
                            <div className="levels-div">
                              <button
                                type="button"
                                className="levels-button small"
                                onClick={() => handleBonusChange(skill.Name, -1)}
                                disabled={bonus <= 0}
                                aria-label="Decrease bonus"
                              >
                                <span className="material-symbols-outlined">remove</span>
                              </button>
                              <div className="level-frame">
                                <span className="level-text">{bonus}</span>
                              </div>
                              <button
                                type="button"
                                className="levels-button small"
                                onClick={() => handleBonusChange(skill.Name, 1)}
                                disabled={bonus >= 99}
                                aria-label="Increase bonus"
                              >
                                <span className="material-symbols-outlined">add</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
