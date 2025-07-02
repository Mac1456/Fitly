/**
 * LangGraph Client for Fitly Renderer Process
 * Provides interface to LangGraph workflows via IPC
 */

class LangGraphClient {
    constructor() {
        this.ipcRenderer = window.require ? window.require('electron').ipcRenderer : window.ipcRenderer;
        this.isReady = false;
        this.activeSessions = new Map();
        this.speechService = null;
    }

    /**
     * Initialize the LangGraph client
     */
    async initialize() {
        console.log('🤖 LangGraphClient.initialize() called');
        console.log('🔍 IPC Renderer available:', !!this.ipcRenderer);
        
        try {
            console.log('🔍 Checking LangGraph readiness via IPC...');
            this.isReady = await this.ipcRenderer.invoke('langgraph-is-ready');
            console.log('🤖 LangGraph Client initialized. Ready:', this.isReady);
            console.log('🔍 LangGraph readiness response received:', this.isReady);
            
            if (!this.isReady) {
                console.warn('⚠️ LangGraph reported as not ready from main process');
            } else {
                console.log('✅ LangGraph confirmed ready from main process');
            }
            
            // Initialize speech service if available
            console.log('🔍 Checking speech service availability...');
            console.log('  - window.SpeechService exists:', !!window.SpeechService);
            
            if (window.SpeechService) {
                console.log('  - SpeechService.isSupported():', window.SpeechService.isSupported());
                
                if (window.SpeechService.isSupported()) {
                    console.log('🔍 Initializing speech service...');
                    this.speechService = new window.SpeechService();
                    const speechInitResult = this.speechService.initialize();
                    console.log('🎤 Speech service initialized:', speechInitResult);
                } else {
                    console.log('⚠️ Speech service not supported in this browser');
                }
            } else {
                console.log('⚠️ SpeechService class not found');
            }
            
            console.log('🤖 LangGraphClient initialization complete. Final state:');
            console.log('  - isReady:', this.isReady);
            console.log('  - speechService:', !!this.speechService);
            console.log('  - ipcRenderer:', !!this.ipcRenderer);
            
            return this.isReady;
        } catch (error) {
            console.error('❌ Error initializing LangGraph client:', error);
            console.error('❌ Error stack:', error.stack);
            console.error('❌ IPC invoke failed for langgraph-is-ready');
            this.isReady = false;
            return false;
        }
    }

    /**
     * Check if LangGraph is ready
     */
    async checkReady() {
        try {
            this.isReady = await this.ipcRenderer.invoke('langgraph-is-ready');
            return this.isReady;
        } catch (error) {
            console.error('❌ Error checking LangGraph readiness:', error);
            return false;
        }
    }

    /**
     * Create a new conversation session
     */
    async createSession(type = 'general', userId = null) {
        if (!this.isReady) {
            console.warn('⚠️ LangGraph not ready, cannot create session');
            return null;
        }

        try {
            const sessionId = await this.ipcRenderer.invoke('langgraph-create-session', type, userId);
            if (sessionId) {
                this.activeSessions.set(sessionId, {
                    id: sessionId,
                    type,
                    userId,
                    createdAt: new Date()
                });
                console.log(`🗣️ Created session: ${sessionId} (${type})`);
            }
            return sessionId;
        } catch (error) {
            console.error('❌ Error creating session:', error);
            return null;
        }
    }

    /**
     * Enhanced onboarding conversation with progress tracking
     */
    async onboardingChat(message, sessionId = null, progress = null) {
        if (!this.isReady) {
            // Fallback to basic onboarding
            return await window.openaiAPI.onboardingChat(message, []);
        }

        try {
            // Include progress information in the call
            const result = await this.ipcRenderer.invoke(
                'langgraph-onboarding-chat',
                message,
                [],
                sessionId,
                progress
            );
            
            console.log('🤖 Onboarding response:', result);
            console.log('🔍 Progress sent:', progress);
            return result;
        } catch (error) {
            console.error('❌ Error in onboarding chat:', error);
            // Fallback to basic onboarding
            return await window.openaiAPI.onboardingChat(message, []);
        }
    }

