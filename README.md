# 🌟 Fitly - AI-Powered Wellness Companion

A sophisticated desktop wellness application that leverages advanced AI workflows to provide personalized nutrition tracking, intelligent meal analysis, and adaptive coaching. Built with Electron, Firebase, and LangGraph for state-of-the-art conversational AI experiences.

## ✨ Current Features

### 🤖 Advanced AI Integration
- ✅ **LangGraph Workflows**: 4 sophisticated AI workflows with state management
- ✅ **Conversational Onboarding**: Natural language profile setup with memory persistence
- ✅ **Intelligent Meal Analysis**: Multi-step nutrition analysis with confidence scoring
- ✅ **Voice Processing**: Speech-to-text with intelligent categorization and data extraction
- ✅ **Adaptive Coaching**: Personalized insights and motivation based on user behavior
- ✅ **Session Management**: Stateful conversations that remember context across interactions

### 🎯 Core Functionality
- ✅ **Smart Dashboard**: Real-time nutrition tracking with AI-generated insights
- ✅ **Natural Language Meal Logging**: "I had penne vodka with chicken" → Full nutrition breakdown
- ✅ **Voice Logging**: Speak your meals and activities for automatic categorization
- ✅ **Activity Tracking**: Intelligent exercise logging with personalized feedback
- ✅ **Goal Calculation**: Dynamic calorie and macro targets based on AI analysis
- ✅ **Progress Tracking**: Trend analysis with behavioral insights
- ✅ **Firebase Integration**: Real-time data synchronization and user profiles

### 🧠 AI Workflow Architecture
- **Onboarding Workflow**: 7-state conversational setup (greeting → profile completion)
- **Meal Analysis Workflow**: 4-state nutrition analysis (parse → analyze → validate → finalize)
- **Speech Processing Workflow**: 4-state voice handling (intent → extract → validate → save)
- **Coaching Workflow**: 5-state personalized guidance (analyze → insights → motivate → suggest → finalize)

## 🛠️ Tech Stack

### Core Technologies
- **Electron**: Cross-platform desktop application framework
- **Firebase**: Authentication, Firestore database, and real-time storage
- **LangGraph**: Advanced AI workflow orchestration and state management
- **OpenAI GPT-3.5**: Large language model for natural language processing
- **Web Speech API**: Browser-native speech recognition

### AI Architecture
- **LangGraph Manager**: Central orchestrator for all AI workflows
- **Session Management**: Persistent conversation states with cleanup
- **Intelligent Fallbacks**: Graceful degradation when AI services are unavailable
- **Firebase Tools Integration**: AI workflows directly interact with database
- **Enhanced Error Recovery**: Automatic retry mechanisms and user-friendly error handling

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/fitly.git
   cd fitly
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env file
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. Configure Firebase:
   - Copy `src/firebase-config.template.json` to `src/renderer/firebase-config.js`
   - Update with your Firebase project configuration

5. Run the application:
   ```bash
   npm start
   ```

## 📱 Usage Guide

### 🎤 Conversational Onboarding
1. Launch the application
2. Engage in natural conversation: "Hi, I'm Sarah and I want to lose weight"
3. The AI remembers your responses and guides you through profile completion
4. No rigid forms - just natural conversation that adapts to your responses

### 🍽️ Intelligent Meal Logging
- **Text Input**: "I had a bowl of penne vodka with chicken for lunch"
- **Voice Input**: Click microphone and speak naturally
- **AI Analysis**: Automatic portion estimation, nutrition breakdown, and personalized insights
- **Smart Clarification**: AI asks follow-up questions for ambiguous descriptions

### 🏃 Activity Tracking
- **Natural Language**: "I went on a half mile sprint"
- **Voice Logging**: Speak your workouts for automatic categorization
- **Intelligent Recognition**: AI determines exercise type, duration, and intensity
- **Progress Integration**: Activities automatically factor into daily goals

### 💬 AI Coaching
- **Daily Insights**: Personalized analysis of your nutrition and activity patterns
- **Motivational Messages**: Context-aware encouragement based on your progress
- **Actionable Suggestions**: Specific recommendations tailored to your goals
- **Behavioral Analysis**: AI identifies trends and provides strategic guidance

## 🎯 AI Workflow Deep Dive

### Onboarding Workflow States
```
greeting → collect_basic_info → collect_goals → 
collect_activity → collect_preferences → 
review_and_confirm → save_profile
```
- **Natural Extraction**: Pulls information from casual conversation
- **Context Memory**: Remembers previous answers throughout the flow
- **Validation**: Confirms understanding before proceeding
- **Intelligent Routing**: Adapts questions based on what's already known

### Meal Analysis Workflow
```
parse_meal → analyze_nutrition → assess_confidence → 
[generate_clarification OR finalize_analysis]
```
- **Component Parsing**: Identifies individual food items and cooking methods
- **Nutrition Analysis**: Calculates macros considering preparation and portions
- **Confidence Scoring**: Determines if clarification is needed
- **Personalized Suggestions**: Recommendations based on user goals

### Speech Processing Workflow
```
detect_intent → extract_data → assess_completeness → 
[generate_clarification OR finalize_data]
```
- **Intent Classification**: Determines if logging food, exercise, or weight
- **Data Extraction**: Pulls structured information from natural speech
- **Completeness Validation**: Identifies missing critical information
- **Firebase Integration**: Automatically saves categorized data

