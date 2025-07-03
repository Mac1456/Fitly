// Fitly - Main Application Logic
console.log('🚀 Fitly app starting...');
console.log('🔍 Window object available:', typeof window !== 'undefined');
console.log('🔍 Document object available:', typeof document !== 'undefined');
console.log('🔍 Script loading timestamp:', new Date().toISOString());

// Add error handler to catch early errors
window.addEventListener('error', (event) => {
    console.error('❌ GLOBAL ERROR:', event.error);
    console.error('❌ ERROR MESSAGE:', event.message);
    console.error('❌ ERROR FILENAME:', event.filename);
    console.error('❌ ERROR LINE:', event.lineno);
});

// Check if required dependencies are available
console.log('🔍 Checking dependencies:');
console.log('  - firebase available:', typeof firebase !== 'undefined');
console.log('  - ipcRenderer available:', typeof window.ipcRenderer !== 'undefined');
console.log('  - require available:', typeof require !== 'undefined');
console.log('  - window.require available:', typeof window.require !== 'undefined');

// Application state
const appState = {
    currentUser: null,
    userProfile: null,
    todaysMeals: [],
    dailyNutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sugar: 0
    },
    currentScreen: 'onboarding',
    isLoading: false,
    onboardingMode: 'form', // 'chat' or 'form' - default to form since AI isn't configured
    conversationHistory: [],
    chatActive: false,
    langGraphReady: false, // Track LangGraph readiness
    currentOnboardingSession: null // Track current onboarding session
};

console.log('🔍 Initial app state:', appState);

