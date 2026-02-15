import { createSlice } from '@reduxjs/toolkit';
import { getDefaultApp, loadApp, saveApp } from '../../lib/appState';

const initialState = getDefaultApp();

export const persistSlice = createSlice({
  name: 'persist',
  initialState,
  reducers: {
    setPersist(state, action) {
      const next = action.payload;
      if (next && typeof next === 'object') {
        saveApp(next);
        return next;
      }
      return state;
    },
    loadPersist(state) {
      const next = loadApp();
      saveApp(next);
      return next;
    },
  },
});

export const { setPersist, loadPersist } = persistSlice.actions;
export default persistSlice.reducer;
