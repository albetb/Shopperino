import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  city: null,
};

export const citySlice = createSlice({
  name: 'city',
  initialState,
  reducers: {
    setCity(state, action) {
      state.city = action.payload;
    },
  },
});

export const { setCity } = citySlice.actions;
export default citySlice.reducer;
