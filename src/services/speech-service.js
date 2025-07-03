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
        this.retryCount = 0;
        this.maxRetries = 2;
        this.lastStartOptions = null;
        this.useNative = false;
        this.nativeService = null;
        
        // Check if we're running in Electron
        this.isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron;
        
        console.log('🎤 Speech Service Constructor - Electron Environment Check:');
        console.log('  - typeof process:', typeof process);
        console.log('  - process.versions:', typeof process !== 'undefined' ? process.versions : 'not available');
        console.log('  - process.versions.electron:', typeof process !== 'undefined' && process.versions ? process.versions.electron : 'not available');
        console.log('  - isElectron (boolean):', this.isElectron);
        console.log('  - Platform:', typeof process !== 'undefined' ? process.platform : 'not available');
        
        if (this.isElectron) {
            console.log('🎤 Detected Electron environment, setting up native speech service...');
            try {
                console.log('🎤 Attempting to load native speech service module...');
                console.log('🎤 Current working directory:', process.cwd());
                console.log('🎤 Module path being required: ./speech-service-native');
                
                const { NativeSpeechService } = require('./speech-service-native');
                console.log('🎤 Native speech service module loaded successfully');
                console.log('🎤 NativeSpeechService class:', typeof NativeSpeechService);
                
                this.nativeService = new NativeSpeechService();
                console.log('🎤 Native speech service instance created');
                console.log('🎤 Native service methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.nativeService)));
            } catch (error) {
                console.warn('🎤 Failed to load native speech service module:', error.message);
                console.warn('🎤 This is expected in renderer process - will create inline service');
                console.warn('🎤 Error details:', error.stack);
                
                // Create inline native service as fallback
                console.log('🎤 Creating inline native service as fallback...');
                try {
                    this.nativeService = this.createInlineNativeService();
                    console.log('✅ Inline native service created successfully');
                } catch (inlineError) {
                    console.error('❌ Failed to create inline native service:', inlineError.message);
                    console.error('❌ Full error:', inlineError);
                }
            }
        } else {
            console.log('🎤 Not in Electron environment, will use Web Speech API only');
        }
        
        // Log final constructor state
        console.log('🎤 Speech Service Constructor Complete:');
        console.log('  - isElectron:', this.isElectron);
        console.log('  - nativeService exists:', !!this.nativeService);
        console.log('  - useNative:', this.useNative);
        console.log('  - isSupported:', this.isSupported);
    }

    /**
     * Create inline native speech service (fallback when module loading fails)
     */
    createInlineNativeService() {
        console.log('🎤 Creating inline native speech service...');
        
        return {
            isSupported: true,
            isListening: false,
            onResult: null,
            onError: null,
            onStart: null,
            onEnd: null,
            currentProcess: null,
            
            initialize: function() {
                console.log('🎤 Initializing inline native speech recognition...');
                
                // Check if process is available
                if (typeof process === 'undefined') {
                    console.error('🎤 Process object not available - cannot use native speech');
                    return false;
                }
                
                console.log('  - Platform:', process.platform);
                console.log('  - Electron version:', process.versions?.electron || 'not available');
                console.log('  - Node version:', process.versions?.node || 'not available');
                
                // Check platform support
                if (process.platform === 'win32') {
                    console.log('✅ Windows platform detected - native speech should work');
                    return true;
                } else if (process.platform === 'darwin') {
                    console.log('✅ macOS platform detected - native speech should work');
                    return true;
                } else if (process.platform === 'linux') {
                    console.log('⚠️ Linux platform detected - requires additional setup');
                    return true;
                } else {
                    console.warn('❌ Unsupported platform for native speech:', process.platform);
                    return false;
                }
            },
            
            setEventHandlers: function({ onResult, onError, onStart, onEnd }) {
                console.log('🎤 Setting event handlers for inline native service');
                this.onResult = onResult;
                this.onError = onError;
                this.onStart = onStart;
                this.onEnd = onEnd;
            },
            
            requestPermission: async function() {
                console.log('🎤 Native speech recognition permissions automatically granted');
                return true;
            },
            
            startListening: async function(options = {}) {
                console.log('🎤 Starting inline native speech recognition...');
                console.log('  - Options:', options);
                
                // Check if process is available
                if (typeof process === 'undefined') {
                    const error = new Error('Process object not available for native speech');
                    console.error('❌', error.message);
                    if (this.onError) this.onError({ error: 'process-unavailable', message: error.message });
                    throw error;
                }
                
                // Check if already listening
                if (this.isListening) {
                    console.warn('🎤 Already listening');
                    return;
                }
                
                try {
                    // Import required modules
                    const { spawn } = require('child_process');
                    const fs = require('fs');
                    const path = require('path');
                    
                    console.log('🎤 Required modules loaded successfully');
                    
                    if (process.platform === 'win32') {
                        return this.startListeningWindows(spawn, fs, path);
                    } else if (process.platform === 'darwin') {
                        return this.startListeningMacOS(spawn);
                    } else {
                        throw new Error('Platform not supported for native speech recognition');
                    }
                } catch (error) {
                    console.error('❌ Failed to start native speech recognition:', error);
                    if (this.onError) {
                        this.onError({
                            error: 'native-start-failed',
                            message: `Failed to start native speech recognition: ${error.message}`
                        });
                    }
                    throw error;
                }
            },
            
            startListeningWindows: function(spawn, fs, path) {
                console.log('🎤 Starting Windows native speech recognition...');
                
                // Create PowerShell script for speech recognition using dictation grammar
                const psScript = `
Add-Type -AssemblyName System.Speech

try {
    # Create speech recognition engine
    Write-Host "SPEECH_DEBUG: Creating speech recognition engine..."
    $recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $recognizer.SetInputToDefaultAudioDevice()

    # Use dictation grammar for free-form speech recognition
    Write-Host "SPEECH_DEBUG: Loading dictation grammar..."
    $dictationGrammar = New-Object System.Speech.Recognition.DictationGrammar
    $recognizer.LoadGrammar($dictationGrammar)

    # Set recognition settings to be more responsive
    Write-Host "SPEECH_DEBUG: Configuring recognition settings..."
    $recognizer.InitialSilenceTimeout = [TimeSpan]::FromSeconds(2)
    $recognizer.BabbleTimeout = [TimeSpan]::FromSeconds(0.5)
    $recognizer.EndSilenceTimeout = [TimeSpan]::FromSeconds(1.0)
    $recognizer.EndSilenceTimeoutAmbiguous = [TimeSpan]::FromSeconds(1.0)

    # Global variables to track state
    $global:speechDetected = $false
    $global:recognitionStarted = $false
    $global:shouldStop = $false

    # Output when speech is recognized (final result)
    Register-ObjectEvent -InputObject $recognizer -EventName "SpeechRecognized" -Action {
        $result = $Event.SourceEventArgs.Result
        $confidence = [Math]::Round($result.Confidence, 2)
        $text = $result.Text
        $global:speechDetected = $true
        Write-Host "SPEECH_RESULT:$($text):$($confidence)"
        
        # Also log which grammar was used
        $grammarName = $result.Grammar.Name
        Write-Host "SPEECH_GRAMMAR:$($grammarName)"
    }

    # Output when speech is rejected (low confidence) - use correct event name
    Register-ObjectEvent -InputObject $recognizer -EventName "SpeechRecognitionRejected" -Action {
        $result = $Event.SourceEventArgs.Result
        $rejectedText = if ($result -ne $null) { $result.Text } else { "unknown" }
        $global:speechDetected = $true
        Write-Host "SPEECH_REJECTED:$($rejectedText)"
        
        # If rejection has decent text, try to use it
        if ($result -ne $null -and $result.Text.Length -gt 2) {
            Write-Host "SPEECH_HYPOTHESIS_FINAL:$($result.Text):0.6"
        }
    }

    # Output when speech is detected but not recognized (hypothesis)
    Register-ObjectEvent -InputObject $recognizer -EventName "SpeechHypothesized" -Action {
        $result = $Event.SourceEventArgs.Result
        $hypothesis = $result.Text
        $global:speechDetected = $true
        Write-Host "SPEECH_HYPOTHESIS:$($hypothesis)"
        
        # If hypothesis is decent length, consider it as potential final result
        if ($hypothesis.Length -gt 2) {
            Write-Host "SPEECH_INTERIM:$($hypothesis):0.5"
        }
    }

    # Event when recognition has started
    Register-ObjectEvent -InputObject $recognizer -EventName "RecognizeCompleted" -Action {
        Write-Host "SPEECH_DEBUG: Recognition completed"
        $global:shouldStop = $true
    }

    # Start recognition
    Write-Host "SPEECH_DEBUG: Starting recognition..."
    Write-Host "SPEECH_START"
    $recognizer.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
    $global:recognitionStarted = $true

    # Wait for recognition to be ready and listen for speech
    Write-Host "SPEECH_DEBUG: Waiting for speech input..."
    $timeout = 10  # 10 second timeout
    $elapsed = 0
    $checkInterval = 0.1  # Check every 100ms
    
    while ($elapsed -lt $timeout -and -not $global:shouldStop) {
        Start-Sleep -Milliseconds ($checkInterval * 1000)
        $elapsed += $checkInterval
        
        # Give periodic status updates
        if (($elapsed % 2) -eq 0) {
            Write-Host "SPEECH_DEBUG: Listening... elapsed: $([Math]::Round($elapsed, 1))s"
        }
    }
    
    Write-Host "SPEECH_DEBUG: Recognition loop finished. Speech detected: $global:speechDetected"
    
    # Stop recognition
    Write-Host "SPEECH_DEBUG: Stopping recognition..."
    $recognizer.RecognizeAsyncCancel()
    Write-Host "SPEECH_END"
    
    # Clean up
    Write-Host "SPEECH_DEBUG: Cleaning up..."
    $recognizer.Dispose()
    
    # Final status
    if ($global:speechDetected) {
        Write-Host "SPEECH_DEBUG: Session completed with speech detected"
    } else {
        Write-Host "SPEECH_DEBUG: Session completed with no speech detected"
    }
    
} catch {
    $errorMessage = $_.Exception.Message
    $errorDetails = $_.Exception.ToString()
    Write-Host "SPEECH_ERROR:$($errorMessage)"
    Write-Host "SPEECH_ERROR_DETAILS:$($errorDetails)"
}
`;

                try {
                    // Create temp directory and script file
                    const tempDir = path.join(process.cwd(), 'src', 'temp');
                    const scriptPath = path.join(tempDir, 'speech-recognition.ps1');
                    
                    console.log('🎤 Temp directory:', tempDir);
                    console.log('🎤 Script path:', scriptPath);
                    
                    // Ensure temp directory exists
                    if (!fs.existsSync(tempDir)) {
                        console.log('🎤 Creating temp directory...');
                        fs.mkdirSync(tempDir, { recursive: true });
                    }
                    
                    // Write PowerShell script
                    console.log('🎤 Writing PowerShell script...');
                    fs.writeFileSync(scriptPath, psScript);
                    
                    // Execute PowerShell script
                    console.log('🎤 Executing PowerShell script...');
                    this.currentProcess = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
                        stdio: 'pipe'
                    });

                    this.currentProcess.stdout.on('data', (data) => {
                        const output = data.toString().trim();
                        console.log('🎤 PowerShell output:', output);
                        
                        if (output.includes('SPEECH_START')) {
                            console.log('🎤 Speech recognition started');
                            this.isListening = true;
                            if (this.onStart) this.onStart();
                        } else if (output.startsWith('SPEECH_RESULT:')) {
                            const parts = output.split(':');
                            if (parts.length >= 3) {
                                const text = parts[1];
                                const confidence = parseFloat(parts[2]) || 0.8;
                                
                                console.log('🎤 Speech recognized:', text, 'confidence:', confidence);
                                
                                if (this.onResult) {
                                    this.onResult({
                                        transcript: text,
                                        confidence: confidence,
                                        isFinal: true
                                    });
                                }
                            }
                        } else if (output.startsWith('SPEECH_HYPOTHESIS_FINAL:')) {
                            const parts = output.split(':');
                            if (parts.length >= 3) {
                                const text = parts[1];
                                const confidence = parseFloat(parts[2]) || 0.7;
                                
                                console.log('🎤 Using hypothesis as final result:', text, 'confidence:', confidence);
                                
                                if (this.onResult) {
                                    this.onResult({
                                        transcript: text,
                                        confidence: confidence,
                                        isFinal: true
                                    });
                                }
                            }
                        } else if (output.startsWith('SPEECH_INTERIM:')) {
                            const parts = output.split(':');
                            if (parts.length >= 3) {
                                const text = parts[1];
                                const confidence = parseFloat(parts[2]) || 0.5;
                                
                                console.log('🎤 Interim speech result:', text, 'confidence:', confidence);
                                
                                if (this.onResult) {
                                    this.onResult({
                                        transcript: text,
                                        confidence: confidence,
                                        isFinal: false  // Mark as interim
                                    });
                                }
                            }
                        } else if (output.startsWith('SPEECH_GRAMMAR:')) {
                            const grammarName = output.substring('SPEECH_GRAMMAR:'.length);
                            console.log('🎤 Grammar used:', grammarName);
                        } else if (output.startsWith('SPEECH_REJECTED:')) {
                            const rejectedText = output.substring('SPEECH_REJECTED:'.length);
                            console.log('🎤 Speech rejected (low confidence):', rejectedText);
                        } else if (output.startsWith('SPEECH_HYPOTHESIS:')) {
                            const hypothesis = output.substring('SPEECH_HYPOTHESIS:'.length);
                            console.log('🎤 Speech hypothesis:', hypothesis);
                        } else if (output.includes('SPEECH_END')) {
                            console.log('🎤 Speech recognition ended');
                            this.isListening = false;
                            if (this.onEnd) this.onEnd();
                        } else if (output.startsWith('SPEECH_ERROR:')) {
                            const errorMessage = output.substring('SPEECH_ERROR:'.length);
                            console.error('🎤 PowerShell speech error:', errorMessage);
                            if (this.onError) {
                                this.onError({
                                    error: 'native-error',
                                    message: `Speech recognition error: ${errorMessage}`
                                });
                            }
                        } else if (output.startsWith('SPEECH_ERROR_DETAILS:')) {
                            const errorDetails = output.substring('SPEECH_ERROR_DETAILS:'.length);
                            console.error('🎤 PowerShell error details:', errorDetails);
                        } else if (output.startsWith('SPEECH_DEBUG:')) {
                            const debugMessage = output.substring('SPEECH_DEBUG:'.length);
                            console.log('🎤 PowerShell debug:', debugMessage);
                        }
                    });

                    this.currentProcess.stderr.on('data', (data) => {
                        const errorOutput = data.toString().trim();
                        console.error('🎤 PowerShell stderr:', errorOutput);
                        if (this.onError) {
                            this.onError({
                                error: 'native-error',
                                message: `Speech recognition error: ${errorOutput}`
                            });
                        }
                    });

                    this.currentProcess.on('close', (code) => {
                        console.log('🎤 PowerShell process closed with code:', code);
                        this.isListening = false;
                        
                        // Clean up temp file
                        try {
                            if (fs.existsSync(scriptPath)) {
                                fs.unlinkSync(scriptPath);
                                console.log('🎤 Temp script file cleaned up');
                            }
                        } catch (error) {
                            console.warn('Failed to clean up temp script:', error);
                        }
                    });

                    this.currentProcess.on('error', (error) => {
                        console.error('🎤 PowerShell process error:', error);
                        this.isListening = false;
                        if (this.onError) {
                            this.onError({
                                error: 'native-process-error',
                                message: `Process error: ${error.message}`
                            });
                        }
                    });
                    
                    console.log('✅ Windows native speech recognition started');
                    
                } catch (error) {
                    console.error('❌ Failed to setup Windows native speech:', error);
                    if (this.onError) {
                        this.onError({
                            error: 'native-setup-failed',
                            message: `Failed to setup native speech: ${error.message}`
                        });
                    }
                    throw error;
                }
            },
            
            startListeningMacOS: function(spawn) {
                console.log('🎤 Starting macOS speech recognition...');
                
                // Use AppleScript for speech recognition
                const appleScript = `
tell application "SpeechRecognitionServer"
    listen for {"what", "did", "I", "eat", "today", "I", "had", "for", "breakfast", "lunch", "dinner"} giving up after 10
end tell
`;

                try {
                    this.currentProcess = spawn('osascript', ['-e', appleScript], {
                        stdio: 'pipe'
                    });

                    this.currentProcess.stdout.on('data', (data) => {
                        const output = data.toString().trim();
                        console.log('🎤 AppleScript output:', output);
                        
                        if (this.onResult && output) {
                            this.onResult({
                                transcript: output,
                                confidence: 0.8,
                                isFinal: true
                            });
                        }
                    });

                    this.currentProcess.stderr.on('data', (data) => {
                        console.error('🎤 AppleScript error:', data.toString());
                        if (this.onError) {
                            this.onError({
                                error: 'native-error',
                                message: `AppleScript error: ${data.toString()}`
                            });
                        }
                    });

                    this.currentProcess.on('close', (code) => {
                        console.log('🎤 AppleScript process closed with code:', code);
                        this.isListening = false;
                        if (this.onEnd) this.onEnd();
                    });

                    this.currentProcess.on('error', (error) => {
                        console.error('🎤 AppleScript process error:', error);
                        this.isListening = false;
                        if (this.onError) {
                            this.onError({
                                error: 'native-process-error',
                                message: `Process error: ${error.message}`
                            });
                        }
                    });

                    if (this.onStart) this.onStart();
                    this.isListening = true;
                    
                    console.log('✅ macOS native speech recognition started');
                    
                } catch (error) {
                    console.error('❌ Failed to setup macOS native speech:', error);
                    if (this.onError) {
                        this.onError({
                            error: 'native-setup-failed',
                            message: `Failed to setup native speech: ${error.message}`
                        });
                    }
                    throw error;
                }
            },
            
            stopListening: function() {
                console.log('🎤 Stopping inline native speech recognition...');
                
                if (this.currentProcess) {
                    console.log('🎤 Killing speech recognition process...');
                    this.currentProcess.kill();
                    this.currentProcess = null;
                }
                
                this.isListening = false;
                console.log('✅ Inline native speech recognition stopped');
            },
            
            abort: function() {
                console.log('🎤 Aborting inline native speech recognition...');
                this.stopListening();
            }
        };
    }

    /**
     * Initialize speech recognition
     */
    initialize() {
        // Debug: Check what's available in the Electron environment
        console.log('🔍 Debugging speech recognition support in Electron:');
        console.log('  - window.webkitSpeechRecognition:', !!window.webkitSpeechRecognition);
        console.log('  - window.SpeechRecognition:', !!window.SpeechRecognition);
        console.log('  - navigator.mediaDevices:', !!navigator.mediaDevices);
        console.log('  - navigator.getUserMedia:', !!navigator.getUserMedia);
        console.log('  - window.location.protocol:', window.location.protocol);
        console.log('  - process.type:', typeof process !== 'undefined' ? process.type : 'not available');
        console.log('  - process.versions.electron:', typeof process !== 'undefined' ? process.versions?.electron : 'not available');
        
        // In Electron, prioritize native speech recognition over Web Speech API
        if (this.isElectron) {
            console.log('🎤 Electron environment detected - prioritizing native speech recognition');
            
            // Try to use native service first
            if (this.nativeService) {
                console.log('🔄 Initializing existing native speech service...');
                try {
                    const nativeSuccess = this.nativeService.initialize();
                    console.log('🔍 Native service initialization result:', nativeSuccess);
                    if (nativeSuccess) {
                        console.log('✅ Native speech recognition initialized successfully');
                        this.useNative = true;
                        this.isSupported = true;
                        return true;
                    } else {
                        console.warn('❌ Native speech recognition initialization failed');
                    }
                } catch (error) {
                    console.error('❌ Error during native speech initialization:', error);
                }
            }
            
            // If no native service exists, create inline native service
            if (!this.nativeService) {
                console.log('🔄 Creating inline native service for Electron...');
                try {
                    this.nativeService = this.createInlineNativeService();
                    if (this.nativeService) {
                        console.log('🎤 Inline native service created, attempting initialization...');
                        const nativeSuccess = this.nativeService.initialize();
                        console.log('🔍 Inline native service initialization result:', nativeSuccess);
                        if (nativeSuccess) {
                            console.log('✅ Inline native speech recognition initialized successfully');
                            this.useNative = true;
                            this.isSupported = true;
                            return true;
                        } else {
                            console.warn('❌ Inline native speech recognition initialization failed');
                        }
                    }
                } catch (error) {
                    console.error('❌ Inline native service creation failed:', error);
                }
            }
            
            // If native service fails, still try Web Speech API as fallback
            console.log('🔄 Native service failed, checking Web Speech API as fallback...');
        }
        
        // Check for browser speech recognition support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('🎤 Web Speech API not available in this environment');
            
            // If we're in Electron and already tried native, this is a complete failure
            if (this.isElectron) {
                console.error('❌ Both native and Web Speech API failed in Electron environment');
                console.warn('🔧 This could be due to:');
                console.warn('  - Missing native speech recognition dependencies');
                console.warn('  - Electron security restrictions');
                console.warn('  - Platform-specific speech recognition not available');
                
                this.isSupported = false;
                return false;
            }
            
            // Not in Electron, so this is expected - no speech support
            console.warn('🔧 This could be due to:');
            console.warn('  - Browser security restrictions');
            console.warn('  - Missing permissions for microphone access');
            console.warn('  - Web Speech API not enabled in current browser');
            console.warn('  - Running in an unsupported context');
            
            this.isSupported = false;
            return false;
        }

        // Web Speech API is available, set it up
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Configure recognition settings for better reliability
            this.recognition.continuous = false;
            this.recognition.interimResults = true; // Enable real-time transcription
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;
            
            // Add settings to improve network reliability
            this.recognition.grammars = null; // Don't use grammars to reduce network calls
            
            console.log('🎤 Web Speech Recognition configuration:');
            console.log('  - continuous:', this.recognition.continuous);
            console.log('  - interimResults:', this.recognition.interimResults);
            console.log('  - lang:', this.recognition.lang);
            console.log('  - protocol:', window.location.protocol);
            console.log('  - userAgent:', navigator.userAgent.substring(0, 100));
        } catch (error) {
            console.error('🎤 Failed to create SpeechRecognition instance:', error);
            
            // If we're in Electron and have native service, fall back to it
            if (this.isElectron && this.nativeService) {
                console.log('🔄 Web Speech API failed, falling back to native service...');
                try {
                    const nativeSuccess = this.nativeService.initialize();
                    if (nativeSuccess) {
                        console.log('✅ Native speech recognition fallback successful');
                        this.useNative = true;
                        this.isSupported = true;
                        return true;
                    }
                } catch (nativeError) {
                    console.error('❌ Native fallback also failed:', nativeError);
                }
            }
            
            this.isSupported = false;
            return false;
        }

        // Set up event handlers for Web Speech API
        this.recognition.onstart = () => {
            console.log('🎤 Web Speech recognition started');
            this.isListening = true;
            if (this.onStart) this.onStart();
        };

        this.recognition.onresult = (event) => {
            // Handle both interim and final results
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                const confidence = event.results[i][0].confidence;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                    console.log('🎤 Final speech recognized:', transcript, `(confidence: ${confidence})`);
                } else {
                    interimTranscript += transcript;
                    console.log('🎤 Interim speech:', transcript);
                }
            }
            
            if (this.onResult) {
                if (finalTranscript) {
                    this.onResult({
                        transcript: finalTranscript.trim(),
                        confidence: event.results[event.results.length - 1][0].confidence || 0.8,
                        isFinal: true
                    });
                } else if (interimTranscript) {
                    this.onResult({
                        transcript: interimTranscript.trim(),
                        confidence: 0.5, // Lower confidence for interim
                        isFinal: false
                    });
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error('🎤 Web Speech recognition error:', event.error);
            console.error('🎤 Full error event:', event);
            this.isListening = false;
            
            // Handle network errors with specific guidance
            if (event.error === 'network') {
                console.warn('🎤 Network error detected - this often happens with:');
                console.warn('  - No internet connection to Google speech servers');
                console.warn('  - Browser security policies blocking speech API');
                console.warn('  - HTTPS requirement not met (some browsers)');
                console.warn('  - Google speech service temporarily unavailable');
                
                // Try to determine the specific cause
                if (window.location.protocol === 'file:') {
                    console.warn('  -> Running on file:// protocol - try http://localhost instead');
                } else if (!navigator.onLine) {
                    console.warn('  -> Browser reports no internet connection');
                } else {
                    console.warn('  -> Internet available but speech service unreachable');
                }
                
                // Provide troubleshooting tips
                console.warn('🔧 Troubleshooting steps:');
                console.warn('  1. Check internet connection');
                console.warn('  2. Try refreshing the browser');
                console.warn('  3. Ensure microphone permissions are granted');
                console.warn('  4. Try using Chrome or Edge browsers');
                console.warn('  5. Disable browser extensions that might block speech');
            }
            
            if (this.onError) {
                this.onError({
                    error: event.error,
                    message: this.getErrorMessage(event.error),
                    canRetry: event.error === 'network' || event.error === 'audio-capture',
                    troubleshooting: event.error === 'network' ? this.getNetworkTroubleshooting() : null
                });
            }
        };

        this.recognition.onend = () => {
            console.log('🎤 Web Speech recognition ended');
            this.isListening = false;
            if (this.onEnd) this.onEnd();
        };

        this.isSupported = true;
        console.log('✅ Web Speech service initialized successfully');
        return true;
    }

    /**
     * Check network connectivity for speech recognition
     */
    async checkNetworkConnectivity() {
        try {
            // Check if browser reports online status
            if (!navigator.onLine) {
                console.warn('🎤 Browser reports offline status');
                return false;
            }
            
            // Try to reach a reliable endpoint
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-cache'
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.warn('🎤 Network connectivity check failed:', error.message);
            return false;
        }
    }

    /**
     * Start listening for speech with network checks and retry logic
     */
    async startListening(options = {}) {
        if (!this.isSupported) {
            throw new Error('Speech recognition not supported');
        }

        if (this.isListening) {
            console.warn('🎤 Already listening');
            return;
        }

        console.log(`🎤 Starting speech recognition with options (attempt ${this.retryCount + 1}/${this.maxRetries + 1}):`, options);
        
        // Use native service if available
        if (this.useNative && this.nativeService) {
            console.log('🎤 Using native speech recognition service');
            return await this.nativeService.startListening(options);
        }
        
        // Store options for potential retry
        this.lastStartOptions = options;

        // Check network connectivity first
        const isConnected = await this.checkNetworkConnectivity();
        if (!isConnected) {
            console.warn('🎤 Network connectivity check failed, but attempting speech recognition anyway');
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
            console.log('🎤 Calling recognition.start()...');
            this.recognition.start();
            console.log('🎤 recognition.start() called successfully');
            
            // Reset retry count on successful start
            this.retryCount = 0;
        } catch (error) {
            console.error('🎤 Failed to start speech recognition:', error);
            
            // Try to retry on network errors
            if (error.message.includes('network') && this.retryCount < this.maxRetries) {
                console.warn(`🔄 Retrying speech recognition in 2 seconds (${this.retryCount + 1}/${this.maxRetries})...`);
                this.retryCount++;
                
                setTimeout(() => {
                    this.startListening(this.lastStartOptions);
                }, 2000);
                
                return; // Don't throw the error yet, give retry a chance
            }
            
            // Reset retry count and throw error
            this.retryCount = 0;
            throw error;
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.useNative && this.nativeService) {
            console.log('🎤 Stopping native speech recognition...');
            this.nativeService.stopListening();
            return;
        }
        
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
        if (this.useNative && this.nativeService) {
            console.log('🎤 Aborting native speech recognition...');
            this.nativeService.abort();
            return;
        }
        
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
        
        // Also set handlers for native service if using it
        if (this.useNative && this.nativeService) {
            this.nativeService.setEventHandlers({ onResult, onError, onStart, onEnd });
        }
    }

    /**
     * Get user-friendly error messages
     */
    getErrorMessage(error) {
        const errorMessages = {
            'no-speech': 'No speech was detected. Please try again.',
            'audio-capture': 'Audio capture failed. Please check your microphone.',
            'not-allowed': 'Microphone permission denied. Please allow microphone access.',
            'network': 'Unable to connect to speech recognition service. This may be due to internet connectivity or browser security policies.',
            'service-not-allowed': 'Speech recognition service not allowed.',
            'bad-grammar': 'Grammar compilation failed.',
            'language-not-supported': 'Language not supported.',
            'aborted': 'Speech recognition was aborted.'
        };

        return errorMessages[error] || `Speech recognition error: ${error}`;
    }

    /**
     * Get network troubleshooting guidance
     */
    getNetworkTroubleshooting() {
        return {
            common: [
                'Check your internet connection',
                'Try refreshing the browser',
                'Ensure microphone permissions are granted',
                'Try using Chrome or Edge browsers'
            ],
            advanced: [
                'Disable browser extensions that might block speech',
                'Check if antivirus software is blocking network requests',
                'Try running the app on http://localhost instead of file://',
                'Clear browser cache and cookies',
                'Try using an incognito/private browsing window'
            ],
            technical: [
                'Browser\'s speech recognition uses Google\'s servers',
                'Some browsers require HTTPS for speech recognition',
                'Corporate networks may block speech recognition APIs',
                'Firewall settings might prevent access to speech services'
            ]
        };
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
        if (this.useNative && this.nativeService) {
            console.log('🎤 Requesting permission for native speech recognition...');
            return await this.nativeService.requestPermission();
        }
        
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