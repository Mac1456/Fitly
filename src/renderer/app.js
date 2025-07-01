// Fitly - Main Application Logic
console.log('🚀 Fitly app starting...');
console.log('🔍 Window object available:', typeof window !== 'undefined');
console.log('🔍 Document object available:', typeof document !== 'undefined');

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
    chatActive: false
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
    photoMealBtn: document.getElementById('photoMealBtn'),
    updateWeightBtn: document.getElementById('updateWeightBtn'),
    
    // Modals
    mealModal: document.getElementById('mealModal'),
    closeMealModal: document.getElementById('closeMealModal'),
    mealForm: document.getElementById('mealForm'),
    mealDescription: document.getElementById('mealDescription'),
    mealTime: document.getElementById('mealTime'),
    
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
                updateHeight: document.getElementById('updateHeight'),
                updateHeightUnit: document.getElementById('updateHeightUnit'),
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
            if (elements.updateHeight) elements.updateHeight.value = profile.height || '';
            if (elements.updateHeightUnit) elements.updateHeightUnit.value = profile.heightUnit || 'ft';
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
    
    testOpenAIConnection: async (buttonElement) => {
        // Get button element (either passed as parameter or from event)
        const button = buttonElement || event.target;
        const originalText = button.textContent;
        button.textContent = '🔄 Testing...';
        button.disabled = true;
        
        try {
            console.log('🔍 Testing OpenAI connection...');
            // Test with a simple request
            const response = await window.openaiAPI.analyzeMeal("apple");
            if (response) {
                utils.showNotification('OpenAI connection successful!', 'success');
                console.log('✅ OpenAI connection test passed');
            } else {
                utils.showNotification('Connection test inconclusive - no response received', 'warning');
                console.log('⚠️ OpenAI connection test inconclusive');
            }
        } catch (error) {
            console.error('❌ OpenAI connection test failed:', error);
            utils.showNotification(`Connection test failed: ${error.message}`, 'error');
        }
        
        button.textContent = originalText;
        button.disabled = false;
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
            const updatedProfile = {
                ...appState.userProfile,
                userName: formData.get('userName'),
                age: parseInt(formData.get('age')) || appState.userProfile.age,
                currentWeight: parseFloat(formData.get('currentWeight')) || appState.userProfile.currentWeight,
                weightUnit: formData.get('weightUnit') || appState.userProfile.weightUnit,
                height: parseFloat(formData.get('height')) || appState.userProfile.height,
                heightUnit: formData.get('heightUnit') || appState.userProfile.heightUnit,
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
        const { currentWeight, height, age, gender, activityLevel, weightUnit, heightUnit } = userProfile;
        
        // Convert to metric if needed
        let weightKg = weightUnit === 'kg' ? currentWeight : currentWeight * 0.453592;
        let heightCm = heightUnit === 'cm' ? height : height * 30.48;
        
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
        
        // Check if OpenAI is configured
        const isConfigured = await window.openaiAPI?.isConfigured();
        console.log('🔍 OpenAI configured:', isConfigured);
        
        if (isConfigured) {
            // Enable chat interface
            if (elements.chatInput) {
                elements.chatInput.disabled = false;
                console.log('✅ Chat input enabled');
            }
            if (elements.sendChatBtn) {
                elements.sendChatBtn.disabled = false;
                console.log('✅ Send chat button enabled');
            }
            
            // Update status
            if (elements.chatStatus) {
                elements.chatStatus.className = 'chat-status ready';
                elements.chatStatus.innerHTML = '<span class="status-indicator">✅</span><span>Ready to chat! Ask me anything.</span>';
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
            console.log('🔄 OpenAI not configured, defaulting to form mode');
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
            elements.chatStatus.className = 'chat-status thinking';
            elements.chatStatus.innerHTML = '<span class="status-indicator">🤔</span><span>Coach is thinking...</span>';
        }
        
        try {
            // Get AI response
            const response = await window.openaiAPI.onboardingChat(message, appState.conversationHistory);
            
            // Add to conversation history
            appState.conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: response.message }
            );
            
            // Add AI message to chat
            onboarding.addMessage(response.message, 'ai');
            
            // Check if onboarding is complete
            if (response.complete && response.profileData) {
                console.log('✅ Onboarding complete via chat:', response.profileData);
                await onboarding.saveProfileData(response.profileData);
            }
            
            // Reset status
            if (elements.chatStatus) {
                elements.chatStatus.className = 'chat-status ready';
                elements.chatStatus.innerHTML = '<span class="status-indicator">✅</span><span>Ready to chat!</span>';
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
                
                utils.showNotification('Welcome to Fitly! Your profile has been saved.', 'success');
                await dashboard.initialize();
            } else {
                throw new Error('No authenticated user found');
            }
            
        } catch (error) {
            console.error('❌ Error saving profile from chat:', error);
            utils.showNotification('Failed to save profile. Please try the form instead.', 'error');
        } finally {
            utils.showLoading(false);
        }
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
            
            const profileData = {
                userName: formData.get('userName'),
                currentWeight: parseFloat(formData.get('currentWeight')),
                weightUnit: formData.get('weightUnit'),
                height: parseFloat(formData.get('height')),
                heightUnit: formData.get('heightUnit'),
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
            const requiredFields = ['userName', 'currentWeight', 'height', 'age', 'gender', 'activityLevel', 'primaryGoal'];
            const missingFields = requiredFields.filter(field => !profileData[field]);
            
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
        
        if (elements.photoMealBtn) {
            elements.photoMealBtn.addEventListener('click', () => {
                console.log('📸 Photo meal button clicked');
                meals.showPhotoUpload();
            });
            console.log('✅ Photo meal button listener added');
        } else {
            console.log('⚠️ Photo meal button element not found');
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
                // Try AI analysis if OpenAI is configured
                console.log('⚠️ No nutrition data found in database, trying AI...');
                
                if (await window.openaiAPI?.isConfigured()) {
                    try {
                        const aiNutrition = await window.openaiAPI.analyzeMeal(mealDescription);
                        if (aiNutrition) {
                            finalNutrition = aiNutrition;
                            source = 'ai';
                            console.log('✅ Nutrition analyzed by AI:', finalNutrition);
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
    
    startVoiceLog: () => {
        console.log('🎤 Voice logging not implemented yet');
        utils.showNotification('Voice logging will be implemented soon!', 'info');
        // TODO: Implement voice logging with speech-to-text
    },
    
    showPhotoUpload: () => {
        console.log('📸 Photo upload not implemented yet');
        utils.showNotification('Photo meal logging will be implemented soon!', 'info');
        // TODO: Implement photo upload and analysis
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
        
        // Check OpenAI configuration
        const isConfigured = await window.openaiAPI?.isConfigured();
        if (!isConfigured) {
            aiAssistant.addMessage("I need an OpenAI API key to help you with comprehensive wellness assistance. Please configure your API key!", 'system');
            if (elements.assistantChatStatus) {
                elements.assistantChatStatus.innerHTML = '<span class="status-indicator">⚠️</span><span>OpenAI API key needed</span>';
            }
        } else {
            if (elements.assistantChatStatus) {
                elements.assistantChatStatus.innerHTML = '<span class="status-indicator">✅</span><span>Ready to help!</span>';
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
            // Get current user data for context
            const userProfile = appState.userProfile;
            const recentData = {
                calories: appState.dailyNutrition?.calories || 0,
                recentMeals: appState.todaysMeals?.slice(-2).map(m => m.description).join(', ') || 'None'
            };
            
            // Get AI response
            const response = await window.openaiAPI.comprehensiveChat(
                message, 
                aiAssistant.conversationHistory, 
                userProfile, 
                recentData
            );
            
            // Add to conversation history
            aiAssistant.conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: response.message }
            );
            
            // Add AI message
            aiAssistant.addMessage(response.message, 'ai');
            
            // Process any action data
            if (response.actionData) {
                await aiAssistant.processAction(response.actionData);
            }
            
            // Reset status
            if (elements.assistantChatStatus) {
                elements.assistantChatStatus.innerHTML = '<span class="status-indicator">✅</span><span>Ready to help!</span>';
            }
            
        } catch (error) {
            console.error('❌ Error in AI assistant chat:', error);
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
        const prompts = {
            meal: "What did you eat? Please describe your meal and I'll help you log it with nutritional information.",
            activity: "What activity or exercise did you do? Tell me about the type and duration, and I'll log it for you.",
            weight: "What's your current weight? I'll help you track your weight progress.",
            progress: "Let me check how you're doing today! Looking at your goals and recent activity..."
        };
        
        const prompt = prompts[type] || prompts.progress;
        
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
    }
};

// Global event listeners that need to be available regardless of current screen
const setupGlobalEventListeners = () => {
    console.log('🌐 Setting up global event listeners...');
    
    // Profile modal event listeners
    const profileModal = document.getElementById('profileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    
    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Close profile modal clicked');
            utils.closeProfileModal();
        });
        console.log('✅ Close profile modal listener added');
    } else {
        console.log('⚠️ Close profile modal button not found');
    }
    
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                console.log('🔄 Profile modal background clicked, closing');
                utils.closeProfileModal();
            }
        });
        console.log('✅ Profile modal background click listener added');
    } else {
        console.log('⚠️ Profile modal element not found');
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC key to close modal
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                console.log('⌨️ ESC pressed, closing modal');
                utils.closeProfileModal();
            }
        }
        
        // Ctrl/Cmd + , to open settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            console.log('⌨️ Settings shortcut pressed');
            utils.showProfileSettings();
        }
    });
    console.log('✅ Keyboard shortcuts set up');
    
    // Tab switching for profile modal
    const initializeTabSwitching = () => {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        console.log('🔍 Found', tabButtons.length, 'tab buttons and', tabContents.length, 'tab contents');
        
        tabButtons.forEach((button, index) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const targetTab = e.currentTarget.getAttribute('data-tab');
                console.log('📝 Tab clicked:', targetTab, 'Button index:', index);
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                e.currentTarget.classList.add('active');
                const targetContent = document.getElementById(targetTab + 'Tab');
                if (targetContent) {
                    targetContent.classList.add('active');
                    console.log('✅ Tab switched to:', targetTab);
                } else {
                    console.error('❌ Tab content not found:', targetTab + 'Tab');
                }
            });
        });
        console.log('✅ Tab switching initialized for', tabButtons.length, 'tabs');
    };
    
    // Initialize tab switching
    initializeTabSwitching();
    
    // Profile form submissions
    const profileUpdateForm = document.getElementById('profileUpdateForm');
    const goalsUpdateForm = document.getElementById('goalsUpdateForm');
    
    if (profileUpdateForm) {
        profileUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('👤 Updating profile...');
            const submitBtn = profileUpdateForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.textContent = '🔄 Updating...';
                submitBtn.disabled = true;
                await utils.updateProfile(new FormData(profileUpdateForm));
            } catch (error) {
                console.error('❌ Profile update failed:', error);
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
        console.log('✅ Profile form submission listener added');
    } else {
        console.log('⚠️ Profile update form element not found');
    }
    
    if (goalsUpdateForm) {
        goalsUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('🎯 Updating goals...');
            const submitBtn = goalsUpdateForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.textContent = '🔄 Updating...';
                submitBtn.disabled = true;
                await utils.updateGoals(new FormData(goalsUpdateForm));
            } catch (error) {
                console.error('❌ Goals update failed:', error);
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
        console.log('✅ Goals form submission listener added');
    } else {
        console.log('⚠️ Goals update form element not found');
    }
    
    // Weight unit change handler for goal weight display
    const updateWeightUnit = document.getElementById('updateWeightUnit');
    const updateGoalWeightUnit = document.getElementById('updateGoalWeightUnit');
    
    if (updateWeightUnit && updateGoalWeightUnit) {
        updateWeightUnit.addEventListener('change', (e) => {
            updateGoalWeightUnit.textContent = e.target.value;
            console.log('⚖️ Goal weight unit updated to:', e.target.value);
        });
        console.log('✅ Weight unit change listener added');
    } else {
        console.log('⚠️ Weight unit elements not found');
    }
    
    console.log('✅ Global event listeners set up complete');
};