    /**
     * Enhanced meal analysis
     */
    async analyzeMeal(description, userProfile = null, recentMeals = []) {
        if (!this.isReady) {
            return null;
        }

        try {
            const result = await this.ipcRenderer.invoke(
                'langgraph-analyze-meal',
                description,
                userProfile,
                recentMeals
            );
            
            console.log('🍽️ Meal analysis result:', result);
            return result;
        } catch (error) {
            console.error('❌ Error analyzing meal:', error);
            return null;
        }
    }

    /**
     * Process speech input
     */
    async processSpeech(transcript, userProfile = null, sessionId = null) {
        if (!this.isReady) {
            throw new Error('LangGraph not ready for speech processing');
        }

        try {
            const result = await this.ipcRenderer.invoke(
                'langgraph-process-speech',
                transcript,
                userProfile,
                sessionId
            );
            
            console.log('🎤 Speech processing result:', result);
            return result;
        } catch (error) {
            console.error('❌ Error processing speech:', error);
            throw error;
        }
    }

    /**
     * Get personalized coaching
     */
    async getCoaching(message = '', userProfile = null, recentData = null, sessionId = null) {
        if (!this.isReady) {
            return {
                motivationalMessage: "Keep up the great work on your wellness journey!",
                insights: [],
                suggestions: [],
                actionItems: []
            };
        }

        try {
            const result = await this.ipcRenderer.invoke(
                'langgraph-get-coaching',
                message,
                userProfile,
                recentData,
                sessionId
            );
            
            console.log('🎯 Coaching result:', result);
            return result;
        } catch (error) {
            console.error('❌ Error getting coaching:', error);
            return {
                motivationalMessage: "I'm here to support you! Keep making progress.",
                insights: [],
                suggestions: [],
                actionItems: []
            };
        }
    }

