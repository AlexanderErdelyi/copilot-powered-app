import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Global Voice Assistant - Works across all pages
 * Activated when listeningMode === 'aiAssistant'
 * Provides hands-free voice commands, navigation, and AI responses
 */
function GlobalVoiceAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(new Audio());
  const isPlayingRef = useRef(false);
  const lastCommandRef = useRef('');
  const restartTimeoutRef = useRef(null);
  
  // Initialize session ID (compute once on mount)
  const sessionIdRef = useRef(
    (() => {
      let id = sessionStorage.getItem('globalAssistantSessionId');
      if (!id) {
        id = 'global_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('globalAssistantSessionId', id);
      }
      return id;
    })()
  );

  // Monitor listening mode changes
  useEffect(() => {
    const checkMode = () => {
      const mode = localStorage.getItem('listeningMode');
      const shouldBeActive = mode === 'aiAssistant';
      
      if (shouldBeActive !== isActive) {
        setIsActive(shouldBeActive);
        console.log('🌐 Global AI Assistant:', shouldBeActive ? 'ACTIVATED' : 'DEACTIVATED');
        
        if (shouldBeActive) {
          toast.success('AI Assistant activated - I\'m listening!', {
            icon: '🎤',
            duration: 3000
          });
          console.log('💡 You can now:\n' +
            '  - Ask questions: "How much did I spend last week?"\n' +
            '  - Add items: "Add milk to shopping list"\n' +
            '  - Navigate: "Go to receipts"\n' +
            '  - Control: "Stop listening" | "Clear conversation"\n' +
            '  Multi-turn conversations are supported!');
        } else {
          // Stop recognition when deactivated
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
              console.log('🛑 Stopped global assistant recognition');
            } catch (e) {
              // Ignore errors
            }
          }
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = null;
          }
          setIsListening(false);
          setIsProcessing(false);
        }
      }
    };

    checkMode();
    const interval = setInterval(checkMode, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isActive) {
      // Stop listening when deactivated
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null; // Clear reference
        } catch (e) {
          // Ignore
        }
      }
      setIsListening(false);
      setIsProcessing(false);
      return;
    }

    // Don't initialize if already exists
    if (recognitionRef.current) {
      return;
    }

    // Initialize recognition when activated
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false; // One command at a time
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Global assistant listening...');
        setIsListening(true);
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript.trim();
        console.log('🎤 Heard command:', transcript);
        
        setIsListening(false);
        lastCommandRef.current = transcript;
        
        await processVoiceCommand(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        setIsListening(false);
        
        // Don't restart on no-speech errors (too aggressive)
        if (event.error !== 'no-speech' && event.error !== 'aborted' && event.error !== 'not-allowed') {
          setTimeout(() => {
            const mode = localStorage.getItem('listeningMode');
            if (mode === 'aiAssistant' && !isProcessing) {
              startListening();
            }
          }, 2000);
        }
      };

      recognition.onend = () => {
        console.log('🎤 Recognition ended');
        setIsListening(false);
        
        // Clear any pending restart
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        
        // Only restart if still in AI Assistant mode and not processing
        const mode = localStorage.getItem('listeningMode');
        if (mode === 'aiAssistant' && !isProcessing) {
          restartTimeoutRef.current = setTimeout(() => {
            startListening();
          }, 2000); // Increased delay
        }
      };

      recognitionRef.current = recognition;
      
      // Start listening immediately
      startListening();

      return () => {
        // Cleanup on unmount
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Ignore
          }
          recognitionRef.current = null;
        }
        setIsListening(false);
        setIsProcessing(false);
      };
    } else {
      console.warn('Speech recognition not supported');
    }
  }, [isActive]);

  const startListening = () => {
    // Check mode before starting
    const mode = localStorage.getItem('listeningMode');
    if (mode !== 'aiAssistant' || isListening || isProcessing) return;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        if (!error.message?.includes('already started')) {
          console.error('Error starting recognition:', error);
        }
      }
    }
  };

  const processVoiceCommand = async (command) => {
    setIsProcessing(true);
    
    // Check for navigation commands first
    const navigationResult = handleNavigationCommand(command);
    if (navigationResult) {
      // Navigation handled, restart listening
      setIsProcessing(false);
      setTimeout(() => startListening(), 1000);
      return;
    }

    // Check for system commands
    const systemResult = handleSystemCommand(command);
    if (systemResult) {
      setIsProcessing(false);
      setTimeout(() => startListening(), 1000);
      return;
    }

    // Send to AI for processing
    try {
      // Add to chat history
      const userMessage = { role: 'user', content: command, timestamp: new Date().toISOString() };
      addToChatHistory(userMessage);

      // Show thinking indicator
      toast.loading('Thinking...', { id: 'thinking' });

      // Get full conversation history for context
      const history = getChatHistory();
      console.log('📝 Sending command with history:', history.length, 'messages');

      // Call AI API (use process-command endpoint like VoiceAssistant page)
      const response = await axios.post('/api/voice/process-command', {
        transcript: command,
        sessionId: sessionIdRef.current,
        conversationHistory: history.slice(-20) // Last 20 messages for better context
      });

      const aiResponse = response.data.response || response.data.answer || 'I heard you, but I don\'t have a response.';
      
      toast.dismiss('thinking');
      
      // Add AI response to history
      const assistantMessage = { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() };
      addToChatHistory(assistantMessage);

      console.log('🤖 AI Response:', aiResponse);

      // Check if response is a question (needs follow-up)
      const isQuestion = aiResponse.includes('?') || 
        aiResponse.toLowerCase().includes('which') ||
        aiResponse.toLowerCase().includes('what') ||
        aiResponse.toLowerCase().includes('please specify');

      if (isQuestion) {
        toast('Waiting for your answer...', { icon: '❓', duration: 2000 });
      }

      // Speak the response
      await speakResponse(aiResponse);

    } catch (error) {
      console.error('Error processing command:', error);
      toast.dismiss('thinking');
      toast.error('Sorry, I couldn\'t process that command');
      
      await speakResponse('Sorry, I encountered an error processing your request.');
    } finally {
      setIsProcessing(false);
      // Clear any auto-restart from onend
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      // Restart listening after response with delay
      restartTimeoutRef.current = setTimeout(() => {
        const mode = localStorage.getItem('listeningMode');
        if (mode === 'aiAssistant') {
          startListening();
        }
      }, 1500);
    }
  };

  const handleNavigationCommand = (command) => {
    const lower = command.toLowerCase();
    
    // Navigation patterns - more flexible matching
    const patterns = [
      { keywords: ['receipt', 'receipts'], excludeWords: [], path: '/receipts', name: 'Receipts' },
      { keywords: ['dashboard', 'home'], excludeWords: [], path: '/', name: 'Dashboard' },
      { keywords: ['voice assistant', 'voice page'], excludeWords: [], path: '/voice-assistant', name: 'Voice Assistant' },
      { keywords: ['shopping', 'shopping list'], excludeWords: [], path: '/shopping', name: 'Shopping List' },
      { keywords: ['meal', 'meals', 'meal plan'], excludeWords: [], path: '/meal-planning', name: 'Meal Planning' },
      { keywords: ['price', 'prices', 'comparison'], excludeWords: [], path: '/price-comparison', name: 'Price Comparison' },
      { keywords: ['achievement', 'achievements'], excludeWords: [], path: '/achievements', name: 'Achievements' },
      { keywords: ['profile'], excludeWords: [], path: '/profile', name: 'Profile' },
    ];

    // Check if command contains navigation intent
    const hasNavigationIntent = lower.includes('go to') || lower.includes('navigate') || 
      lower.includes('open') || lower.includes('show') || lower.includes('take me to');

    for (const pattern of patterns) {
      // Match if any keyword is found (for navigation commands)
      const matched = pattern.keywords.some(keyword => lower.includes(keyword));
      
      if (matched && hasNavigationIntent) {
        console.log('🧭 Navigation command detected:', pattern.path, '- Command:', command);
        navigate(pattern.path);
        toast.success(`Navigating to ${pattern.name}`, { icon: '🧭', duration: 2000 });
        speakResponse(`Going to ${pattern.name}`);
        return true;
      }
    }

    return false;
  };

  const handleSystemCommand = (command) => {
    const lower = command.toLowerCase();

    // Clear/reset conversation
    if (lower.includes('clear conversation') || lower.includes('reset conversation') || 
        lower.includes('start over') || lower.includes('new conversation')) {
      console.log('🔄 Clearing conversation history');
      localStorage.setItem('globalChatHistory', '[]');
      window.dispatchEvent(new CustomEvent('chatHistoryUpdated'));
      // Create new session
      const newSessionId = 'global_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('globalAssistantSessionId', newSessionId);
      sessionIdRef.current = newSessionId;
      toast.success('Conversation cleared', { icon: '🔄' });
      speakResponse('Conversation cleared. How can I help you?');
      return true;
    }

    // Stop listening
    if (lower.includes('stop listening') || lower.includes('deactivate') || lower.includes('go to sleep')) {
      console.log('💤 Deactivating assistant');
      localStorage.setItem('listeningMode', 'wakeWord');
      toast.success('Going back to wake word mode', { icon: '💤' });
      speakResponse('Switching to wake word mode. Say hey sanitas mind to reactivate.');
      return true;
    }

    // Turn off - go back to wake word mode
    if (lower.includes('turn off') || lower.includes('disable')) {
      console.log('💤 Switching back to wake word mode');
      localStorage.setItem('listeningMode', 'wakeWord');
      toast.success('Back to wake word mode', { icon: '💤' });
      speakResponse('Going back to wake word mode. Say hey sanitas mind to reactivate.');
      return true;
    }

    return false;
  };

  const speakResponse = async (text) => {
    return new Promise((resolve) => {
      if (isPlayingRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      isPlayingRef.current = true;

      // Try Piper TTS first
      axios.post('/api/voice/text-to-speech', { 
        text,
        voice: localStorage.getItem('selectedVoice') || 'en_US-lessac-medium'
      }, {
        responseType: 'blob'
      })
      .then(response => {
        const audioBlob = new Blob([response.data], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl);
          isPlayingRef.current = false;
          resolve();
        };
        audioRef.current.onerror = () => {
          isPlayingRef.current = false;
          resolve();
        };
        
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          isPlayingRef.current = false;
          resolve();
        });
      })
      .catch(error => {
        console.error('TTS error:', error);
        isPlayingRef.current = false;
        resolve();
      });
    });
  };

  // Chat history management
  const getChatHistory = () => {
    try {
      const history = localStorage.getItem('globalChatHistory');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  };

  const addToChatHistory = (message) => {
    try {
      const history = getChatHistory();
      history.push({
        ...message,
        timestamp: new Date().toISOString()
      });
      
      // Keep last 50 messages
      const trimmed = history.slice(-50);
      localStorage.setItem('globalChatHistory', JSON.stringify(trimmed));
      
      // Trigger event for VoiceAssistant page to update
      window.dispatchEvent(new CustomEvent('chatHistoryUpdated'));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  // Visual indicator component
  const ListeningIndicator = () => {
    if (!isActive) return null;

    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl">
        <div className="relative">
          {isListening || isProcessing ? (
            <>
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping"></div>
            </>
          ) : (
            <div className="w-3 h-3 bg-white rounded-full opacity-70"></div>
          )}
        </div>
        <span className="font-medium">
          {isProcessing ? '🤔 Thinking...' : isListening ? '🎤 Listening...' : '👂 Ready'}
        </span>
      </div>
    );
  };

  return <ListeningIndicator />;
}

export default GlobalVoiceAssistant;
