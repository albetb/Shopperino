import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onAddBonusLanguage, onRemoveBonusLanguage } from '../../store/thunks/playerSheetThunks';
import { onSetPlayerSpellOption } from '../../store/thunks/playerSheetThunks';
import { getClassData, getRaceData } from '../../lib/player';
import { getAllowedEthics, getAllowedMorals } from '../../lib/alignment';
import { getClassStats, renderFeature } from './class_cards';
import StatBar from './stat_bar';
import '../../style/menu_cards.css';
import '../../style/App.css';

const FEATURE_CARD_KEYS = ['alignment', 'languages', 'weaponArmor', 'racialTraits', 'classTraits'];

export default function FeaturesPage() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet.player);
  const [collapsed, setCollapsed] = useState(() =>
    Object.fromEntries(FEATURE_CARD_KEYS.map((k) => [k, true]))
  );

  const toggleCard = (key) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const autoLangs = useMemo(() => player?.getAutomaticLanguages?.() ?? [], [player]);
  const learnedBonus = useMemo(() => player?.getBonusLanguagesLearned?.() ?? [], [player]);
  const allLangs = useMemo(() => [...autoLangs, ...learnedBonus], [autoLangs, learnedBonus]);
  const maxBonus = useMemo(() => player?.getMaxBonusLanguages?.() ?? 0, [player]);
  const bonusOptions = useMemo(() => player?.getBonusLanguagesOptions?.() ?? [], [player]);
  const extraLangCost = useMemo(() => {
    if (learnedBonus.length < maxBonus) return 0;
    return player?.isClassSkill?.('Speak Language') ? 1 : 2;
  }, [player, learnedBonus.length, maxBonus]);

  const classData = useMemo(
    () => getClassData(player?.getClass?.() ?? player?.class ?? ''),
    [player]
  );
  const raceData = useMemo(
    () => getRaceData(player?.getRace?.() ?? player?.race ?? ''),
    [player]
  );

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
    const traits = raceData?.traits ?? [];
    return traits
      .filter((t) => t.name === 'Weapon Proficiency' || t.name === 'Weapon Familiarity')
      .map((t) => t.description);
  }, [raceData]);

  const classWeaponArmorProficiencyText = useMemo(() => {
    if (classData?.weaponArmorProficiency) return classData.weaponArmorProficiency;
    const feature = (classData?.classFeatures ?? []).find((f) =>
      String(f).trimStart().startsWith('Weapon and Armor Proficiency')
    );
    return feature ? String(feature).trim() : '';
  }, [classData]);

  const racialTraitsFiltered = useMemo(() => {
    const traits = raceData?.traits ?? [];
    const skipNames = [
      'Weapon Proficiency',
      'Weapon Familiarity',
      'Automatic and bonus languages',
    ];
    return traits.filter((t) => !skipNames.includes(t.name));
  }, [raceData]);

  const className = player?.getClass?.() ?? player?.class ?? '';
  const raceName = player?.getRace?.() ?? player?.race ?? '';
  const classStats = useMemo(
    () => getClassStats(className, classData),
    [className, classData]
  );
  const classFeaturesFiltered = useMemo(() => {
    const features = classData?.classFeatures ?? [];
    return features.filter(
      (f) => !String(f).trimStart().startsWith('Weapon and Armor Proficiency')
    );
  }, [classData]);

  const [selectedLang, setSelectedLang] = useState('');

  const moralAlignment = player?.moralAlignment ?? 'Neutral';
  const ethicalAlignment = player?.ethicalAlignment ?? 'Neutral';
  const allowedMorals = useMemo(() => getAllowedMorals(className), [className]);
  const allowedEthics = useMemo(() => getAllowedEthics(className), [className]);
  const currentMoral = allowedMorals.includes(moralAlignment) ? moralAlignment : allowedMorals[0];
  const currentEthical = allowedEthics.includes(ethicalAlignment) ? ethicalAlignment : allowedEthics[0];
  const setAlignment = (key, value) => dispatch(onSetPlayerSpellOption(key, value));
  const alignmentTitle =
    currentMoral === 'Neutral' && currentEthical === 'Neutral'
      ? 'Alignments - Neutral'
      : `Alignments - ${currentEthical} ${currentMoral}`;

  const handleAdd = () => {
    const lang = (selectedLang || '').trim();
    if (!lang) return;
    dispatch(onAddBonusLanguage(lang));
    setSelectedLang('');
  };

  const handleRemove = (lang) => {
    if (autoLangs.includes(lang)) return;
    dispatch(onRemoveBonusLanguage(lang));
  };

  return (
    <div className="player-sheet-features-cards">
      <div className={`card card-width-spellbook ${collapsed.alignment ? 'collapsed' : ''}`}>
        <div className="card-side-div card-expand-div" onClick={() => toggleCard('alignment')}>
          <h3 className="card-title">{alignmentTitle}</h3>
          <button type="button" className="collapse-button">
            <span className="material-symbols-outlined">
              {collapsed.alignment ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!collapsed.alignment && (
          <div className="card-content player-sheet-alignment-card-content">
            <div className="player-sheet-alignment-row">
              <label className="player-sheet-alignment-label">Ethics</label>
              <select
                className="modern-dropdown small-long"
                value={currentEthical}
                onChange={(e) => setAlignment('ethicalAlignment', e.target.value)}
              >
                {allowedEthics.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div className="player-sheet-alignment-row">
              <label className="player-sheet-alignment-label">Moral</label>
              <select
                className="modern-dropdown small-long"
                value={currentMoral}
                onChange={(e) => setAlignment('moralAlignment', e.target.value)}
              >
                {allowedMorals.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className={`card card-width-spellbook ${collapsed.languages ? 'collapsed' : ''}`}>
        <div className="card-side-div card-expand-div" onClick={() => toggleCard('languages')}>
          <h3 className="card-title">
            Languages - {learnedBonus.length}/{maxBonus}
            {learnedBonus.length > maxBonus && (
              <span className="player-sheet-lang-extra-hint" title="Extra languages cost skill points">
                {' '}(+{(learnedBonus.length - maxBonus) * extraLangCost} SP)
              </span>
            )}
          </h3>
          <button type="button" className="collapse-button">
            <span className="material-symbols-outlined">
              {collapsed.languages ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!collapsed.languages && (
          <div className="card-content">
            <div className="player-sheet-languages-table-wrap">
              <table className="player-sheet-languages-table">
                <tbody>
                  {allLangs.map((lang) => {
                    const isAuto = autoLangs.includes(lang);
                    return (
                      <tr key={lang}>
                        <td className="player-sheet-lang-name">{lang}</td>
                        <td className="player-sheet-lang-action">
                          <button
                            type="button"
                            className="modern-button small player-sheet-lang-remove"
                            onClick={() => handleRemove(lang)}
                            disabled={isAuto}
                            title={isAuto ? 'Automatic language' : 'Remove'}
                            aria-label={`Remove ${lang}`}
                          >
                            <span className="material-symbols-outlined">remove</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="player-sheet-languages-add-row">
              <select
                className="modern-dropdown small-longer player-sheet-lang-select"
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                aria-label="Choose language to add"
              >
                <option value="">—</option>
                {bonusOptions.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="modern-button small player-sheet-lang-add"
                onClick={handleAdd}
                disabled={!selectedLang.trim()}
                title="Add language"
                aria-label="Add language"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`card card-width-spellbook ${collapsed.weaponArmor ? 'collapsed' : ''}`}>
        <div className="card-side-div card-expand-div" onClick={() => toggleCard('weaponArmor')}>
          <h3 className="card-title">Weapon and Armor Proficiency</h3>
          <button type="button" className="collapse-button">
            <span className="material-symbols-outlined">
              {collapsed.weaponArmor ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!collapsed.weaponArmor && (
          <div className="card-content">
            <table className="player-sheet-weapon-armor-table">
              <thead>
                <tr>
                  <th>Weapons</th>
                  <th>Armors</th>
                </tr>
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
              {classWeaponArmorProficiencyText
                ? renderFeature(classWeaponArmorProficiencyText, 0)
                : null}
              {raceWeaponTraitDescriptions.map((desc, i) =>
                renderFeature(desc, `race-${i}`)
              )}
            </div>
          </div>
        )}
      </div>

      <div className={`card card-width-spellbook ${collapsed.racialTraits ? 'collapsed' : ''}`}>
        <div className="card-side-div card-expand-div" onClick={() => toggleCard('racialTraits')}>
          <h3 className="card-title">{raceName ? `${raceName} traits` : 'Racial traits'}</h3>
          <button type="button" className="collapse-button">
            <span className="material-symbols-outlined">
              {collapsed.racialTraits ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!collapsed.racialTraits && (
          <div className="card-content">
            {racialTraitsFiltered.length === 0 ? (
              <p className="modal-body-muted text-center">No racial traits to show.</p>
            ) : (
              <div className="player-sheet-class-features">
                {racialTraitsFiltered.map((trait, i) =>
                  renderFeature(`${trait.name}: ${trait.description}`, i)
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`card card-width-spellbook ${collapsed.classTraits ? 'collapsed' : ''}`}>
        <div className="card-side-div card-expand-div" onClick={() => toggleCard('classTraits')}>
          <h3 className="card-title">{className ? `${className} features` : 'Class features'}</h3>
          <button type="button" className="collapse-button">
            <span className="material-symbols-outlined">
              {collapsed.classTraits ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!collapsed.classTraits && (
          <div className="card-content">
            {!classData ? (
              <p className="modal-body-muted text-center">No class selected.</p>
            ) : (
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
          </div>
        )}
      </div>
    </div>
  );
}