// Application initialization
const app = {
    initialize: async () => {
        console.log('🚀 Initializing Fitly application...');
        console.log('🔍 Environment check:');
        console.log('  - Window:', typeof window !== 'undefined');
        console.log('  - Document:', typeof document !== 'undefined');
        console.log('  - Firebase Auth:', typeof window.firebaseAuth !== 'undefined');
        console.log('  - Firebase DB:', typeof window.firebaseDB !== 'undefined');
        console.log('  - OpenAI API:', typeof window.openaiAPI !== 'undefined');
        console.log('  - Nutrition Utils:', typeof window.nutritionUtils !== 'undefined');
        
        try {
            console.log('🎨 Step 0: Initializing theme...');
            // Initialize dark mode based on saved preference
            const savedTheme = localStorage.getItem('fitly-theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                console.log('🌙 Dark mode loaded from saved preference');
            }
            
            console.log('🔐 Step 1: Initializing authentication...');
            // Initialize authentication
            await authModule.initialize();
            console.log('✅ Step 1 complete: Authentication initialized');
            
            console.log('📝 Step 2: Initializing onboarding...');
            // Initialize onboarding
            await onboarding.initialize();
            console.log('✅ Step 2 complete: Onboarding initialized');
            
            console.log('✅ Fitly application initialized successfully');
            console.log('🔍 Final initialization state:');
            console.log('  - Current screen:', appState.currentScreen);
            console.log('  - Current user:', appState.currentUser?.uid || 'None');
            console.log('  - User profile:', !!appState.userProfile);
            console.log('  - Onboarding mode:', appState.onboardingMode);
            console.log('  - Theme:', savedTheme || 'light');
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            console.error('❌ Initialization error stack:', error.stack);
            utils.showNotification('Application failed to initialize. Please refresh the page.', 'error');
        }
    }
};

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, starting Fitly...');
    console.log('🔍 DOM ready state:', document.readyState);
    console.log('🔍 Document body:', document.body ? 'available' : 'missing');
    
    // Set up global event listeners first
    setupGlobalEventListeners();
    
    // Add a small delay to ensure all scripts are loaded
    setTimeout(() => {
        console.log('⏱️ Delayed initialization starting...');
        app.initialize();
    }, 100);
});

// Add window load event for additional debugging
window.addEventListener('load', () => {
    console.log('🌐 Window fully loaded');
    console.log('🔍 All dependencies loaded check:');
    console.log('  - Firebase Auth:', typeof window.firebaseAuth !== 'undefined');
    console.log('  - Firebase DB:', typeof window.firebaseDB !== 'undefined');
    console.log('  - OpenAI API:', typeof window.openaiAPI !== 'undefined');
    console.log('  - Nutrition Utils:', typeof window.nutritionUtils !== 'undefined');
});

// Add error handling for unhandled errors
window.addEventListener('error', (event) => {
    console.error('🚨 Unhandled error:', event.error);
    console.error('🚨 Error details:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Add error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    console.error('🚨 Promise:', event.promise);
});

// Export for debugging
window.fitlyApp = {
    appState,
    utils,
    authModule,
    onboarding,
    dashboard,
    meals,
    weight,
    aiAssistant
};

// Make aiAssistant, utils, and dashboard globally available for onclick handlers
window.aiAssistant = aiAssistant;
window.utils = utils;
window.dashboard = dashboard;

console.log('✅ Fitly app.js loaded');
console.log('🔍 Global fitlyApp object available:', typeof window.fitlyApp !== 'undefined'); 