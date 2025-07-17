import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Spellbook, { CLASSES, ETHICALALIGNMENTS, MORALALIGNMENTS } from '../../../../lib/spellbook';
import { order } from '../../../../lib/utils';
import { setSpellbookPage } from '../../../../store/slices/spellbookSlice';
import {
  onDeleteSpellbook,
  onDomain1Change,
  onDomain2Change,
  onEthicalAlignmentChange,
  onMoralAlignmentChange,
  onNewSpellbook,
  onPlayerCharacteristicChange,
  onPlayerClassChange,
  onPlayerLevelChange,
  onSelectSpellbook
} from '../../../../store/thunks/spellbookThunks';
import CreateComponent from '../../../common/create_component';
import LevelComponent from '../../../common/level_component';
import SelectComponent from '../../../common/select_component';
import '../../../../style/menu_cards.css';

export default function MenuCardPlayer() {
  const dispatch = useDispatch();
  const [isNewVisible, setIsNewVisible] = useState(false);

  // Redux state
  const spellbook = useSelector(state => state.spellbook.spellbook);
  const spellbooks = useSelector(state => state.spellbook.spellbooks);
  const spellbookPage = useSelector(s => s.spellbook.spellbookPage);

  const selectedName = spellbook?.Name;
  const saved = order(spellbooks.map(w => w.Name), selectedName);
  const playerLevel = spellbook?.Level ?? 1;
  const playerClass = spellbook?.Class ?? "";
  const moralAlign = spellbook?.MoralAlignment ?? "Neutral";
  const ethicalAlign = spellbook?.EthicalAlignment ?? "Neutral";
  const charLevel = spellbook?.Characteristic ?? 1;
  const domain1 = spellbook?.Domain1 ?? "";
  const domain2 = spellbook?.Domain2 ?? "";
  const spellbookInstance = spellbook ? new Spellbook().load(spellbook) : null;
  const charName = spellbookInstance?.getCharName() ?? "Characteristic";
  const possibleDomains1 = spellbookInstance?.getPossibleDomain1();
  const possibleDomains2 = spellbookInstance?.getPossibleDomain2();

  // Handlers
  const showCreate = () => setIsNewVisible(true);
  const hideCreate = () => setIsNewVisible(false);
  const handleNew = name => dispatch(onNewSpellbook(name));
  const handleSelect = name => dispatch(onSelectSpellbook(name));
  const handleDelete = () => dispatch(onDeleteSpellbook());
  const handleLevelChange = lvl => dispatch(onPlayerLevelChange(lvl));
  const handleClassChange = cls => dispatch(onPlayerClassChange(cls));
  const handleCharChange = char => dispatch(onPlayerCharacteristicChange(char));
  const handleMoralAlignmentChange = align => dispatch(onMoralAlignmentChange(align));
  const handleEthicalAlignmentChange = align => dispatch(onEthicalAlignmentChange(align));
  const handleDomain1Change = domain => dispatch(onDomain1Change(domain));
  const handleDomain2Change = domain => dispatch(onDomain2Change(domain));

  const classList = CLASSES;

  const levelProps = {
    level: playerLevel,
    levelName: 'Player Level',
    onLevelChange: lvl => handleLevelChange(lvl)
  };

  const charProps = {
    level: charLevel,
    levelName: charName,
    onLevelChange: lvl => handleCharChange(lvl)
  };

  if (isNewVisible) {
    return (
      <CreateComponent
        props={{
          saved,
          tabName: 'player',
          onNew: handleNew,
          setIsVisible: hideCreate
        }}
      />
    );
  }

  const isLearnVisible = ["Sorcerer", "Wizard", "Bard"].includes(playerClass);
  const isPrepareVisible = ["Wizard", "Cleric", "Druid", "Ranger", "Paladin"].includes(playerClass);
  const buttonClass = `modern-button 
                ${playerClass === "Wizard" ? "small-middle-long3" : "small-middle-long2"}`;

  return (
    <>
      <SelectComponent
        props={{
          saved,
          tabName: 'player',
          setIsVisible: showCreate,
          onSelect: handleSelect,
          onDeleteItem: handleDelete
        }}
      />

      {saved.length > 0 && (
        <>
          <div className="card-side-div margin-top">
            <label className="modern-label">Class:</label>
            <select
              className="modern-dropdown small-long"
              value={playerClass}
              onChange={e => handleClassChange(e.target.value)}
            >
              <option value="">Select a class</option>
              {classList.map(cls => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {playerClass && <LevelComponent props={levelProps} />}

          {playerClass && <LevelComponent props={charProps} />}

          {["Cleric", "Druid"].includes(playerClass) &&
            <>
              <div className="card-side-div margin-top">
                <label className="modern-label">Moral:</label>
                <select
                  className="modern-dropdown small-long"
                  value={moralAlign}
                  onChange={e => handleMoralAlignmentChange(e.target.value)}
                >
                  {MORALALIGNMENTS.map(align => (
                    <option key={align} value={align}>
                      {align}
                    </option>
                  ))}
                </select>
              </div>

              <div className="card-side-div margin-top">
                <label className="modern-label">Ethics:</label>
                <select
                  className="modern-dropdown small-long"
                  value={ethicalAlign}
                  onChange={e => handleEthicalAlignmentChange(e.target.value)}
                >
                  {ETHICALALIGNMENTS.map(align => (
                    <option key={align} value={align}>
                      {align}
                    </option>
                  ))}
                </select>
              </div>
            </>
          }
          {playerClass === "Cleric" &&
            <>
              <div className="card-side-div margin-top">
                <label className="modern-label">Domains:</label>
                <select
                  className="modern-dropdown small-long"
                  value={domain1}
                  onChange={e => handleDomain1Change(e.target.value)}
                >
                  <option value="">-</option>
                  {possibleDomains1.map(domain => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              <div className="card-side-div margin-top">
                <label className="modern-label"></label>
                <select
                  className="modern-dropdown small-long"
                  value={domain2}
                  onChange={e => handleDomain2Change(e.target.value)}
                >
                  <option value="">-</option>
                  {possibleDomains2.map(domain => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>
            </>
          }

          {playerClass && <div className="card-side-div margin-top">
            {isLearnVisible &&
              <button
                className={buttonClass + `${spellbookPage === 0 ? " opacity-50" : ""}`}
                onClick={() => dispatch(setSpellbookPage(0))}
                disabled={spellbookPage === 0}
              >
                <b>Learn</b>
              </button>
            }

            {isPrepareVisible &&
              <button
                className={buttonClass + `${spellbookPage === 1 ? " opacity-50" : ""}`}
                onClick={() => dispatch(setSpellbookPage(1))}
                disabled={spellbookPage === 1}
              >
                <b>Prepare</b>
              </button>
            }

            <button
              className={buttonClass + `${spellbookPage === 2 ? " opacity-50" : ""}`}
              onClick={() => dispatch(setSpellbookPage(2))}
              disabled={spellbookPage === 2}
            >
              <b>Spellbook</b>
            </button>
          </div>
          }
        </>
      )}
    </>
  );
}