    /**
     * Voice logging with speech recognition
     */
    async startVoiceLogging(userProfile = null) {
        console.log('🎤 Starting voice logging - detailed debug:');
        console.log('  - speechService exists:', !!this.speechService);
        console.log('  - LangGraph ready:', this.isReady);
        
        if (!this.speechService) {
            console.error('❌ Speech service not available during voice logging');
            throw new Error('Speech service not available');
        }

        const isSupported = this.speechService.isSupported();
        console.log('  - Speech supported:', isSupported);
        
        if (!isSupported) {
            console.error('❌ Speech recognition not supported');
            throw new Error('Speech recognition not supported in this browser');
        }

        if (!this.isReady) {
            console.error('❌ LangGraph not ready for speech processing');
            throw new Error('Enhanced AI features not available for speech processing');
        }

        return new Promise((resolve, reject) => {
            let sessionId = null;
            let hasResolved = false; // Prevent multiple resolutions
            let timeoutId = null;

            console.log('🎤 Setting up voice logging handlers...');

            timeoutId = setTimeout(() => {
                if (!hasResolved) {
                    hasResolved = true;
                    console.error('❌ Voice logging timeout');
                    reject(new Error('Voice logging timed out - no speech detected'));
                }
            }, 10000); // 10 second timeout

            this.speechService.setEventHandlers({
                onStart: () => {
                    console.log('🎤 Voice logging started - listening...');
                },
                onResult: async (speechResult) => {
                    if (hasResolved) return;
                    hasResolved = true;
                    
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }

                    try {
                        const transcript = speechResult.transcript;
                        console.log('🎤 Voice input received:', transcript);

                        // Create session if needed
                        if (!sessionId) {
                            sessionId = await this.createSession('speech', userProfile?.userId);
                            console.log('🗣️ Created speech session:', sessionId);
                        }

                        // Process speech with LangGraph
                        const result = await this.processSpeech(transcript, userProfile, sessionId);
                        
                        resolve({
                            transcript,
                            speechConfidence: speechResult.confidence,
                            processingResult: result
                        });
                    } catch (error) {
                        console.error('❌ Error processing speech result:', error);
                        reject(new Error(`Speech processing failed: ${error.message}`));
                    }
                },
                onError: (error) => {
                    if (hasResolved) return;
                    hasResolved = true;
                    
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    
                    console.error('🎤 Speech recognition error:', error);
                    let errorMessage = 'Speech recognition failed';
                    
                    if (error.error === 'not-allowed') {
                        errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
                    } else if (error.error === 'no-speech') {
                        errorMessage = 'No speech detected. Please try speaking clearly into your microphone.';
                    } else if (error.error === 'network') {
                        errorMessage = 'Network error during speech recognition. Please check your connection.';
                    }
                    
                    reject(new Error(errorMessage));
                },
                onEnd: () => {
                    console.log('🎤 Voice logging ended');
                    if (!hasResolved) {
                        hasResolved = true;
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                        }
                        reject(new Error('Speech recognition ended without detecting any speech'));
                    }
                }
            });

            // Request microphone permission and start listening
            console.log('🎤 Requesting microphone permission...');
            this.speechService.requestPermission()
                .then(() => {
                    console.log('🎤 Permission granted, starting speech recognition...');
                    this.speechService.startListening({
                        continuous: false,
                        interimResults: false,
                        lang: 'en-US'
                    });
                })
                .catch((error) => {
                    if (hasResolved) return;
                    hasResolved = true;
                    
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    
                    console.error('❌ Microphone permission error:', error);
                    reject(new Error(`Microphone access failed: ${error.message}`));
                });
        });
    }

    /**
     * Stop voice logging
     */
    stopVoiceLogging() {
        if (this.speechService) {
            this.speechService.stopListening();
        }
    }

    /**
     * Get session information
     */
    async getSession(sessionId) {
        try {
            return await this.ipcRenderer.invoke('langgraph-get-session', sessionId);
        } catch (error) {
            console.error('❌ Error getting session:', error);
            return null;
        }
    }

    /**
     * Clean up old sessions
     */
    async cleanupSessions(maxAgeHours = 24) {
        try {
            return await this.ipcRenderer.invoke('langgraph-cleanup-sessions', maxAgeHours);
        } catch (error) {
            console.error('❌ Error cleaning up sessions:', error);
            return false;
        }
    }

    /**
     * Get usage statistics
     */
    async getStats() {
        try {
            return await this.ipcRenderer.invoke('langgraph-get-stats');
        } catch (error) {
            console.error('❌ Error getting stats:', error);
            return null;
        }
    }

    /**
     * Test speech recognition
     */
    async testSpeech() {
        if (!this.speechService) {
            throw new Error('Speech service not available');
        }

        try {
            await this.speechService.requestPermission();
            const result = await this.speechService.testRecognition();
            console.log('✅ Speech test successful:', result);
            return result;
        } catch (error) {
            console.error('❌ Speech test failed:', error);
            throw error;
        }
    }
}

// Create global instance
console.log('🤖 Creating global LangGraphClient instance...');
const langGraphClient = new LangGraphClient();
console.log('🤖 Global LangGraphClient instance created');

// Make available globally
window.langGraphClient = langGraphClient;
console.log('🤖 LangGraphClient attached to window.langGraphClient');

// Make class available globally too
window.LangGraphClient = LangGraphClient;
console.log('🤖 LangGraphClient class attached to window.LangGraphClient');

// Auto-initialize when DOM is ready
console.log('🤖 Setting up auto-initialization...');
console.log('🔍 Document ready state:', document.readyState);

if (document.readyState === 'loading') {
    console.log('🤖 Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🤖 DOMContentLoaded fired, initializing LangGraphClient...');
        langGraphClient.initialize();
    });
} else {
    console.log('🤖 Document already loaded, initializing LangGraphClient immediately...');
    langGraphClient.initialize();
}

console.log('🤖 LangGraph Client loaded');

module.exports = { LangGraphClient }; 