import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import socketReducer from './slices/socketSlice';
import serversReducer from './slices/serversSlice';
import channelsReducer from './slices/channelsSlice';
import messagesReducer from './slices/messagesSlice';
import usersReducer from './slices/usersSlice';
import uiReducer from './slices/uiSlice';
import groupsReducer from './slices/groupsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    socket: socketReducer,
    servers: serversReducer,
    channels: channelsReducer,
    messages: messagesReducer,
    users: usersReducer,
    ui: uiReducer,
    groups: groupsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/setSocket'],
        ignoredPaths: ['socket.socket']
      }
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;