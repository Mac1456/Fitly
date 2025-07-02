/**
 * Speech Service for Fitly
 * Handles speech recognition using browser APIs
 */
class SpeechService {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.onResult = null;
        this.onError = null;
        this.onStart = null;
        this.onEnd = null;
    }

    /**
     * Initialize speech recognition
     */
    initialize() {
        // Check for browser speech recognition support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('🎤 Speech recognition not supported in this browser');
            this.isSupported = false;
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition settings
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // Set up event handlers
        this.recognition.onstart = () => {
            console.log('🎤 Speech recognition started');
            this.isListening = true;
            if (this.onStart) this.onStart();
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const confidence = event.results[0][0].confidence;
            
            console.log('🎤 Speech recognized:', transcript, `(confidence: ${confidence})`);
            
            if (this.onResult) {
                this.onResult({
                    transcript: transcript.trim(),
                    confidence: confidence || 0.8,
                    isFinal: event.results[0].isFinal
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.error('🎤 Speech recognition error:', event.error);
            this.isListening = false;
            
            if (this.onError) {
                this.onError({
                    error: event.error,
                    message: this.getErrorMessage(event.error)
                });
            }
        };

        this.recognition.onend = () => {
            console.log('🎤 Speech recognition ended');
            this.isListening = false;
            if (this.onEnd) this.onEnd();
        };

        this.isSupported = true;
        console.log('✅ Speech service initialized successfully');
        return true;
    }

    /**
     * Start listening for speech
     */
    startListening(options = {}) {
        if (!this.isSupported) {
            throw new Error('Speech recognition not supported');
        }

        if (this.isListening) {
            console.warn('🎤 Already listening');
            return;
        }

        // Configure options
        if (options.language) {
            this.recognition.lang = options.language;
        }
        if (options.continuous !== undefined) {
            this.recognition.continuous = options.continuous;
        }
        if (options.interimResults !== undefined) {
            this.recognition.interimResults = options.interimResults;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('🎤 Failed to start speech recognition:', error);
            throw error;
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (!this.recognition || !this.isListening) {
            return;
        }

        try {
            this.recognition.stop();
        } catch (error) {
            console.error('🎤 Error stopping speech recognition:', error);
        }
    }

    /**
     * Abort current recognition
     */
    abort() {
        if (!this.recognition) {
            return;
        }

        try {
            this.recognition.abort();
            this.isListening = false;
        } catch (error) {
            console.error('🎤 Error aborting speech recognition:', error);
        }
    }

    /**
     * Set event handlers
     */
    setEventHandlers({ onResult, onError, onStart, onEnd }) {
        this.onResult = onResult;
        this.onError = onError;
        this.onStart = onStart;
        this.onEnd = onEnd;
    }

    /**
     * Get user-friendly error messages
     */
    getErrorMessage(error) {
        const errorMessages = {
            'no-speech': 'No speech was detected. Please try again.',
            'audio-capture': 'Audio capture failed. Please check your microphone.',
            'not-allowed': 'Microphone permission denied. Please allow microphone access.',
            'network': 'Network error occurred. Please check your internet connection.',
            'service-not-allowed': 'Speech recognition service not allowed.',
            'bad-grammar': 'Grammar compilation failed.',
            'language-not-supported': 'Language not supported.',
            'aborted': 'Speech recognition was aborted.'
        };

        return errorMessages[error] || `Speech recognition error: ${error}`;
    }

    /**
     * Check if browser supports speech recognition
     */
    static isSupported() {
        return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    }

    /**
     * Request microphone permission
     */
    async requestPermission() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Media devices not supported');
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ Microphone permission granted');
            return true;
        } catch (error) {
            console.error('❌ Microphone permission denied:', error);
            throw new Error('Microphone permission is required for voice logging');
        }
    }

    /**
     * Test speech recognition functionality
     */
    async testRecognition() {
        return new Promise((resolve, reject) => {
            if (!this.isSupported) {
                reject(new Error('Speech recognition not supported'));
                return;
            }

            let timeout;
            const originalHandlers = {
                onResult: this.onResult,
                onError: this.onError,
                onStart: this.onStart,
                onEnd: this.onEnd
            };

            // Set test handlers
            this.setEventHandlers({
                onResult: (result) => {
                    clearTimeout(timeout);
                    this.setEventHandlers(originalHandlers);
                    resolve({
                        success: true,
                        transcript: result.transcript,
                        confidence: result.confidence
                    });
                },
                onError: (error) => {
                    clearTimeout(timeout);
                    this.setEventHandlers(originalHandlers);
                    reject(new Error(error.message));
                },
                onStart: () => {
                    // Set timeout for test
                    timeout = setTimeout(() => {
                        this.stopListening();
                        this.setEventHandlers(originalHandlers);
                        reject(new Error('Test timeout - no speech detected'));
                    }, 5000);
                },
                onEnd: () => {
                    clearTimeout(timeout);
                    this.setEventHandlers(originalHandlers);
                }
            });

            try {
                this.startListening();
            } catch (error) {
                clearTimeout(timeout);
                this.setEventHandlers(originalHandlers);
                reject(error);
            }
        });
    }

    /**
     * Get current state
     */
    getState() {
        return {
            isSupported: this.isSupported,
            isListening: this.isListening,
            language: this.recognition?.lang || 'en-US'
        };
    }
}

// Make globally available in renderer process
if (typeof window !== 'undefined') {
    window.SpeechService = SpeechService;
}

module.exports = { SpeechService }; 