import { combineReducers } from 'redux';
import agentReducer from './agentReducer';
import configReducer from './configReducer';

const rootReducer = combineReducers({
  agents: agentReducer,
  config: configReducer,
});

export default rootReducer;