// DOM elements
const elements = {
    // Screens
    onboardingScreen: document.getElementById('onboardingScreen'),
    aiAssistantScreen: document.getElementById('aiAssistantScreen'),
    dashboardScreen: document.getElementById('dashboardScreen'),
    
    // Authentication elements
    authSection: document.getElementById('authSection'),
    profileSetupSection: document.getElementById('profileSetupSection'),
    signInModeBtn: document.getElementById('signInModeBtn'),
    signUpModeBtn: document.getElementById('signUpModeBtn'),
    signInForm: document.getElementById('signInForm'),
    signUpForm: document.getElementById('signUpForm'),
    signInEmail: document.getElementById('signInEmail'),
    signInPassword: document.getElementById('signInPassword'),
    signUpEmail: document.getElementById('signUpEmail'),
    signUpPassword: document.getElementById('signUpPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    
    // Onboarding toggle
    chatModeBtn: document.getElementById('chatModeBtn'),
    formModeBtn: document.getElementById('formModeBtn'),
    onboardingChat: document.getElementById('onboardingChat'),
    onboardingForm: document.getElementById('onboardingForm'),
    
    // Chat elements
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendChatBtn: document.getElementById('sendChatBtn'),
    chatStatus: document.getElementById('chatStatus'),
    initialAiMessage: document.getElementById('initialAiMessage'),
    
    // Form elements
    weightUnit: document.getElementById('weightUnit'),
    goalWeightUnit: document.getElementById('goalWeightUnit'),
    
    // Dashboard elements
    userGreeting: document.getElementById('userGreeting'),
    todayCalories: document.getElementById('todayCalories'),
    todayProtein: document.getElementById('todayProtein'),
    todayCarbs: document.getElementById('todayCarbs'),
    todayFats: document.getElementById('todayFats'),
    todaySugar: document.getElementById('todaySugar'),
    currentWeightDisplay: document.getElementById('currentWeightDisplay'),
    weightTrend: document.getElementById('weightTrend'),
    calorieGoal: document.getElementById('calorieGoal'),
    proteinGoal: document.getElementById('proteinGoal'),
    
    // Activity checkboxes
    workedOutToday: document.getElementById('workedOutToday'),
    walkedToday: document.getElementById('walkedToday'),
    
    // Action buttons
    logMealBtn: document.getElementById('logMealBtn'),
    voiceLogBtn: document.getElementById('voiceLogBtn'),

    updateWeightBtn: document.getElementById('updateWeightBtn'),
    
    // Modals
    mealModal: document.getElementById('mealModal'),
    closeMealModal: document.getElementById('closeMealModal'),
    mealForm: document.getElementById('mealForm'),
    mealDescription: document.getElementById('mealDescription'),
    mealTime: document.getElementById('mealTime'),
    
    // Voice Recording Modal Elements
    voiceRecordingModal: document.getElementById('voiceRecordingModal'),
    closeVoiceModal: document.getElementById('closeVoiceModal'),
    recordingStatusText: document.getElementById('recordingStatusText'),
    recordingTimer: document.getElementById('recordingTimer'),
    finalTranscript: document.getElementById('finalTranscript'),
    interimTranscript: document.getElementById('interimTranscript'),
    stopRecordingBtn: document.getElementById('stopRecordingBtn'),
    cancelRecordingBtn: document.getElementById('cancelRecordingBtn'),
    
    // UI elements
    loadingSpinner: document.getElementById('loadingSpinner'),
    
    // Progress bars
    carbsProgress: document.getElementById('carbsProgress'),
    fatsProgress: document.getElementById('fatsProgress'),
    sugarProgress: document.getElementById('sugarProgress'),
    
    // Meals list
    todaysMealsList: document.getElementById('todaysMealsList'),
    
    // AI Assistant elements
    assistantChatMessages: document.getElementById('assistantChatMessages'),
    assistantChatInput: document.getElementById('assistantChatInput'),
    assistantSendBtn: document.getElementById('assistantSendBtn'),
    assistantChatStatus: document.getElementById('assistantChatStatus'),
    liveCalories: document.getElementById('liveCalories'),
    liveProtein: document.getElementById('liveProtein'),
    liveActivities: document.getElementById('liveActivities'),
    liveWeight: document.getElementById('liveWeight'),
    recentLogsList: document.getElementById('recentLogsList')
};

// Log DOM element availability
console.log('🔍 DOM Elements Check:');
Object.keys(elements).forEach(key => {
    const element = elements[key];
    console.log(`  ${key}: ${element ? '✅ Found' : '❌ Missing'}`);
});

// Utility functions
const utils = {
    showLoading: (show = true) => {
        console.log('🔄 Loading spinner:', show ? 'shown' : 'hidden');
        console.log('🔍 Loading spinner element:', elements.loadingSpinner ? 'available' : 'missing');
        if (elements.loadingSpinner) {
            if (show) {
                elements.loadingSpinner.classList.remove('hidden');
            } else {
                elements.loadingSpinner.classList.add('hidden');
            }
        }
        appState.isLoading = show;
        console.log('🔍 Updated app state loading:', appState.isLoading);
    },
    
    // Height utility functions
    toggleHeightInputs: () => {
        const heightUnit = document.getElementById('heightUnit');
        const imperialHeight = document.getElementById('imperialHeight');
        const metricHeight = document.getElementById('metricHeight');
        
        if (heightUnit && imperialHeight && metricHeight) {
            const isImperial = heightUnit.value === 'imperial';
            imperialHeight.style.display = isImperial ? 'flex' : 'none';
            metricHeight.style.display = isImperial ? 'none' : 'flex';
            
            // Update required attributes
            const heightFeet = document.getElementById('heightFeet');
            const heightInches = document.getElementById('heightInches');
            const heightCm = document.getElementById('heightCm');
            
            if (heightFeet) heightFeet.required = isImperial;
            if (heightInches) heightInches.required = isImperial;
            if (heightCm) heightCm.required = !isImperial;
        }
    },
    
    toggleUpdateHeightInputs: () => {
        const heightUnit = document.getElementById('updateHeightUnit');
        const imperialHeight = document.getElementById('updateImperialHeight');
        const metricHeight = document.getElementById('updateMetricHeight');
        
        if (heightUnit && imperialHeight && metricHeight) {
            const isImperial = heightUnit.value === 'imperial';
            imperialHeight.style.display = isImperial ? 'flex' : 'none';
            metricHeight.style.display = isImperial ? 'none' : 'flex';
        }
    },
    
    // Convert height to centimeters for calculations
    convertHeightToCm: (heightData) => {
        if (heightData.heightUnit === 'imperial') {
            const totalInches = (heightData.heightFeet * 12) + heightData.heightInches;
            return totalInches * 2.54;
        } else {
            return heightData.heightCm;
        }
    },
    
    // Convert height from old format to new format
    convertLegacyHeight: (height, heightUnit) => {
        if (heightUnit === 'ft') {
            // Convert decimal feet to feet and inches
            const feet = Math.floor(height);
            const inches = Math.round((height - feet) * 12);
            return {
                heightUnit: 'imperial',
                heightFeet: feet,
                heightInches: inches
            };
        } else if (heightUnit === 'cm') {
            return {
                heightUnit: 'metric',
                heightCm: Math.round(height)
            };
        }
        return null;
    },
    
    switchScreen: (screenName) => {
        console.log('🔄 Switching to screen:', screenName);
        console.log('🔍 Current screen before switch:', appState.currentScreen);
        console.log('🔍 Onboarding screen element:', elements.onboardingScreen ? 'available' : 'missing');
        console.log('🔍 AI Assistant screen element:', elements.aiAssistantScreen ? 'available' : 'missing');
        console.log('🔍 Dashboard screen element:', elements.dashboardScreen ? 'available' : 'missing');
        
        // Hide all screens
        if (elements.onboardingScreen) {
            elements.onboardingScreen.classList.remove('active');
            console.log('🔍 Onboarding screen hidden');
        }
        if (elements.aiAssistantScreen) {
            elements.aiAssistantScreen.classList.remove('active');
            console.log('🔍 AI Assistant screen hidden');
        }
        if (elements.dashboardScreen) {
            elements.dashboardScreen.classList.remove('active');
            console.log('🔍 Dashboard screen hidden');
        }
        
        // Show requested screen
        if (screenName === 'onboarding' && elements.onboardingScreen) {
            elements.onboardingScreen.classList.add('active');
            utils.hideNavigation();
            console.log('✅ Onboarding screen activated');
        } else if (screenName === 'aiassistant' && elements.aiAssistantScreen) {
            elements.aiAssistantScreen.classList.add('active');
            utils.showNavigation();
            utils.updateNavigation('aiAssistant');
            console.log('✅ AI Assistant screen activated');
            // Initialize AI assistant when first accessed
            if (window.aiAssistant && typeof window.aiAssistant.initialize === 'function') {
                window.aiAssistant.initialize();
            }
            // Refresh live stats
            if (window.aiAssistant && typeof window.aiAssistant.updateLiveStats === 'function') {
                window.aiAssistant.updateLiveStats();
            }
        } else if (screenName === 'dashboard' && elements.dashboardScreen) {
            elements.dashboardScreen.classList.add('active');
            utils.showNavigation();
            utils.updateNavigation('dashboard');
            console.log('✅ Dashboard screen activated');
            
            // Ensure dashboard event listeners are set up
            if (window.dashboard && typeof window.dashboard.setupEventListeners === 'function') {
                console.log('🔧 Setting up dashboard event listeners...');
                window.dashboard.setupEventListeners();
            }
            
            // Refresh dashboard data
            if (window.dashboard && typeof window.dashboard.refreshData === 'function') {
                window.dashboard.refreshData();
            }
        } else {
            console.error('❌ Failed to switch to screen:', screenName, 'Element missing or invalid screen name');
        }
        
        appState.currentScreen = screenName;
        console.log('🔍 Updated current screen in state:', appState.currentScreen);
    },
    
    updateNavigation: (activeScreen) => {
        // Update active state for navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Set active navigation button
        if (activeScreen === 'aiAssistant') {
            document.getElementById('navAiAssistant')?.classList.add('active');
        } else if (activeScreen === 'dashboard') {
            document.getElementById('navDashboard')?.classList.add('active');
        } else if (activeScreen === 'profile') {
            document.getElementById('navProfile')?.classList.add('active');
        }
        console.log('🧭 Navigation updated for screen:', activeScreen);
    },
    
    showNavigation: () => {
        const navElement = document.getElementById('mainNav');
        if (navElement) {
            navElement.style.display = 'flex';
            console.log('🧭 Navigation shown');
        }
    },
    
    hideNavigation: () => {
        const navElement = document.getElementById('mainNav');
        if (navElement) {
            navElement.style.display = 'none';
            console.log('🧭 Navigation hidden');
        }
    },
    
    showProfileSettings: () => {
        const modal = document.getElementById('profileModal');
        if (modal) {
            modal.classList.add('active');
            utils.populateProfileModal();
            utils.updateStatusIndicators(); // Update all status indicators
            console.log('👤 Profile settings modal opened');
        }
    },
    
    closeProfileModal: () => {
        const modal = document.getElementById('profileModal');
        if (modal) {
            modal.classList.remove('active');
            console.log('❌ Profile settings modal closed');
        }
    },
    
    populateProfileModal: () => {
        console.log('📋 Populating profile modal with user data...');
        
        // Populate profile data
        if (appState.userProfile) {
            const profile = appState.userProfile;
            console.log('👤 Loading profile data:', profile);
            
            // Profile tab - with safety checks
            const elements = {
                updateUserName: document.getElementById('updateUserName'),
                updateAge: document.getElementById('updateAge'),
                updateCurrentWeight: document.getElementById('updateCurrentWeight'),
                updateWeightUnit: document.getElementById('updateWeightUnit'),
                updateHeightUnit: document.getElementById('updateHeightUnit'),
                updateHeightFeet: document.getElementById('updateHeightFeet'),
                updateHeightInches: document.getElementById('updateHeightInches'),
                updateHeightCm: document.getElementById('updateHeightCm'),
                updateGender: document.getElementById('updateGender'),
                updateGoalWeight: document.getElementById('updateGoalWeight'),
                updateActivityLevel: document.getElementById('updateActivityLevel'),
                updatePrimaryGoal: document.getElementById('updatePrimaryGoal'),
                updateGoalWeightUnit: document.getElementById('updateGoalWeightUnit'),
                calculatedCalories: document.getElementById('calculatedCalories'),
                calculatedProtein: document.getElementById('calculatedProtein')
            };
            
            // Profile tab
            if (elements.updateUserName) elements.updateUserName.value = profile.userName || '';
            if (elements.updateAge) elements.updateAge.value = profile.age || '';
            if (elements.updateCurrentWeight) elements.updateCurrentWeight.value = profile.currentWeight || '';
            if (elements.updateWeightUnit) elements.updateWeightUnit.value = profile.weightUnit || 'lbs';
            
            // Handle height - support both old and new formats
            if (profile.heightUnit === 'imperial' || profile.heightFeet !== undefined) {
                // New format
                if (elements.updateHeightUnit) elements.updateHeightUnit.value = 'imperial';
                if (elements.updateHeightFeet) elements.updateHeightFeet.value = profile.heightFeet || '';
                if (elements.updateHeightInches) elements.updateHeightInches.value = profile.heightInches || '';
                if (elements.updateHeightCm) elements.updateHeightCm.value = '';
            } else if (profile.heightUnit === 'metric' || profile.heightCm !== undefined) {
                // New format
                if (elements.updateHeightUnit) elements.updateHeightUnit.value = 'metric';
                if (elements.updateHeightCm) elements.updateHeightCm.value = profile.heightCm || '';
                if (elements.updateHeightFeet) elements.updateHeightFeet.value = '';
                if (elements.updateHeightInches) elements.updateHeightInches.value = '';
            } else if (profile.height !== undefined) {
                // Legacy format - convert to new format
                const convertedHeight = utils.convertLegacyHeight(profile.height, profile.heightUnit);
                if (convertedHeight) {
                    if (convertedHeight.heightUnit === 'imperial') {
                        if (elements.updateHeightUnit) elements.updateHeightUnit.value = 'imperial';
                        if (elements.updateHeightFeet) elements.updateHeightFeet.value = convertedHeight.heightFeet || '';
                        if (elements.updateHeightInches) elements.updateHeightInches.value = convertedHeight.heightInches || '';
                        if (elements.updateHeightCm) elements.updateHeightCm.value = '';
                    } else {
                        if (elements.updateHeightUnit) elements.updateHeightUnit.value = 'metric';
                        if (elements.updateHeightCm) elements.updateHeightCm.value = convertedHeight.heightCm || '';
                        if (elements.updateHeightFeet) elements.updateHeightFeet.value = '';
                        if (elements.updateHeightInches) elements.updateHeightInches.value = '';
                    }
                }
            }
            
            // Update height input visibility based on selection
            utils.toggleUpdateHeightInputs();
            
            if (elements.updateGender) elements.updateGender.value = profile.gender || '';
            
            // Goals tab
            if (elements.updateGoalWeight) elements.updateGoalWeight.value = profile.goalWeight || '';
            if (elements.updateActivityLevel) elements.updateActivityLevel.value = profile.activityLevel || '';
            if (elements.updatePrimaryGoal) elements.updatePrimaryGoal.value = profile.primaryGoal || '';
            
            // Update goal weight unit display to match current weight unit
            if (elements.updateGoalWeightUnit) {
                elements.updateGoalWeightUnit.textContent = profile.weightUnit || 'lbs';
            }
            
            // Calculate and display goals
            try {
                const calorieGoal = utils.calculateCalorieGoal(profile);
                const proteinGoal = utils.calculateProteinGoal(profile);
                if (elements.calculatedCalories) elements.calculatedCalories.textContent = `${calorieGoal} cal`;
                if (elements.calculatedProtein) elements.calculatedProtein.textContent = `${proteinGoal}g`;
                console.log('📊 Goals calculated - Calories:', calorieGoal, 'Protein:', proteinGoal);
            } catch (error) {
                console.error('❌ Error calculating goals:', error);
                if (elements.calculatedCalories) elements.calculatedCalories.textContent = '--';
                if (elements.calculatedProtein) elements.calculatedProtein.textContent = '--';
            }
        } else {
            console.log('⚠️ No user profile available');
        }
        
        // Account tab
        if (appState.currentUser) {
            const userEmailEl = document.getElementById('userEmail');
            const memberSinceEl = document.getElementById('memberSince');
            
            if (userEmailEl) userEmailEl.textContent = appState.currentUser.email || '--';
            
            if (memberSinceEl) {
                const creationDate = appState.currentUser.metadata?.creationTime;
                if (creationDate) {
                    memberSinceEl.textContent = new Date(creationDate).toLocaleDateString();
                } else {
                    memberSinceEl.textContent = '--';
                }
            }
            console.log('📧 Account info populated');
        }
        
        // Preferences tab - Dark mode
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // Check current theme preference
            const currentTheme = localStorage.getItem('fitly-theme') || 'light';
            themeToggle.checked = currentTheme === 'dark';
            
            // Add change listener if not already added
            if (!themeToggle.hasAttribute('data-listener-added')) {
                themeToggle.addEventListener('change', (e) => {
                    utils.toggleDarkMode(e.target.checked);
                });
                themeToggle.setAttribute('data-listener-added', 'true');
                console.log('🌙 Dark mode toggle listener added');
            }
        }
        
        // Check API status
        utils.checkApiStatus();
        console.log('✅ Profile modal populated successfully');
    },
    
    checkApiStatus: async () => {
        const statusElement = document.getElementById('apiStatus');
        if (statusElement) {
            statusElement.textContent = 'Checking...';
            statusElement.className = 'status-indicator';
            
            try {
                const isConfigured = await window.openaiAPI.isConfigured();
                if (isConfigured) {
                    statusElement.textContent = '✅ Connected';
                    statusElement.className = 'status-indicator ready';
                } else {
                    statusElement.textContent = '❌ Not configured';
                    statusElement.className = 'status-indicator error';
                }
            } catch (error) {
                statusElement.textContent = '⚠️ Error checking';
                statusElement.className = 'status-indicator error';
            }
        }
    },
    
    testOpenAIConnection: async () => {
        console.log('🔍 Testing OpenAI connection...');
        const apiStatus = document.getElementById('apiStatus');
        
        try {
            if (apiStatus) apiStatus.textContent = 'Testing...';
            const isConfigured = await window.openaiAPI.isConfigured();
            
            if (isConfigured) {
                console.log('✅ OpenAI connection test passed');
                if (apiStatus) apiStatus.textContent = '✅ Connected';
                utils.showNotification('OpenAI connection successful!', 'success');
            } else {
                console.log('❌ OpenAI not configured');
                if (apiStatus) apiStatus.textContent = '❌ Not configured';
                utils.showNotification('OpenAI API key not configured', 'error');
            }
        } catch (error) {
            console.error('❌ OpenAI connection test failed:', error);
            if (apiStatus) apiStatus.textContent = '❌ Failed';
            utils.showNotification('OpenAI connection failed', 'error');
        }
    },
    
    testAIConnection: async () => {
        console.log('🧪 Testing AI connection...');
        const aiStatus = document.getElementById('langGraphStatus');
        
        try {
            if (aiStatus) aiStatus.textContent = 'Testing...';
            
            if (!appState.langGraphReady || !window.langGraphClient) {
                console.log('❌ Enhanced AI not available');
                if (aiStatus) aiStatus.textContent = '⚪ Basic mode';
                utils.showNotification('Using basic AI mode. All features available.', 'info');
                return;
            }
            
            // Test AI functionality
            const testSession = await window.langGraphClient.createSession('coaching', appState.currentUser?.uid);
            
            if (testSession) {
                console.log('✅ AI test session created:', testSession);
                
                // Test coaching capabilities
                const testCoachingResult = await window.langGraphClient.getCoaching(
                    "How am I doing with my wellness goals?",
                    appState.userProfile,
                    {
                        calories: appState.dailyNutrition?.calories || 0,
                        todaysMeals: appState.todaysMeals || []
                    }
                );
                
                if (testCoachingResult && testCoachingResult.motivationalMessage) {
                    console.log('✅ Enhanced AI coaching test passed');
                    if (aiStatus) aiStatus.textContent = '🚀 Enhanced AI';
                    utils.showNotification('Enhanced AI features are working perfectly! 🚀', 'success');
                    
                    // Show a sample coaching response
                    if (window.aiAssistant && window.aiAssistant.addMessage) {
                        aiAssistant.addMessage("AI Test: " + testCoachingResult.motivationalMessage, 'ai');
                        utils.switchScreen('aiassistant');
                    }
                } else {
                    throw new Error('AI coaching test failed');
                }
            } else {
                throw new Error('AI session creation failed');
            }
        } catch (error) {
            console.error('❌ AI test failed:', error);
            if (aiStatus) aiStatus.textContent = '❌ Connection failed';
            utils.showNotification(`AI connection test failed: ${error.message}`, 'error');
        }
    },

    testSpeechRecognition: async () => {
        console.log('🎤 Testing speech recognition...');
        const speechStatus = document.getElementById('speechStatus');
        
        try {
            if (speechStatus) speechStatus.textContent = 'Testing...';
            
            // Check if speech service is available
            if (!window.SpeechService || !window.SpeechService.isSupported()) {
                console.log('❌ Speech recognition not supported');
                if (speechStatus) speechStatus.textContent = '❌ Not supported';
                utils.showNotification('Speech recognition is not supported in this browser', 'error');
                return;
            }
            
            // Check if enhanced AI is available for speech processing
            if (!appState.langGraphReady || !window.langGraphClient) {
                console.log('❌ Enhanced AI not available for speech processing');
                if (speechStatus) speechStatus.textContent = '⚪ Basic mode';
                utils.showNotification('Speech recognition available in basic mode', 'info');
                return;
            }
            
            // Test speech recognition
            const result = await window.langGraphClient.testSpeech();
            
            if (result) {
                console.log('✅ Speech recognition test passed:', result);
                if (speechStatus) speechStatus.textContent = '🎤 Ready';
                utils.showNotification('Speech recognition is working! Try the voice log button.', 'success');
            } else {
                throw new Error('Speech test failed');
            }
        } catch (error) {
            console.error('❌ Speech recognition test failed:', error);
            if (speechStatus) speechStatus.textContent = '❌ Failed';
            utils.showNotification(`Speech test failed: ${error.message}`, 'error');
        }
    },
    
    updateStatusIndicators: async () => {
        console.log('🔍 Updating all status indicators...');
        
        // Update OpenAI status
        const apiStatus = document.getElementById('apiStatus');
        if (apiStatus) {
            try {
                const isConfigured = await window.openaiAPI?.isConfigured();
                if (isConfigured) {
                    apiStatus.textContent = '✅ Connected';
                } else {
                    apiStatus.textContent = '❌ Not configured';
                }
            } catch (error) {
                apiStatus.textContent = '❌ Error';
            }
        }
        
        // Update AI status
        const aiStatus = document.getElementById('langGraphStatus');
        if (aiStatus) {
            if (appState.langGraphReady && window.langGraphClient && window.langGraphClient.isReady) {
                aiStatus.textContent = '🚀 Enhanced AI';
            } else if (window.langGraphClient) {
                aiStatus.textContent = '⚪ Loading...';
            } else {
                aiStatus.textContent = '⚪ Basic mode';
            }
        }
        
        // Update Speech status
        const speechStatus = document.getElementById('speechStatus');
        if (speechStatus) {
            if (!window.SpeechService) {
                speechStatus.textContent = '❌ Not available';
            } else if (!window.SpeechService.isSupported()) {
                speechStatus.textContent = '❌ Not supported';
            } else if (!appState.langGraphReady) {
                speechStatus.textContent = '⚪ Basic mode';
            } else {
                speechStatus.textContent = '🎤 Ready';
            }
        }
        
        console.log('✅ Status indicators updated');
    },
    
    exportUserData: async () => {
        try {
            const data = {
                profile: appState.userProfile,
                dailyNutrition: appState.dailyNutrition,
                todaysMeals: appState.todaysMeals,
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fitly-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            utils.showNotification('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            utils.showNotification('Failed to export data', 'error');
        }
    },
    
    resetPassword: async () => {
        try {
            const email = appState.currentUser?.email;
            if (!email) {
                alert('❌ No email found for password reset');
                return;
            }
            
            const confirmed = confirm(`🔑 Send password reset email to:\n${email}\n\nAre you sure?`);
            if (confirmed) {
                await window.firebaseAuth.sendPasswordResetEmail(email);
                alert('✅ Password reset email sent!\n\nCheck your inbox and follow the instructions.');
            }
        } catch (error) {
            console.error('Error sending password reset:', error);
            alert(`❌ Failed to send password reset email:\n${error.message}`);
        }
    },
    
    signOut: async () => {
        const confirmed = confirm('🚪 Are you sure you want to sign out?\n\nYour data will be saved to the cloud.');
        if (confirmed) {
            try {
                await window.firebaseAuth.signOut();
                utils.showNotification('Signed out successfully', 'success');
                // Navigation will be handled by auth state change
            } catch (error) {
                console.error('Error signing out:', error);
                utils.showNotification('Failed to sign out', 'error');
            }
        }
    },
    
    toggleDarkMode: (enabled) => {
        console.log('🌙 Toggling dark mode:', enabled ? 'ON' : 'OFF');
        
        if (enabled) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('fitly-theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('fitly-theme', 'light');
        }
        
        utils.showNotification(`Dark mode ${enabled ? 'enabled' : 'disabled'}`, 'success');
        console.log('✅ Dark mode toggled successfully');
    },
    
    updateProfile: async (formData) => {
        try {
            const heightUnit = formData.get('heightUnit');
            let heightData = {};
            
            if (heightUnit === 'imperial') {
                heightData = {
                    heightUnit: 'imperial',
                    heightFeet: parseInt(formData.get('heightFeet')) || appState.userProfile.heightFeet,
                    heightInches: parseInt(formData.get('heightInches')) || appState.userProfile.heightInches,
                    heightCm: null
                };
            } else {
                heightData = {
                    heightUnit: 'metric',
                    heightCm: parseInt(formData.get('heightCm')) || appState.userProfile.heightCm,
                    heightFeet: null,
                    heightInches: null
                };
            }
            
            const updatedProfile = {
                ...appState.userProfile,
                userName: formData.get('userName'),
                age: parseInt(formData.get('age')) || appState.userProfile.age,
                currentWeight: parseFloat(formData.get('currentWeight')) || appState.userProfile.currentWeight,
                weightUnit: formData.get('weightUnit') || appState.userProfile.weightUnit,
                ...heightData,
                gender: formData.get('gender') || appState.userProfile.gender
            };
            
            if (appState.currentUser) {
                await window.firebaseDB.updateUserProfile(appState.currentUser.uid, updatedProfile);
                appState.userProfile = updatedProfile;
                console.log('✅ Profile updated successfully');
                utils.showNotification('Profile updated successfully!', 'success');
                
                // Refresh calculated goals
                utils.populateProfileModal();
            }
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            utils.showNotification('Failed to update profile', 'error');
        }
    },
    
    updateGoals: async (formData) => {
        try {
            const updatedProfile = {
                ...appState.userProfile,
                goalWeight: parseFloat(formData.get('goalWeight')) || appState.userProfile.goalWeight,
                activityLevel: formData.get('activityLevel') || appState.userProfile.activityLevel,
                primaryGoal: formData.get('primaryGoal') || appState.userProfile.primaryGoal
            };
            
            if (appState.currentUser) {
                await window.firebaseDB.updateUserProfile(appState.currentUser.uid, updatedProfile);
                appState.userProfile = updatedProfile;
                console.log('✅ Goals updated successfully');
                utils.showNotification('Goals updated successfully!', 'success');
                
                // Refresh calculated goals
                utils.populateProfileModal();
                
                // Update dashboard if visible
                if (appState.currentScreen === 'dashboard') {
                    dashboard.refreshData();
                }
            }
        } catch (error) {
            console.error('❌ Error updating goals:', error);
            utils.showNotification('Failed to update goals', 'error');
        }
    },
    
    showNotification: (message, type = 'info') => {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Add icon based on type
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        console.log('📢 Visual notification shown:', message);
    },
    
    calculateCalorieGoal: (userProfile) => {
        console.log('🔢 Calculating calorie goal for profile:', userProfile);
        // Basic BMR calculation using Mifflin-St Jeor equation
        const { currentWeight, age, gender, activityLevel, weightUnit } = userProfile;
        
        // Convert to metric if needed
        let weightKg = weightUnit === 'kg' ? currentWeight : currentWeight * 0.453592;
        
        // Get height in cm - support both old and new formats
        let heightCm;
        if (userProfile.heightUnit === 'imperial') {
            const totalInches = (userProfile.heightFeet * 12) + userProfile.heightInches;
            heightCm = totalInches * 2.54;
        } else if (userProfile.heightUnit === 'metric') {
            heightCm = userProfile.heightCm;
        } else if (userProfile.height !== undefined) {
            // Legacy format
            heightCm = userProfile.heightUnit === 'cm' ? userProfile.height : userProfile.height * 30.48;
        } else {
            console.error('❌ No height data available for calorie calculation');
            return 2000; // Default fallback
        }
        
        // Calculate BMR
        let bmr;
        if (gender === 'male') {
            bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
        } else {
            bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
        }
        
        // Apply activity multiplier
        const activityMultipliers = {
            'sedentary': 1.2,
            'lightly-active': 1.375,
            'moderately-active': 1.55,
            'very-active': 1.725,
            'inconsistent': 1.4 // Average between sedentary and lightly active
        };
        
        const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);
        
        // Adjust based on goal
        let calorieGoal;
        switch (userProfile.primaryGoal) {
            case 'lose-fat':
                calorieGoal = Math.round(tdee - 500); // 500 calorie deficit
                break;
            case 'build-muscle':
                calorieGoal = Math.round(tdee + 300); // 300 calorie surplus
                break;
            case 'maintain':
            case 'general-health':
            case 'just-tracking':
            default:
                calorieGoal = Math.round(tdee);
                break;
        }
        
        console.log('✅ Calculated calorie goal:', calorieGoal);
        return calorieGoal;
    },
    
    calculateProteinGoal: (userProfile) => {
        console.log('🔢 Calculating protein goal for profile:', userProfile);
        const { currentWeight, primaryGoal, weightUnit } = userProfile;
        
        // Convert to kg if needed
        const weightKg = weightUnit === 'kg' ? currentWeight : currentWeight * 0.453592;
        
        // Protein per kg of body weight based on goal
        let proteinPerKg;
        switch (primaryGoal) {
            case 'build-muscle':
                proteinPerKg = 2.2; // 2.2g per kg for muscle building
                break;
            case 'lose-fat':
                proteinPerKg = 2.0; // 2.0g per kg for fat loss
                break;
            case 'maintain':
            case 'general-health':
            case 'just-tracking':
            default:
                proteinPerKg = 1.6; // 1.6g per kg for general health
                break;
        }
        
        const proteinGoal = Math.round(weightKg * proteinPerKg);
        console.log('✅ Calculated protein goal:', proteinGoal);
        return proteinGoal;
    }
};

// Authentication functions
const authModule = {
    initialize: async () => {
        console.log('🔐 Initializing authentication...');
        console.log('🔍 Firebase auth available:', typeof window.firebaseAuth !== 'undefined');
        
        if (!window.firebaseAuth) {
            console.error('❌ Firebase auth not available!');
            throw new Error('Firebase auth not available');
        }
        
        // Set up auth form handlers
        authModule.setupAuthForms();
        
        return new Promise((resolve) => {
            console.log('🔍 Setting up auth state listener...');
            window.firebaseAuth.onAuthStateChanged(async (user) => {
                console.log('🔐 Auth state changed. User:', user ? user.uid : 'None');
                
                if (user) {
                    console.log('✅ User authenticated:', user.uid, user.email);
                    appState.currentUser = user;
                    console.log('🔍 Updated app state current user:', appState.currentUser?.uid);
                    
                    // Hide auth section and show profile setup or dashboard
                    authModule.hideAuthSection();
                    
                    // Load user profile
                    try {
                        console.log('📋 Loading user profile...');
                        const profile = await window.firebaseDB.getUserProfile(user.uid);
                        console.log('📋 Profile loaded:', profile ? 'Yes' : 'No', profile);
                        
                        if (profile) {
                            appState.userProfile = profile;
                            console.log('✅ User profile loaded and stored in app state');
                            console.log('🔄 Attempting to initialize AI assistant...');
                            utils.switchScreen('aiassistant');
                        } else {
                            console.log('⚠️ No user profile found, showing profile setup');
                            await authModule.showProfileSetup();
                        }
                    } catch (error) {
                        console.error('❌ Error loading user profile:', error);
                        console.log('🔄 Falling back to profile setup due to profile load error');
                        await authModule.showProfileSetup();
                    }
                } else {
                    console.log('ℹ️ No user authenticated, showing auth forms');
                    authModule.showAuthSection();
                    utils.switchScreen('onboarding');
                }
                console.log('🔍 Auth state change handler complete, resolving...');
                resolve();
            });
        });
    },
    
    setupAuthForms: () => {
        console.log('🔐 Setting up auth forms...');
        
        // Auth toggle buttons
        if (elements.signInModeBtn && elements.signUpModeBtn) {
            elements.signInModeBtn.addEventListener('click', () => {
                console.log('🔄 Switching to sign in mode');
                authModule.switchAuthMode('signin');
            });
            
            elements.signUpModeBtn.addEventListener('click', () => {
                console.log('🔄 Switching to sign up mode');
                authModule.switchAuthMode('signup');
            });
            console.log('✅ Auth toggle listeners added');
            
            // Set initial auth mode to sign in
            authModule.switchAuthMode('signin');
            console.log('✅ Initial auth mode set to sign in');
        }
        
        // Sign in form
        if (elements.signInForm) {
            elements.signInForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('🔑 Sign in form submitted');
                await authModule.handleSignIn();
            });
            console.log('✅ Sign in form listener added');
        }
        
        // Sign up form
        if (elements.signUpForm) {
            elements.signUpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('✨ Sign up form submitted');
                await authModule.handleSignUp();
            });
            console.log('✅ Sign up form listener added');
        }
    },
    
    switchAuthMode: (mode) => {
        console.log('🔄 Switching auth mode to:', mode);
        
        if (mode === 'signin') {
            elements.signInModeBtn?.classList.add('active');
            elements.signUpModeBtn?.classList.remove('active');
            elements.signInForm?.classList.add('active');
            elements.signUpForm?.classList.remove('active');
        } else {
            elements.signInModeBtn?.classList.remove('active');
            elements.signUpModeBtn?.classList.add('active');
            elements.signInForm?.classList.remove('active');
            elements.signUpForm?.classList.add('active');
        }
    },
    
    handleSignIn: async () => {
        const email = elements.signInEmail?.value?.trim();
        const password = elements.signInPassword?.value;
        
        if (!email || !password) {
            utils.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        console.log('🔑 Attempting sign in for:', email);
        utils.showLoading(true);
        
        try {
            const user = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            console.log('✅ Sign in successful:', user.uid);
            utils.showNotification('Welcome back! 👋', 'success');
        } catch (error) {
            console.error('❌ Sign in error:', error);
            let message = 'Sign in failed. Please try again.';
            
            if (error.code === 'auth/user-not-found') {
                message = 'No account found with this email. Please sign up first.';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            }
            
            utils.showNotification(message, 'error');
        } finally {
            utils.showLoading(false);
        }
    },
    
    handleSignUp: async () => {
        const email = elements.signUpEmail?.value?.trim();
        const password = elements.signUpPassword?.value;
        const confirmPassword = elements.confirmPassword?.value;
        
        if (!email || !password || !confirmPassword) {
            utils.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            utils.showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            utils.showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        console.log('✨ Attempting sign up for:', email);
        utils.showLoading(true);
        
        try {
            const user = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            console.log('✅ Sign up successful:', user.uid);
            utils.showNotification('Account created successfully! Welcome to Fitly! 🎉', 'success');
        } catch (error) {
            console.error('❌ Sign up error:', error);
            let message = 'Sign up failed. Please try again.';
            
            if (error.code === 'auth/email-already-in-use') {
                message = 'An account with this email already exists. Please sign in instead.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password is too weak. Please choose a stronger password.';
            }
            
            utils.showNotification(message, 'error');
        } finally {
            utils.showLoading(false);
        }
    },
    
    showAuthSection: () => {
        console.log('🔐 Showing auth section');
        elements.authSection?.classList.remove('hidden');
        elements.profileSetupSection?.classList.add('hidden');
    },
    
    hideAuthSection: () => {
        console.log('🔐 Hiding auth section');
        elements.authSection?.classList.add('hidden');
    },
    
    showProfileSetup: async () => {
        console.log('📋 Showing profile setup');
        elements.profileSetupSection?.classList.remove('hidden');
        await onboarding.initialize(); // Initialize the profile setup forms
    }
};

// Onboarding functions
const onboarding = {
    initialize: async () => {
        console.log('📝 Initializing onboarding...');
        console.log('🔍 Onboarding form element:', elements.onboardingForm ? 'available' : 'missing');
        
        // Set default meal time to now
        const now = new Date();
        if (elements.mealTime) {
            elements.mealTime.value = now.toISOString().slice(0, 16);
            console.log('✅ Meal time set to current time');
        }
        
        // Handle weight unit changes
        if (elements.weightUnit && elements.goalWeightUnit) {
            elements.weightUnit.addEventListener('change', (e) => {
                console.log('🔄 Weight unit changed to:', e.target.value);
                elements.goalWeightUnit.textContent = e.target.value;
            });
            console.log('✅ Weight unit change listener added');
        } else {
            console.log('⚠️ Weight unit elements not found');
        }
        
        // Handle form submission
        if (elements.onboardingForm) {
            console.log('📝 Attaching form submit handler to:', elements.onboardingForm);
            elements.onboardingForm.addEventListener('submit', onboarding.handleSubmit);
            console.log('✅ Form submit handler attached');
        } else {
            console.error('❌ Onboarding form element not found!');
        }
        
        // Set up mode toggle
        console.log('🔄 Setting up mode toggle...');
        onboarding.setupModeToggle();
        
        // Initialize chat
        console.log('💬 Initializing chat...');
        await onboarding.initializeChat();
        
        // Set initial mode
        console.log('🔄 Setting initial onboarding mode to:', appState.onboardingMode);
        onboarding.switchMode(appState.onboardingMode);
        
        console.log('✅ Onboarding initialized');
    },
    
    setupModeToggle: () => {
        console.log('🔄 Setting up mode toggle buttons...');
        console.log('🔍 Chat mode btn element:', elements.chatModeBtn);
        console.log('🔍 Form mode btn element:', elements.formModeBtn);
        console.log('🔍 Chat mode btn available:', elements.chatModeBtn ? 'YES' : 'NO');
        console.log('🔍 Form mode btn available:', elements.formModeBtn ? 'YES' : 'NO');
        
        if (elements.chatModeBtn && elements.formModeBtn) {
            console.log('🔄 Adding click listeners to toggle buttons...');
            
            elements.chatModeBtn.addEventListener('click', () => {
                console.log('💬 Chat mode button clicked - switching to chat mode');
                onboarding.switchMode('chat');
            });
            
            elements.formModeBtn.addEventListener('click', () => {
                console.log('📝 Form mode button clicked - switching to form mode');
                onboarding.switchMode('form');
            });
            
            console.log('✅ Mode toggle event listeners added successfully');
            
            // Log initial button classes
            console.log('🔍 Chat btn initial classes:', elements.chatModeBtn.className);
            console.log('🔍 Form btn initial classes:', elements.formModeBtn.className);
        } else {
            console.error('❌ Mode toggle buttons not found in DOM!');
            console.log('🔍 Available elements:', Object.keys(elements).filter(key => elements[key] !== null));
        }
    },
    
    switchMode: (mode) => {
        console.log('🔄 Switching onboarding mode to:', mode);
        console.log('🔍 Previous mode:', appState.onboardingMode);
        
        appState.onboardingMode = mode;
        
        // Update toggle buttons
        if (elements.chatModeBtn && elements.formModeBtn) {
            elements.chatModeBtn.classList.toggle('active', mode === 'chat');
            elements.formModeBtn.classList.toggle('active', mode === 'form');
            console.log('✅ Toggle buttons updated');
            console.log('🔍 Chat btn active:', elements.chatModeBtn.classList.contains('active'));
            console.log('🔍 Form btn active:', elements.formModeBtn.classList.contains('active'));
        } else {
            console.error('❌ Toggle buttons not available for mode update');
        }
        
        // Update interfaces
        if (elements.onboardingChat && elements.onboardingForm) {
            elements.onboardingChat.classList.toggle('active', mode === 'chat');
            elements.onboardingForm.classList.toggle('active', mode === 'form');
            console.log('✅ Interface panels updated');
            console.log('🔍 Chat panel active:', elements.onboardingChat.classList.contains('active'));
            console.log('🔍 Form panel active:', elements.onboardingForm.classList.contains('active'));
        } else {
            console.error('❌ Interface panels not available for mode update');
            console.log('🔍 Chat panel element:', elements.onboardingChat);
            console.log('🔍 Form panel element:', elements.onboardingForm);
        }
        
        console.log('✅ Mode switch complete. Current mode:', appState.onboardingMode);
    },
    
    initializeChat: async () => {
        console.log('💬 Initializing chat...');
        console.log('🔍 OpenAI API available:', typeof window.openaiAPI !== 'undefined');
        console.log('🔍 LangGraph ready:', appState.langGraphReady);
        
        // Check if AI capabilities are available (either LangGraph or OpenAI)
        const isConfigured = await window.openaiAPI?.isConfigured();
        const hasAICapability = appState.langGraphReady || isConfigured;
        console.log('🔍 OpenAI configured:', isConfigured);
        console.log('🔍 AI capability available:', hasAICapability);
        
        if (hasAICapability) {
            // Enable chat interface
            if (elements.chatInput) {
                elements.chatInput.disabled = false;
                console.log('✅ Chat input enabled');
            }
            if (elements.sendChatBtn) {
                elements.sendChatBtn.disabled = false;
                console.log('✅ Send chat button enabled');
            }
            
            // Update status based on capability type
            if (elements.chatStatus) {
                                    elements.chatStatus.className = 'chat-status ready';
                    elements.chatStatus.innerHTML = '<span class="status-indicator">✅</span><span>Your AI coach is ready! Ask me anything.</span>';
                    console.log('✅ Chat status updated to ready');
            }
            
            appState.chatActive = true;
            console.log('✅ Chat activated');
        } else {
            // Show API key needed message
            if (elements.initialAiMessage) {
                elements.initialAiMessage.textContent = "Hi there! 👋 I'm your wellness coach, but I need an OpenAI API key to have a real conversation with you. For now, you can use the Quick Form below to get started! Once you add your API key to openai-config.js, I'll be able to chat with you in a more natural way.";
                console.log('✅ Initial AI message updated with API key needed notice');
            }
            
            // Switch to form as default since AI isn't available
            console.log('🔄 AI not available, defaulting to form mode');
            // Don't call switchMode here as it might cause infinite loop
            appState.onboardingMode = 'form';
        }
        
        // Set up chat input handlers
        if (elements.chatInput) {
            elements.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && appState.chatActive) {
                    console.log('⌨️ Enter key pressed in chat input');
                    e.preventDefault();
                    onboarding.sendMessage();
                }
            });
            console.log('✅ Chat input keypress handler added');
        }
        
        if (elements.sendChatBtn) {
            elements.sendChatBtn.addEventListener('click', () => {
                console.log('🔄 Send chat button clicked');
                onboarding.sendMessage();
            });
            console.log('✅ Send chat button click handler added');
        }
        
        console.log('✅ Chat initialization complete');
    },
    
    sendMessage: async () => {
        const message = elements.chatInput?.value?.trim();
        if (!message || !appState.chatActive) return;
        
        console.log('💬 Sending message:', message);
        
        // Clear input
        elements.chatInput.value = '';
        
        // Add user message to chat
        onboarding.addMessage(message, 'user');
        
        // Show thinking status
        if (elements.chatStatus) {
            if (appState.langGraphReady) {
                elements.chatStatus.className = 'chat-status thinking';
                elements.chatStatus.innerHTML = '<span class="status-indicator">🤔</span><span>Enhanced Coach is thinking...</span>';
            } else {
                elements.chatStatus.className = 'chat-status thinking';
                elements.chatStatus.innerHTML = '<span class="status-indicator">🤔</span><span>Coach is thinking...</span>';
            }
        }
        
        try {
            let response;
            
            // Use enhanced LangGraph onboarding with proper flow control
            if (appState.langGraphReady && window.langGraphClient) {
                console.log('🤖 Using enhanced AI onboarding...');
                
                // Create session if needed
                if (!appState.currentOnboardingSession) {
                    appState.currentOnboardingSession = await window.langGraphClient.createSession('onboarding', appState.currentUser?.uid);
                    console.log('🗣️ Created onboarding session:', appState.currentOnboardingSession);
                }
                
                // Track onboarding progress manually to prevent premature completion
                if (!appState.onboardingProgress) {
                    appState.onboardingProgress = {
                        step: 1,
                        maxSteps: 7,
                        collectedData: {}
                    };
                }
                
                // Ensure existing data from previous steps is preserved
                if (appState.onboardingProgress.collectedData) {
                    // Merge any existing collected data with current input
                    const existingData = appState.onboardingProgress.collectedData;
                    if (Object.keys(existingData).length > 0) {
                        console.log('📝 Preserving existing onboarding data:', existingData);
                    }
                }
                
                // Get enhanced response from LangGraph with step tracking
                response = await window.langGraphClient.onboardingChat(
                    message, 
                    appState.currentOnboardingSession,
                    appState.onboardingProgress
                );
                
                console.log('🤖 Enhanced AI onboarding response:', response);
                
                // Update progress based on what information was gathered
                onboarding.updateOnboardingProgress(message, response);
                
                // Ensure weight field consistency for validation
                if (response.userData && response.userData.weight && !response.userData.currentWeight) {
                    response.userData.currentWeight = response.userData.weight;
                    console.log('🔧 Fixed weight field mapping in response:', response.userData.currentWeight);
                }
                
            } else {
                console.log('🤖 Using fallback conversational onboarding...');
                // Fallback to intelligent but simpler system
                response = await onboarding.processConversationalOnboarding(message);
            }
            
            // Add to conversation history
            appState.conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: response.message }
            );
            
            // Add AI message to chat
            onboarding.addMessage(response.message, 'ai');
            
            // Check if onboarding is complete (with better validation)
            if (response.complete || response.isComplete) {
                const profileData = response.profileData || response.userData;
                console.log('🔍 Onboarding completion check:', { profileData, complete: response.complete, isComplete: response.isComplete });
                
                // Map userData fields to expected profile format with robust field handling
                const mappedProfileData = profileData ? {
                    userName: profileData.userName || profileData.name,
                    age: profileData.age,
                    currentWeight: profileData.currentWeight || profileData.weight,
                    weightUnit: profileData.weightUnit || 'lbs',
                    height: profileData.height,
                    heightUnit: profileData.heightUnit || 'ft',
                    gender: profileData.gender,
                    primaryGoal: profileData.primaryGoal,
                    goalWeight: profileData.goalWeight,
                    activityLevel: profileData.activityLevel,
                    workoutFrequency: profileData.workoutFrequency,
                    dietaryPreferences: profileData.dietaryPreferences || []
                } : null;
                
                // Additional validation to ensure critical fields are present
                if (mappedProfileData) {
                    // Double-check weight field mapping with multiple fallbacks
                    if (!mappedProfileData.currentWeight) {
                        if (profileData.weight) {
                            mappedProfileData.currentWeight = profileData.weight;
                            console.log('🔧 Applied emergency weight fix from .weight:', mappedProfileData.currentWeight);
                        } else if (response.userData?.weight) {
                            mappedProfileData.currentWeight = response.userData.weight;
                            console.log('🔧 Applied emergency weight fix from response.userData.weight:', mappedProfileData.currentWeight);
                        } else if (response.userData?.currentWeight) {
                            mappedProfileData.currentWeight = response.userData.currentWeight;
                            console.log('🔧 Applied emergency weight fix from response.userData.currentWeight:', mappedProfileData.currentWeight);
                        }
                    }
                    
                    // Validate numeric fields
                    if (mappedProfileData.currentWeight && typeof mappedProfileData.currentWeight === 'string') {
                        mappedProfileData.currentWeight = parseFloat(mappedProfileData.currentWeight);
                    }
                    if (mappedProfileData.age && typeof mappedProfileData.age === 'string') {
                        mappedProfileData.age = parseInt(mappedProfileData.age);
                    }
                    if (mappedProfileData.height && typeof mappedProfileData.height === 'string') {
                        mappedProfileData.height = parseFloat(mappedProfileData.height);
                    }
                }
                
                const requiredFields = ['userName', 'currentWeight', 'height', 'age', 'gender', 'activityLevel', 'primaryGoal'];
                const hasAllRequired = mappedProfileData && requiredFields.every(field => mappedProfileData[field] !== undefined && mappedProfileData[field] !== null);
                
                console.log('🔍 Mapped profile data:', mappedProfileData);
                console.log('🔍 Required fields check:', requiredFields.map(field => ({ field, value: mappedProfileData?.[field], hasValue: mappedProfileData?.[field] !== undefined })));
                
                if (hasAllRequired) {
                    console.log('✅ Onboarding complete with all required data, saving profile...');
                    try {
                        await onboarding.saveProfileData(mappedProfileData);
                        console.log('✅ Profile saved successfully!');
                        
                        // Hide the onboarding chat interface after successful completion
                        console.log('🔄 Hiding onboarding chat interface...');
                        onboarding.hideChat();
                        
                        // Show completion message briefly before switching
                        setTimeout(() => {
                            console.log('🎉 Onboarding fully complete, user should now see main app');
                            console.log('🔍 Current app state after completion:', {
                                userProfile: !!appState.userProfile,
                                currentScreen: appState.currentScreen,
                                currentUser: !!appState.currentUser
                            });
                        }, 2000);
                        
                    } catch (error) {
                        console.error('❌ Error saving profile:', error);
                    }
                } else {
                    console.log('⚠️ Onboarding marked complete but missing required fields, continuing conversation...');
                    console.log('🔍 Missing fields:', requiredFields.filter(field => !mappedProfileData || mappedProfileData[field] === undefined || mappedProfileData[field] === null));
                    
                    // Reset completion flag and continue
                    response.complete = false;
                    response.isComplete = false;
                }
            }
            
            // Reset status
            if (elements.chatStatus) {
                if (appState.langGraphReady) {
                    elements.chatStatus.className = 'chat-status ready';
                    elements.chatStatus.innerHTML = '<span class="status-indicator">🚀</span><span>Enhanced AI Coach ready!</span>';
                } else {
                    elements.chatStatus.className = 'chat-status ready';
                    elements.chatStatus.innerHTML = '<span class="status-indicator">✅</span><span>Ready to chat!</span>';
                }
            }
            
        } catch (error) {
            console.error('❌ Error in chat:', error);
            onboarding.addMessage("I'm having trouble connecting right now. Would you like to try the Quick Form instead?", 'ai');
            
            if (elements.chatStatus) {
                elements.chatStatus.className = 'chat-status';
                elements.chatStatus.innerHTML = '<span class="status-indicator">⚠️</span><span>Connection issue. Try Quick Form.</span>';
            }
        }
    },
    
    addMessage: (text, sender) => {
        if (!elements.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'ai' ? '🤖' : '👤';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${text}</div>
            </div>
        `;
        
        elements.chatMessages.appendChild(messageDiv);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    },

    processConversationalOnboarding: async (message) => {
        // Initialize conversation data if not exists
        if (!appState.onboardingData) {
            appState.onboardingData = {};
        }

        const userData = appState.onboardingData;
        const lowerMessage = message.toLowerCase();

        // Extract information from user's message
        onboarding.extractUserInfo(lowerMessage, userData);

        // Determine what information we still need
        const missingInfo = onboarding.getMissingInfo(userData);
        
        console.log('🔍 Current user data:', userData);
        console.log('🔍 Missing info:', missingInfo);

        if (missingInfo.length === 0) {
            // All information collected!
            const profileData = {
                userName: userData.name,
                currentWeight: userData.weight,
                weightUnit: userData.weightUnit || 'lbs',
                height: userData.height,
                heightUnit: userData.heightUnit || 'ft',
                age: userData.age,
                gender: userData.gender,
                goalWeight: userData.goalWeight,
                activityLevel: userData.activityLevel,
                primaryGoal: userData.primaryGoal
            };

            return {
                message: `Perfect! I have all the information I need. Welcome to Fitly, ${userData.name}! 🎉\n\nYour profile is being set up now. I'm excited to be your wellness companion and help you on your ${userData.primaryGoal} journey!`,
                complete: true,
                profileData: profileData
            };
        }

        // Generate appropriate response for next needed information
        let responseMessage;
        if (!userData.name) {
            responseMessage = "Great to meet you! What should I call you?";
        } else if (!userData.age) {
            responseMessage = `Nice to meet you, ${userData.name}! How old are you?`;
        } else if (!userData.weight) {
            responseMessage = "What's your current weight? (You can say something like '150 lbs' or '68 kg')";
        } else if (!userData.heightFeet && !userData.heightCm) {
            responseMessage = "What's your height? (You can say something like '5 feet 8 inches' or '170 cm')";
        } else if (!userData.gender) {
            responseMessage = "Are you male, female, or prefer not to specify?";
        } else if (!userData.primaryGoal) {
            responseMessage = "What's your main wellness goal? Are you looking to lose fat, build muscle, maintain your current weight, improve general health, or just track your habits?";
        } else if (!userData.activityLevel) {
            responseMessage = "How would you describe your current activity level? Are you mostly sedentary, lightly active, moderately active, very active, or does it vary (inconsistent)?";
        } else if (!userData.goalWeight && userData.primaryGoal === 'lose fat') {
            responseMessage = "Do you have a goal weight in mind? (This is optional - you can say 'no goal weight' if you prefer)";
        } else {
            // Fallback - shouldn't reach here
            responseMessage = "Is there anything else you'd like to tell me about your wellness goals?";
        }

        return {
            message: responseMessage,
            complete: false,
            profileData: null
        };
    },

    extractUserInfo: (message, userData) => {
        // Extract name
        const nameMatch = message.match(/(?:name is|i'm|i am|call me)\s+([a-zA-Z]+)/i) || 
                         message.match(/^([a-zA-Z]+)$/);
        if (nameMatch && !userData.name) {
            userData.name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
        }

        // Extract age
        const ageMatch = message.match(/(\d+)(?:\s+years?\s+old)?/i);
        if (ageMatch && parseInt(ageMatch[1]) >= 13 && parseInt(ageMatch[1]) <= 120) {
            userData.age = parseInt(ageMatch[1]);
        }

        // Extract weight
        const weightMatch = message.match(/(\d+(?:\.\d+)?)\s*(lbs?|pounds?|kg|kilograms?)/i);
        if (weightMatch) {
            userData.weight = parseFloat(weightMatch[1]);
            userData.weightUnit = weightMatch[2].toLowerCase().includes('kg') ? 'kg' : 'lbs';
        }

        // Extract height
        const heightFeetMatch = message.match(/(\d+)\s*(?:feet?|ft|')\s*(?:and\s*)?(\d+)?\s*(?:inches?|in|")?/i);
        const heightCmMatch = message.match(/(\d+)\s*(cm|centimeters?)/i);
        
        if (heightFeetMatch) {
            const feet = parseInt(heightFeetMatch[1]);
            const inches = heightFeetMatch[2] ? parseInt(heightFeetMatch[2]) : 0;
            userData.heightFeet = feet;
            userData.heightInches = inches;
            userData.heightUnit = 'imperial';
        } else if (heightCmMatch) {
            userData.heightCm = parseInt(heightCmMatch[1]);
            userData.heightUnit = 'metric';
        }

        // Extract gender
        if (message.includes('male') && !message.includes('female')) userData.gender = 'male';
        if (message.includes('female')) userData.gender = 'female';
        if (message.includes('other') || message.includes('non-binary') || message.includes('prefer not')) userData.gender = 'other';

        // Extract primary goal
        if (message.includes('lose') || message.includes('fat') || message.includes('weight loss')) userData.primaryGoal = 'lose-fat';
        if (message.includes('muscle') || message.includes('gain') || message.includes('build')) userData.primaryGoal = 'build-muscle';
        if (message.includes('maintain')) userData.primaryGoal = 'maintain';
        if (message.includes('health') || message.includes('general') || message.includes('wellness')) userData.primaryGoal = 'general-health';
        if (message.includes('track') || message.includes('tracking')) userData.primaryGoal = 'just-tracking';

        // Extract activity level
        if (message.includes('sedentary') || message.includes('desk job') || message.includes('sitting')) userData.activityLevel = 'sedentary';
        if (message.includes('lightly active') || message.includes('light exercise')) userData.activityLevel = 'lightly-active';
        if (message.includes('moderately active') || message.includes('moderate exercise')) userData.activityLevel = 'moderately-active';
        if (message.includes('very active') || message.includes('very')) userData.activityLevel = 'very-active';
        if (message.includes('inconsistent') || message.includes('varies') || message.includes('sporadic')) userData.activityLevel = 'inconsistent';

        // Extract goal weight
        if (userData.primaryGoal === 'lose-fat') {
            const goalWeightMatch = message.match(/(?:goal|target)?\s*(?:weight)?\s*(\d+(?:\.\d+)?)\s*(lbs?|kg)?/i);
            if (goalWeightMatch) {
                userData.goalWeight = parseFloat(goalWeightMatch[1]);
            } else if (message.includes('no goal') || message.includes('no target') || message.includes("don't have")) {
                userData.goalWeight = null; // Explicitly no goal weight
            }
        }
    },

    getMissingInfo: (userData) => {
        const required = ['name', 'age', 'weight', 'gender', 'primaryGoal', 'activityLevel'];
        const missing = [];

        for (const field of required) {
            if (!userData[field]) {
                missing.push(field);
            }
        }

        // Check height separately (can be either imperial or metric)
        if (!userData.heightFeet && !userData.heightCm) {
            missing.push('height');
        }

        // Special case: goal weight is only required for fat loss goals
        if (userData.primaryGoal === 'lose-fat' && userData.goalWeight === undefined) {
            missing.push('goalWeight');
        }

        return missing;
    },

    updateOnboardingProgress: (userMessage, aiResponse) => {
        if (!appState.onboardingProgress) return;

        const progress = appState.onboardingProgress;
        const userData = progress.collectedData;
        
        // Extract information from user's latest message
        onboarding.extractUserInfo(userMessage.toLowerCase(), userData);
        
        // Analyze AI response to understand what step we're on
        const aiMessage = aiResponse.message || aiResponse.motivationalMessage || '';
        
        // Update step based on what information we have and what the AI is asking for
        const collectedFields = Object.keys(userData).filter(key => userData[key] !== null && userData[key] !== undefined);
        
        console.log('🔍 Progress update:');
        console.log('  - Collected fields:', collectedFields);
        console.log('  - Current step:', progress.step);
        console.log('  - User data:', userData);
        
        // Determine current step based on collected information
        if (!userData.name) {
            progress.step = 1; // Asking for name
        } else if (!userData.age) {
            progress.step = 2; // Asking for age
        } else if (!userData.weight) {
            progress.step = 3; // Asking for weight
        } else if (!userData.heightFeet && !userData.heightCm) {
            progress.step = 4; // Asking for height
        } else if (!userData.gender) {
            progress.step = 5; // Asking for gender
        } else if (!userData.primaryGoal) {
            progress.step = 6; // Asking for goals
        } else if (!userData.activityLevel) {
            progress.step = 7; // Asking for activity level
        } else {
            progress.step = 8; // Should be complete
        }
        
        // Override completion if we don't have enough data
        if (progress.step < 8) {
            if (aiResponse.complete || aiResponse.isComplete) {
                console.log('⚠️ AI tried to complete early, overriding...');
                aiResponse.complete = false;
                aiResponse.isComplete = false;
            }
        }
        
        // Provide the collected data back to the response for proper tracking
        if (aiResponse.userData) {
            aiResponse.userData = { ...aiResponse.userData, ...userData };
        } else {
            aiResponse.userData = userData;
        }
        
        // Ensure weight field consistency for downstream validation
        if (aiResponse.userData.weight && !aiResponse.userData.currentWeight) {
            aiResponse.userData.currentWeight = aiResponse.userData.weight;
            console.log('🔧 Fixed currentWeight field in progress update:', aiResponse.userData.currentWeight);
        }
        
        // Update the progress data to persist between steps
        progress.collectedData = { ...progress.collectedData, ...userData };
        console.log('💾 Updated progress.collectedData:', progress.collectedData);
        
        console.log('✅ Progress updated - Step:', progress.step, '/', progress.maxSteps);
    },
    
    saveProfileData: async (profileData) => {
        console.log('💾 Saving profile from chat:', profileData);
        
        utils.showLoading(true);
        
        try {
            // Add timestamps
            const fullProfileData = {
                ...profileData,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            // Save to Firebase
            if (appState.currentUser) {
                await window.firebaseDB.saveUserProfile(appState.currentUser.uid, fullProfileData);
                appState.userProfile = fullProfileData;
                
                console.log('✅ Profile saved successfully, initializing dashboard...');
                utils.showNotification('Welcome to Fitly! Your profile has been saved.', 'success');
                
                // Initialize dashboard and switch to main app
                await dashboard.initialize();
                
                console.log('✅ Profile save and dashboard initialization complete');
            } else {
                throw new Error('No authenticated user found');
            }
            
                } catch (error) {
            console.error('❌ Error saving profile from chat:', error);
            console.error('❌ Profile data that failed to save:', fullProfileData);
            console.error('❌ Current user:', appState.currentUser);
            console.error('❌ Firebase DB available:', typeof window.firebaseDB);
            console.error('❌ Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            // More specific error message
            let errorMsg = 'Failed to save profile.';
            if (error.message.includes('Firebase')) {
                errorMsg = 'Firebase connection error. Please check your internet connection.';
            } else if (error.message.includes('auth')) {
                errorMsg = 'Authentication error. Please try signing in again.';
            } else if (!appState.currentUser) {
                errorMsg = 'No user logged in. Please sign in first.';
            } else if (!window.firebaseDB) {
                errorMsg = 'Database not available. Please refresh the page.';
            }
            
            utils.showNotification(`${errorMsg} You can try the form instead.`, 'error');
        } finally {
            utils.showLoading(false);
        }
    },

    hideChat: () => {
        console.log('🔒 Hiding onboarding chat interface...');
        
        // Hide the chat interface elements
        const chatContainer = document.getElementById('onboardingChat');
        const chatInput = document.getElementById('onboardingChatInput');
        const chatSendBtn = document.getElementById('onboardingChatSendBtn');
        
        if (chatContainer) {
            chatContainer.style.display = 'none';
            console.log('✅ Chat container hidden');
        }
        
        if (chatInput) {
            chatInput.disabled = true;
            console.log('✅ Chat input disabled');
        }
        
        if (chatSendBtn) {
            chatSendBtn.disabled = true;
            console.log('✅ Chat send button disabled');
        }
        
        // Show a completion message
        const completionMessage = document.createElement('div');
        completionMessage.innerHTML = `
            <div class="completion-message" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 2rem;
                border-radius: 15px;
                text-align: center;
                margin: 2rem 0;
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                <h2 style="margin: 0 0 1rem 0; font-size: 1.5rem;">Welcome to Fitly!</h2>
                <p style="margin: 0; opacity: 0.9;">Your profile is all set up. Redirecting to your dashboard...</p>
                <div style="margin-top: 1rem;">
                    <div class="loading-spinner" style="
                        width: 30px;
                        height: 30px;
                        border: 3px solid rgba(255,255,255,0.3);
                        border-top: 3px solid white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto;
                    "></div>
                </div>
            </div>
        `;
        
        const onboardingContent = document.querySelector('#onboardingScreen .screen-content');
        if (onboardingContent && chatContainer) {
            onboardingContent.insertBefore(completionMessage, chatContainer);
            console.log('✅ Completion message displayed');
        }
        
        console.log('✅ Onboarding chat interface hidden successfully');
    },

    handleSubmit: async (e) => {
        e.preventDefault();
        console.log('📋 Form submitted! Processing onboarding form...');
        console.log('📋 Event:', e);
        console.log('📋 Form element:', e.target);
        console.log('📋 Current user before form processing:', appState.currentUser);
        console.log('📋 Form data elements check:');
        
        // Validate form elements exist
        const formElement = elements.onboardingForm;
        if (!formElement) {
            console.error('❌ Form element not found in DOM!');
            return;
        }
        
        console.log('🔍 Form element validation passed');
        utils.showLoading(true);
        
        try {
            const formData = new FormData(formElement);
            console.log('📋 FormData created successfully');
            
            // Log all form fields
            console.log('📋 Form fields:');
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}: ${value}`);
            }
            
            const heightUnit = formData.get('heightUnit');
            let heightData = {};
            
            if (heightUnit === 'imperial') {
                heightData = {
                    heightUnit: 'imperial',
                    heightFeet: parseInt(formData.get('heightFeet')),
                    heightInches: parseInt(formData.get('heightInches')),
                    heightCm: null
                };
            } else {
                heightData = {
                    heightUnit: 'metric',
                    heightCm: parseInt(formData.get('heightCm')),
                    heightFeet: null,
                    heightInches: null
                };
            }
            
            const profileData = {
                userName: formData.get('userName'),
                currentWeight: parseFloat(formData.get('currentWeight')),
                weightUnit: formData.get('weightUnit'),
                ...heightData,
                age: parseInt(formData.get('age')),
                gender: formData.get('gender'),
                goalWeight: formData.get('goalWeight') ? parseFloat(formData.get('goalWeight')) : null,
                activityLevel: formData.get('activityLevel'),
                primaryGoal: formData.get('primaryGoal'),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            console.log('📋 Profile data constructed:', profileData);
            
            // Validate required fields
            const requiredFields = ['userName', 'currentWeight', 'age', 'gender', 'activityLevel', 'primaryGoal'];
            const missingFields = requiredFields.filter(field => !profileData[field]);
            
            // Check height separately based on unit
            if (heightUnit === 'imperial') {
                if (!profileData.heightFeet || profileData.heightInches === undefined) {
                    missingFields.push('height');
                }
            } else {
                if (!profileData.heightCm) {
                    missingFields.push('height');
                }
            }
            
            if (missingFields.length > 0) {
                console.error('❌ Missing required fields:', missingFields);
                utils.showNotification(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error');
                return;
            }
            
            console.log('✅ All required fields validated');
            
            // Ensure user is authenticated (should already be authenticated via email)
            if (!appState.currentUser) {
                console.error('❌ No current user found during profile submission');
                throw new Error('User not authenticated. Please sign in first.');
            }
            
            console.log('✅ User authenticated:', appState.currentUser.uid, appState.currentUser.email);
            
            // Save to Firebase
            if (appState.currentUser) {
                console.log('💾 Saving profile for user:', appState.currentUser.uid);
                console.log('🔍 Firebase DB available:', typeof window.firebaseDB !== 'undefined');
                
                if (!window.firebaseDB) {
                    throw new Error('Firebase DB not available');
                }
                
                await window.firebaseDB.saveUserProfile(appState.currentUser.uid, profileData);
                console.log('✅ Profile saved to Firebase successfully');
                
                appState.userProfile = profileData;
                console.log('✅ Profile stored in app state');
                
                console.log('✅ Profile saved successfully');
                utils.showNotification('Welcome to Fitly! Your profile has been saved.', 'success');
                
                // Force a small delay to ensure UI updates
                console.log('⏱️ Adding delay before dashboard initialization...');
                await new Promise(resolve => setTimeout(resolve, 100));
                
                console.log('🔄 Attempting to initialize dashboard...');
                console.log('🔍 Profile in appState before dashboard init:', appState.userProfile);
                
                try {
                    await dashboard.initialize();
                    console.log('✅ Dashboard initialized successfully');
                } catch (dashboardError) {
                    console.error('❌ Dashboard initialization failed:', dashboardError);
                    // Force switch to dashboard even if initialization fails partially
                    console.log('🔄 Force switching to dashboard as fallback...');
                    utils.switchScreen('dashboard');
                }
                
                console.log('✅ Onboarding form submit complete, should be on dashboard');
            } else {
                console.error('❌ No authenticated user found after sign in attempt');
                console.log('🔍 AppState current user:', appState.currentUser);
                throw new Error('No authenticated user found after sign in attempt');
            }
            
        } catch (error) {
            console.error('❌ Error saving profile:', error);
            console.error('❌ Error stack:', error.stack);
            utils.showNotification('Failed to save profile. Please try again.', 'error');
        } finally {
            utils.showLoading(false);
        }
    }
};

// Dashboard functions
const dashboard = {
    initialize: async () => {
        console.log('📊 Initializing dashboard...');
        console.log('📊 User profile available:', !!appState.userProfile);
        console.log('📊 User profile data:', appState.userProfile);
        console.log('📊 Current screen before dashboard init:', appState.currentScreen);
        console.log('📊 Current user:', appState.currentUser?.uid);
        
        if (!appState.userProfile) {
            console.error('❌ No user profile available for dashboard initialization');
            console.log('🔍 AppState contents:', appState);
            return;
        }
        
        try {
            console.log('📊 Step 1: Updating UI...');
            // Update UI with user data
            dashboard.updateUI();
            console.log('✅ Step 1 complete: UI updated');
            
            console.log('📊 Step 2: Loading today\'s data...');
            // Load today's data
            await dashboard.loadTodaysData();
            console.log('✅ Step 2 complete: Today\'s data loaded');
            
            console.log('📊 Step 3: Setting up event listeners...');
            // Set up event listeners
            dashboard.setupEventListeners();
            console.log('✅ Step 3 complete: Event listeners set up');
            
            console.log('📊 Step 4: Rendering meals list...');
            // Render today's meals
            dashboard.renderMealsList();
            console.log('✅ Step 4 complete: Meals list rendered');
            
            console.log('📊 Step 5: Switching to dashboard screen...');
            // Switch to dashboard screen
            utils.switchScreen('dashboard');
            console.log('✅ Step 5 complete: Screen switched');
            
            console.log('✅ Dashboard initialization complete - should now be visible');
            console.log('🔍 Final app state:', appState);
        } catch (error) {
            console.error('❌ Error during dashboard initialization:', error);
            console.error('❌ Dashboard init error stack:', error.stack);
        }
    },
    
    updateUI: () => {
        console.log('🎨 Updating dashboard UI...');
        const profile = appState.userProfile;
        console.log('🔍 Profile for UI update:', profile);
        
        // Update greeting
        if (elements.userGreeting) {
            const greeting = `Welcome back, ${profile.userName}! 🌟`;
            elements.userGreeting.textContent = greeting;
            console.log('✅ User greeting updated:', greeting);
        } else {
            console.log('⚠️ User greeting element not found');
        }
        
        // Calculate and display goals
        console.log('🔢 Calculating goals...');
        const calorieGoal = utils.calculateCalorieGoal(profile);
        const proteinGoal = utils.calculateProteinGoal(profile);
        
        if (elements.calorieGoal) {
            elements.calorieGoal.textContent = calorieGoal;
            console.log('✅ Calorie goal updated:', calorieGoal);
        } else {
            console.log('⚠️ Calorie goal element not found');
        }
        
        if (elements.proteinGoal) {
            const proteinText = `${proteinGoal}g`;
            elements.proteinGoal.textContent = proteinText;
            console.log('✅ Protein goal updated:', proteinText);
        } else {
            console.log('⚠️ Protein goal element not found');
        }
        
        // Update current weight display
        if (elements.currentWeightDisplay) {
            const weightText = `${profile.currentWeight} ${profile.weightUnit}`;
            elements.currentWeightDisplay.textContent = weightText;
            console.log('✅ Current weight updated:', weightText);
        } else {
            console.log('⚠️ Current weight display element not found');
        }
        
        console.log('✅ UI updated with user profile');
    },
    
    loadTodaysData: async () => {
        console.log('📅 Loading today\'s data...');
        console.log('🔍 Current user for data loading:', appState.currentUser?.uid);
        console.log('🔍 Firebase DB available:', typeof window.firebaseDB !== 'undefined');
        
        try {
            if (appState.currentUser) {
                console.log('📋 Loading today\'s meals...');
                // Load today's meals
                appState.todaysMeals = await window.firebaseDB.getTodaysMeals(appState.currentUser.uid);
                console.log('✅ Today\'s meals loaded:', appState.todaysMeals);
                
                console.log('🔢 Calculating daily nutrition...');
                // Calculate daily nutrition
                dashboard.calculateDailyNutrition();
                console.log('✅ Daily nutrition calculated:', appState.dailyNutrition);
                
                console.log('🎨 Updating nutrition display...');
                // Update nutrition display
                dashboard.updateNutritionDisplay();
                console.log('✅ Nutrition display updated');
                
                console.log('✅ Today\'s data loaded');
            } else {
                console.error('❌ No current user available for loading today\'s data');
            }
        } catch (error) {
            console.error('❌ Error loading today\'s data:', error);
            console.error('❌ Today\'s data error stack:', error.stack);
        }
    },
    
    calculateDailyNutrition: () => {
        console.log('🔢 Calculating daily nutrition from meals...');
        const nutrition = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            sugar: 0
        };
        
        console.log('🔍 Processing', appState.todaysMeals.length, 'meals');
        
        appState.todaysMeals.forEach((meal, index) => {
            console.log(`🍽️ Processing meal ${index + 1}:`, meal);
            if (meal.nutrition) {
                nutrition.calories += meal.nutrition.calories || 0;
                nutrition.protein += meal.nutrition.protein || 0;
                nutrition.carbs += meal.nutrition.carbs || 0;
                nutrition.fat += meal.nutrition.fat || 0;
                nutrition.sugar += meal.nutrition.sugar || 0;
                console.log(`✅ Meal ${index + 1} nutrition added`);
            } else {
                console.log(`⚠️ Meal ${index + 1} has no nutrition data`);
            }
        });
        
        appState.dailyNutrition = nutrition;
        console.log('✅ Daily nutrition calculated:', nutrition);
    },
    
    updateNutritionDisplay: () => {
        console.log('🎨 Updating nutrition display...');
        console.log('🔍 Daily nutrition data:', appState.dailyNutrition);
        console.log('🔍 User profile for goals:', appState.userProfile);
        
        const nutrition = appState.dailyNutrition;
        const profile = appState.userProfile;
        
        // Update calorie display
        if (elements.todayCalories) {
            elements.todayCalories.textContent = Math.round(nutrition.calories);
            console.log('✅ Calories display updated:', Math.round(nutrition.calories));
        } else {
            console.log('⚠️ Today calories element not found');
        }
        
        // Update protein display
        if (elements.todayProtein) {
            elements.todayProtein.textContent = `${Math.round(nutrition.protein)}g`;
            console.log('✅ Protein display updated:', `${Math.round(nutrition.protein)}g`);
        } else {
            console.log('⚠️ Today protein element not found');
        }
        
        // Update carbs display
        if (elements.todayCarbs) {
            elements.todayCarbs.textContent = `${Math.round(nutrition.carbs)}g`;
            console.log('✅ Carbs display updated:', `${Math.round(nutrition.carbs)}g`);
        } else {
            console.log('⚠️ Today carbs element not found');
        }
        
        // Update fats display
        if (elements.todayFats) {
            elements.todayFats.textContent = `${Math.round(nutrition.fat)}g`;
            console.log('✅ Fats display updated:', `${Math.round(nutrition.fat)}g`);
        } else {
            console.log('⚠️ Today fats element not found');
        }
        
        // Update sugar display
        if (elements.todaySugar) {
            elements.todaySugar.textContent = `${Math.round(nutrition.sugar)}g`;
            console.log('✅ Sugar display updated:', `${Math.round(nutrition.sugar)}g`);
        } else {
            console.log('⚠️ Today sugar element not found');
        }
        
        // Update progress bars if they exist
        if (profile) {
            const calorieGoal = utils.calculateCalorieGoal(profile);
            const proteinGoal = utils.calculateProteinGoal(profile);
            
            console.log('🔢 Calculating progress percentages...');
            console.log('  - Calorie progress:', `${nutrition.calories}/${calorieGoal}`);
            console.log('  - Protein progress:', `${nutrition.protein}/${proteinGoal}`);
            
            // Update progress bars (if elements exist)
            if (elements.carbsProgress) {
                const carbsPercentage = Math.min((nutrition.carbs / (calorieGoal * 0.5 / 4)) * 100, 100);
                elements.carbsProgress.style.width = `${carbsPercentage}%`;
                console.log('✅ Carbs progress bar updated:', `${Math.round(carbsPercentage)}%`);
            }
            
            if (elements.fatsProgress) {
                const fatsPercentage = Math.min((nutrition.fat / (calorieGoal * 0.3 / 9)) * 100, 100);
                elements.fatsProgress.style.width = `${fatsPercentage}%`;
                console.log('✅ Fats progress bar updated:', `${Math.round(fatsPercentage)}%`);
            }
            
            if (elements.sugarProgress) {
                const sugarLimit = 50; // Daily sugar limit in grams
                const sugarPercentage = Math.min((nutrition.sugar / sugarLimit) * 100, 100);
                elements.sugarProgress.style.width = `${sugarPercentage}%`;
                console.log('✅ Sugar progress bar updated:', `${Math.round(sugarPercentage)}%`);
            }
        }
        
        console.log('✅ Nutrition display update complete');
    },
    
    setupEventListeners: () => {
        console.log('👂 Setting up dashboard event listeners...');
        
        // Activity checkboxes
        if (elements.workedOutToday) {
            elements.workedOutToday.addEventListener('change', () => {
                console.log('💪 Worked out checkbox changed:', elements.workedOutToday.checked);
                dashboard.updateActivity();
            });
            console.log('✅ Worked out checkbox listener added');
        } else {
            console.log('⚠️ Worked out checkbox element not found');
        }
        
        if (elements.walkedToday) {
            elements.walkedToday.addEventListener('change', () => {
                console.log('🚶 Walked today checkbox changed:', elements.walkedToday.checked);
                dashboard.updateActivity();
            });
            console.log('✅ Walked today checkbox listener added');
        } else {
            console.log('⚠️ Walked today checkbox element not found');
        }
        
        // Action buttons
        if (elements.logMealBtn) {
            elements.logMealBtn.addEventListener('click', () => {
                console.log('🍽️ Log meal button clicked');
                meals.showMealModal();
            });
            console.log('✅ Log meal button listener added');
        } else {
            console.log('⚠️ Log meal button element not found');
        }
        
        if (elements.voiceLogBtn) {
            elements.voiceLogBtn.addEventListener('click', () => {
                console.log('🎤 Voice log button clicked');
                meals.startVoiceLog();
            });
            console.log('✅ Voice log button listener added');
        } else {
            console.log('⚠️ Voice log button element not found');
        }
        

        
        if (elements.updateWeightBtn) {
            elements.updateWeightBtn.addEventListener('click', () => {
                console.log('⚖️ Update weight button clicked');
                weight.showWeightModal();
            });
            console.log('✅ Update weight button listener added');
        } else {
            console.log('⚠️ Update weight button element not found');
        }
        
        // Modal event listeners
        if (elements.closeMealModal) {
            elements.closeMealModal.addEventListener('click', () => {
                console.log('❌ Close meal modal clicked');
                meals.hideMealModal();
            });
            console.log('✅ Close meal modal listener added');
        } else {
            console.log('⚠️ Close meal modal element not found');
        }
        
        if (elements.mealForm) {
            elements.mealForm.addEventListener('submit', (e) => {
                console.log('📝 Meal form submitted');
                meals.handleMealSubmit(e);
            });
            console.log('✅ Meal form submit listener added');
        } else {
            console.log('⚠️ Meal form element not found');
        }
        
        // Modal background click to close
        if (elements.mealModal) {
            elements.mealModal.addEventListener('click', (e) => {
                if (e.target === elements.mealModal) {
                    console.log('🔄 Meal modal background clicked, closing');
                    meals.hideMealModal();
                }
            });
            console.log('✅ Meal modal background click listener added');
        } else {
            console.log('⚠️ Meal modal element not found');
        }
        
        // Note: Profile modal event listeners are set up globally in setupGlobalEventListeners
        
        // Note: Profile modal keyboard shortcuts, tab switching, and form submissions are set up globally in setupGlobalEventListeners
        
        console.log('✅ Event listeners set up');
    },
    
    updateActivity: async () => {
        console.log('💪 Updating activity...');
        
        const activityData = {
            workedOut: elements.workedOutToday?.checked || false,
            walked: elements.walkedToday?.checked || false
        };
        
        try {
            if (appState.currentUser) {
                await window.firebaseDB.updateTodayActivity(appState.currentUser.uid, activityData);
                console.log('✅ Activity updated');
            }
        } catch (error) {
            console.error('❌ Error updating activity:', error);
        }
    },
    
    renderMealsList: () => {
        console.log('🍽️ Rendering meals list...');
        console.log('🔍 Today\'s meals:', appState.todaysMeals.length);
        
        if (!elements.todaysMealsList) {
            console.error('❌ Meals list element not found');
            return;
        }
        
        // Clear existing content
        elements.todaysMealsList.innerHTML = '';
        
        if (appState.todaysMeals.length === 0) {
            // Show no meals message
            elements.todaysMealsList.innerHTML = `
                <div class="no-meals-message">
                    <div class="no-meals-icon">🍽️</div>
                    <p>No meals logged today</p>
                    <p class="no-meals-subtitle">Click "Log Meal" to get started!</p>
                </div>
            `;
            console.log('✅ No meals message displayed');
            return;
        }
        
        // Render meal cards
        appState.todaysMeals.forEach((meal, index) => {
            const mealCard = dashboard.createMealCard(meal, index);
            elements.todaysMealsList.appendChild(mealCard);
        });
        
        console.log('✅ Rendered', appState.todaysMeals.length, 'meal cards');
    },
    
    createMealCard: (meal, index) => {
        const mealCard = document.createElement('div');
        mealCard.className = 'meal-card';
        
        // Format time
        const mealDate = meal.date instanceof Date ? meal.date : new Date(meal.date);
        const timeStr = mealDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Get source display info
        const sourceInfo = dashboard.getSourceInfo(meal.source);
        
        mealCard.innerHTML = `
            <div class="meal-header">
                <div>
                    <div class="meal-description">${meal.description}</div>
                    <div class="meal-time">🕐 ${timeStr}</div>
                </div>
                <div class="meal-source ${meal.source}">${sourceInfo}</div>
            </div>
            <div class="meal-nutrition">
                <div class="nutrition-item">
                    <div class="nutrition-value">${meal.nutrition.calories}</div>
                    <div class="nutrition-label">Calories</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${meal.nutrition.protein}g</div>
                    <div class="nutrition-label">Protein</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${meal.nutrition.carbs}g</div>
                    <div class="nutrition-label">Carbs</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${meal.nutrition.fat}g</div>
                    <div class="nutrition-label">Fat</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${meal.nutrition.sugar}g</div>
                    <div class="nutrition-label">Sugar</div>
                </div>
            </div>
        `;
        
        return mealCard;
    },
    
    getSourceInfo: (source) => {
        switch (source) {
            case 'database':
                return 'Database';
            case 'ai':
                return 'AI Analysis';
            case 'placeholder':
                return 'Estimate';
            default:
                return 'Unknown';
        }
    },
    
    // Refresh dashboard data and UI
    refreshData: async () => {
        console.log('🔄 Refreshing dashboard data...');
        
        try {
            // Update UI with any profile changes
            dashboard.updateUI();
            console.log('✅ UI refreshed');
            
            // Reload today's data
            await dashboard.loadTodaysData();
            console.log('✅ Today\'s data reloaded');
            
            // Update nutrition display
            dashboard.updateNutritionDisplay();
            console.log('✅ Nutrition display updated');
            
            // Re-render meals list
            dashboard.renderMealsList();
            console.log('✅ Meals list re-rendered');
            
            console.log('✅ Dashboard refresh complete');
        } catch (error) {
            console.error('❌ Error refreshing dashboard:', error);
        }
    }
};

// Meal management functions
const meals = {
    showMealModal: () => {
        console.log('🍽️ Showing meal modal...');
        if (elements.mealModal) {
            elements.mealModal.classList.add('active');
            if (elements.mealDescription) {
                elements.mealDescription.focus();
            }
        }
    },
    
    hideMealModal: () => {
        console.log('🍽️ Hiding meal modal...');
        if (elements.mealModal) {
            elements.mealModal.classList.remove('active');
        }
        if (elements.mealForm) {
            elements.mealForm.reset();
        }
        // Reset meal time to current time
        if (elements.mealTime) {
            const now = new Date();
            elements.mealTime.value = now.toISOString().slice(0, 16);
        }
    },
    
    handleMealSubmit: async (e) => {
        e.preventDefault();
        console.log('🍽️ Processing meal submission...');
        
        utils.showLoading(true);
        
        try {
            const formData = new FormData(elements.mealForm);
            const mealDescription = formData.get('mealDescription');
            const mealTimeString = formData.get('mealTime');
            
            // Parse nutrition from description
            const nutritionData = window.nutritionUtils.parseMealNutrition(mealDescription);
            
            let finalNutrition = null;
            let source = 'placeholder';
            
            if (nutritionData) {
                // Found nutrition data in static database
                finalNutrition = nutritionData.totalNutrition;
                source = 'database';
                console.log('✅ Nutrition found in database:', finalNutrition);
            } else {
                // Try AI analysis - Enhanced LangGraph first, then basic OpenAI
                console.log('⚠️ No nutrition data found in database, trying AI...');
                
                // Try enhanced LangGraph meal analysis first
                if (appState.langGraphReady && window.langGraphClient) {
                    try {
                        console.log('🚀 Trying enhanced LangGraph meal analysis...');
                        const mealAnalysisResult = await window.langGraphClient.analyzeMeal(
                            mealDescription,
                            appState.userProfile
                        );
                        
                        if (mealAnalysisResult && mealAnalysisResult.nutrition) {
                            finalNutrition = mealAnalysisResult.nutrition;
                            source = 'enhanced_ai';
                            console.log('✅ Nutrition analyzed by enhanced AI:', finalNutrition);
                            utils.showNotification('Meal analyzed by enhanced AI! 🚀', 'success');
                            
                            // Show any additional insights or suggestions
                            if (mealAnalysisResult.message) {
                                utils.showNotification(mealAnalysisResult.message, 'info');
                            }
                        } else {
                            throw new Error('Enhanced AI analysis failed');
                        }
                    } catch (error) {
                        console.error('❌ Enhanced AI analysis failed, trying basic AI:', error);
                        
                        // Fallback to basic OpenAI
                        if (await window.openaiAPI?.isConfigured()) {
                            try {
                                const aiNutrition = await window.openaiAPI.analyzeMeal(mealDescription);
                                if (aiNutrition) {
                                    finalNutrition = aiNutrition;
                                    source = 'ai';
                                    console.log('✅ Nutrition analyzed by basic AI:', finalNutrition);
                                    utils.showNotification('Meal analyzed by AI! 🤖', 'success');
                                } else {
                                    throw new Error('Basic AI analysis failed');
                                }
                            } catch (basicError) {
                                console.error('❌ Basic AI analysis also failed:', basicError);
                                finalNutrition = meals.getPlaceholderNutrition();
                                utils.showNotification('AI analysis failed, using estimate. Consider adding this food to the database!', 'info');
                            }
                        } else {
                            finalNutrition = meals.getPlaceholderNutrition();
                            utils.showNotification('Enhanced AI failed and no OpenAI key. Using estimate!', 'info');
                        }
                    }
                } else if (await window.openaiAPI?.isConfigured()) {
                    // No LangGraph, try basic OpenAI
                    try {
                        const aiNutrition = await window.openaiAPI.analyzeMeal(mealDescription);
                        if (aiNutrition) {
                            finalNutrition = aiNutrition;
                            source = 'ai';
                            console.log('✅ Nutrition analyzed by basic AI:', finalNutrition);
                            utils.showNotification('Meal analyzed by AI! 🤖', 'success');
                        } else {
                            throw new Error('AI analysis failed');
                        }
                    } catch (error) {
                        console.error('❌ AI analysis failed:', error);
                        finalNutrition = meals.getPlaceholderNutrition();
                        utils.showNotification('AI analysis failed, using estimate. Consider adding this food to the database!', 'info');
                    }
                } else {
                    finalNutrition = meals.getPlaceholderNutrition();
                    utils.showNotification('Meal logged with estimate. Add OpenAI API key for better analysis!', 'info');
                }
            }
            
            // Create meal log entry
            const mealData = {
                description: mealDescription,
                date: new Date(mealTimeString),
                nutrition: finalNutrition,
                source: source,
                confidence: finalNutrition.confidence || (source === 'database' ? 'high' : source === 'ai' ? 'medium' : 'low')
            };
            
            // Save to Firebase
            if (appState.currentUser) {
                await window.firebaseDB.addMealLog(appState.currentUser.uid, mealData);
                
                // Update local state
                appState.todaysMeals.push(mealData);
                dashboard.calculateDailyNutrition();
                dashboard.updateNutritionDisplay();
                dashboard.renderMealsList(); // Refresh the meals display
                
                utils.showNotification('Meal logged successfully!', 'success');
                meals.hideMealModal();
            }
            
        } catch (error) {
            console.error('❌ Error logging meal:', error);
            utils.showNotification('Failed to log meal. Please try again.', 'error');
        } finally {
            utils.showLoading(false);
        }
    },
    
    // Voice recording state and modal functions
    isVoiceRecording: false,
    currentRecordingPromise: null,
    recordingState: 'ready', // 'ready', 'recording', 'paused', 'processing'
    recordingStartTime: null,
    recordingTimer: null,
    finalTranscriptText: '',
    currentTranscriptText: '',
    
    showVoiceRecordingModal: () => {
        console.log('🎤 Showing voice recording modal...');
        
        // Hide loading spinner when modal appears to prevent z-index conflicts
        utils.showLoading(false);
        
        if (elements.voiceRecordingModal) {
            elements.voiceRecordingModal.classList.add('active');
            
            // Reset modal state to initial 'ready' state
            meals.recordingState = 'ready';
            meals.finalTranscriptText = '';
            meals.currentTranscriptText = '';
            
            // Reset UI elements
            if (elements.finalTranscript) elements.finalTranscript.textContent = '';
            if (elements.interimTranscript) elements.interimTranscript.textContent = '';
            if (elements.recordingTimer) elements.recordingTimer.textContent = '0:00';
            if (elements.recordingStatusText) elements.recordingStatusText.textContent = 'Ready to record';
            
            // Update button states
            meals.updateRecordingUI();
            
            console.log('✅ Voice recording modal shown, loading spinner hidden');
        } else {
            console.error('❌ Voice recording modal not found');
        }
    },
    
    hideVoiceRecordingModal: () => {
        console.log('🎤 Hiding voice recording modal...');
        
        if (elements.voiceRecordingModal) {
            elements.voiceRecordingModal.classList.remove('active');
            console.log('✅ Voice recording modal hidden');
        }
        
        // Reset recording state
        meals.isVoiceRecording = false;
        meals.currentRecordingPromise = null;
        meals.voiceCleanupDone = false; // Reset cleanup flag for next use
        meals.recordingState = 'ready';
        meals.finalTranscriptText = '';
        meals.currentTranscriptText = '';
        
        // Clear timers
        if (meals.recordingTimer) {
            clearInterval(meals.recordingTimer);
            meals.recordingTimer = null;
        }
        
        // Stop any ongoing recording
        if (window.langGraphClient && window.langGraphClient.stopVoiceLogging) {
            window.langGraphClient.stopVoiceLogging();
        }
    },

    updateRecordingUI: () => {
        const recordingStatus = document.querySelector('.recording-status');
        const pulseDot = document.getElementById('recordingPulseDot');
        const statusText = document.getElementById('recordingStatusText');
        const startStopBtn = document.getElementById('startStopRecordingBtn');
        const startStopIcon = document.getElementById('startStopIcon');
        const startStopText = document.getElementById('startStopText');
        const saveBtn = document.getElementById('saveRecordingBtn');
        
        // Remove all state classes
        if (recordingStatus) {
            recordingStatus.classList.remove('ready', 'recording', 'paused', 'processing');
            recordingStatus.classList.add(meals.recordingState);
        }
        
        if (pulseDot) {
            pulseDot.classList.remove('ready', 'recording', 'paused', 'processing');
            pulseDot.classList.add(meals.recordingState);
        }
        
        if (startStopBtn) {
            startStopBtn.classList.remove('recording', 'paused');
        }
        
        // Update UI based on current state
        switch (meals.recordingState) {
            case 'ready':
                if (statusText) statusText.textContent = 'Ready to record';
                if (startStopIcon) startStopIcon.textContent = '🎙️';
                if (startStopText) startStopText.textContent = 'Start Recording';
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.style.opacity = '0.6';
                }
                break;
                
            case 'recording':
                if (statusText) statusText.textContent = 'Recording...';
                if (startStopIcon) startStopIcon.textContent = '⏸️';
                if (startStopText) startStopText.textContent = 'Pause';
                if (startStopBtn) startStopBtn.classList.add('recording');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.style.opacity = '1';
                }
                break;
                
            case 'paused':
                if (statusText) statusText.textContent = 'Paused - Click to resume';
                if (startStopIcon) startStopIcon.textContent = '▶️';
                if (startStopText) startStopText.textContent = 'Resume';
                if (startStopBtn) startStopBtn.classList.add('paused');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.style.opacity = '1';
                }
                break;
                
            case 'processing':
                if (statusText) statusText.textContent = 'Processing...';
                if (startStopIcon) startStopIcon.textContent = '⏳';
                if (startStopText) startStopText.textContent = 'Processing';
                if (startStopBtn) startStopBtn.disabled = true;
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.style.opacity = '0.6';
                }
                break;
        }
    },
    
    toggleRecording: async () => {
        console.log('🎤 Toggle recording called, current state:', meals.recordingState);
        
        switch (meals.recordingState) {
            case 'ready':
                await meals.startRecording();
                break;
            case 'recording':
                meals.pauseRecording();
                break;
            case 'paused':
                await meals.resumeRecording();
                break;
            default:
                console.log('⚠️ Cannot toggle recording from state:', meals.recordingState);
        }
    },

    startRecording: async () => {
        console.log('🎤 Starting recording...');
        
        // Check if speech service is available
        if (!window.SpeechService || !window.SpeechService.isSupported()) {
            console.error('❌ Speech recognition not supported');
            utils.showNotification('Speech recognition is not supported in this browser!', 'error');
            return;
        }
        
        try {
            meals.recordingState = 'recording';
            meals.recordingStartTime = Date.now();
            meals.updateRecordingUI();
            
            // Start recording timer
            meals.startRecordingTimer();
            
            // Set up speech recognition callbacks
            const voiceLoggingOptions = {
                onStart: () => {
                    console.log('🎤 Voice recording started');
                },
                onTimer: (timeString) => {
                    // Timer is handled by our own timer function
                },
                onInterimTranscript: (transcript) => {
                    meals.currentTranscriptText = transcript;
                    if (elements.interimTranscript) {
                        elements.interimTranscript.textContent = transcript;
                    }
                },
                onFinalTranscript: (transcript) => {
                    meals.finalTranscriptText = transcript;
                    if (elements.finalTranscript) {
                        elements.finalTranscript.textContent = transcript;
                    }
                    if (elements.interimTranscript) {
                        elements.interimTranscript.textContent = '';
                    }
                },
                onEnd: () => {
                    console.log('🎤 Voice recording ended');
                },
                onError: (error) => {
                    console.error('🎤 Voice recording error:', error);
                    meals.recordingState = 'ready';
                    meals.updateRecordingUI();
                    utils.showNotification('Voice recording error: ' + error, 'error');
                }
            };
            
            // Start speech recognition
            meals.currentRecordingPromise = window.langGraphClient.startVoiceLogging(appState.userProfile, voiceLoggingOptions);
            
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            meals.recordingState = 'ready';
            meals.updateRecordingUI();
            utils.showNotification('Failed to start recording: ' + error.message, 'error');
        }
    },

    pauseRecording: () => {
        console.log('🎤 Pausing recording...');
        
        meals.recordingState = 'paused';
        meals.updateRecordingUI();
        
        // Stop recording timer
        if (meals.recordingTimer) {
            clearInterval(meals.recordingTimer);
            meals.recordingTimer = null;
        }
        
        // Stop speech recognition
        if (window.langGraphClient && window.langGraphClient.stopVoiceLogging) {
            window.langGraphClient.stopVoiceLogging();
        }
    },

    resumeRecording: async () => {
        console.log('🎤 Resuming recording...');
        
        meals.recordingState = 'recording';
        meals.updateRecordingUI();
        
        // Resume recording timer
        meals.startRecordingTimer();
        
        // Resume speech recognition
        try {
            const voiceLoggingOptions = {
                onStart: () => {
                    console.log('🎤 Voice recording resumed');
                },
                onInterimTranscript: (transcript) => {
                    meals.currentTranscriptText = transcript;
                    if (elements.interimTranscript) {
                        elements.interimTranscript.textContent = transcript;
                    }
                },
                onFinalTranscript: (transcript) => {
                    meals.finalTranscriptText = transcript;
                    if (elements.finalTranscript) {
                        elements.finalTranscript.textContent = transcript;
                    }
                    if (elements.interimTranscript) {
                        elements.interimTranscript.textContent = '';
                    }
                },
                onEnd: () => {
                    console.log('🎤 Voice recording ended');
                },
                onError: (error) => {
                    console.error('🎤 Voice recording error:', error);
                    meals.recordingState = 'ready';
                    meals.updateRecordingUI();
                    utils.showNotification('Voice recording error: ' + error, 'error');
                }
            };
            
            meals.currentRecordingPromise = window.langGraphClient.startVoiceLogging(appState.userProfile, voiceLoggingOptions);
            
        } catch (error) {
            console.error('❌ Failed to resume recording:', error);
            meals.recordingState = 'ready';
            meals.updateRecordingUI();
            utils.showNotification('Failed to resume recording: ' + error.message, 'error');
        }
    },

    startRecordingTimer: () => {
        meals.recordingTimer = setInterval(() => {
            if (meals.recordingStartTime) {
                const elapsed = Date.now() - meals.recordingStartTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (elements.recordingTimer) {
                    elements.recordingTimer.textContent = timeString;
                }
            }
        }, 1000);
    },

    saveRecording: async () => {
        console.log('🎤 Saving recording...');
        
        const transcript = meals.finalTranscriptText || meals.currentTranscriptText;
        
        if (!transcript || transcript.trim() === '') {
            utils.showNotification('No speech was recorded to save!', 'warning');
            return;
        }
        
        meals.recordingState = 'processing';
        meals.updateRecordingUI();
        
        try {
            // Stop any ongoing recording
            if (meals.recordingTimer) {
                clearInterval(meals.recordingTimer);
                meals.recordingTimer = null;
            }
            
            if (window.langGraphClient && window.langGraphClient.stopVoiceLogging) {
                window.langGraphClient.stopVoiceLogging();
            }
            
            // Process the transcript
            const result = {
                transcript: transcript,
                processingResult: { success: true, data: {} }
            };
            
            // Process the meal using the existing logic
            await meals.processSavedRecording(result);
            
        } catch (error) {
            console.error('❌ Failed to save recording:', error);
            meals.recordingState = 'ready';
            meals.updateRecordingUI();
            utils.showNotification('Failed to save recording: ' + error.message, 'error');
        }
    },

    processSavedRecording: async (result) => {
        console.log('🎤 Processing saved recording:', result);
        
        // Hide modal
        meals.hideVoiceRecordingModal();
        
        if (result && result.transcript) {
            console.log('✅ Voice transcript received:', result.transcript);
            
            // Show success notification
            utils.showNotification(`Voice logged: "${result.transcript}"`, 'success');
            
            // Process the meal description with existing logic
            const mealData = result.processingResult?.data || {};
            
            // Process the transcript with AI first
            let finalNutrition = null;
            let source = 'voice';
            
            // Try AI analysis - Enhanced LangGraph first, then basic OpenAI
            if (appState.langGraphReady && window.langGraphClient) {
                try {
                    console.log('🚀 Analyzing voice transcript with enhanced AI...');
                    const mealAnalysisResult = await window.langGraphClient.analyzeMeal(
                        result.transcript,
                        appState.userProfile
                    );
                    
                    if (mealAnalysisResult && mealAnalysisResult.nutrition) {
                        finalNutrition = mealAnalysisResult.nutrition;
                        source = 'ai';
                        console.log('✅ Voice transcript analyzed by AI:', finalNutrition);
                        utils.showNotification('Voice meal analyzed by AI! 🚀', 'success');
                    } else {
                        throw new Error('Enhanced AI analysis failed');
                    }
                } catch (error) {
                    console.error('❌ Enhanced AI analysis failed, trying basic AI:', error);
                    
                    // Fallback to basic OpenAI
                    if (await window.openaiAPI?.isConfigured()) {
                        try {
                            const aiNutrition = await window.openaiAPI.analyzeMeal(result.transcript);
                            if (aiNutrition) {
                                finalNutrition = aiNutrition;
                                source = 'ai';
                                console.log('✅ Voice transcript analyzed by basic AI:', finalNutrition);
                                utils.showNotification('Voice meal analyzed by AI! 🤖', 'success');
                            } else {
                                throw new Error('Basic AI analysis failed');
                            }
                        } catch (basicError) {
                            console.error('❌ Basic AI analysis also failed:', basicError);
                            finalNutrition = meals.getPlaceholderNutrition();
                            utils.showNotification('AI analysis failed, using estimate.', 'info');
                        }
                    } else {
                        finalNutrition = meals.getPlaceholderNutrition();
                        utils.showNotification('No AI available, using estimate.', 'info');
                    }
                }
            } else if (await window.openaiAPI?.isConfigured()) {
                // No LangGraph, try basic OpenAI
                try {
                    const aiNutrition = await window.openaiAPI.analyzeMeal(result.transcript);
                    if (aiNutrition) {
                        finalNutrition = aiNutrition;
                        source = 'ai';
                        console.log('✅ Voice transcript analyzed by basic AI:', finalNutrition);
                        utils.showNotification('Voice meal analyzed by AI! 🤖', 'success');
                    } else {
                        throw new Error('AI analysis failed');
                    }
                } catch (error) {
                    console.error('❌ AI analysis failed:', error);
                    finalNutrition = meals.getPlaceholderNutrition();
                    utils.showNotification('AI analysis failed, using estimate.', 'info');
                }
            } else {
                finalNutrition = meals.getPlaceholderNutrition();
                utils.showNotification('Voice logged with estimate. Add OpenAI API key for better analysis!', 'info');
            }
            
            const meal = {
                id: Date.now(),
                description: result.transcript,
                date: new Date(),
                nutrition: finalNutrition,
                source: source,
                confidence: finalNutrition.confidence || 'medium'
            };
            
            // Save to Firebase
            if (appState.currentUser) {
                try {
                    await window.firebaseDB.addMealLog(appState.currentUser.uid, meal);
                    console.log('✅ Meal saved to Firebase');
                } catch (firebaseError) {
                    console.error('⚠️ Firebase save failed:', firebaseError);
                }
            }
            
            // Update local state
            appState.todaysMeals.push(meal);
            dashboard.calculateDailyNutrition();
            dashboard.updateNutritionDisplay();
            dashboard.renderMealsList(); // Refresh the meals display
            
            utils.showNotification('Meal logged successfully!', 'success');
        } else {
            console.warn('⚠️ No transcript received from recording');
            utils.showNotification('No speech was detected in the recording.', 'warning');
        }
    },

    cancelRecording: () => {
        console.log('🎤 Cancelling recording...');
        
        // Stop any ongoing recording
        if (meals.recordingTimer) {
            clearInterval(meals.recordingTimer);
            meals.recordingTimer = null;
        }
        
        if (window.langGraphClient && window.langGraphClient.stopVoiceLogging) {
            window.langGraphClient.stopVoiceLogging();
        }
        
        // Hide modal without saving
        meals.hideVoiceRecordingModal();
        
        utils.showNotification('Recording cancelled', 'info');
    },

    startVoiceLog: async () => {
        console.log('🎤 Opening voice logging modal...');
        
        // Check if LangGraph speech capabilities are available
        if (!appState.langGraphReady || !window.langGraphClient) {
            console.log('⚠️ LangGraph not available, voice logging disabled');
            utils.showNotification('Voice logging requires enhanced AI features. Please ensure LangGraph is configured!', 'info');
            return;
        }
        
        // Check if speech service is available
        if (!window.SpeechService || !window.SpeechService.isSupported()) {
            console.log('⚠️ Speech recognition not supported');
            utils.showNotification('Speech recognition is not supported in this browser!', 'error');
            return;
        }
        
        // Show the voice recording modal (ready state)
        meals.showVoiceRecordingModal();
        
        console.log('✅ Voice recording modal opened - ready to record');
    },


    
    showManualMealInput: () => {
        console.log('📝 Showing manual meal input as speech alternative...');
        
        // Show the regular meal modal but with a note about it being an alternative to voice
        meals.showMealModal();
        
        // Add a helpful message
        setTimeout(() => {
            utils.showNotification('Type your meal description in the text area below', 'info');
        }, 500);
    },
    

    
    getPlaceholderNutrition: () => {
        return {
            calories: 400,
            protein: 20,
            carbs: 30,
            fat: 15,
            sugar: 5,
            confidence: 'low'
        };
    }
};

// Weight management functions
const weight = {
    showWeightModal: () => {
        console.log('⚖️ Weight update not implemented yet');
        utils.showNotification('Weight update will be implemented soon!', 'info');
        // TODO: Implement weight update modal
    }
};

// AI Assistant functions
const aiAssistant = {
    conversationHistory: [],
    isInitialized: false,

    initialize: async () => {
        if (aiAssistant.isInitialized) return;
        
        console.log('🤖 Initializing AI Assistant...');
        
        // Set up event listeners
        if (elements.assistantChatInput) {
            elements.assistantChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    aiAssistant.sendMessage();
                }
            });
        }
        
        if (elements.assistantSendBtn) {
            elements.assistantSendBtn.addEventListener('click', () => {
                aiAssistant.sendMessage();
            });
        }
        
        // Check capabilities (LangGraph or OpenAI)
        const isOpenAIConfigured = await window.openaiAPI?.isConfigured();
        const hasAICapability = appState.langGraphReady || isOpenAIConfigured;
        
        console.log('🔍 AI Assistant capabilities:');
        console.log('  - LangGraph ready:', appState.langGraphReady);
        console.log('  - OpenAI configured:', isOpenAIConfigured);
        console.log('  - Has AI capability:', hasAICapability);
        
        if (!hasAICapability) {
            aiAssistant.addMessage("I need an OpenAI API key to help you with comprehensive wellness assistance. Please configure your API key!", 'system');
            if (elements.assistantChatStatus) {
                elements.assistantChatStatus.innerHTML = '<span class="status-indicator">⚠️</span><span>OpenAI API key needed</span>';
            }
        } else {
            // Show enhanced status if LangGraph is available
            if (elements.assistantChatStatus) {
                elements.assistantChatStatus.innerHTML = '<span class="status-indicator">🤖</span><span>Your AI coach is ready!</span>';
                aiAssistant.addMessage("Hello! I'm your AI wellness coach, here to help you achieve your health goals. I can assist with meal logging, nutrition analysis, and personalized coaching insights. Try telling me about your meals like 'I just ate a chicken salad' or ask 'How am I doing with my goals?'", 'ai');
            }
        }
        
        // Update live stats
        await aiAssistant.updateLiveStats();
        
        aiAssistant.isInitialized = true;
        console.log('✅ AI Assistant initialized');
    },

    sendMessage: async () => {
        const message = elements.assistantChatInput?.value?.trim();
        if (!message) return;
        
        console.log('🤖 Sending message to AI assistant:', message);
        
        // Clear input
        elements.assistantChatInput.value = '';
        
        // Add user message
        aiAssistant.addMessage(message, 'user');
        
        // Show thinking status
        if (elements.assistantChatStatus) {
            elements.assistantChatStatus.innerHTML = '<span class="status-indicator">🤔</span><span>Thinking...</span>';
        }
        
        try {
            let response;
            
            // Use advanced coaching workflow if available
            if (appState.langGraphReady && window.langGraphClient) {
                console.log('🤖 Using advanced AI coaching workflow...');
                
                // Get current user data for context
                const userProfile = appState.userProfile;
                const recentData = {
                    calories: appState.dailyNutrition?.calories || 0,
                    recentMeals: appState.todaysMeals?.slice(-2).map(m => m.description).join(', ') || 'None',
                    dailyNutrition: appState.dailyNutrition,
                    todaysMeals: appState.todaysMeals
                };
                
                // Use coaching workflow for comprehensive assistance
                response = await window.langGraphClient.getCoaching(
                    message,
                    userProfile,
                    recentData
                );
                
                console.log('🤖 AI coaching response:', response);
                
                // *** NEW: Auto-detect and log meals/activities from user messages ***
                await aiAssistant.detectAndLogFromMessage(message, userProfile);
                
                // Transform LangGraph coaching response to expected format
                if (response && response.motivationalMessage) {
                    // Create a comprehensive response message
                    let responseMessage = response.motivationalMessage;
                    
                    // Add insights if available
                    if (response.insights && response.insights.length > 0) {
                        responseMessage += '\n\n📊 **Insights:**\n';
                        response.insights.forEach(insight => {
                            responseMessage += `${insight.emoji || '•'} ${insight.message}\n`;
                        });
                    }
                    
                    // Add suggestions if available
                    if (response.suggestions && response.suggestions.length > 0) {
                        responseMessage += '\n💡 **Suggestions:**\n';
                        response.suggestions.forEach(suggestion => {
                            responseMessage += `• ${suggestion}\n`;
                        });
                    }
                    
                    // Add action items if available
                    if (response.actionItems && response.actionItems.length > 0) {
                        responseMessage += '\n✅ **Quick Actions:**\n';
                        response.actionItems.forEach(action => {
                            responseMessage += `• ${action}\n`;
                        });
                    }
                    
                    // Transform to expected format
                    response = {
                        message: responseMessage,
                        actionData: null // LangGraph handles actions differently
                    };
                } else {
                    console.warn('⚠️ LangGraph response missing expected format, using fallback');
                    response = {
                        message: response?.motivationalMessage || "I'm here to help you on your wellness journey!",
                        actionData: null
                    };
                }
                
                // Handle enhanced response format
                if (response.actions && response.actions.length > 0) {
                    // Process any actions
                    for (const action of response.actions) {
                        if (action.type === 'meal') {
                            await aiAssistant.logMealFromAI(action.data);
                        } else if (action.type === 'activity') {
                            await aiAssistant.logActivityFromAI(action.data);
                        } else if (action.type === 'weight') {
                            await aiAssistant.logWeightFromAI(action.data);
                        }
                    }
                }
            } else {
                console.log('🤖 Using basic comprehensive chat...');
                // Fallback to basic comprehensive chat
                const userProfile = appState.userProfile;
                const recentData = {
                    calories: appState.dailyNutrition?.calories || 0,
                    recentMeals: appState.todaysMeals?.slice(-2).map(m => m.description).join(', ') || 'None'
                };
                
                response = await window.openaiAPI.comprehensiveChat(
                    message, 
                    aiAssistant.conversationHistory, 
                    userProfile, 
                    recentData
                );
                
                // *** NEW: Auto-detect and log meals/activities from user messages ***
                await aiAssistant.detectAndLogFromMessage(message, userProfile);
                
                // Process any action data
                if (response.actionData) {
                    await aiAssistant.processAction(response.actionData);
                }
            }
            
            // Add to conversation history
            aiAssistant.conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: response.message }
            );
            
            // Add AI message
            aiAssistant.addMessage(response.message, 'ai');
            
            // Reset status
            if (elements.assistantChatStatus) {
                elements.assistantChatStatus.innerHTML = '<span class="status-indicator">🤖</span><span>Your AI coach is ready!</span>';
            }
            
        } catch (error) {
            console.error('❌ Error in AI assistant:', error);
            aiAssistant.addMessage("I'm having trouble connecting right now. Please try again in a moment.", 'ai');
            
            if (elements.assistantChatStatus) {
                elements.assistantChatStatus.innerHTML = '<span class="status-indicator">⚠️</span><span>Connection issue</span>';
            }
        }
    },

    addMessage: (text, sender) => {
        if (!elements.assistantChatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        let avatar;
        switch(sender) {
            case 'ai': avatar = '🤖'; break;
            case 'user': avatar = '👤'; break;
            case 'system': avatar = '⚠️'; break;
            default: avatar = '💬'; break;
        }
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${text}</div>
            </div>
        `;
        
        elements.assistantChatMessages.appendChild(messageDiv);
        elements.assistantChatMessages.scrollTop = elements.assistantChatMessages.scrollHeight;
    },

    processAction: async (actionData) => {
        console.log('🎬 Processing AI action:', actionData);
        
        try {
            switch(actionData.type) {
                case 'meal':
                    await aiAssistant.logMealFromAI(actionData.data);
                    break;
                case 'activity':
                    await aiAssistant.logActivityFromAI(actionData.data);
                    break;
                case 'weight':
                    await aiAssistant.logWeightFromAI(actionData.data);
                    break;
                default:
                    console.log('Unknown action type:', actionData.type);
            }
            
            // Update live stats after any action
            await aiAssistant.updateLiveStats();
            
        } catch (error) {
            console.error('❌ Error processing AI action:', error);
            aiAssistant.addMessage("I had trouble logging that. Could you try again?", 'system');
        }
    },

    logMealFromAI: async (mealData) => {
        console.log('🍽️ Logging meal from AI:', mealData);
        
        if (!appState.currentUser) {
            throw new Error('No authenticated user');
        }
        
        const mealLog = {
            description: mealData.description,
            date: new Date(),
            nutrition: mealData.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
            source: 'ai_assistant',
            confidence: 'high'
        };
        
        // Save to Firebase
        await window.firebaseDB.addMealLog(appState.currentUser.uid, mealLog);
        
        // Update local state
        appState.todaysMeals.push(mealLog);
        dashboard.calculateDailyNutrition();
        
        // Add to recent logs
        aiAssistant.addRecentLog(`🍽️ ${mealData.description}`);
        
        utils.showNotification('Meal logged successfully!', 'success');
    },

    logActivityFromAI: async (activityData) => {
        console.log('🏃 Logging activity from AI:', activityData);
        
        // Add to recent logs (for now, until we implement full activity tracking)
        aiAssistant.addRecentLog(`🏃 ${activityData.description} (${activityData.duration || 0} min)`);
        
        utils.showNotification('Activity logged successfully!', 'success');
    },

    logWeightFromAI: async (weightData) => {
        console.log('⚖️ Logging weight from AI:', weightData);
        
        // Add to recent logs (for now, until we implement full weight tracking)
        aiAssistant.addRecentLog(`⚖️ Weight: ${weightData.weight} ${weightData.unit}`);
        
        utils.showNotification('Weight logged successfully!', 'success');
    },

    quickLog: async (type) => {
        if (type === 'progress') {
            // Actually show real progress data instead of generic message
            console.log('📊 Fetching real progress data...');
            
            try {
                utils.showLoading(true, 'Checking your progress...');
                
                let progressMessage = "📊 **Your Progress Today:**\n\n";
                
                // Get today's meals
                const todaysMeals = appState.todaysMeals || [];
                const totalCalories = appState.dailyNutrition?.calories || 0;
                const totalProtein = appState.dailyNutrition?.protein || 0;
                
                progressMessage += `🍽️ **Meals Logged:** ${todaysMeals.length}\n`;
                progressMessage += `🔥 **Total Calories:** ${totalCalories}\n`;
                progressMessage += `💪 **Protein:** ${totalProtein}g\n\n`;
                
                if (todaysMeals.length > 0) {
                    progressMessage += "**Recent Meals:**\n";
                    todaysMeals.slice(-3).forEach(meal => {
                        const time = new Date(meal.date || meal.timestamp).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                        });
                        progressMessage += `• ${meal.description} (${time})\n`;
                    });
                } else {
                    progressMessage += "No meals logged today. Try saying 'I had [food]' to log a meal!\n";
                }
                
                // Goal progress
                const userGoal = appState.userProfile?.primary_goal;
                if (userGoal) {
                    progressMessage += `\n🎯 **Goal:** ${userGoal}\n`;
                    
                    if (userGoal === 'lose fat' && totalCalories > 0) {
                        progressMessage += totalCalories < 1800 ? "✅ Good calorie management!\n" : "⚠️ Consider lighter meals\n";
                    } else if (userGoal === 'build muscle' && totalProtein > 0) {
                        progressMessage += totalProtein >= 100 ? "✅ Great protein intake!\n" : "💡 Try adding more protein\n";
                    }
                }
                
                aiAssistant.addMessage(progressMessage, 'ai');
                
            } catch (error) {
                console.error('❌ Error fetching progress:', error);
                aiAssistant.addMessage("I had trouble fetching your progress. Please try again.", 'ai');
            } finally {
                utils.showLoading(false);
            }
            return;
        }
        
        // Original prompts for other types
        const prompts = {
            meal: "What did you eat? Please describe your meal and I'll help you log it with nutritional information.",
            activity: "What activity or exercise did you do? Tell me about the type and duration, and I'll log it for you.",
            weight: "What's your current weight? I'll help you track your weight progress."
        };
        
        const prompt = prompts[type] || "How can I help you today?";
        
        // Have the AI ask the question instead of filling the input
        aiAssistant.addMessage(prompt, 'ai');
        
        // Focus the input for user response
        if (elements.assistantChatInput) {
            elements.assistantChatInput.focus();
        }
    },

    updateLiveStats: async () => {
        console.log('📊 Updating live stats...');
        
        try {
            // Update calories
            const totalCalories = appState.dailyNutrition?.calories || 0;
            if (elements.liveCalories) {
                elements.liveCalories.textContent = totalCalories;
            }
            
            // Update protein
            const totalProtein = appState.dailyNutrition?.protein || 0;
            if (elements.liveProtein) {
                elements.liveProtein.textContent = `${totalProtein}g`;
            }
            
            // Update activities (count of meals for now)
            const activityCount = appState.todaysMeals?.length || 0;
            if (elements.liveActivities) {
                elements.liveActivities.textContent = activityCount;
            }
            
            // Update weight (from profile)
            const currentWeight = appState.userProfile?.currentWeight || '--';
            const weightUnit = appState.userProfile?.weightUnit || '';
            if (elements.liveWeight) {
                elements.liveWeight.textContent = currentWeight !== '--' ? `${currentWeight} ${weightUnit}` : '--';
            }
            
        } catch (error) {
            console.error('❌ Error updating live stats:', error);
        }
    },

    addRecentLog: (logText) => {
        if (!elements.recentLogsList) return;
        
        // Remove "no logs" message if it exists
        const noLogsMsg = elements.recentLogsList.querySelector('.no-logs');
        if (noLogsMsg) {
            noLogsMsg.remove();
        }
        
        // Add new log
        const logDiv = document.createElement('div');
        logDiv.className = 'log-item';
        logDiv.textContent = logText;
        
        // Add to top of list
        elements.recentLogsList.insertBefore(logDiv, elements.recentLogsList.firstChild);
        
        // Limit to 5 recent logs
        const logs = elements.recentLogsList.querySelectorAll('.log-item');
        if (logs.length > 5) {
            logs[logs.length - 1].remove();
        }
    },

    detectAndLogFromMessage: async (message, userProfile) => {
        console.log('🔍 Analyzing message for meals/activities:', message);
        
        try {
            const lowerMessage = message.toLowerCase();
            
            // Enhanced meal detection patterns
            const mealPatterns = [
                /(?:i had|i ate|i just had|just ate|for (?:breakfast|lunch|dinner|snack))\s*:?\s*([^.!?]+)/i,
                /(?:had|ate)\s+(a|an|some|the)?\s*([^.!?]+)(?:\s+for\s+(?:breakfast|lunch|dinner|snack))?/i,
                /(?:breakfast|lunch|dinner|snack)\s*:?\s*([^.!?]+)/i
            ];
            
            // Activity detection patterns  
            const activityPatterns = [
                /(?:i did|just did|went for|did some|i ran|i walked|i sprinted|went)\s+(?:a|an|some)?\s*([^.!?]+)/i,
                /(?:workout|exercise|training|cardio|running|walking|cycling|swimming|lifting)\s*:?\s*([^.!?]*)/i,
                /(\d+)\s*(?:mile|miles|km|minutes?|mins?|hours?)\s+(?:of\s+)?([^.!?]+)/i
            ];
            
            let detectedMeal = null;
            let detectedActivity = null;
            
            // Try to detect meals
            for (const pattern of mealPatterns) {
                const match = message.match(pattern);
                if (match && match[1]) {
                    let description = match[1].trim();
                    // Clean up the description
                    description = description.replace(/^(a|an|some|the)\s+/i, '');
                    description = description.replace(/\s*\.$/, '');
                    
                    if (description.length > 3) { // Must be at least 4 characters
                        detectedMeal = description;
                        break;
                    }
                }
            }
            
            // Try to detect activities  
            for (const pattern of activityPatterns) {
                const match = message.match(pattern);
                if (match && match[1]) {
                    let description = match[1].trim();
                    description = description.replace(/^(a|an|some|the)\s+/i, '');
                    description = description.replace(/\s*\.$/, '');
                    
                    if (description.length > 3) {
                        detectedActivity = description;
                        break;
                    }
                }
            }
            
            // Log detected meal
            if (detectedMeal && appState.currentUser) {
                console.log('🍽️ Auto-detected meal:', detectedMeal);
                
                // Generate basic nutrition estimate
                const estimatedNutrition = aiAssistant.estimateNutrition(detectedMeal);
                
                const mealData = {
                    description: detectedMeal,
                    nutrition: estimatedNutrition,
                    source: 'ai_auto_detect',
                    timestamp: new Date().toISOString(),
                    confidence: 'medium'
                };
                
                // Save to Firebase
                await window.firebaseDB.addMealLog(appState.currentUser.uid, mealData);
                
                // Update local state
                appState.todaysMeals.push(mealData);
                dashboard.calculateDailyNutrition();
                dashboard.updateNutritionDisplay();
                dashboard.renderMealsList();
                
                // *** FIX: Update AI Assistant live stats panel ***
                await aiAssistant.updateLiveStats();
                
                // Show confirmation
                utils.showNotification(`✅ Logged: ${detectedMeal}`, 'success');
                aiAssistant.addRecentLog(`🍽️ ${detectedMeal} (auto-logged)`);
                
                console.log('✅ Meal auto-logged successfully');
            }
            
            // Log detected activity
            if (detectedActivity && appState.currentUser) {
                console.log('🏃 Auto-detected activity:', detectedActivity);
                
                // For now, just add to recent logs (can expand to full activity tracking later)
                utils.showNotification(`✅ Activity noted: ${detectedActivity}`, 'success');
                aiAssistant.addRecentLog(`🏃 ${detectedActivity} (auto-logged)`);
                
                console.log('✅ Activity auto-logged successfully');
            }
            
        } catch (error) {
            console.error('❌ Error in auto-detection:', error);
            // Fail silently - don't interrupt the conversation
        }
    },
    
    estimateNutrition: (foodDescription) => {
        const lower = foodDescription.toLowerCase();
        
        // Basic nutrition estimates for common foods
        const nutritionMap = {
            // Common meals
            'pancakes': { calories: 350, protein: 8, carbs: 45, fat: 12, sugar: 15 },
            'eggs': { calories: 140, protein: 12, carbs: 1, fat: 10, sugar: 0 },
            'oatmeal': { calories: 150, protein: 5, carbs: 30, fat: 3, sugar: 12 },
            'toast': { calories: 200, protein: 6, carbs: 30, fat: 4, sugar: 3 },
            'cereal': { calories: 200, protein: 4, carbs: 40, fat: 2, sugar: 20 },
            
            // Lunch/dinner foods
            'chicken': { calories: 250, protein: 25, carbs: 0, fat: 14, sugar: 0 },
            'salad': { calories: 150, protein: 5, carbs: 15, fat: 8, sugar: 8 },
            'pasta': { calories: 400, protein: 15, carbs: 60, fat: 8, sugar: 5 },
            'penne vodka': { calories: 650, protein: 35, carbs: 65, fat: 25, sugar: 8 },
            'sandwich': { calories: 350, protein: 18, carbs: 35, fat: 15, sugar: 5 },
            'pizza': { calories: 500, protein: 20, carbs: 45, fat: 25, sugar: 8 },
            'burger': { calories: 550, protein: 25, carbs: 40, fat: 30, sugar: 6 },
            'rice': { calories: 300, protein: 6, carbs: 60, fat: 2, sugar: 1 },
            'soup': { calories: 200, protein: 8, carbs: 20, fat: 8, sugar: 5 }
        };
        
        // Try to find matching food
        for (const [food, nutrition] of Object.entries(nutritionMap)) {
            if (lower.includes(food)) {
                return nutrition;
            }
        }
        
        // Default estimate for unknown foods
        return { calories: 300, protein: 15, carbs: 35, fat: 12, sugar: 8 };
    }
};

// Make key objects globally accessible
window.aiAssistant = aiAssistant;
window.utils = utils;
window.dashboard = dashboard;

// Make height toggle functions globally accessible for HTML onchange events
window.toggleHeightInputs = utils.toggleHeightInputs;
window.toggleUpdateHeightInputs = utils.toggleUpdateHeightInputs;

// Global event listeners that need to be available regardless of current screen
const setupGlobalEventListeners = () => {
    console.log('🌐 Setting up global event listeners...');
    
    // Profile modal close button
    const closeProfileModal = document.getElementById('closeProfileModal');
    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => {
            utils.closeProfileModal();
        });
    }
    
    // Modal background click to close
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                utils.closeProfileModal();
            }
        });
    }
    
    // Tab switching in profile modal
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-tab');
            if (targetTab) {
                switchTab(targetTab);
            }
        });
    });
    
    // Form submissions
    const profileUpdateForm = document.getElementById('profileUpdateForm');
    if (profileUpdateForm) {
        profileUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await utils.updateProfile(new FormData(e.target));
        });
    }
    
    const goalsUpdateForm = document.getElementById('goalsUpdateForm');
    if (goalsUpdateForm) {
        goalsUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await utils.updateGoals(new FormData(e.target));
        });
    }
    
    // AI Assistant chat functionality
    const assistantSendBtn = document.getElementById('assistantSendBtn');
    const assistantChatInput = document.getElementById('assistantChatInput');
    
    if (assistantSendBtn) {
        assistantSendBtn.addEventListener('click', () => {
            if (window.aiAssistant && window.aiAssistant.sendMessage) {
                window.aiAssistant.sendMessage();
            }
        });
    }
    
    if (assistantChatInput) {
        assistantChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (window.aiAssistant && window.aiAssistant.sendMessage) {
                    window.aiAssistant.sendMessage();
                }
            }
        });
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            utils.toggleDarkMode(e.target.checked);
        });
    }
    
    // Voice logging button
    const voiceLogBtn = document.getElementById('voiceLogBtn');
    if (voiceLogBtn) {
        voiceLogBtn.addEventListener('click', () => {
            if (window.aiAssistant && window.aiAssistant.startVoiceLogging) {
                window.aiAssistant.startVoiceLogging();
            }
        });
    }
    
    // Voice recording modal event listeners
    const closeVoiceModal = document.getElementById('closeVoiceModal');
    if (closeVoiceModal) {
        closeVoiceModal.addEventListener('click', () => {
            meals.hideVoiceRecordingModal();
        });
    }
    
    const startStopRecordingBtn = document.getElementById('startStopRecordingBtn');
    if (startStopRecordingBtn) {
        startStopRecordingBtn.addEventListener('click', () => {
            meals.toggleRecording();
        });
    }
    
    const saveRecordingBtn = document.getElementById('saveRecordingBtn');
    if (saveRecordingBtn) {
        saveRecordingBtn.addEventListener('click', () => {
            meals.saveRecording();
        });
    }
    
    const cancelRecordingBtn = document.getElementById('cancelRecordingBtn');
    if (cancelRecordingBtn) {
        cancelRecordingBtn.addEventListener('click', () => {
            meals.cancelRecording();
        });
    }
    
    // Voice recording modal background click to close
    const voiceRecordingModal = document.getElementById('voiceRecordingModal');
    if (voiceRecordingModal) {
        voiceRecordingModal.addEventListener('click', (e) => {
            if (e.target === voiceRecordingModal) {
                meals.hideVoiceRecordingModal();
            }
        });
    }
    
    // Quick action buttons
    const quickActionButtons = document.querySelectorAll('.quick-action-btn');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const buttonText = e.target.textContent || e.target.innerText;
            if (buttonText.includes('Log Meal')) {
                if (window.aiAssistant && window.aiAssistant.quickLog) {
                    window.aiAssistant.quickLog('meal');
                }
            } else if (buttonText.includes('Log Activity')) {
                if (window.aiAssistant && window.aiAssistant.quickLog) {
                    window.aiAssistant.quickLog('activity');
                }
            } else if (buttonText.includes('Log Weight')) {
                if (window.aiAssistant && window.aiAssistant.quickLog) {
                    window.aiAssistant.quickLog('weight');
                }
            } else if (buttonText.includes('Check Progress')) {
                if (window.aiAssistant && window.aiAssistant.quickLog) {
                    window.aiAssistant.quickLog('progress');
                }
            }
        });
    });
    
    console.log('✅ Global event listeners set up successfully');
};