## 🔧 Development

### Project Structure
```
src/
├── main.js                           # Electron main process with LangGraph integration
├── langgraph/
│   ├── langgraph-manager.js          # Central AI workflow orchestrator
│   ├── workflows/
│   │   ├── onboarding-workflow.js    # Conversational profile setup
│   │   ├── meal-analysis-workflow.js # Advanced nutrition analysis
│   │   ├── speech-workflow.js        # Voice processing pipeline
│   │   └── coaching-workflow.js      # Personalized guidance system
│   └── tools/
│       └── firebase-tools.js         # Database integration for AI workflows
├── renderer/
│   ├── index.html                    # Enhanced UI with voice controls
│   ├── style.css                     # Modern, accessible design
│   ├── app.js                        # Main application logic
│   ├── langgraph-client.js          # AI workflow client interface
│   ├── firebase-config.js           # Firebase configuration
│   └── nutrition-data.js            # Fallback nutrition database
├── services/
│   └── speech-service.js             # Browser speech recognition service
└── utils/
    └── langgraph-utils.js           # Utility functions for AI workflows
```

### Development Commands
- `npm start`: Run the application with full AI features
- `npm test`: Run LangGraph workflow tests
- `node test-langgraph.js`: Test AI functionality

### Testing AI Features
```bash
# Test LangGraph initialization
node test-langgraph.js

# The app includes comprehensive logging for debugging AI workflows
# Check console for detailed AI processing information
```

## 🌈 Design Philosophy

### AI-First Approach
- **Natural Interaction**: Conversational interfaces over traditional forms
- **Intelligent Adaptation**: AI learns and adapts to user preferences
- **Context Awareness**: Workflows remember and build upon previous interactions
- **Graceful Degradation**: Full functionality even when AI services are limited

### User Experience Principles
- **Effortless Tracking**: Speak naturally, AI handles the complexity
- **Personalized Insights**: Every interaction becomes more tailored
- **Non-Judgmental**: AI provides encouragement, not criticism
- **Flexible Engagement**: Works with your lifestyle, not against it

## 🚀 Advanced Features

### Session Management
- **Persistent Conversations**: AI remembers context across app sessions
- **User-Specific Memory**: Each user's AI interactions are personalized
- **Automatic Cleanup**: Old sessions cleaned up to prevent memory leaks
- **Cross-Workflow State**: Information flows intelligently between different AI features

### Voice Integration
- **Native Speech Recognition**: Uses browser's built-in Web Speech API
- **Intelligent Processing**: AI determines intent and extracts structured data
- **Error Handling**: Clear feedback when speech recognition fails
- **Privacy-First**: All speech processing happens locally

### Firebase AI Integration
- **Direct Workflow Connection**: AI can read and write user data seamlessly
- **Real-Time Updates**: Changes sync immediately across all interfaces
- **Intelligent Querying**: AI can analyze user patterns and history
- **Secure Processing**: All AI operations maintain data privacy

## 🔬 Technical Innovations

### LangGraph State Management
```javascript
// Complex multi-step workflows with intelligent routing
const workflow = new StateGraph({
    channels: {
        messages: { value: (x, y) => x.concat(y) },
        userData: { value: (x, y) => ({ ...x, ...y }) },
        currentStep: { value: (x, y) => y },
        isComplete: { value: (x, y) => y }
    }
});
```

### Intelligent Fallbacks
```javascript
// Graceful degradation when AI services are unavailable
async onboardingChat(message, sessionId) {
    if (!this.isReady) {
        return await window.openaiAPI.onboardingChat(message, []);
    }
    return await this.langGraphClient.onboardingChat(message, sessionId);
}
```

### Enhanced Error Recovery
- **Automatic Retry**: Failed AI requests automatically retry with backoff
- **User Feedback**: Clear messaging when AI features are temporarily unavailable
- **Fallback Methods**: Traditional input methods available as backup
- **State Preservation**: User data never lost during AI processing errors

## 📊 Current Status

**✅ Production Ready** - Full AI-powered wellness application

The application successfully provides:
- Complete conversational AI onboarding experience
- Advanced meal analysis with natural language processing
- Voice-controlled logging with intelligent categorization
- Personalized coaching with behavioral insights
- Real-time Firebase integration with AI workflows
- Professional-grade error handling and fallback systems

## 🔮 Future Enhancements

1. **Photo Meal Analysis**: Visual food recognition and analysis
2. **Workout Planning**: AI-generated exercise routines
3. **Habit Formation**: Behavioral pattern analysis and suggestions
4. **Social Features**: Community insights while maintaining privacy
5. **Wearable Integration**: Connect with fitness trackers and smartwatches
6. **Advanced Analytics**: Deeper insights into health patterns and trends

## 📋 Setup Documentation

Comprehensive setup guides available:
- `FIREBASE_SETUP.md`: Complete Firebase configuration
- `LANGGRAPH_SETUP.md`: Detailed AI architecture documentation
- `OPENAI_SETUP.md`: OpenAI API integration guide

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

Built as a showcase of modern AI application development, demonstrating:
- Advanced LangGraph workflow orchestration
- Natural language processing for health applications
- Seamless AI-human interaction design
- Enterprise-grade error handling and reliability

---

**Experience the future of wellness tracking**: Where AI understands you, adapts to you, and grows with you. 🌟