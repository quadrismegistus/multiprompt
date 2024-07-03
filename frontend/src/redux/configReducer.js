const initialState = {
  includeRepoAnalysis: true,
  summaryModel: false,
  summaryModelValue: '',
  openaiApiKey: '',
  claudeApiKey: '',
  referenceCodePrompt: '',
  userPrompt: '',
  isDarkMode: false,
  savedGlobalConfigurations: {},
  conversationHistory: [],
  useFileInput: false,
};

const configReducer = (state = initialState, action) => {
  switch(action.type) {
    case 'UPDATE_CONFIG':
      return { ...state, ...action.payload };
    case 'RESET_CONFIG':
      return initialState;
    case 'UPDATE_REFERENCE_CODE_PROMPT':
      return { ...state, referenceCodePrompt: action.payload };
    case 'UPDATE_USER_PROMPT':
      return { ...state, userPrompt: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, isDarkMode: !state.isDarkMode };
    case 'SAVE_CONFIGURATION':
      return {
        ...state,
        savedGlobalConfigurations: {
          ...state.savedGlobalConfigurations,
          [action.payload.name]: action.payload.configuration
        }
      };
    case 'LOAD_CONFIGURATION':
      return {
        ...state,
        ...state.savedGlobalConfigurations[action.payload.name]
      };
    case 'ADD_CONVERSATION_HISTORY':
      if (!Array.isArray(state.conversationHistory)) {
        state.conversationHistory = [];
      }
      return {
        ...state,
        conversationHistory: [...state.conversationHistory, action.payload]
      };
    case 'SHOW_MODAL':
      return { ...state, activeModal: action.payload };

    case 'HIDE_MODAL':
      return { ...state, activeModal: null };

    case 'TOGGLE_THEME':
      return { ...state, isDarkMode: !state.isDarkMode };
    case 'UPDATE_GITHUB_URL':  // Add this case for updating GitHub URL
      return {
        ...state,
        githubUrl: action.payload,
      };
    default:
      return state;
  }
};

export default configReducer;
