// OpenAI configuration for Fitly AI features
// This handles the OpenAI API integration for conversational onboarding and meal analysis
// 🔐 SECURE VERSION - API key stored safely in main process, communication via IPC

// Use ipcRenderer from window (set by firebase-config.js)

// OpenAI API helper functions - all secure via IPC
window.openaiAPI = {
    // Check if OpenAI is configured (checks main process)
    isConfigured: async () => {
        if (!window.ipcRenderer) {
            return false;
        }
        try {
            return await window.ipcRenderer.invoke('openai-is-configured');
        } catch (error) {
            console.error('❌ Error checking OpenAI configuration:', error);
            return false;
        }
    },
    
    // Analyze meal description for nutrition (secure via main process)
    analyzeMeal: async (mealDescription) => {
        if (!window.ipcRenderer) {
            return null;
        }
        try {
            console.log('🤖 Requesting meal analysis via secure IPC...');
            return await window.ipcRenderer.invoke('openai-analyze-meal', mealDescription);
        } catch (error) {
            console.error('❌ Error analyzing meal via IPC:', error);
            return null;
        }
    },
    
    // Conversational onboarding chat (secure via main process)
    onboardingChat: async (userMessage, conversationHistory = []) => {
        if (!window.ipcRenderer) {
            return {
                message: "I'm having trouble connecting right now. Would you like to try the quick form instead?",
                error: true
            };
        }
        try {
            console.log('🤖 Requesting onboarding chat via secure IPC...');
            return await window.ipcRenderer.invoke('openai-onboarding-chat', userMessage, conversationHistory);
        } catch (error) {
            console.error('❌ Error in onboarding chat via IPC:', error);
            return {
                message: "I'm having trouble connecting right now. Would you like to try the quick form instead?",
                error: true
            };
        }
    },

    // Comprehensive AI assistant chat (secure via main process)
    comprehensiveChat: async (userMessage, conversationHistory = [], userProfile = null, recentData = null) => {
        if (!window.ipcRenderer) {
            return {
                message: "I'm having trouble connecting right now. Please try again in a moment.",
                error: true
            };
        }
        try {
            console.log('🤖 Requesting comprehensive chat via secure IPC...');
            return await window.ipcRenderer.invoke('openai-comprehensive-chat', userMessage, conversationHistory, userProfile, recentData);
        } catch (error) {
            console.error('❌ Error in comprehensive chat via IPC:', error);
            return {
                message: "I'm having trouble connecting right now. Please try again in a moment.",
                error: true
            };
        }
    }
};

console.log('🔐 Secure OpenAI configuration loaded (IPC-based)');

/*
🔐 SECURE OPENAI SETUP INSTRUCTIONS:

OPTION 1 - Environment Variable (Most Secure):
1. Go to https://platform.openai.com/
2. Sign up or log in to your account  
3. Go to API Keys section
4. Create a new API key
5. Set environment variable:
   Windows: setx OPENAI_API_KEY "your-api-key-here"
   Mac/Linux: export OPENAI_API_KEY="your-api-key-here"
6. Restart the app to load the environment variable

OPTION 2 - Local File (Development):
1. Get your API key from OpenAI (steps 1-4 above)
2. Create file: src/openai-key.local.txt
3. Put your API key in that file (one line, no extra text)
4. ⚠️ Make sure this file is in .gitignore (never commit API keys!)

Security Features:
✅ API key never stored in renderer process
✅ API key never visible in DevTools
✅ All API calls made securely from main process
✅ IPC communication between renderer and main
✅ Multiple secure storage options
✅ Automatic fallback if key not found

Cost estimates:
- Onboarding chat: ~$0.002-0.005 per conversation
- Meal analysis: ~$0.001-0.003 per meal
- Very affordable for personal use!

The app will automatically detect and use your API key once configured.
No code changes needed - just set up your key using one of the options above.
*/ 