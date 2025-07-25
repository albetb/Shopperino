import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onDeleteLoot, onNewLoot, onSelectLoot } from '../../../../store/thunks/lootThunks';
import '../../../../style/menu_cards.css';
import LevelComponent from '../../../common/level_component';
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

  useEffect(() => {
    if (loot) {
      setLevel(loot.Level);
      setGoldMod(loot.GoldMod);
      setGoodsMod(loot.GoodsMod);
      setItemsMod(loot.ItemsMod);
    }
  }, [loot]);

  const handleSelectLoot = (l) => { dispatch(onSelectLoot(l)); };
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
          value={selectedLoot ? selectedLoot.Id : ''}
          onChange={e => handleSelectLoot(e.target.value)}
          disabled={loots.length === 0}
        >
          <option value="" disabled>Select Loot</option>
          {loots.map(l => (
            <option key={l.Id} value={l.Id}>{l.Name}</option>
          ))}
        </select>
        <button
          className="modern-button small-middle"
          onClick={handleDelete}
          disabled={!selectedLoot}
        >
          Delete
        </button>
      </div>

      <LevelComponent props={{ level, levelName: 'Player Level', onLevelChange: setLevel }} />

      <div className="card-side-div margin-top">
        <label className="modern-label">Gold:</label>
        <select
          className="modern-dropdown small-middle"
          value={goldMod}
          onChange={e => setGoldMod(parseFloat(e.target.value))}
        >
          {MODIFIER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="card-side-div margin-top">
        <label className="modern-label">Goods:</label>
        <select
          className="modern-dropdown small-middle"
          value={goodsMod}
          onChange={e => setGoodsMod(parseFloat(e.target.value))}
        >
          {MODIFIER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="card-side-div margin-top">
        <label className="modern-label">Item:</label>
        <select
          className="modern-dropdown small-middle"
          value={itemsMod}
          onChange={e => setItemsMod(parseFloat(e.target.value))}
        >
          {MODIFIER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="card-side-div margin-top" style={{ justifyContent: "center" }}>
        <button className="modern-button small-long" onClick={handleGenerate}>
          Generate loot
        </button>
      </div>
    </>
  );
}
