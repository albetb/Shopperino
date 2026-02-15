import Loot from '../../lib/loot';
import * as db from '../../lib/storage';
import { resetLoot, setLoot, setLootsList, setSelectedLootIndex } from '../slices/lootSlice';
import { setPersist } from '../slices/persistSlice';

export const onNewLoot = (level, goldMod, goodsMod, itemsMod) => (dispatch, getState) => {
  const app = getState().persist;
  const l = new Loot(level, goldMod, goodsMod, itemsMod);
  const newL = [...(app.l || []), db.lootToTuple(l)];
  const newApp = { ...app, l: newL, sl: newL.length - 1 };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setLootsList(db.getLootsList(newApp)));
  dispatch(setSelectedLootIndex(newApp.sl));
  dispatch(setLoot(l));
};

export const onSelectLoot = (index) => (dispatch, getState) => {
  const app = getState().persist;
  if (index == null || index < 0 || !app.l?.[index]) return;
  const l = db.getLootByIndex(app, index);
  const newApp = { ...app, sl: index };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setSelectedLootIndex(index));
  dispatch(setLoot(l));
};

export const onDeleteLoot = () => (dispatch, getState) => {
  const app = getState().persist;
  if (app.sl == null || app.sl < 0 || !app.l?.length) return;

  const newL = app.l.filter((_, i) => i !== app.sl);
  const newSl = newL.length === 0 ? null : Math.min(app.sl, newL.length - 1);
  const newApp = { ...app, l: newL, sl: newSl };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setLootsList(db.getLootsList(newApp)));
  dispatch(setSelectedLootIndex(newSl));
  if (newSl != null) {
    dispatch(setLoot(db.getLootByIndex(newApp, newSl)));
  } else {
    dispatch(resetLoot());
  }
};
