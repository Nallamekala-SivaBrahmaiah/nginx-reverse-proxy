import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
  },
  reducers: {
    setCartItems: (state, action) => {
      state.items = action.payload;
    },
    clearCartLocal: (state) => {
      state.items = [];
    },
  },
});

export const { setCartItems, clearCartLocal } = cartSlice.actions;
export default cartSlice.reducer;
