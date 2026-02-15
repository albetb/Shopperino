import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  worlds: [],             // [{ name, level }]
  selectedWorldIndex: null,
  selectedWorld: null,    // { Name } for UI compat
  world: null,
};

export const worldSlice = createSlice({
  name: 'world',
  initialState,
  reducers: {
    setWorldsList(state, action) {
      state.worlds = action.payload ?? [];
    },
    setSelectedWorldIndex(state, action) {
      state.selectedWorldIndex = action.payload;
      const i = action.payload;
      state.selectedWorld = (state.worlds[i] != null) ? { Name: state.worlds[i].name } : null;
    },
    setWorld(state, action) {
      state.world = action.payload;
    },
  },
});

export const { setWorldsList, setSelectedWorldIndex, setWorld } = worldSlice.actions;

export default worldSlice.reducer;
