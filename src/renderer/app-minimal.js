// Minimal Fitly App - Focus on AI Chat Functionality  
console.log('🚀 Minimal Fitly starting - AI Chat Focus');

// Global error handling
window.addEventListener('error', (event) => {
    console.error('❌ GLOBAL ERROR:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ UNHANDLED PROMISE REJECTION:', event.reason);
    event.preventDefault();
});

// Simple app state
const appState = {
    langGraphReady: false,
    currentUser: { uid: 'demo-user' }, // Mock user for demo
    userProfile: {
        userName: 'Demo User',
        currentWeight: 150,
        goalWeight: 140,
        weightUnit: 'lbs'
    }
};

// Enhanced utilities with navigation
const utils = {
    showNotification: (message, type) => {
        console.log(`${type === 'error' ? '❌' : '✅'} ${message}`);
        // Find and update a notification area or just console log
        const notificationArea = document.getElementById('notification-area');
        if (notificationArea) {
            notificationArea.innerHTML = `<div class="notification ${type}">${message}</div>`;
            setTimeout(() => notificationArea.innerHTML = '', 3000);
        }
    },

    switchScreen: (screenName) => {
        console.log('🔄 Switching to screen:', screenName);
        // Hide all screens
        const screens = ['onboardingScreen', 'aiAssistantScreen', 'dashboardScreen'];
        screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.remove('active');
            }
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // Update navigation
        utils.updateNavigation(screenName);
        
        // Show/hide navigation based on screen
        if (screenName === 'onboarding') {
            utils.hideNavigation();
        } else {
            utils.showNavigation();
        }
    },
    
    showNavigation: () => {
        const nav = document.getElementById('mainNav');
        if (nav) {
            nav.style.display = 'flex';
        }
    },
    
    hideNavigation: () => {
        const nav = document.getElementById('mainNav');
        if (nav) {
            nav.style.display = 'none';
        }
    },
    
    updateNavigation: (activeScreen) => {
        const navButtons = {
            'aiAssistantScreen': 'navAiAssistant',
            'aiassistant': 'navAiAssistant',
            'dashboardScreen': 'navDashboard', 
            'dashboard': 'navDashboard'
        };
        
        // Remove active class from all nav buttons
        Object.values(navButtons).forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.classList.remove('active');
            }
        });
        
        // Add active class to current button
        const activeButtonId = navButtons[activeScreen];
        if (activeButtonId) {
            const activeButton = document.getElementById(activeButtonId);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
    },
    
    updateLangGraphStatus: () => {
        // Update status indicators throughout the app
        const statusElements = [
            'langGraphStatus',
            'assistantChatStatus'
        ];
        
        statusElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                if (appState.langGraphReady) {
                    element.innerHTML = '🚀 Enhanced AI Active';
                    element.className = 'status-indicator ready enhanced';
                } else {
                    element.innerHTML = '⚪ Basic AI Mode';
                    element.className = 'status-indicator basic';
                }
            }
        });
        
        // Update chat status specifically
        const chatStatus = document.getElementById('assistantChatStatus');
        if (chatStatus) {
            if (appState.langGraphReady) {
                chatStatus.innerHTML = '<span class="status-indicator">🚀</span><span>Enhanced AI Coach Active - Full LangGraph Features</span>';
                chatStatus.className = 'chat-status ready enhanced';
            } else {
                chatStatus.innerHTML = '<span class="status-indicator">⚪</span><span>Basic AI Mode - Limited Features</span>';
                chatStatus.className = 'chat-status basic';
            }
        }
    }
};

