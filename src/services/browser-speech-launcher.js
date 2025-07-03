const { shell } = require('electron');
const express = require('express');
const path = require('path');

class BrowserSpeechLauncher {
    constructor() {
        this.server = null;
        this.port = 3456;
        this.isServerRunning = false;
    }

    /**
     * Start local server for browser-based speech recognition
     */
    async startServer() {
        if (this.isServerRunning) {
            console.log('🌐 Browser speech server already running');
            return;
        }

        const app = express();
        
        // Serve static files
        app.use(express.static(path.join(__dirname, '../renderer')));
        
        // Simple voice logging page
        app.get('/voice', (req, res) => {
            res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Fitly Voice Logging</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #1a1a1a; color: white; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; }
        .voice-btn { background: #4CAF50; color: white; border: none; padding: 15px 30px; 
                    font-size: 18px; border-radius: 8px; cursor: pointer; margin: 10px; }
        .voice-btn:hover { background: #45a049; }
        .voice-btn:disabled { background: #666; cursor: not-allowed; }
        .transcript { background: #333; padding: 15px; border-radius: 8px; margin: 20px 0; 
                     min-height: 60px; border: 2px solid #555; }
        .status { margin: 10px 0; font-weight: bold; }
        .recording { color: #ff4444; }
        .success { color: #4CAF50; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎤 Fitly Voice Logging</h1>
        <p>Click the button below to start voice recognition</p>
        
        <button id="startBtn" class="voice-btn">🎤 Start Voice Logging</button>
        <button id="stopBtn" class="voice-btn" disabled>⏹️ Stop Recording</button>
        
        <div id="status" class="status">Ready to start recording</div>
        <div id="transcript" class="transcript">Your speech will appear here...</div>
        
        <button id="sendBtn" class="voice-btn" disabled>📤 Send to Fitly</button>
        <button id="clearBtn" class="voice-btn">🗑️ Clear</button>
    </div>

    <script>
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const sendBtn = document.getElementById('sendBtn');
        const clearBtn = document.getElementById('clearBtn');
        const status = document.getElementById('status');
        const transcript = document.getElementById('transcript');
        
        let recognition = null;
        let finalTranscript = '';
        
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            status.textContent = '❌ Speech recognition not supported in this browser. Please use Chrome or Edge.';
            startBtn.disabled = true;
        } else {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            recognition.onstart = () => {
                status.textContent = '🎤 Listening... Speak now!';
                status.className = 'status recording';
                startBtn.disabled = true;
                stopBtn.disabled = false;
            };
            
            recognition.onresult = (event) => {
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += result;
                    } else {
                        interimTranscript += result;
                    }
                }
                
                transcript.innerHTML = finalTranscript + '<span style="color: #888;">' + interimTranscript + '</span>';
            };
            
            recognition.onend = () => {
                status.textContent = finalTranscript ? '✅ Recording complete!' : '❌ No speech detected';
                status.className = finalTranscript ? 'status success' : 'status';
                startBtn.disabled = false;
                stopBtn.disabled = true;
                sendBtn.disabled = !finalTranscript;
            };
            
            recognition.onerror = (event) => {
                status.textContent = '❌ Error: ' + event.error;
                status.className = 'status';
                startBtn.disabled = false;
                stopBtn.disabled = true;
            };
        }
        
        startBtn.onclick = () => {
            if (recognition) {
                finalTranscript = '';
                transcript.textContent = 'Listening...';
                recognition.start();
            }
        };
        
        stopBtn.onclick = () => {
            if (recognition) {
                recognition.stop();
            }
        };
        
        clearBtn.onclick = () => {
            finalTranscript = '';
            transcript.textContent = 'Your speech will appear here...';
            status.textContent = 'Ready to start recording';
            status.className = 'status';
            sendBtn.disabled = true;
        };
        
        sendBtn.onclick = () => {
            if (finalTranscript) {
                // In a real implementation, this would send data back to Electron
                alert('Transcript: "' + finalTranscript + '"\\n\\nThis would be sent to Fitly for meal analysis.');
                
                // Close the window after sending
                setTimeout(() => {
                    window.close();
                }, 1000);
            }
        };
    </script>
</body>
</html>
            `);
        });

        return new Promise((resolve, reject) => {
            this.server = app.listen(this.port, (error) => {
                if (error) {
                    console.error('❌ Failed to start browser speech server:', error);
                    reject(error);
                } else {
                    console.log(`🌐 Browser speech server running at http://localhost:${this.port}/voice`);
                    this.isServerRunning = true;
                    resolve();
                }
            });
        });
    }

    /**
     * Open voice logging in system browser
     */
    async openVoiceLogging() {
        try {
            // Start server if not running
            if (!this.isServerRunning) {
                await this.startServer();
            }

            // Open in system browser
            const url = `http://localhost:${this.port}/voice`;
            console.log('🌐 Opening voice logging in browser:', url);
            shell.openExternal(url);
            
            return { success: true, url };
        } catch (error) {
            console.error('❌ Failed to open browser voice logging:', error);
            throw error;
        }
    }

    /**
     * Stop the server
     */
    stopServer() {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.isServerRunning = false;
            console.log('🌐 Browser speech server stopped');
        }
    }
}

module.exports = { BrowserSpeechLauncher }; 