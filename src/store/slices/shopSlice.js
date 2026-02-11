import { createSlice } from '@reduxjs/toolkit';
import Shop from '../../lib/shop';
import { createPrng } from '../../lib/prng';
import * as db from '../../lib/storage';
import { serialize } from '../../lib/utils';

const initialState = {
  shop: null,
  shopGenerated: false,
};

export const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    setShop: {
      reducer(state, action) {
        db.setShop(action.payload);
        state.shop = action.payload;
      },
      prepare(shopInstance) {
        return { payload: shopInstance ? serialize(shopInstance) : null };
      },
    },

    setShopGenerated(state, action) {
      state.shopGenerated = action.payload;
    },

    updateShop(state, action) {
      const [method, ...args] = action.payload;
      if (!state.shop) return;
      const s = new Shop().load(state.shop);
      s[method](...args);
      db.setShop(s);
      state.shop = serialize(s);
    },

    onCreateShop(state) {
      if (!state.shop) return;
      const s = new Shop().load(state.shop);
      s.template();
      const seed = (Math.random() * 0x100000000) >>> 0;
      s.Seed = seed;
      s.generateInventory(createPrng(seed));
      db.setShop(s);
      state.shop = serialize(s);

      const w = db.getWorld(db.getSelectedWorld().Id);
      state.shopGenerated = w.Cities.some(c =>
        db.getCity(c.Id).Shops.some(s2 =>
          (db.getShop(s2.Id).getInventory() || []).length > 0
        )
      );
    },
  },
});

export const {
  setShop,
  setShopGenerated,
  updateShop,
  onCreateShop
} = shopSlice.actions;

export default shopSlice.reducer;