// Tab switching function
const switchTab = (tabName) => {
    console.log('🔄 Switching to tab:', tabName);
    
    // Remove active class from all tab buttons and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab button and content
    const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
    const targetContent = document.getElementById(`${tabName}Tab`);
    
    if (targetButton) {
        targetButton.classList.add('active');
    }
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    console.log('✅ Tab switched to:', tabName);
};

// Initialize the application
const init = async () => {
    console.log('🚀 Starting Fitly initialization...');
    
    try {
        // Wait for Firebase to be ready
        console.log('⏳ Waiting for Firebase to initialize...');
        console.log('🔍 window.firebaseReady available:', typeof window.firebaseReady);
        
        const firebaseConfigured = await window.firebaseReady;
        console.log('🔐 Firebase initialization complete. Configured:', firebaseConfigured);
        
        // Initialize enhanced AI features
        console.log('🤖 Initializing AI features...');
        console.log('🔍 Enhanced AI client available:', typeof window.LangGraphClient);
        
        if (window.LangGraphClient) {
            window.langGraphClient = new window.LangGraphClient();
            const enhancedReady = await window.langGraphClient.initialize();
            appState.langGraphReady = enhancedReady;
            console.log('🤖 AI features initialized. Enhanced mode:', enhancedReady);
        } else {
            console.log('⚠️ Enhanced AI not available, using basic mode');
            appState.langGraphReady = false;
        }
        
        console.log('🔐 About to initialize authentication...');
        console.log('🔍 window.firebaseAuth available:', typeof window.firebaseAuth);
        
        // Initialize authentication
        console.log('🔐 Initializing authentication...');
        await authModule.initialize();
        console.log('✅ Authentication initialized successfully');
        
        // Initialize onboarding
        console.log('📝 Initializing onboarding...');
        await onboarding.initialize();
        console.log('✅ Onboarding initialized successfully');
        
        // Initialize dashboard
        console.log('📊 Initializing dashboard...');
        await dashboard.initialize();
        console.log('✅ Dashboard initialized successfully');
        
        // Set up global event listeners
        console.log('🌐 Setting up global event listeners...');
        setupGlobalEventListeners();
        console.log('✅ Global event listeners set up successfully');
        
        console.log('✅ Fitly app initialized successfully');
        console.log('🔍 Final app state:', {
            currentUser: appState.currentUser?.uid || 'none',
            userProfile: !!appState.userProfile,
            currentScreen: appState.currentScreen,
            langGraphReady: appState.langGraphReady
        });
        
    } catch (error) {
        console.error('❌ Error initializing Fitly:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        // More specific error handling
        if (error.message && error.message.includes('Firebase')) {
            console.error('🔥 Firebase-related error detected');
        }
        if (error.message && error.message.includes('LangGraph')) {
            console.error('🤖 LangGraph-related error detected');
        }
        
        utils.showNotification('Failed to initialize Fitly. Please try again.', 'error');
    }
};

// Wrap entire initialization in error handling
console.log('🔄 About to call init() function...');
console.log('🔍 init function type:', typeof init);

// Add a final safety net
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ UNHANDLED PROMISE REJECTION:', event.reason);
    console.error('❌ Promise:', event.promise);
    // Prevent the default behavior (which would close the app)
    event.preventDefault();
});

try {
    // Call init and handle any promise rejections
    const initResult = init();
    if (initResult && typeof initResult.then === 'function') {
        initResult.catch(error => {
            console.error('❌ Init promise rejected:', error);
            console.error('❌ Error stack:', error.stack);
            // Don't let the error crash the app
        });
    }
    console.log('✅ init() function called successfully');
} catch (error) {
    console.error('❌ Error calling init():', error);
    console.error('❌ Error stack:', error.stack);
    
    // Still try to show the UI in a basic state
    try {
        console.log('🔧 Attempting basic recovery...');
        utils.switchScreen('onboarding');
        utils.showNotification('App started with limited functionality. Some features may not work.', 'error');
    } catch (recoveryError) {
        console.error('❌ Recovery also failed:', recoveryError);
    }
}