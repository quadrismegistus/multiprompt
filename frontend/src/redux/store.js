import { createStore, applyMiddleware } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './reducers';
import { thunk } from 'redux-thunk';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['agents', 'config'], // Ensure both agents and config are persisted
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(persistedReducer, applyMiddleware(thunk));
const persistor = persistStore(store);

export { store, persistor };