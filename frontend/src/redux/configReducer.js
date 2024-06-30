const initialState = {
  includeRepoAnalysis: true,
  summaryModel: false,
  summaryModelValue: '',
  openaiApiKey: '',
  claudeApiKey: '',
  referenceCodePrompt: '',
  userPrompt: ''
};

const configReducer = (state = initialState, action) => {
  switch(action.type) {
    case 'UPDATE_CONFIG':
      return { ...state, ...action.payload };
    case 'RESET_CONFIG':
      return initialState;
    case 'UPDATE_REFERENCE_CODE_PROMPT':
      return { ...state, referenceCodePrompt: action.payload };
    case 'UPDATE_USER_PROMPT': // Handle userPrompt update
      return { ...state, userPrompt: action.payload };
    default:
      return state;
  }
};

export default configReducer;