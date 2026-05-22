import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onAddBonusLanguage, onRemoveBonusLanguage } from '../../store/thunks/playerSheetThunks';
import { onSetPlayerAlignment } from '../../store/thunks/playerSheetThunks';
import { getClassData, getRaceData } from '../../lib/player';
import { getAllowedEthics, getAllowedMorals } from '../../lib/alignment';
import { getClassStats, renderFeature } from './class_cards';
import StatBar from './stat_bar';
import Card from '../common/Card';
import Filigree from '../common/Filigree';
import Pill from '../common/Pill';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import EmptyState from '../common/EmptyState';
import '../../style/player_sheet.css';

const FEATURE_CARD_KEYS = ['alignment', 'languages', 'weaponArmor', 'racialTraits', 'classTraits'];

function CollapsibleCard({ eyebrow, title, action, open, onToggle, children }) {
  const toggle = (
    <IconButton
      ghost size="sm"
      icon={open ? 'expand_less' : 'expand_more'}
      onClick={onToggle}
      aria-label={open ? 'Collapse' : 'Expand'}
    />
  );
  return (
    <Card
      className="card-width-spellbook"
      eyebrow={eyebrow}
      title={title}
      action={action ? <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>{action}{toggle}</span> : toggle}
      padding
      onHeadClick={onToggle}
    >
      {open && children}
    </Card>
  );
}

