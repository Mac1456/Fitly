const { app, BrowserWindow, ipcMain, dialog, systemPreferences } = require('electron');
const path = require('path');
const https = require('https');
const fs = require('fs');

// Load environment variables from .env file
require('dotenv').config();

// Import LangGraph components
const { LangGraphManager } = require('./langgraph/langgraph-manager');
const { FirebaseTools } = require('./langgraph/tools/firebase-tools');

let mainWindow;

function createWindow() {
  console.log('Creating main application window...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false, // Disable web security to allow speech API
      allowRunningInsecureContent: true, // Allow speech recognition
      experimentalFeatures: true // Enable experimental web features
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // We'll add an icon later
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Handle permission requests for speech recognition
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log('🔐 Permission request:', permission);
    
    // Allow microphone access for speech recognition
    if (permission === 'microphone' || permission === 'media') {
      console.log('✅ Granting microphone permission for speech recognition');
      callback(true);
    } else {
      console.log('❌ Denying permission:', permission);
      callback(false);
    }
  });

  // Set permission check handler
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    console.log('🔍 Permission check:', permission, 'from:', requestingOrigin);
    
    // Allow microphone access
    if (permission === 'microphone' || permission === 'media') {
      console.log('✅ Allowing microphone permission');
      return true;
    }
    
    return false;
  });

  // Load the main UI
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.log('Main window ready, showing application...');
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    console.log('Development mode: Opening DevTools...');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
  });
}

