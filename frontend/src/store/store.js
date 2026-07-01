import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './sessionSlice';

const store = configureStore({
  reducer: {
    sessions: sessionReducer,
  },
});

export default store;