// AI Chat Functions
const aiChat = {
    langGraphClient: null,
    
    initialize: async () => {
        console.log('🤖 Initializing AI Chat...');
        
        try {
            // Initialize LangGraph client
            if (window.LangGraphClient) {
                aiChat.langGraphClient = new window.LangGraphClient();
                appState.langGraphReady = await aiChat.langGraphClient.initialize();
                console.log('🤖 LangGraph ready:', appState.langGraphReady);
            }
            
            // Set up chat interface
            aiChat.setupChatInterface();
            
            console.log('✅ AI Chat initialized');
            return true;
        } catch (error) {
            console.error('❌ AI Chat initialization failed:', error);
            return false;
        }
    },
    
    setupChatInterface: () => {
        const chatInput = document.getElementById('assistantChatInput');
        const sendBtn = document.getElementById('assistantSendBtn');
        
        if (chatInput && sendBtn) {
            // Enable chat
            chatInput.disabled = false;
            sendBtn.disabled = false;
            
            // Add event listeners
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    aiChat.sendMessage();
                }
            });
            
            sendBtn.addEventListener('click', () => {
                aiChat.sendMessage();
            });
            
            console.log('✅ Chat interface set up');
        }
    },
    
         sendMessage: async () => {
         const chatInput = document.getElementById('assistantChatInput');
         const message = chatInput?.value?.trim();
         
         if (!message) return;
         
         console.log('💬 Sending message:', message);
         chatInput.value = '';
         
         // Add user message to chat
         aiChat.addMessage(message, 'user');
         
         // Show typing indicator
         aiChat.showTypingIndicator();
         
         try {
             let response;
             
             if (appState.langGraphReady && aiChat.langGraphClient) {
                 // Use enhanced LangGraph chat - with enhanced features badge
                 console.log('🚀 Using LangGraph Enhanced Features');
                 
                 // Add enhanced features indicator
                 aiChat.addSystemMessage('🚀 Using Enhanced AI with LangGraph workflows...');
                 
                 response = await aiChat.langGraphClient.getCoaching(
                     message, 
                     appState.userProfile, 
                     null,
                     null
                 );
                 
                 // Enhanced response with multiple components
                 let responseText = response.motivationalMessage || response.message || 'I received your message!';
                 
                 // Add insights if available
                 if (response.insights && response.insights.length > 0) {
                     responseText += '\n\n💡 **Insights:**\n' + response.insights.join('\n• ');
                 }
                 
                 // Add suggestions if available
                 if (response.suggestions && response.suggestions.length > 0) {
                     responseText += '\n\n🎯 **Suggestions:**\n• ' + response.suggestions.join('\n• ');
                 }
                 
                 // Add action items if available
                 if (response.actionItems && response.actionItems.length > 0) {
                     responseText += '\n\n✅ **Action Items:**\n• ' + response.actionItems.join('\n• ');
                 }
                 
                 aiChat.addMessage(responseText, 'ai', true); // true = enhanced
                 
             } else {
                 // Fallback to basic response
                 console.log('⚪ Using fallback response');
                 aiChat.addSystemMessage('⚪ Using basic AI mode...');
                 const fallbackResponse = aiChat.generateFallbackResponse(message);
                 aiChat.addMessage(fallbackResponse, 'ai', false); // false = basic
             }
             
         } catch (error) {
             console.error('❌ Error sending message:', error);
             aiChat.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
         } finally {
             aiChat.hideTypingIndicator();
         }
     },
    
         addMessage: (text, sender, isEnhanced = false) => {
         const chatMessages = document.getElementById('assistantChatMessages');
         if (!chatMessages) return;
         
         const messageDiv = document.createElement('div');
         messageDiv.className = `message ${sender}-message`;
         if (isEnhanced && sender === 'ai') {
             messageDiv.classList.add('enhanced-message');
         }
         
         const avatar = document.createElement('div');
         avatar.className = 'message-avatar';
         avatar.textContent = sender === 'user' ? '👤' : (isEnhanced ? '🚀' : '🤖');
         
         const content = document.createElement('div');
         content.className = 'message-content';
         
         const messageText = document.createElement('div');
         messageText.className = 'message-text';
         
         // Handle enhanced formatting
         if (isEnhanced && text.includes('**')) {
             messageText.innerHTML = text
                 .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                 .replace(/\n/g, '<br>');
         } else {
             messageText.textContent = text;
         }
         
         content.appendChild(messageText);
         messageDiv.appendChild(avatar);
         messageDiv.appendChild(content);
         
         chatMessages.appendChild(messageDiv);
         chatMessages.scrollTop = chatMessages.scrollHeight;
         
         console.log(`📝 Added ${sender} message (enhanced: ${isEnhanced}): ${text}`);
     },
     
     addSystemMessage: (text) => {
         const chatMessages = document.getElementById('assistantChatMessages');
         if (!chatMessages) return;
         
         const messageDiv = document.createElement('div');
         messageDiv.className = 'message system-message';
         
         const messageText = document.createElement('div');
         messageText.className = 'message-text';
         messageText.textContent = text;
         
         messageDiv.appendChild(messageText);
         chatMessages.appendChild(messageDiv);
         chatMessages.scrollTop = chatMessages.scrollHeight;
         
         // Auto-remove system messages after 3 seconds
         setTimeout(() => {
             if (messageDiv.parentNode) {
                 messageDiv.remove();
             }
         }, 3000);
     },
     
     showTypingIndicator: () => {
         const chatMessages = document.getElementById('assistantChatMessages');
         if (!chatMessages) return;
         
         const typingDiv = document.createElement('div');
         typingDiv.className = 'message ai-message typing-indicator';
         typingDiv.id = 'typing-indicator';
         
         const avatar = document.createElement('div');
         avatar.className = 'message-avatar';
         avatar.textContent = '🤖';
         
         const content = document.createElement('div');
         content.className = 'message-content typing-content';
         content.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
         
         typingDiv.appendChild(avatar);
         typingDiv.appendChild(content);
         chatMessages.appendChild(typingDiv);
         chatMessages.scrollTop = chatMessages.scrollHeight;
     },
     
     hideTypingIndicator: () => {
         const typingIndicator = document.getElementById('typing-indicator');
         if (typingIndicator) {
             typingIndicator.remove();
         }
     },
    
    generateFallbackResponse: (message) => {
        const responses = [
            "That's interesting! Tell me more about your wellness goals.",
            "I'm here to help with your fitness journey. What would you like to work on?",
            "Thanks for sharing! How has your nutrition been lately?",
            "I'd love to help you with that. What are your current fitness goals?",
            "Great question! Let's focus on your wellness journey together.",
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
};

// Enhanced initialization with navigation and status
const initApp = async () => {
    try {
        console.log('🚀 Starting enhanced Fitly initialization...');
        
        // Set up navigation event listeners
        setupNavigation();
        
        // Wait for Firebase (optional, won't block)
        if (window.firebaseReady) {
            try {
                await window.firebaseReady;
                console.log('✅ Firebase ready');
            } catch (error) {
                console.log('⚠️ Firebase not available, continuing anyway');
            }
        }
        
        // Initialize AI chat
        await aiChat.initialize();
        
        // Update all status indicators
        utils.updateLangGraphStatus();
        
        // Switch to AI Assistant screen (with navigation)
        utils.switchScreen('aiAssistantScreen');
        
        // Add enhanced welcome message
        const welcomeMessage = appState.langGraphReady 
            ? 'Hello! I\'m your Enhanced AI wellness coach powered by LangGraph! 🚀\n\nI can provide:\n• Personalized insights\n• Smart suggestions\n• Action-oriented coaching\n\nHow can I help you today?'
            : 'Hello! I\'m your AI wellness coach. Basic features are available. 🤖\n\nHow can I help you today?';
            
        aiChat.addMessage(welcomeMessage, 'ai', appState.langGraphReady);
        
        // Show success notification with enhancement status
        const statusMessage = appState.langGraphReady 
            ? 'Fitly Enhanced AI is ready! 🚀 LangGraph features active.'
            : 'Fitly AI is ready! ⚪ Basic mode active.';
            
        utils.showNotification(statusMessage, 'success');
        
        console.log('✅ Enhanced app initialization complete');
        console.log('🔍 LangGraph Enhanced Features:', appState.langGraphReady ? 'ACTIVE' : 'INACTIVE');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        utils.showNotification('App started with limited functionality: ' + error.message, 'error');
        
        // Still try to show the interface
        utils.switchScreen('aiAssistantScreen');
        aiChat.addMessage('Hello! I\'m running in limited mode. Basic chat may still work.', 'ai');
    }
};

// Set up navigation event listeners
const setupNavigation = () => {
    console.log('🔧 Setting up navigation...');
    
    // Set up navigation button listeners
    const navAiAssistant = document.getElementById('navAiAssistant');
    const navDashboard = document.getElementById('navDashboard');
    const navProfile = document.getElementById('navProfile');
    
    if (navAiAssistant) {
        navAiAssistant.addEventListener('click', () => {
            utils.switchScreen('aiAssistantScreen');
        });
        console.log('✅ AI Assistant nav button set up');
    }
    
    if (navDashboard) {
        navDashboard.addEventListener('click', () => {
            utils.switchScreen('dashboardScreen');
            // Add basic dashboard content
            setupBasicDashboard();
        });
        console.log('✅ Dashboard nav button set up');
    }
    
    if (navProfile) {
        navProfile.addEventListener('click', () => {
            alert('Profile settings coming soon! For now, you can test the Enhanced AI features in the chat.');
        });
        console.log('✅ Profile nav button set up');
    }
};

// Basic dashboard setup
const setupBasicDashboard = () => {
    const userGreeting = document.getElementById('userGreeting');
    if (userGreeting) {
        userGreeting.textContent = `Welcome back, ${appState.userProfile.userName}! 🌟`;
    }
    
    // Update weight display
    const currentWeightDisplay = document.getElementById('currentWeightDisplay');
    if (currentWeightDisplay) {
        currentWeightDisplay.textContent = `${appState.userProfile.currentWeight} ${appState.userProfile.weightUnit}`;
    }
    
    console.log('📊 Basic dashboard set up');
};

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    setTimeout(initApp, 100); // Small delay to ensure all scripts are loaded
}

console.log('📝 Minimal app script loaded successfully'); 