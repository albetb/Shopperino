import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onDeleteLoot, onNewLoot, onSelectLoot } from '../../../../store/thunks/lootThunks';
import { unixToDisplay } from '../../../../lib/storageFormat';
import '../../../../style/menu_cards.css';
import LevelComponent from '../../../common/level_component';
import OptionStepper from '../../../common/option_stepper';
import { isMobile } from '../../../../lib/utils';
import { setIsLootSidebarCollapsed } from '../../../../store/slices/lootSlice';

const MODIFIER_OPTIONS = [
  { value: 0, label: 'x0' },
  { value: 0.25, label: 'x1/4' },
  { value: 0.5, label: 'x1/2' },
  { value: 1, label: 'x1' },
  { value: 2, label: 'x2' },
  { value: 3, label: 'x3' }
];

export default function MenuCardLoot() {
  const dispatch = useDispatch();
  const loots = useSelector(state => state.loot.loots);
  const selectedLoot = useSelector(state => state.loot.selectedLoot);
  const loot = useSelector(state => state.loot.loot);

  const [level, setLevel] = useState(1);
  const [goldMod, setGoldMod] = useState(1);
  const [goodsMod, setGoodsMod] = useState(1);
  const [itemsMod, setItemsMod] = useState(1);

  const onSetLevel = (lvl) => {
    if (lvl > 0)
      setLevel(lvl);
  };

  useEffect(() => {
    if (loot) {
      setLevel(loot.Level);
      setGoldMod(loot.GoldMod);
      setGoodsMod(loot.GoodsMod);
      setItemsMod(loot.ItemsMod);
    }
  }, [loot]);

  const handleSelectLoot = (index) => {
    dispatch(onSelectLoot(Number(index)));
    if (isMobile()) {
      dispatch(setIsLootSidebarCollapsed(true));
    }
  };
  const handleDelete = () => { dispatch(onDeleteLoot()); };
  const handleGenerate = () => {
    dispatch(onNewLoot(level, goldMod, goodsMod, itemsMod));
    if (isMobile()) {
      dispatch(setIsLootSidebarCollapsed(true));
    }
  };

  return (
    <>
      <div className="card-side-div">
        <select
          className="modern-dropdown small-longer"
          value={selectedLoot != null ? String(selectedLoot.Id) : ''}
          onChange={e => handleSelectLoot(e.target.value)}
          disabled={loots.length === 0}
        >
          <option value="" disabled>Select Loot</option>
          {loots
            .map((l, i) => ({ item: l, originalIndex: i }))
            .reverse()
            .map(({ item, originalIndex }) => (
              <option key={originalIndex} value={originalIndex}>
                {typeof item.timestamp === 'number' ? unixToDisplay(item.timestamp) : (item.timestamp ?? '')}
              </option>
          ))}
        </select>
        <button
          className="modern-button small-middle"
          onClick={handleDelete}
          disabled={!selectedLoot}
        >
          <span className="material-symbols-outlined">
            delete
          </span>
        </button>
      </div>

      <LevelComponent props={{ level, levelName: 'Encounter lv', onLevelChange: onSetLevel }} />

      <OptionStepper props={{ value: goldMod,  options: MODIFIER_OPTIONS, name: 'Gold',  onChange: setGoldMod  }} />
      <OptionStepper props={{ value: goodsMod, options: MODIFIER_OPTIONS, name: 'Goods', onChange: setGoodsMod }} />
      <OptionStepper props={{ value: itemsMod, options: MODIFIER_OPTIONS, name: 'Item',  onChange: setItemsMod }} />

      <div className="card-side-div margin-top buttons-row-center">
        <button className="modern-button small-long" onClick={handleGenerate}>
          Generate loot
        </button>
      </div>
    </>
  );
}