// Request microphone permission (macOS)
async function requestMicrophonePermission() {
  if (process.platform === 'darwin') {
    try {
      const microphoneStatus = systemPreferences.getMediaAccessStatus('microphone');
      console.log('🎤 Current microphone status:', microphoneStatus);
      
      if (microphoneStatus !== 'granted') {
        console.log('🎤 Requesting microphone permission...');
        const granted = await systemPreferences.askForMediaAccess('microphone');
        console.log('🎤 Microphone permission granted:', granted);
        return granted;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error requesting microphone permission:', error);
      return false;
    }
  }
  
  // On Windows/Linux, assume permission is available
  console.log('🎤 Platform:', process.platform, '- assuming microphone access available');
  return true;
}

// App event handlers
app.whenReady().then(async () => {
  console.log('Electron app ready, creating window...');
  
  // Request microphone permission before creating window
  await requestMicrophonePermission();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('No windows open, creating new window...');
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Secure OpenAI API configuration
let OPENAI_API_KEY = null;

// LangGraph Manager
let langGraphManager = null;
let firebaseTools = null;

// Try to load API key from multiple sources (in order of preference)
function loadOpenAIKey() {
  // 1. Environment variable or .env file (dotenv automatically loads .env into process.env)
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
    OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    console.log('🔐 OpenAI API key loaded from environment variable or .env file');
    return true;
  }
  
  // 2. Local config file (for development - fallback)
  try {
    const configPath = path.join(__dirname, 'openai-key.local.txt');
    if (fs.existsSync(configPath)) {
      const keyFromFile = fs.readFileSync(configPath, 'utf8').trim();
      if (keyFromFile && keyFromFile !== 'sk-replace-this-with-your-actual-openai-api-key') {
        OPENAI_API_KEY = keyFromFile;
        console.log('🔐 OpenAI API key loaded from local file');
        return true;
      }
    }
  } catch (error) {
    console.log('No local OpenAI key file found');
  }
  
  console.log('⚠️ No OpenAI API key found. AI features will be disabled.');
  console.log('💡 Add your key to .env file: OPENAI_API_KEY=your-key-here');
  return false;
}

// Load OpenAI API key from environment
loadOpenAIKey();

// Initialize LangGraph as soon as we have the OpenAI key
if (OPENAI_API_KEY) {
    console.log('🤖 OpenAI key available, initializing LangGraph early...');
    initializeLangGraph().catch(error => {
        console.error('❌ Early LangGraph initialization failed:', error);
    });
}

// Initialize LangGraph Manager
async function initializeLangGraph() {
    if (langGraphManager) {
        console.log('⚠️ LangGraph Manager already initialized');
        return;
    }
    
    console.log('🤖 Initializing LangGraph Manager...');
    
    try {
        console.log('🔍 Pre-initialization checks:');
        console.log('  - OPENAI_API_KEY available:', !!OPENAI_API_KEY);
        console.log('  - LangGraphManager class:', typeof LangGraphManager);
        console.log('  - FirebaseTools class:', typeof FirebaseTools);
        
        // Create Firebase tools instance
        console.log('🔍 Creating FirebaseTools instance...');
        const firebaseTools = new FirebaseTools();
        console.log('✅ FirebaseTools instance created');
        
        // Create LangGraph manager with OpenAI key and Firebase tools
        console.log('🔍 Creating LangGraphManager instance...');
        console.log('  - Using OpenAI key (first 10 chars):', OPENAI_API_KEY?.substring(0, 10) + '...');
        
        langGraphManager = new LangGraphManager();
        console.log('✅ LangGraphManager instance created');
        
        console.log('🔍 Setting up LangGraph workflows...');
        await langGraphManager.initialize(OPENAI_API_KEY, firebaseTools);
        console.log('✅ All workflows initialized');
        
        console.log('🤖 LangGraph Manager initialized successfully');
        console.log('🔍 Final LangGraph Manager state:');
        console.log('  - initialized:', langGraphManager.initialized);
        console.log('  - workflows:', Object.keys(langGraphManager.workflows || {}));
        console.log('  - llm configured:', !!langGraphManager.llm);
        
    } catch (error) {
        console.error('❌ Failed to initialize LangGraph Manager:', error);
        console.error('❌ Error stack:', error.stack);
        langGraphManager = null;
        throw error;
    }
}

// Update Firebase tools when config becomes available
function updateFirebaseTools(db, auth, storage) {
    if (firebaseTools) {
        firebaseTools.db = db;
        firebaseTools.auth = auth;
        firebaseTools.storage = storage;
        console.log('✅ Firebase tools updated for LangGraph');
    }
}

// Secure OpenAI API call function (runs in main process only)
async function makeOpenAIRequest(messages, options = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: options.model || 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: options.max_tokens || 150,
      temperature: options.temperature || 0.7,
      ...options
    });
    
    const requestOptions = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(response);
          } else {
            reject(new Error(`OpenAI API error: ${res.statusCode} - ${response.error?.message || 'Unknown error'}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse OpenAI response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`OpenAI request failed: ${error.message}`));
    });
    
    req.write(postData);
    req.end();
  });
}

// IPC handlers for renderer communication
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Secure OpenAI IPC handlers
ipcMain.handle('openai-is-configured', () => {
  return OPENAI_API_KEY !== null;
});

ipcMain.handle('openai-analyze-meal', async (event, mealDescription) => {
  if (!OPENAI_API_KEY) {
    console.log('⚠️ OpenAI not configured for meal analysis');
    return null;
  }
  
  const prompt = `Analyze this meal and provide nutritional information in JSON format:
  
Meal: "${mealDescription}"

Please provide estimated nutrition as JSON with these exact keys:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "sugar": number,
  "confidence": "high" | "medium" | "low"
}

Base your estimates on standard serving sizes and common preparations. Be realistic and conservative in estimates.`;
  
  try {
    console.log('🤖 Analyzing meal with OpenAI:', mealDescription);
    const response = await makeOpenAIRequest([
      { role: 'system', content: 'You are a nutrition expert. Provide accurate, conservative nutritional estimates.' },
      { role: 'user', content: prompt }
    ], {
      max_tokens: 200,
      temperature: 0.3
    });
    
    const content = response.choices[0].message.content;
    console.log('🤖 OpenAI meal analysis response received');
    
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const nutritionData = JSON.parse(jsonMatch[0]);
      return nutritionData;
    } else {
      console.error('❌ Could not parse nutrition JSON from OpenAI response');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error analyzing meal with OpenAI:', error);
    return null;
  }
});

ipcMain.handle('openai-comprehensive-chat', async (event, userMessage, conversationHistory = [], userProfile = null, recentData = null) => {
  const systemPrompt = `You are Fitly's AI wellness assistant. You help users log meals, activities, weight, and provide insights.

Your capabilities:
- Log meals with nutrition analysis
- Log workouts and activities
- Log weight updates
- Analyze progress and trends
- Provide personalized recommendations
- Answer wellness questions

User context:
${userProfile ? `Name: ${userProfile.userName}, Goal: ${userProfile.primaryGoal}, Activity Level: ${userProfile.activityLevel}` : 'Profile not available'}

Recent data:
${recentData ? `Today's calories: ${recentData.calories || 0}, Recent meals: ${recentData.recentMeals || 'None'}` : 'No recent data'}

When users want to log something, respond conversationally AND provide structured data using this format:
ACTION_LOG: {"type": "meal|activity|weight", "data": {...}}

For meals, include: {"description": "...", "nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}}
For activities, include: {"description": "...", "duration": 0, "type": "cardio|strength|other"}
For weight, include: {"weight": 0, "unit": "lbs|kg", "date": "today"}

Be conversational, encouraging, and helpful. Ask follow-up questions when needed.`;

  if (!OPENAI_API_KEY) {
    return {
      message: "I need an OpenAI API key to help you with comprehensive wellness assistance. Please configure your API key!",
      needsApiKey: true
    };
  }
  
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];
    
    console.log('🤖 Processing comprehensive chat with OpenAI');
    const response = await makeOpenAIRequest(messages, {
      max_tokens: 350,
      temperature: 0.8
    });
    
    const aiMessage = response.choices[0].message.content;
    
    // Check for action logs
    const actionMatch = aiMessage.match(/ACTION_LOG:\s*(\{[^}]*\})/);
    let actionData = null;
    let cleanMessage = aiMessage;
    
    if (actionMatch) {
      try {
        actionData = JSON.parse(actionMatch[1]);
        cleanMessage = aiMessage.replace(/ACTION_LOG:[^}]*\}/, '').trim();
      } catch (e) {
        console.error('Error parsing action data:', e);
      }
    }
    
    return {
      message: cleanMessage,
      actionData: actionData,
      complete: false
    };
    
  } catch (error) {
    console.error('❌ Error in comprehensive chat:', error);
    return {
      message: "I'm having trouble connecting right now. Please try again in a moment.",
      error: true
    };
  }
});

ipcMain.handle('openai-onboarding-chat', async (event, userMessage, conversationHistory = []) => {
  const systemPrompt = `You are Fitly's friendly wellness coach. You're helping a new user set up their profile through casual conversation.

Your personality:
- Warm, encouraging, and non-judgmental
- Supportive of inconsistent fitness habits
- Focus on sustainable, flexible approaches
- Use emojis occasionally but not excessively

You need to collect this information through natural conversation:
- Name
- Current weight and unit preference (lbs/kg)
- Height and unit preference (ft/cm)
- Age
- Gender
- Goal weight (optional)
- Activity level (sedentary, lightly active, moderately active, very active, inconsistent)
- Primary goal (lose fat, build muscle, maintain, general health, just tracking)

Keep responses conversational and ask only 1-2 questions at a time. Make the user feel comfortable about their fitness journey, especially if they mention being inconsistent.

When you have all the information, end with "ONBOARDING_COMPLETE" followed by a JSON object with all the collected data.`;

  if (!OPENAI_API_KEY) {
    return {
      message: "Hi there! 👋 I'm your Fitly wellness coach, but I need an OpenAI API key to have a real conversation with you. For now, you can use the quick form below to get started! Once you add your API key, I'll be able to chat with you in a more natural way.",
      needsApiKey: true
    };
  }
  
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];
    
    console.log('🤖 Processing onboarding chat with OpenAI');
    const response = await makeOpenAIRequest(messages, {
      max_tokens: 250,
      temperature: 0.8
    });
    
    const aiMessage = response.choices[0].message.content;
    
    // Check if onboarding is complete
    if (aiMessage.includes('ONBOARDING_COMPLETE')) {
      const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const profileData = JSON.parse(jsonMatch[0]);
          return {
            message: aiMessage.replace(/ONBOARDING_COMPLETE[\s\S]*/, '').trim(),
            complete: true,
            profileData: profileData
          };
        } catch (e) {
          console.error('Error parsing profile data:', e);
        }
      }
    }
    
    return {
      message: aiMessage,
      complete: false
    };
    
  } catch (error) {
    console.error('❌ Error in onboarding chat:', error);
    return {
      message: "I'm having trouble connecting right now. Would you like to try the quick form instead?",
      error: true
    };
  }
});

// Add secure Firebase configuration handling

// Secure Firebase configuration loader
function getFirebaseConfig() {
    // Option 1: Environment variables (most secure)
    if (process.env.FIREBASE_API_KEY) {
        return {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID
        };
    }
    
    // Option 2: Local config file (development)
    const configPath = path.join(__dirname, 'firebase-config.local.json');
    if (fs.existsSync(configPath)) {
        try {
            const configFile = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configFile);
        } catch (error) {
            console.error('Error reading firebase-config.local.json:', error);
        }
    }
    
    console.log('⚠️ No Firebase configuration found. App will run in development mode.');
    return null;
}

// IPC handler for secure Firebase config
ipcMain.handle('get-firebase-config', async () => {
    const config = getFirebaseConfig();
    
    // Initialize LangGraph when we have both OpenAI key and are setting up Firebase
    if (OPENAI_API_KEY && !langGraphManager) {
        await initializeLangGraph();
    }
    
    return config;
});

// LangGraph IPC Handlers
ipcMain.handle('langgraph-is-ready', () => {
    const isReady = langGraphManager && langGraphManager.initialized;
    console.log('🔍 IPC: langgraph-is-ready called');
    console.log('  - langGraphManager exists:', !!langGraphManager);
    console.log('  - langGraphManager.initialized:', langGraphManager?.initialized);
    console.log('  - returning:', isReady);
    return isReady;
});

ipcMain.handle('langgraph-create-session', (event, type, userId) => {
    if (!langGraphManager) {
        console.warn('⚠️ LangGraph Manager not initialized');
        return null;
    }
    
    try {
        const sessionId = langGraphManager.createSession(type, userId);
        console.log(`🗣️ Created LangGraph session: ${sessionId} (type: ${type})`);
        return sessionId;
    } catch (error) {
        console.error('❌ Error creating LangGraph session:', error);
        return null;
    }
});

ipcMain.handle('langgraph-execute-workflow', async (event, workflowName, input, sessionId, additionalContext) => {
    if (!langGraphManager) {
        throw new Error('LangGraph Manager not initialized');
    }
    
    try {
        console.log(`🔄 Executing LangGraph workflow: ${workflowName}`);
        const result = await langGraphManager.executeWorkflow(workflowName, input, sessionId, additionalContext);
        console.log(`✅ LangGraph workflow ${workflowName} completed`);
        return result;
    } catch (error) {
        console.error(`❌ LangGraph workflow ${workflowName} failed:`, error);
        throw error;
    }
});

ipcMain.handle('langgraph-get-session', (event, sessionId) => {
    if (!langGraphManager) {
        return null;
    }
    
    return langGraphManager.getSession(sessionId);
});

ipcMain.handle('langgraph-cleanup-sessions', (event, maxAgeHours) => {
    if (!langGraphManager) {
        return false;
    }
    
    try {
        langGraphManager.cleanupSessions(maxAgeHours);
        return true;
    } catch (error) {
        console.error('❌ Error cleaning up LangGraph sessions:', error);
        return false;
    }
});

ipcMain.handle('langgraph-get-stats', () => {
    if (!langGraphManager) {
        return null;
    }
    
    return langGraphManager.getSessionStats();
});

// Enhanced meal analysis using LangGraph
ipcMain.handle('langgraph-analyze-meal', async (event, mealDescription, userProfile, recentMeals) => {
    if (!langGraphManager) {
        // Fallback to original OpenAI meal analysis
        return await ipcMain.invoke('openai-analyze-meal', mealDescription);
    }
    
    try {
        const input = {
            description: mealDescription,
            userProfile: userProfile || {},
            recentMeals: recentMeals || [],
            goals: userProfile?.goals || {}
        };
        
        const result = await langGraphManager.executeWorkflow('meal-analysis', input);
        return result;
    } catch (error) {
        console.error('❌ LangGraph meal analysis failed, falling back to basic analysis:', error);
        // Fallback to original method
        return await ipcMain.invoke('openai-analyze-meal', mealDescription);
    }
});

// Enhanced onboarding using LangGraph with progress tracking
ipcMain.handle('langgraph-onboarding-chat', async (event, userMessage, conversationHistory, sessionId, progress) => {
    if (!langGraphManager) {
        // Fallback to original onboarding chat
        return await ipcMain.invoke('openai-onboarding-chat', userMessage, conversationHistory);
    }
    
    try {
        if (!sessionId) {
            sessionId = langGraphManager.createSession('onboarding');
        }
        
        // Use progress information to guide the conversation with better data preservation
        const existingData = progress?.collectedData || {};
        const input = {
            message: userMessage,
            existingData: existingData,
            step: progress?.step || 1,
            maxSteps: progress?.maxSteps || 7,
            forceStepByStep: true, // Ensure step-by-step progression
            currentStep: progress?.step || 1,
            preserveData: true // Flag to ensure data persistence
        };
        
        console.log('🔍 Enhanced onboarding input with preserved data:', {
            message: userMessage,
            existingDataKeys: Object.keys(existingData),
            existingData: existingData,
            step: input.step
        });
        
        console.log('🔍 Enhanced onboarding input:', input);
        
        const context = {
            sessionId,
            session: langGraphManager.getSession(sessionId),
            progress: progress
        };
        
        const result = await langGraphManager.executeWorkflow('onboarding', input, sessionId);
        
        // Only override completion if the AI workflow clearly made an error
        // Trust the AI workflow's completion determination unless there's missing critical data
        if (progress && result.isComplete && !result.profileData) {
            console.log('⚠️ AI workflow claimed completion but no profile data - overriding to continue');
            result.complete = false;
            result.isComplete = false;
        }
        
        console.log('🔍 Enhanced onboarding result:', result);
        
        return {
            ...result,
            sessionId
        };
    } catch (error) {
        console.error('❌ LangGraph onboarding failed, falling back to basic chat:', error);
        // Fallback to original method
        return await ipcMain.invoke('openai-onboarding-chat', userMessage, conversationHistory);
    }
});

// Speech processing workflow
ipcMain.handle('langgraph-process-speech', async (event, transcript, userProfile, sessionId) => {
    if (!langGraphManager) {
        throw new Error('LangGraph Manager not initialized');
    }
    
    try {
        const input = {
            transcript,
            userProfile: userProfile || {}
        };
        
        const context = {
            sessionId,
            session: langGraphManager.getSession(sessionId)
        };
        
        const result = await langGraphManager.executeWorkflow('speech-processing', input, sessionId);
        return result;
    } catch (error) {
        console.error('❌ Speech processing workflow failed:', error);
        throw error;
    }
});

// Coaching workflow
ipcMain.handle('langgraph-get-coaching', async (event, userMessage, userProfile, recentData, sessionId) => {
    if (!langGraphManager) {
        throw new Error('LangGraph Manager not initialized');
    }
    
    try {
        const input = {
            message: userMessage || '',
            userProfile: userProfile || {},
            goals: userProfile?.goals || {},
            type: 'general',
            recentActivity: recentData || {}
        };
        
        const context = {
            sessionId,
            session: langGraphManager.getSession(sessionId)
        };
        
        console.log('🎯 Coaching input:', input);
        const result = await langGraphManager.executeWorkflow('coaching', input, sessionId);
        console.log('🎯 Coaching result:', result);
        return result;
    } catch (error) {
        console.error('❌ Coaching workflow failed:', error);
        throw error;
    }
});

console.log('Fitly main process initialized with LangGraph support'); 