import { Mic, MicOff, Volume2, Send, Settings, Volume1, Radio } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

function VoiceAssistant() {
  const location = useLocation();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [response, setResponse] = useState('');
  const [processing, setProcessing] = useState(false);
  const [useTextMode, setUseTextMode] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('en-US-AriaNeural');
  const [testingVoice, setTestingVoice] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const audioRef = useRef(null);
  const streamingIntervalRef = useRef(null);
  const autoStartHandledRef = useRef(false);
  const [sessionId, setSessionId] = useState(() => {
    // Get or create session ID from sessionStorage
    let id = sessionStorage.getItem('voiceAssistantSessionId');
    if (!id) {
      id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('voiceAssistantSessionId', id);
    }
    return id;
  });

  useEffect(() => {
    // Load saved voice preference
    const savedVoice = localStorage.getItem('preferredEdgeVoice');
    if (savedVoice) {
      setSelectedVoice(savedVoice);
    }
    
    // Load available voices
    loadVoices();
    
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        processCommand(transcript);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
        
        // Don't show error toast for aborted errors in continuous mode
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          toast.error('Speech recognition error');
        }
        
        // Try to restart in continuous mode if not aborted
        if (continuousMode && event.error !== 'aborted') {
          console.log('📢 Attempting to restart after error in continuous mode');
          setTimeout(() => {
            if (!listening && !processing && continuousMode) {
              startListening();
            }
          }, 1000);
        }
      };

      recognitionInstance.onend = () => {
        console.log('🎤 Recognition ended, listening state:', listening);
        setListening(false);
        // Restart logic is handled in speak() onended callback for continuous mode
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Handle wake word events and autoStart (separate effect that depends on recognition being ready)
  useEffect(() => {
    if (!recognition) return; // Wait for recognition to be initialized
    
    // Handle wake word event
    const handleWakeWord = () => {
      console.log('✨ Wake word event received, starting listening...');
      if (!listening && !processing) {
        setContinuousMode(true);
        setTimeout(() => {
          startListening();
        }, 500);
      }
    };
    
    window.addEventListener('wakeWordDetected', handleWakeWord);
    
    // Check if navigated with enableContinuousMode or autoStart from wake word (only handle once per navigation)
    if ((location.state?.enableContinuousMode || location.state?.autoStart) && !listening && !processing && !autoStartHandledRef.current) {
      console.log('📍 Navigated with continuous mode enabled from wake word');
      autoStartHandledRef.current = true;
      setContinuousMode(true);
      setTimeout(() => {
        console.log('🎤 AutoStart: Starting listening...');
        startListening();
      }, 800);
    }
    
    return () => {
      window.removeEventListener('wakeWordDetected', handleWakeWord);
      // Reset autoStart flag when leaving the page
      if (location.pathname !== '/voice-assistant') {
        autoStartHandledRef.current = false;
      }
    };
  }, [location, recognition, listening, processing]);

  // Listen for changes to listeningMode (when user cycles to AI Assistant mode)
  useEffect(() => {
    if (!recognition) return;

    const handleModeChange = () => {
      const mode = localStorage.getItem('listeningMode');
      if (mode === 'aiAssistant' && !listening && !processing && !continuousMode) {
        console.log('🎤 Listening mode changed to AI Assistant, enabling continuous mode');
        setContinuousMode(true);
        setTimeout(() => {
          startListening();
        }, 500);
      }
    };

    // Check every second for mode changes
    const interval = setInterval(handleModeChange, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [recognition, listening, processing, continuousMode]);

  // Sync with global chat history
  useEffect(() => {
    // Load global chat history on mount
    const loadGlobalHistory = () => {
      try {
        const globalHistory = localStorage.getItem('globalChatHistory');
        if (globalHistory) {
          const parsed = JSON.parse(globalHistory);
          // Merge with existing conversation history (avoid duplicates)
          setConversationHistory(prev => {
            const merged = [...prev];
            parsed.forEach(msg => {
              // Check if message already exists by timestamp
              if (!merged.some(m => m.timestamp === msg.timestamp)) {
                merged.push(msg);
              }
            });
            // Sort by timestamp
            return merged.sort((a, b) => 
              new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
            );
          });
          console.log('📖 Loaded global chat history:', parsed.length, 'messages');
        }
      } catch (error) {
        console.error('Error loading global chat:', error);
      }
    };

    loadGlobalHistory();

    // Listen for updates from GlobalVoiceAssistant
    const handleHistoryUpdate = () => {
      console.log('📖 Global chat history updated, syncing...');
      loadGlobalHistory();
    };

    window.addEventListener('chatHistoryUpdated', handleHistoryUpdate);

    return () => {
      window.removeEventListener('chatHistoryUpdated', handleHistoryUpdate);
    };
  }, []);

  const loadVoices = async () => {
    try {
      const response = await axios.get('/api/voice/available-voices');
      setAvailableVoices(response.data || []);
    } catch (error) {
      console.error('Error loading voices:', error);
      toast.error('Failed to load voices');
    }
  };

  // Helper to save message to global history
  const saveToGlobalHistory = (message) => {
    try {
      const history = JSON.parse(localStorage.getItem('globalChatHistory') || '[]');
      history.push({
        ...message,
        timestamp: new Date().toISOString()
      });
      // Keep last 50 messages
      const trimmed = history.slice(-50);
      localStorage.setItem('globalChatHistory', JSON.stringify(trimmed));
      window.dispatchEvent(new CustomEvent('chatHistoryUpdated'));
    } catch (error) {
      console.error('Error saving to global history:', error);
    }
  };

  const testVoice = async () => {
    const voice = availableVoices.find(v => v.id === selectedVoice);
    if (!voice) {
      toast.error('Please select a voice first');
      return;
    }

    setTestingVoice(true);
    try {
      const testText = `Hello! I'm ${voice.name.split(' ')[0]}. This is how I sound. I'm a ${voice.gender.toLowerCase()} voice with a ${voice.description.toLowerCase()} style.`;
      
      const response = await axios.post('/api/voice/text-to-speech', {
        text: testText,
        voice: selectedVoice
      }, {
        responseType: 'blob'
      });

      const audioBlob = response.data;
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setTestingVoice(false);
        };
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error testing voice:', error);
      toast.error('Failed to test voice');
      setTestingVoice(false);
    }
  };

  const handleVoiceChange = (voiceId) => {
    setSelectedVoice(voiceId);
    localStorage.setItem('preferredEdgeVoice', voiceId);
  };

  const startListening = () => {
    if (recognition) {
      try {
        console.log('🎤 Starting listening...');
        recognition.start();
        setListening(true);
        setResponse('');
      } catch (error) {
        console.error('Error starting recognition:', error);
        // If already started, stop and restart
        if (error.message && error.message.includes('already started')) {
          console.log('Recognition already started, stopping first...');
          recognition.stop();
          setTimeout(() => {
            try {
              recognition.start();
              setListening(true);
              setResponse('');
            } catch (retryError) {
              console.error('Retry failed:', retryError);
              toast.error('Could not start voice recognition');
            }
          }, 100);
        }
      }
    } else {
      toast.error('Speech recognition not supported in your browser');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setListening(false);
    }
  };

  const processCommand = async (command) => {
    setProcessing(true);
    
    // Add user message to history immediately
    const userMessage = { role: 'user', content: command, timestamp: new Date().toISOString() };
    setConversationHistory(prev => [...prev, userMessage]);
    saveToGlobalHistory(userMessage); // Save to global history
    setTranscript(''); // Clear current transcript
    setTextInput(''); // Clear text input
    
    try {
      // Prepare conversation history (last 10 messages)
      const historyToSend = conversationHistory.slice(-10);
      
      const res = await axios.post('/api/voice/process-command', { 
        transcript: command, // Backend expects 'transcript' not 'command'
        sessionId,
        conversationHistory: historyToSend
      });
      
      const responseText = res.data.response || res.data.message || 'Command processed';
      const newSessionId = res.data.sessionId || sessionId;
      
      // Update session ID if changed
      if (newSessionId !== sessionId) {
        setSessionId(newSessionId);
        sessionStorage.setItem('voiceAssistantSessionId', newSessionId);
      }
      
      // Start BOTH text streaming AND voice synthesis in parallel for faster response
      startStreamingMessage(responseText);
      speak(responseText); // Start speaking immediately, don't wait for streaming to finish
      
      setResponse(responseText);
      
      // Track feature usage for achievements
      try {
        await axios.post('/api/features/track', { 
          featureName: 'voice_assistant',
          details: `Command: ${command.substring(0, 50)}...`
        });
      } catch (trackError) {
        // Silent fail - don't interrupt user experience
        console.error('Feature tracking failed:', trackError);
      }
    } catch (error) {
      console.error('Error processing command:', error);
      const errorMsg = error.response?.data?.error || 'Sorry, I could not process that command';
      
      // Start BOTH streaming and voice in parallel for error messages too
      startStreamingMessage(errorMsg);
      speak(errorMsg); // Start speaking immediately
      
      setResponse(errorMsg);
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const startStreamingMessage = (fullText) => {
    // Clear any existing streaming
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    setIsStreaming(true);
    setStreamingMessage('');
    
    let currentIndex = 0;
    const words = fullText.split(' ');
    
    streamingIntervalRef.current = setInterval(() => {
      if (currentIndex < words.length) {
        setStreamingMessage(prev => {
          const newText = prev + (currentIndex > 0 ? ' ' : '') + words[currentIndex];
          return newText;
        });
        currentIndex++;
      } else {
        // Streaming complete
        clearInterval(streamingIntervalRef.current);
        setIsStreaming(false);
        
        // Add complete message to history
        const assistantMessage = { role: 'assistant', content: fullText, timestamp: new Date().toISOString() };
        setConversationHistory(prev => [...prev, assistantMessage]);
        saveToGlobalHistory(assistantMessage); // Save to global history
        setStreamingMessage(null);
        
        // Voice is already speaking (started in processCommand), no need to call speak() here
      }
    }, 50); // Adjust speed: lower = faster, higher = slower
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      toast.error('Please enter a command');
      return;
    }
    setTranscript(textInput);
    processCommand(textInput);
    setTextInput('');
  };

  const speak = async (text) => {
    if (!autoSpeak) {
      // If auto-speak is disabled but continuous mode is enabled, restart listening
      if (continuousMode) {
        console.log('📢 No audio, restarting listening immediately');
        setTimeout(() => {
          if (!processing && !listening && continuousMode) {
            console.log('📢 Restarting listening (no audio)');
            startListening();
          }
        }, 300); // Shorter delay when no audio
      }
      return;
    }
    
    try {
      const response = await axios.post('/api/voice/text-to-speech', {
        text: text,
        voice: selectedVoice
      }, {
        responseType: 'blob'
      });

      const audioBlob = response.data;
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl);
          console.log('🔊 Audio finished playing');
          
          // Auto-restart listening if continuous mode is enabled
          if (continuousMode) {
            console.log('📢 Audio ended, checking restart conditions...');
            setTimeout(() => {
              console.log(`State check: processing=${processing}, listening=${listening}, continuousMode=${continuousMode}`);
              if (!processing && !listening && continuousMode) {
                console.log('📢 Restarting listening (after audio)');
                startListening();
              } else {
                console.log('❌ Cannot restart: conditions not met');
              }
            }, 500); // Small delay before restarting
          }
        };
        await audioRef.current.play();
        console.log('🔊 Audio started playing');
      }
    } catch (error) {
      console.error('Error speaking:', error);
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.08;
        utterance.volume = 0.95;
        utterance.onend = () => {
          console.log('🔊 Fallback audio finished');
          // Auto-restart listening if continuous mode is enabled
          if (continuousMode) {
            setTimeout(() => {
              if (!processing && !listening && continuousMode) {
                console.log('📢 Restarting listening (after fallback audio)');
                startListening();
              }
            }, 500);
          }
        };
        speechSynthesis.speak(utterance);
      } else if (continuousMode) {
        // No audio available but continuous mode is on, restart immediately
        setTimeout(() => {
          if (!processing && !listening && continuousMode) {
            console.log('📢 Restarting listening (no audio available)');
            startListening();
          }
        }, 300);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <audio ref={audioRef} style={{ display: 'none' }} />
      {/* Header */}
      <div className="mb-3 sm:mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
          Chat with your AI assistant using voice or text
        </p>
      </div>

      {/* Chat Container - Google Assistant Style */}
      <div className="flex-1 min-h-0 card flex flex-col max-w-4xl mx-auto w-full">
        {/* Settings Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Voice Settings"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {conversationHistory.length > 0 && (
            <button
              onClick={() => {
                setConversationHistory([]);
                // Clear global chat history too
                localStorage.setItem('globalChatHistory', '[]');
                window.dispatchEvent(new CustomEvent('chatHistoryUpdated'));
                const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                setSessionId(newSessionId);
                sessionStorage.setItem('voiceAssistantSessionId', newSessionId);
                setTranscript('');
                setResponse('');
                toast.success('Chat history cleared');
              }}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Clear Chat
            </button>
          )}
        </div>
        
        {/* Voice Settings Panel */}
        {showVoiceSettings && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-purple-200 dark:border-gray-600">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Volume2 className="w-5 h-5 mr-2 text-purple-500" />
              Voice Settings
            </h3>
            
            {/* Auto-speak toggle */}
            <div className="space-y-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="rounded border-gray-300 text-purple-500 focus:ring-purple-500 mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Auto-speak responses</span>
              </label>
              
              {/* Continuous mode toggle */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={continuousMode}
                  onChange={(e) => setContinuousMode(e.target.checked)}
                  className="rounded border-gray-300 text-purple-500 focus:ring-purple-500 mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">🎤 Continuous conversation mode</span>
              </label>
              {continuousMode && (
                <p className="text-xs text-purple-600 dark:text-purple-400 ml-6">
                  Mic will auto-restart after each response for hands-free conversation
                </p>
              )}
            </div>
            
            {/* Voice Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🎵 Select Voice
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedVoice}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="flex-1 input text-sm"
                >
                  {availableVoices.length === 0 ? (
                    <option value="">Loading voices...</option>
                  ) : (
                    availableVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} - {voice.gender} ({voice.description})
                      </option>
                    ))
                  )}
                </select>
                <button
                  onClick={testVoice}
                  disabled={testingVoice || availableVoices.length === 0}
                  className="btn-secondary flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap"
                >
                  <Volume1 className="w-4 h-4" />
                  <span>{testingVoice ? 'Testing...' : 'Test'}</span>
                </button>
              </div>
              {selectedVoice && availableVoices.length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {(() => {
                    const voice = availableVoices.find(v => v.id === selectedVoice);
                    return voice ? `${voice.language} • ${voice.gender} • ${voice.description}` : '';
                  })()}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto mb-3 sm:mb-4 space-y-3 sm:space-y-4 px-1 sm:px-2">
          {conversationHistory.length === 0 && !streamingMessage ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Hi! I'm your Sanitas Mind Assistant
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md">
                I can help you with receipts, shopping lists, meal planning, and more. Try asking me something!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-2xl w-full">
                {[
                  'Show my recent receipts',
                  'What\'s my spending this month?',
                  'Create a meal plan',
                  'Generate a healthy shopping list'
                ].map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTextInput(example)}
                    className="text-left p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{example}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            conversationHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                  }`}
                >
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1 sm:mt-2">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Streaming message */}
          {streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm">
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {streamingMessage}
                  {isStreaming && <span className="animate-pulse">▊</span>}
                </p>
                <p className="text-xs opacity-70 mt-1 sm:mt-2">
                  Assistant
                </p>
              </div>
            </div>
          )}
          
          {/* Processing indicator */}
          {processing && !streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl bg-gray-100 dark:bg-gray-700 rounded-bl-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Unified Text/Voice */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
          <div className="relative">
            <input
              type="text"
              value={listening ? transcript : textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !processing && handleTextSubmit()}
              placeholder={listening ? 'Listening...' : 'Type or speak your message...'}
              className="input w-full pr-32 text-sm sm:text-base"
              disabled={processing || listening}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Regular Mic Button */}
              <button
                onClick={listening ? stopListening : startListening}
                disabled={processing || continuousMode}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  listening && !continuousMode
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30'
                }`}
                title={listening ? 'Stop listening' : 'Push to talk'}
              >
                <Mic className="w-5 h-5" />
              </button>
              
              {/* Open Mic (Continuous Mode) Button */}
              <button
                onClick={() => {
                  if (continuousMode) {
                    // Turn off continuous mode and stop listening
                    setContinuousMode(false);
                    if (listening) {
                      stopListening();
                    }
                  } else {
                    // Turn on continuous mode and start listening
                    setContinuousMode(true);
                    if (!listening && !processing) {
                      startListening();
                    }
                  }
                }}
                disabled={processing}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  continuousMode
                    ? listening 
                      ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title={continuousMode ? 'Stop continuous mode' : 'Open mic (continuous conversation)'}
              >
                <Radio className={`w-5 h-5 ${listening && continuousMode ? 'animate-pulse' : ''}`} />
              </button>
              
              {/* Send Button */}
              <button
                onClick={handleTextSubmit}
                disabled={processing || (!textInput.trim() && !listening)}
                className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors text-primary-600 dark:text-primary-400 disabled:opacity-50"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          {listening && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
              {continuousMode ? (
                <span className="text-green-600 dark:text-green-400 font-medium">
                  📡 Open mic active - Listening continuously... Click Radio button to stop
                </span>
              ) : (
                <span>🎤 Listening... Click mic to stop</span>
              )}
              <br />
              <span className="text-xs opacity-60">Say "Hey Sanitas Mind" from anywhere to activate me</span>
            </p>
          )}
          {transcript && !listening && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2 italic">
              Last heard: "{transcript}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceAssistant;
