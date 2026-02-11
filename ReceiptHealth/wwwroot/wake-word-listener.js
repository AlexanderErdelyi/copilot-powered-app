/**
 * Wake Word Listener - "Hey Assistant" Voice Activation
 * This module continuously listens for the wake word "Hey Assistant" 
 * and activates a voice command interface when detected.
 */

(function() {
    'use strict';

    // Configuration
    const WAKE_WORDS = ['hey assistant', 'a assistant', 'ok assistant'];
    const ACTIVATION_TIMEOUT = 30000; // 30 seconds after activation
    
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechRecognition) {
        console.warn('⚠️ Wake word listener: Speech recognition not supported in this browser');
        return;
    }

    // State
    let wakeWordRecognition = null;
    let commandRecognition = null;
    let isWakeWordListening = false;
    let isCommandMode = false;
    let activationTimer = null;
    let conversationHistory = [];
    let availableVoices = [];
    let selectedVoice = null;
    let isEnabled = true; // Wake word listener enabled state

    // DOM Elements (will be created dynamically)
    let floatingIndicator = null;
    let voiceModal = null;
    let modalStatus = null;
    let modalTranscript = null;
    let modalResponse = null;

    /**
     * Load enabled state from localStorage
     */
    function loadEnabledState() {
        const saved = localStorage.getItem('wakeWordEnabled');
        isEnabled = saved === null ? true : saved === 'true';
        return isEnabled;
    }

    /**
     * Save enabled state to localStorage
     */
    function saveEnabledState(enabled) {
        isEnabled = enabled;
        localStorage.setItem('wakeWordEnabled', enabled.toString());
    }

    /**
     * Toggle wake word listener on/off
     */
    function toggleWakeWordListener() {
        const newState = !isEnabled;
        saveEnabledState(newState);
        
        if (newState) {
            // Enable
            console.log('🎤 Wake word listener enabled');
            requestMicrophonePermission();
            updateIndicatorState();
        } else {
            // Disable
            console.log('🔇 Wake word listener disabled');
            stopWakeWordRecognition();
            updateIndicatorState();
        }
    }

    /**
     * Initialize the wake word listener
     */
    function init() {
        // Don't activate on voice-assistant.html page (already has full UI)
        if (window.location.pathname.includes('voice-assistant.html')) {
            console.log('👋 Wake word listener disabled on voice-assistant page');
            return;
        }

        console.log('🎤 Initializing wake word listener...');
        
        // Load enabled state
        loadEnabledState();
        
        // Load voices
        loadVoices();
        if (SpeechSynthesis) {
            SpeechSynthesis.onvoiceschanged = loadVoices;
        }

        // Create UI elements
        createFloatingIndicator();
        createVoiceModal();

        // Initialize wake word recognition
        initWakeWordRecognition();

        // Request microphone permission and start listening if enabled
        if (isEnabled) {
            requestMicrophonePermission();
        }
    }

    /**
     * Load available voices for speech synthesis
     */
    function loadVoices() {
        availableVoices = SpeechSynthesis.getVoices();
        
        if (availableVoices.length === 0) {
            setTimeout(loadVoices, 100);
            return;
        }

        // Select the most natural-sounding English voice with priority order:
        // 1. Premium/Enhanced voices (Google US English, Microsoft Natural)
        // 2. Google voices (generally high quality)
        // 3. Natural/Neural voices
        // 4. Any English voice
        // 5. Fallback to first available
        
        // Priority list for best natural voices
        const premiumVoices = [
            'Google US English',
            'Google UK English Female',
            'Microsoft Zira - English (United States)',
            'Microsoft Mark - English (United States)',
            'Samantha',  // macOS/iOS premium voice
            'Alex',      // macOS/iOS premium voice
            'Moira',     // macOS/iOS UK voice
        ];
        
        // Try premium voices first
        for (const premiumName of premiumVoices) {
            const voice = availableVoices.find(v => 
                v.lang.startsWith('en') && v.name.includes(premiumName)
            );
            if (voice) {
                selectedVoice = voice;
                console.log('🎵 Selected premium voice:', selectedVoice.name);
                return;
            }
        }
        
        // Try Enhanced/Natural/Neural voices
        selectedVoice = availableVoices.find(v => 
            v.lang.startsWith('en') && 
            (v.name.toLowerCase().includes('enhanced') || 
             v.name.toLowerCase().includes('natural') || 
             v.name.toLowerCase().includes('neural'))
        );
        
        if (selectedVoice) {
            console.log('🎵 Selected natural voice:', selectedVoice.name);
            return;
        }
        
        // Try Google voices (generally high quality)
        selectedVoice = availableVoices.find(v => 
            v.lang.startsWith('en') && v.name.includes('Google')
        );
        
        if (selectedVoice) {
            console.log('🎵 Selected Google voice:', selectedVoice.name);
            return;
        }
        
        // Fallback to any English voice or first available
        selectedVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
        console.log('🎵 Selected voice:', selectedVoice?.name);
    }

    /**
     * Request microphone permission
     */
    function requestMicrophonePermission() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('⚠️ getUserMedia not supported');
            showFloatingIndicator('Click to enable voice', 'idle');
            floatingIndicator.onclick = startWakeWordListening;
            return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                console.log('✅ Microphone permission granted');
                startWakeWordListening();
            })
            .catch(err => {
                console.warn('⚠️ Microphone permission denied:', err);
                showFloatingIndicator('Click to enable voice', 'idle');
                floatingIndicator.onclick = () => {
                    // Retry permission request
                    requestMicrophonePermission();
                };
            });
    }

    /**
     * Initialize wake word recognition
     */
    function initWakeWordRecognition() {
        wakeWordRecognition = new SpeechRecognition();
        wakeWordRecognition.continuous = true;
        wakeWordRecognition.interimResults = true;
        wakeWordRecognition.lang = 'en-US';
        wakeWordRecognition.maxAlternatives = 3;

        wakeWordRecognition.onstart = () => {
            isWakeWordListening = true;
            console.log('👂 Wake word listener started');
            showFloatingIndicator('Listening for "Hey Assistant"', 'listening');
        };

        wakeWordRecognition.onend = () => {
            isWakeWordListening = false;
            console.log('👂 Wake word listener ended');
            
            // Auto-restart if not in command mode and if enabled
            if (!isCommandMode && isEnabled) {
                setTimeout(() => {
                    if (!isCommandMode && isEnabled) {
                        startWakeWordListening();
                    }
                }, 1000);
            }
        };

        wakeWordRecognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.toLowerCase().trim();
                
                // Check if any wake word was detected
                const wakeWordDetected = WAKE_WORDS.some(word => transcript.includes(word));
                
                if (wakeWordDetected) {
                    console.log('🎯 Wake word detected:', transcript);
                    activateCommandMode();
                    break;
                }
            }
        };

        wakeWordRecognition.onerror = (event) => {
            console.error('❌ Wake word recognition error:', event.error);
            
            if (event.error === 'not-allowed') {
                showFloatingIndicator('Mic permission needed', 'error');
            } else if (event.error === 'no-speech') {
                // Ignore no-speech errors, just restart
                if (!isCommandMode) {
                    startWakeWordListening();
                }
            }
        };
    }

    /**
     * Start listening for wake word
     */
    function startWakeWordListening() {
        if (isWakeWordListening || isCommandMode || !isEnabled) {
            return;
        }

        try {
            wakeWordRecognition.start();
        } catch (err) {
            console.error('❌ Failed to start wake word listener:', err);
            setTimeout(() => {
                if (!isWakeWordListening && !isCommandMode && isEnabled) {
                    startWakeWordListening();
                }
            }, 2000);
        }
    }

    /**
     * Stop listening for wake word
     */
    function stopWakeWordListening() {
        if (wakeWordRecognition && isWakeWordListening) {
            try {
                wakeWordRecognition.stop();
            } catch (err) {
                console.error('❌ Failed to stop wake word listener:', err);
            }
        }
    }

    /**
     * Completely stop wake word recognition
     */
    function stopWakeWordRecognition() {
        stopWakeWordListening();
        isWakeWordListening = false;
    }

    /**
     * Activate command mode (user can now give commands)
     */
    function activateCommandMode() {
        stopWakeWordListening();
        isCommandMode = true;
        
        // Play activation sound (using speech)
        speak('Yes?', false);
        
        // Show modal
        showVoiceModal();
        updateModalStatus('Listening for your command...', 'listening');
        
        // Start command recognition
        startCommandRecognition();
        
        // Set timeout to deactivate
        if (activationTimer) {
            clearTimeout(activationTimer);
        }
        activationTimer = setTimeout(() => {
            deactivateCommandMode('Timeout - say "Hey Assistant" to activate again');
        }, ACTIVATION_TIMEOUT);
    }

    /**
     * Deactivate command mode
     */
    function deactivateCommandMode(message) {
        isCommandMode = false;
        
        if (commandRecognition) {
            try {
                commandRecognition.stop();
            } catch (err) {
                console.error('❌ Failed to stop command recognition:', err);
            }
        }
        
        if (activationTimer) {
            clearTimeout(activationTimer);
            activationTimer = null;
        }
        
        if (message) {
            updateModalStatus(message, 'idle');
            setTimeout(() => {
                hideVoiceModal();
                startWakeWordListening();
            }, 2000);
        } else {
            hideVoiceModal();
            startWakeWordListening();
        }
    }

    /**
     * Start command recognition
     */
    function startCommandRecognition() {
        if (!commandRecognition) {
            commandRecognition = new SpeechRecognition();
            commandRecognition.continuous = false;
            commandRecognition.interimResults = true;
            commandRecognition.lang = 'en-US';
            commandRecognition.maxAlternatives = 1;

            commandRecognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript;
                    } else {
                        interimTranscript += result[0].transcript;
                    }
                }

                modalTranscript.textContent = finalTranscript || interimTranscript;

                if (finalTranscript) {
                    console.log('📝 Command received:', finalTranscript);
                    processVoiceCommand(finalTranscript);
                }
            };

            commandRecognition.onerror = (event) => {
                console.error('❌ Command recognition error:', event.error);
                updateModalStatus(`Error: ${event.error}`, 'error');
            };

            commandRecognition.onend = () => {
                // Auto-restart if still in command mode
                if (isCommandMode) {
                    setTimeout(() => {
                        if (isCommandMode) {
                            try {
                                commandRecognition.start();
                            } catch (err) {
                                console.error('❌ Failed to restart command recognition:', err);
                            }
                        }
                    }, 500);
                }
            };
        }

        try {
            commandRecognition.start();
        } catch (err) {
            console.error('❌ Failed to start command recognition:', err);
        }
    }

    /**
     * Process voice command
     */
    async function processVoiceCommand(text) {
        updateModalStatus('Processing...', 'processing');
        
        // Add to conversation history
        conversationHistory.push({
            role: 'user',
            content: text
        });

        // Keep only last 10 messages (5 exchanges)
        if (conversationHistory.length > 10) {
            conversationHistory = conversationHistory.slice(-10);
        }

        try {
            const response = await fetch('/api/voice/process-command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    command: text,
                    history: conversationHistory
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Response received:', data);

            // Add assistant response to history
            conversationHistory.push({
                role: 'assistant',
                content: data.response
            });

            // Display response
            modalResponse.innerHTML = formatResponse(data.response);
            updateModalStatus('Response received', 'success');

            // Speak response
            speak(data.response, true);

            // Reset activation timer
            if (activationTimer) {
                clearTimeout(activationTimer);
            }
            activationTimer = setTimeout(() => {
                deactivateCommandMode('Timeout - say "Hey Assistant" to activate again');
            }, ACTIVATION_TIMEOUT);

        } catch (err) {
            console.error('❌ Error processing command:', err);
            const errorMsg = `Sorry, I couldn't process that: ${err.message}`;
            modalResponse.textContent = errorMsg;
            updateModalStatus('Error', 'error');
            speak(errorMsg, true);
        }
    }

    /**
     * Format response text (convert URLs to links, etc.)
     */
    function formatResponse(text) {
        // Convert URLs to clickable links (exclude trailing punctuation)
        const urlRegex = /(https?:\/\/[^\s]+?)(?=[.,;:!?)\]\s]|$)/g;
        return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
    }

    /**
     * Process text for more natural speech delivery
     */
    function processTextForSpeech(text) {
        // Add natural pauses after punctuation for breathing and clarity
        let processed = text
            .replace(/\. /g, '.  ')      // Longer pause after sentences
            .replace(/, /g, ',  ')       // Pause after commas
            .replace(/! /g, '!  ')       // Pause after exclamations
            .replace(/\? /g, '?  ')      // Pause after questions
            .replace(/: /g, ':  ')       // Pause after colons
            .replace(/; /g, ';  ');      // Pause after semicolons
        
        // Handle currency more naturally (including decimals)
        processed = processed.replace(/\$(\d+(?:\.\d{2})?)/g, (match, amount) => {
            const [dollars, cents] = amount.split('.');
            if (cents) {
                return `${dollars} dollars and ${cents} cents`;
            }
            return `${dollars} dollars`;
        });
        
        // Handle percentages (including decimals)
        processed = processed.replace(/\b(\d+(?:\.\d+)?)%/g, '$1 percent');
        
        // Handle common abbreviations (case-insensitive)
        processed = processed
            .replace(/\bAI\b/gi, 'A I')
            .replace(/\bAPI\b/gi, 'A P I')
            .replace(/\bURL\b/gi, 'U R L');
        
        return processed;
    }

    /**
     * Speak text using natural speech synthesis
     */
    function speak(text, isFullResponse) {
        if (!SpeechSynthesis) {
            return;
        }

        // Stop any ongoing speech
        SpeechSynthesis.cancel();

        // Process text for more natural delivery
        const processedText = processTextForSpeech(text);

        const utterance = new SpeechSynthesisUtterance(processedText);
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        // Natural speech parameters (more human-like)
        // Rate: Slightly slower for clarity and natural feel
        utterance.rate = 0.92;
        
        // Pitch: Slightly higher for friendlier, more engaging tone
        // Research shows slightly higher pitch is perceived as more pleasant
        utterance.pitch = 1.08;
        
        // Volume: Slightly lower can sound less robotic
        utterance.volume = 0.95;

        // Add event handlers for better UX
        utterance.onend = () => {
            console.log('✅ Finished speaking');
        };

        utterance.onerror = (event) => {
            console.error('❌ Speech synthesis error:', event);
        };

        SpeechSynthesis.speak(utterance);
    }

    /**
     * Create floating indicator button
     */
    function createFloatingIndicator() {
        floatingIndicator = document.createElement('div');
        floatingIndicator.id = 'wake-word-indicator';
        floatingIndicator.className = 'wake-word-indicator';
        floatingIndicator.title = isEnabled ? 'Click to disable voice listening' : 'Click to enable voice listening';
        
        // Add click handler to toggle
        floatingIndicator.addEventListener('click', toggleWakeWordListener);
        
        // Add right-click context menu prevention (use click to toggle instead)
        floatingIndicator.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleWakeWordListener();
        });
        
        updateIndicatorState();
        
        document.body.appendChild(floatingIndicator);
    }

    /**
     * Update indicator visual state
     */
    function updateIndicatorState() {
        if (!floatingIndicator) return;
        
        if (isEnabled) {
            floatingIndicator.innerHTML = '🎤';
            floatingIndicator.className = 'wake-word-indicator';
            floatingIndicator.title = 'Voice listening enabled - Click to disable';
            floatingIndicator.style.opacity = '1';
        } else {
            floatingIndicator.innerHTML = '🔇';
            floatingIndicator.className = 'wake-word-indicator disabled';
            floatingIndicator.title = 'Voice listening disabled - Click to enable';
            floatingIndicator.style.opacity = '0.5';
        }
    }

    /**
     * Show/update floating indicator
     */
    function showFloatingIndicator(tooltip, state) {
        floatingIndicator.title = tooltip;
        floatingIndicator.className = `wake-word-indicator ${state}`;
    }

    /**
     * Create voice modal
     */
    function createVoiceModal() {
        voiceModal = document.createElement('div');
        voiceModal.id = 'wake-word-modal';
        voiceModal.className = 'wake-word-modal hidden';
        voiceModal.innerHTML = `
            <div class="wake-word-modal-content">
                <div class="wake-word-modal-header">
                    <h2>🎤 Voice Assistant</h2>
                    <button class="wake-word-close-btn" id="wakeWordCloseBtn">✕</button>
                </div>
                
                <div class="wake-word-status" id="wakeWordStatus">Ready</div>
                
                <div class="wake-word-transcript-section">
                    <label>You said:</label>
                    <div class="wake-word-transcript" id="wakeWordTranscript">Listening...</div>
                </div>
                
                <div class="wake-word-response-section">
                    <label>Assistant:</label>
                    <div class="wake-word-response" id="wakeWordResponse">Waiting for command...</div>
                </div>
                
                <div class="wake-word-actions">
                    <button class="wake-word-btn" id="wakeWordStopBtn">🔇 Stop Speaking</button>
                    <button class="wake-word-btn" id="wakeWordDismissBtn">Dismiss</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(voiceModal);
        
        // Get references
        modalStatus = document.getElementById('wakeWordStatus');
        modalTranscript = document.getElementById('wakeWordTranscript');
        modalResponse = document.getElementById('wakeWordResponse');
        
        // Add event listeners
        document.getElementById('wakeWordCloseBtn').onclick = () => {
            deactivateCommandMode();
        };
        
        document.getElementById('wakeWordDismissBtn').onclick = () => {
            deactivateCommandMode();
        };
        
        document.getElementById('wakeWordStopBtn').onclick = () => {
            if (SpeechSynthesis) {
                SpeechSynthesis.cancel();
            }
        };
    }

    /**
     * Show voice modal
     */
    function showVoiceModal() {
        voiceModal.classList.remove('hidden');
        modalTranscript.textContent = 'Listening...';
        modalResponse.textContent = 'Waiting for command...';
    }

    /**
     * Hide voice modal
     */
    function hideVoiceModal() {
        voiceModal.classList.add('hidden');
    }

    /**
     * Update modal status
     */
    function updateModalStatus(message, state) {
        modalStatus.textContent = message;
        modalStatus.className = `wake-word-status ${state}`;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
