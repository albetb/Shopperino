import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  shop: null,
  shopGenerated: false,
};

export const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    setShop(state, action) {
      state.shop = action.payload;
    },
    setShopGenerated(state, action) {
      state.shopGenerated = action.payload;
    },
  },
});

export const { setShop, setShopGenerated } = shopSlice.actions;

export default shopSlice.reducer;
