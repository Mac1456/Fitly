# 🤖 LangGraph Implementation in Fitly

## Overview

Fitly now includes advanced LangGraph workflows that enhance the AI capabilities with structured, memory-aware conversations and sophisticated data processing. This implementation provides:

- **Enhanced Onboarding**: Structured conversational onboarding with context awareness
- **Advanced Meal Analysis**: Multi-step meal analysis with confidence scoring and clarification
- **Speech Processing**: Voice-to-text with intent detection and structured data extraction
- **Adaptive Coaching**: Personalized wellness coaching based on user behavior and goals

## 🗂️ Architecture

```
src/
├── langgraph/
│   ├── langgraph-manager.js          # Main LangGraph orchestrator
│   ├── workflows/
│   │   ├── onboarding-workflow.js    # Conversational onboarding
│   │   ├── meal-analysis-workflow.js # Enhanced meal analysis
│   │   ├── speech-workflow.js        # Speech processing
│   │   └── coaching-workflow.js      # Adaptive coaching
│   ├── tools/
│   │   └── firebase-tools.js         # Firebase integration tools
├── services/
│   └── speech-service.js             # Browser speech recognition
├── utils/
│   └── langgraph-utils.js           # Utility functions
└── renderer/
    └── langgraph-client.js          # Client-side interface
```

## 🚀 Features

### 1. Enhanced Onboarding Workflow

**States**: greeting → collect_basic_info → collect_goals → collect_activity → collect_preferences → review_and_confirm → save_profile

**Features**:
- Natural conversation flow with memory
- Information extraction from casual responses
- Validation and confirmation steps
- Automatic profile saving to Firebase

**Usage**:
```javascript
// Client-side
const result = await langGraphClient.onboardingChat("Hi, I want to get started", sessionId);
```

### 2. Advanced Meal Analysis

**States**: parse_meal → analyze_nutrition → assess_confidence → generate_clarification/finalize_analysis

**Features**:
- Detailed meal component parsing
- Context-aware nutrition analysis
- Confidence scoring
- Clarification questions for low-confidence analyses
- Personalized suggestions based on goals

**Usage**:
```javascript
// Enhanced meal analysis
const result = await langGraphClient.analyzeMeal(
    "grilled chicken breast with quinoa",
    userProfile,
    recentMeals
);
```

### 3. Speech Processing Workflow

**States**: detect_intent → extract_data → assess_completeness → generate_clarification/finalize_data

**Features**:
- Intent detection (meal, activity, weight logging)
- Structured data extraction from speech
- Completeness validation
- Automatic Firebase storage

**Usage**:
```javascript
// Voice logging
const result = await langGraphClient.startVoiceLogging(userProfile);
```

### 4. Adaptive Coaching

**States**: analyze_context → generate_insights → provide_motivation → suggest_actions → finalize_coaching

**Features**:
- Behavioral pattern analysis
- Goal-specific insights
- Personalized motivation
- Actionable suggestions

**Usage**:
```javascript
// Get coaching
const coaching = await langGraphClient.getCoaching(
    "How am I doing this week?",
    userProfile,
    'weekly-summary'
);
```

## 🔧 Integration Points

### Main Process (main.js)
- LangGraph Manager initialization
- IPC handlers for workflow execution
- Firebase tools integration
- Fallback to original OpenAI methods

### Renderer Process
- LangGraph client for easy access
- Speech service integration
- Automatic session management
- Error handling with graceful fallbacks

## 📊 Session Management

```javascript
// Create session
const sessionId = await langGraphClient.createSession('onboarding', userId);

// Get session info
const session = await langGraphClient.getSession(sessionId);

// Cleanup old sessions
await langGraphClient.cleanupSessions(24); // 24 hours
```

## 🎤 Speech Features

### Browser Speech Recognition
- Native Web Speech API integration
- Microphone permission handling
- Error handling and user feedback
- Confidence scoring

### Voice Logging Process
1. User clicks voice button
2. Microphone permission requested
3. Speech recognition starts
4. Transcript processed by LangGraph
5. Intent detected and data extracted
6. Results automatically saved to Firebase

## 🔒 Security & Privacy

- API keys remain in main process only
- All AI operations use secure IPC
- Speech processing happens locally
- User data encrypted in Firebase
- Session cleanup prevents memory leaks

## 📈 Error Handling & Fallbacks

The implementation includes comprehensive fallbacks:

1. **LangGraph unavailable** → Falls back to original OpenAI methods
2. **Workflow errors** → Graceful error messages with retry options
3. **Speech recognition fails** → Clear error messages and manual input options
4. **Network issues** → Cached responses and offline capability

## 🧪 Testing

Run the test suite:
```bash
npm test
# or
node test-langgraph.js
```

Test coverage includes:
- LangGraph Manager initialization
- Session management
- Workflow structure validation
- Utility functions
- Firebase integration
- Error handling

## 🛠️ Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=your-openai-api-key

# Optional LangGraph settings
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-key
LANGCHAIN_PROJECT=fitly-dev
```

### Speech Configuration
Speech recognition is automatically configured for:
- Language: English (US)
- Continuous: false (single utterance)
- Interim results: false (final only)

## 🔄 Workflow Customization

Each workflow can be customized by modifying the corresponding file in `src/langgraph/workflows/`. The workflows use LangGraph's StateGraph for:

- **State management**: Persistent conversation state
- **Conditional routing**: Different paths based on context
- **Error handling**: Graceful failure recovery
- **Memory**: Context-aware conversations

## 📱 Usage Examples

### Enhanced Onboarding
```javascript
// Start conversational onboarding
const sessionId = await langGraphClient.createSession('onboarding', userId);
const response = await langGraphClient.onboardingChat("I want to lose weight", sessionId);

if (response.isComplete) {
    // Profile saved automatically
    console.log('Onboarding complete!');
} else {
    // Continue conversation
    displayMessage(response.message);
}
```

### Voice Meal Logging
```javascript
// Start voice logging
try {
    const result = await langGraphClient.startVoiceLogging(userProfile);
    
    if (result.processingResult.isComplete) {
        // Meal automatically logged
        updateUI(result.processingResult.extractedData);
    } else {
        // Request clarification
        askFollowUp(result.processingResult.clarificationMessage);
    }
} catch (error) {
    showError('Voice logging failed: ' + error.message);
}
```

### Weekly Coaching
```javascript
// Get weekly insights
const coaching = await langGraphClient.getCoaching(
    '',
    userProfile,
    'weekly-summary'
);

displayInsights(coaching.insights);
displaySuggestions(coaching.suggestions);
displayMotivation(coaching.motivationalMessage);
```

## 🎯 Benefits

1. **Better User Experience**: Natural conversations instead of forms
2. **Higher Accuracy**: Multi-step validation and clarification
3. **Personalization**: Context-aware responses based on user data
4. **Accessibility**: Voice input for hands-free logging
5. **Engagement**: Adaptive coaching keeps users motivated
6. **Reliability**: Graceful fallbacks ensure the app always works

## 🔮 Future Enhancements

- **Image Analysis**: Meal photo processing workflow
- **Habit Tracking**: Behavioral pattern detection
- **Integration APIs**: Connect with fitness trackers
- **Advanced NLP**: Better food recognition and extraction
- **Multi-language**: Support for additional languages 