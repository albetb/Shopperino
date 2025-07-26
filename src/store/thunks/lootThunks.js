import Loot from '../../lib/loot';
import * as db from '../../lib/storage';
import { resetLoot, setLoot, setLoots, setSelectedLoot } from '../slices/lootSlice';

export const onNewLoot = (level, goldMod, goodsMod, itemsMod) => (dispatch, getState) => {
  const { loots } = getState().loot;
  const l = new Loot(level, goldMod, goodsMod, itemsMod);
  const entry = { Id: l.Id, Name: l.Timestamp };
  dispatch(setLoots([...loots, entry]));
  dispatch(setLoot(l));
  dispatch(setSelectedLoot(entry));
};

export const onSelectLoot = id => (dispatch, getState) => {
  const { loots } = getState().loot;
  const entry = loots.find(sb => sb.Id === id);
  if (!entry) return;
  const l = db.getLoot(entry.Id);
  dispatch(setLoot(l));
  dispatch(setSelectedLoot(entry));
};

export const onDeleteLoot = () => (dispatch, getState) => {
  const { loots, selectedLoot } = getState().loot;
  if (!selectedLoot) return;
  db.deleteLoot(selectedLoot.Id);
  const updated = loots.filter(sb => sb.Id !== selectedLoot.Id);
  const next = updated[0] || null;
  dispatch(setLoots(updated));
  dispatch(setSelectedLoot(next));
  if (next) {
    const l = db.getLoot(next.Id);
    dispatch(setLoot(l));
  } else {
    dispatch(resetLoot());
  }
};