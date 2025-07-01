# 🌟 Fitly - Your Flexible Wellness Companion

A desktop wellness application designed for inconsistently active users who want to improve their health without rigid programs. Built with Electron, Firebase, and a warm, non-judgmental approach to fitness and nutrition tracking.

## ✨ Features

### Current Implementation (Core Functionality - Early Submission)
- ✅ **User Onboarding**: Comprehensive form-based profile setup
- ✅ **Dashboard**: Clean, friendly interface with daily stats
- ✅ **Meal Logging**: Text-based meal entry with nutrition analysis
- ✅ **Static Nutrition Database**: 50+ common foods with macro information
- ✅ **Activity Tracking**: Simple checkboxes for daily activities
- ✅ **Goal Calculation**: Automatic calorie and protein goals based on user profile
- ✅ **Responsive Design**: Works on various screen sizes
- ✅ **Firebase Integration**: User profiles and data storage (with mock data for development)

### Planned Features (Post-Core)
- 🔄 **Voice Logging**: Speech-to-text meal entry using OpenAI Whisper
- 🔄 **Photo Meal Logging**: Upload meal photos for AI analysis
- 🔄 **Weight Tracking**: Progress tracking with trend analysis
- 🔄 **AI Enhancement**: LangGraph integration for intelligent meal analysis
- 🔄 **Workflow Automation**: n8n integration for reminders and insights
- 🔄 **Conversational Onboarding**: AI-powered friendly setup chat

## 🛠️ Tech Stack

### Core Technologies
- **Electron**: Cross-platform desktop application framework
- **Firebase**: Authentication, Firestore database, and storage
- **JavaScript/HTML/CSS**: Frontend development
- **Static Nutrition Database**: Comprehensive food macro information

### Planned AI Integrations
- **LangGraph**: AI workflow orchestration for meal analysis and insights
- **n8n**: Automation workflows for reminders and data processing
- **OpenAI Whisper**: Speech-to-text for voice logging
- **OpenAI GPT**: Intelligent meal analysis and conversational features

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

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

3. Run the application:
   ```bash
   npm start
   ```

### Firebase Setup (Optional)
The app currently works with mock data for development. To enable full Firebase functionality:

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Anonymous sign-in)
3. Create a Firestore database
4. Enable Storage
5. Update `src/renderer/firebase-config.js` with your Firebase configuration
6. Update security rules as documented in the firebase-config.js file

## 📱 Usage

### First Time Setup
1. Launch the application
2. Complete the onboarding form with your personal information
3. Set your primary wellness goal (lose fat, build muscle, maintain, etc.)
4. The app will calculate personalized calorie and protein targets

### Daily Use
1. **Log Meals**: Click "Log Meal" to add what you've eaten
2. **Track Activity**: Check off workouts and walks
3. **View Progress**: Monitor daily nutrition intake and goals
4. **Flexible Tracking**: No pressure - log what you can, when you can

## 🎯 Philosophy

Fitly is built on the principle that **perfect is the enemy of good**. Rather than demanding rigid adherence to complex programs, Fitly:

- 🤗 **Meets you where you are**: No judgment for inconsistent tracking
- 🌱 **Encourages small wins**: Every logged meal and activity counts
- 🔄 **Adapts to your lifestyle**: Designed for people who go through active and less active phases
- 💪 **Focuses on protein**: Emphasizes protein intake for body composition goals
- 📊 **Shows trends, not perfection**: Progress over time, not daily perfectionism

## 🔧 Development

### Project Structure
```
src/
├── main.js                 # Electron main process
├── renderer/
│   ├── index.html          # Main UI
│   ├── style.css           # Warm, friendly styling
│   ├── app.js              # Application logic
│   ├── firebase-config.js  # Firebase integration
│   └── nutrition-data.js   # Static nutrition database
└── assets/                 # Images and icons
```

### Development Commands
- `npm start`: Run the application
- `npm run dev`: Run with DevTools open
- `npm run build`: Build for production (coming soon)

### Future AI Integration Points
The codebase is structured to easily integrate AI capabilities:
- **Meal Analysis**: `meals.handleMealSubmit()` ready for AI enhancement
- **Conversational UI**: Modal system prepared for chat interfaces
- **Background Processing**: Event system ready for automated workflows

## 🌈 Design Principles

### User Experience
- **Warm and Friendly**: Soft gradients, encouraging language, positive reinforcement
- **Accessible**: High contrast mode support, keyboard navigation, screen reader friendly
- **Non-Intimidating**: Simple forms, clear labels, helpful placeholders
- **Consistent**: Unified color scheme and typography throughout

### Technical Approach
- **Thorough Logging**: Comprehensive console logging for easy debugging
- **Graceful Degradation**: Works with or without Firebase connection
- **Error Handling**: Robust error handling with user-friendly messages
- **Performance**: Efficient DOM updates and minimal resource usage

## 🚧 Current Status

**✅ Core Functionality Complete** - Ready for early submission (Tuesday 8 PM Central)

The application successfully demonstrates:
- Complete user onboarding flow
- Functional dashboard with real nutrition calculations
- Meal logging with database lookup
- Activity tracking
- Firebase integration (with mock data fallback)
- Responsive, accessible design

## 🔮 Next Steps (Post-Core)

1. **Firebase Configuration**: Complete Firebase setup with real data persistence
2. **Voice Integration**: Implement OpenAI Whisper for speech-to-text
3. **Photo Analysis**: Add meal photo upload and AI analysis
4. **LangGraph Integration**: Enhanced meal analysis and user insights
5. **n8n Workflows**: Automated reminders and data processing
6. **Weight Tracking**: Comprehensive weight and trend analysis
7. **Enhanced UI**: Additional polish and micro-interactions

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

Built as part of the FlowGenius desktop application development project, focusing on AI-first methodologies and solving personal productivity challenges.

---

**Remember**: This isn't about perfect tracking - it's about building healthy habits that work with your real life. Every small step counts! 🌟