export default function FeaturesPage() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);
  const [collapsed, setCollapsed] = useState(() =>
    Object.fromEntries(FEATURE_CARD_KEYS.map(k => [k, true]))
  );
  const isOpen = key => !collapsed[key];
  const toggleCard = key => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const autoLangs = useMemo(() => player?.getAutomaticLanguages?.() ?? [], [player]);
  const learnedBonus = useMemo(() => player?.getBonusLanguagesLearned?.() ?? [], [player]);
  const allLangs = useMemo(() => [...autoLangs, ...learnedBonus], [autoLangs, learnedBonus]);
  const maxBonus = useMemo(() => player?.getMaxBonusLanguages?.() ?? 0, [player]);
  const bonusOptions = useMemo(() => player?.getBonusLanguagesOptions?.() ?? [], [player]);
  const extraLangCost = useMemo(() => {
    if (learnedBonus.length < maxBonus) return 0;
    return player?.isClassSkill?.('Speak Language') ? 1 : 2;
  }, [player, learnedBonus.length, maxBonus]);

  const classData = useMemo(() => getClassData(player?.getClass?.() ?? player?.class ?? ''), [player]);
  const raceData  = useMemo(() => getRaceData(player?.getRace?.() ?? player?.race ?? ''), [player]);

  const weaponArmorTable = useMemo(() => {
    const weapons = [
      ...(classData?.weaponProficiency ?? []),
      ...(raceData?.weaponProficiency ?? []),
      ...(raceData?.weaponFamiliarity ?? []),
    ];
    const armorMap = {
      light: ['Light armor'],
      medium: ['Light armor', 'Medium armor'],
      heavy: ['Light armor', 'Medium armor', 'Heavy armor'],
      no: [],
    };
    const armors = [...(armorMap[classData?.armorProficiency] ?? []), ...(classData?.shieldProficiency ? ['Shield'] : [])];
    const rowCount = Math.max(weapons.length, armors.length, 1);
    return { weapons, armors, rowCount };
  }, [classData, raceData]);

  const raceWeaponTraitDescriptions = useMemo(() => {
    return (raceData?.traits ?? [])
      .filter(t => t.name === 'Weapon Proficiency' || t.name === 'Weapon Familiarity')
      .map(t => t.description);
  }, [raceData]);

  const classWeaponArmorProficiencyText = useMemo(() => {
    if (classData?.weaponArmorProficiency) return classData.weaponArmorProficiency;
    const feature = (classData?.classFeatures ?? []).find(f =>
      String(f).trimStart().startsWith('Weapon and Armor Proficiency')
    );
    return feature ? String(feature).trim() : '';
  }, [classData]);

  const racialTraitsFiltered = useMemo(() => {
    const skip = ['Weapon Proficiency', 'Weapon Familiarity', 'Automatic and bonus languages'];
    return (raceData?.traits ?? []).filter(t => !skip.includes(t.name));
  }, [raceData]);

  const className = player?.getClass?.() ?? player?.class ?? '';
  const raceName = player?.getRace?.() ?? player?.race ?? '';
  const classStats = useMemo(() => getClassStats(className, classData), [className, classData]);
  const classFeaturesFiltered = useMemo(() => {
    return (classData?.classFeatures ?? []).filter(
      f => !String(f).trimStart().startsWith('Weapon and Armor Proficiency')
    );
  }, [classData]);

  const [selectedLang, setSelectedLang] = useState('');
  const moralAlignment = player?.moralAlignment ?? 'Neutral';
  const ethicalAlignment = player?.ethicalAlignment ?? 'Neutral';
  const allowedMorals = useMemo(() => getAllowedMorals(className), [className]);
  const allowedEthics = useMemo(() => getAllowedEthics(className), [className]);
  const currentMoral = allowedMorals.includes(moralAlignment) ? moralAlignment : allowedMorals[0];
  const currentEthical = allowedEthics.includes(ethicalAlignment) ? ethicalAlignment : allowedEthics[0];
  const setAlignment = (key, value) => dispatch(onSetPlayerAlignment(key, value));
  const alignmentTitle = currentMoral === 'Neutral' && currentEthical === 'Neutral'
    ? 'Neutral'
    : `${currentEthical} ${currentMoral}`;

  const handleAdd = () => {
    const lang = (selectedLang || '').trim();
    if (!lang) return;
    dispatch(onAddBonusLanguage(lang));
    setSelectedLang('');
  };
  const handleRemove = lang => {
    if (autoLangs.includes(lang)) return;
    dispatch(onRemoveBonusLanguage(lang));
  };

  if (!player) {
    return (
      <div className="sh-stack" style={{ padding: 'var(--space-4)' }}>
        <EmptyState icon="extension" title="No character selected" hint="Pick or create one from the sidebar." />
      </div>
    );
  }

  return (
    <div
      className="player-sheet-features-cards"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'var(--space-4)',
        paddingBottom: 'var(--space-12)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-4)', textAlign: 'center' }}>
        <Filigree>Class & race features</Filigree>
        <div className="sh-display" style={{ fontSize: 'var(--font-size-2xl)' }}>
          {className || 'Classless'} · {raceName || 'No race'}
        </div>
      </div>

      <CollapsibleCard
        eyebrow="Alignment"
        title={alignmentTitle}
        open={isOpen('alignment')}
        onToggle={() => toggleCard('alignment')}
      >
        <div className="sh-stack">
          <label
            className="sh-field"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <span className="sh-label" style={{ flex: '0 0 40%' }}>Ethics</span>
            <select
              className="sh-select"
              style={{ flex: '0 0 60%' }}
              value={currentEthical}
              onChange={e => setAlignment('ethicalAlignment', e.target.value)}
            >
              {allowedEthics.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>
          <label
            className="sh-field"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <span className="sh-label" style={{ flex: '0 0 40%' }}>Moral</span>
            <select
              className="sh-select"
              style={{ flex: '0 0 60%' }}
              value={currentMoral}
              onChange={e => setAlignment('moralAlignment', e.target.value)}
            >
              {allowedMorals.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        eyebrow="Languages"
        title={`${learnedBonus.length} / ${maxBonus}`}
        action={learnedBonus.length > maxBonus
          ? <Pill tone="warn" icon="warning">+{(learnedBonus.length - maxBonus) * extraLangCost} SP</Pill>
          : null}
        open={isOpen('languages')}
        onToggle={() => toggleCard('languages')}
      >
        <div className="sh-stack">
          {allLangs.length === 0
            ? <EmptyState icon="translate" title="No languages known" />
            : allLangs.map(lang => {
                const isAuto = autoLangs.includes(lang);
                return (
                  <div key={lang} className="sh-row-h sh-spread" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <span className="sh-row-h" style={{ gap: 'var(--space-2)' }}>
                      <span className="sh-display" style={{ fontSize: 'var(--font-size-md)' }}>{lang}</span>
                      {isAuto && <Pill tone="ghost">auto</Pill>}
                    </span>
                    <IconButton
                      ghost size="sm" icon="remove"
                      onClick={() => handleRemove(lang)}
                      disabled={isAuto}
                      aria-label={`Remove ${lang}`}
                    />
                  </div>
                );
              })}
          <div className="sh-row-h" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <select
              className="sh-select"
              style={{ flex: 1 }}
              value={selectedLang}
              onChange={e => setSelectedLang(e.target.value)}
              aria-label="Choose language to add"
            >
              <option value="">— choose —</option>
              {bonusOptions.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
            <Button
              icon="add"
              onClick={handleAdd}
              disabled={!selectedLang.trim()}
              variant="primary"
              size="sm"
            >Add</Button>
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        eyebrow="Weapons & armor"
        title="Proficiency"
        open={isOpen('weaponArmor')}
        onToggle={() => toggleCard('weaponArmor')}
      >
        <table className="player-sheet-weapon-armor-table">
          <thead>
            <tr><th>Weapons</th><th>Armors</th></tr>
          </thead>
          <tbody>
            {Array.from({ length: weaponArmorTable.rowCount }, (_, i) => (
              <tr key={i}>
                <td>{weaponArmorTable.weapons[i] ?? ''}</td>
                <td>{weaponArmorTable.armors[i] ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="player-sheet-class-features">
          {classWeaponArmorProficiencyText ? renderFeature(classWeaponArmorProficiencyText, 0) : null}
          {raceWeaponTraitDescriptions.map((desc, i) => renderFeature(desc, `race-${i}`))}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        eyebrow="Race"
        title={raceName ? `${raceName} traits` : 'Racial traits'}
        open={isOpen('racialTraits')}
        onToggle={() => toggleCard('racialTraits')}
      >
        {racialTraitsFiltered.length === 0
          ? <EmptyState icon="auto_fix_high" title="No racial traits" />
          : (
            <div className="player-sheet-class-features">
              {racialTraitsFiltered.map((trait, i) => renderFeature(`${trait.name}: ${trait.description}`, i))}
            </div>
          )}
      </CollapsibleCard>

      <CollapsibleCard
        eyebrow="Class"
        title={className ? `${className} features` : 'Class features'}
        open={isOpen('classTraits')}
        onToggle={() => toggleCard('classTraits')}
      >
        {!classData
          ? <EmptyState icon="extension" title="No class selected" />
          : (
            <>
              {classStats && (
                <div className="player-sheet-class-bars">
                  <StatBar label="Life" {...classStats.life} />
                  <StatBar label="Attack" {...classStats.attack} />
                  <StatBar label="Armor" {...classStats.armor} />
                  <StatBar label="Abilities" {...classStats.abilities} />
                  <StatBar label="Spells" {...classStats.spells} />
                  <div className="player-sheet-class-bars-saves">
                    <StatBar label="Fortitude" {...classStats.fort} className="short" />
                    <StatBar label="Reflex" {...classStats.reflex} className="short" />
                    <StatBar label="Will" {...classStats.will} className="short" />
                  </div>
                </div>
              )}
              <div className="player-sheet-class-features">
                {classFeaturesFiltered.map((text, idx) => renderFeature(text, idx))}
              </div>
            </>
          )}
      </CollapsibleCard>
    </div>
  );
}
