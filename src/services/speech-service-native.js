const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class NativeSpeechService {
    constructor() {
        this.isSupported = this.checkSupport();
        this.isListening = false;
        this.onResult = null;
        this.onError = null;
        this.onStart = null;
        this.onEnd = null;
        this.currentProcess = null;
    }

    /**
     * Check if native speech recognition is supported
     */
    checkSupport() {
        // Check platform support
        if (process.platform === 'win32') {
            // Windows has built-in speech recognition
            return true;
        } else if (process.platform === 'darwin') {
            // macOS has built-in speech recognition
            return true;
        } else if (process.platform === 'linux') {
            // Linux requires additional setup but is possible
            return true;
        }
        
        return false;
    }

    /**
     * Initialize speech recognition
     */
    initialize() {
        console.log('🎤 Initializing native speech recognition...');
        console.log('  - Platform:', process.platform);
        console.log('  - Supported:', this.isSupported);
        
        if (!this.isSupported) {
            console.warn('🎤 Native speech recognition not supported on this platform');
            return false;
        }

        console.log('✅ Native speech service initialized successfully');
        return true;
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
     * Request permission (automatically granted for native)
     */
    async requestPermission() {
        console.log('🎤 Native speech recognition permissions automatically granted');
        return true;
    }

    /**
     * Start listening using Windows Speech Recognition
     */
    async startListeningWindows() {
        console.log('🎤 Starting Windows speech recognition...');
        
        // Create PowerShell script for speech recognition
        const psScript = `
Add-Type -AssemblyName System.Speech
$recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$recognizer.SetInputToDefaultAudioDevice()

# Create grammar for general speech
$grammarBuilder = New-Object System.Speech.Recognition.GrammarBuilder
$grammarBuilder.Culture = [System.Globalization.CultureInfo]::GetCultureInfo("en-US")
$grammar = New-Object System.Speech.Recognition.Grammar($grammarBuilder)
$recognizer.LoadGrammar($grammar)

# Start recognition
$recognizer.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)

# Output when speech is recognized
Register-ObjectEvent -InputObject $recognizer -EventName "SpeechRecognized" -Action {
    $result = $Event.SourceEventArgs.Result
    Write-Host "SPEECH_RESULT:$($result.Text):$($result.Confidence)"
}

# Output when recognition completes
Register-ObjectEvent -InputObject $recognizer -EventName "RecognizeCompleted" -Action {
    Write-Host "SPEECH_END"
}

Write-Host "SPEECH_START"
Start-Sleep -Seconds 10  # Listen for 10 seconds
$recognizer.RecognizeAsyncCancel()
Write-Host "SPEECH_END"
`;

        const scriptPath = path.join(__dirname, '../temp/speech-recognition.ps1');
        
        // Ensure temp directory exists
        const tempDir = path.dirname(scriptPath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Write PowerShell script
        fs.writeFileSync(scriptPath, psScript);
        
        // Execute PowerShell script
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
            } else if (output.includes('SPEECH_END')) {
                console.log('🎤 Speech recognition ended');
                this.isListening = false;
                if (this.onEnd) this.onEnd();
            }
        });

        this.currentProcess.stderr.on('data', (data) => {
            console.error('🎤 PowerShell error:', data.toString());
            if (this.onError) {
                this.onError({
                    error: 'native-error',
                    message: `Speech recognition error: ${data.toString()}`
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
                }
            } catch (error) {
                console.warn('Failed to clean up temp script:', error);
            }
        });
    }

    /**
     * Start listening using macOS speech recognition
     */
    async startListeningMacOS() {
        console.log('🎤 Starting macOS speech recognition...');
        
        // Use AppleScript for speech recognition
        const appleScript = `
tell application "SpeechRecognitionServer"
    listen for {"what", "did", "I", "eat", "today"} giving up after 10
end tell
`;

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

        this.currentProcess.on('close', (code) => {
            console.log('🎤 AppleScript process closed with code:', code);
            this.isListening = false;
            if (this.onEnd) this.onEnd();
        });

        if (this.onStart) this.onStart();
        this.isListening = true;
    }

    /**
     * Start listening using Linux speech recognition
     */
    async startListeningLinux() {
        console.log('🎤 Linux speech recognition requires additional setup');
        console.log('💡 Please install: sudo apt-get install espeak espeak-data libespeak1 libespeak-dev');
        
        if (this.onError) {
            this.onError({
                error: 'not-implemented',
                message: 'Linux speech recognition requires additional system packages. Please use manual input.'
            });
        }
    }

    /**
     * Start listening for speech
     */
    async startListening(options = {}) {
        if (!this.isSupported) {
            throw new Error('Native speech recognition not supported');
        }

        if (this.isListening) {
            console.warn('🎤 Already listening');
            return;
        }

        console.log('🎤 Starting native speech recognition on:', process.platform);

        try {
            if (process.platform === 'win32') {
                await this.startListeningWindows();
            } else if (process.platform === 'darwin') {
                await this.startListeningMacOS();
            } else if (process.platform === 'linux') {
                await this.startListeningLinux();
            }
        } catch (error) {
            console.error('🎤 Failed to start native speech recognition:', error);
            this.isListening = false;
            throw error;
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        console.log('🎤 Stopping native speech recognition...');
        
        if (this.currentProcess) {
            this.currentProcess.kill();
            this.currentProcess = null;
        }
        
        this.isListening = false;
        console.log('🎤 Native speech recognition stopped');
    }

    /**
     * Abort listening
     */
    abort() {
        this.stopListening();
    }

    /**
     * Get error message
     */
    getErrorMessage(error) {
        switch (error) {
            case 'not-implemented':
                return 'Speech recognition not implemented for this platform';
            case 'native-error':
                return 'Native speech recognition system error';
            default:
                return 'Unknown speech recognition error';
        }
    }

    /**
     * Get state
     */
    getState() {
        return {
            isSupported: this.isSupported,
            isListening: this.isListening,
            platform: process.platform
        };
    }
}

module.exports = { NativeSpeechService }; 