import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

function WakeWordListener() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => {
    // Only enable wake word listener if mode is 'wakeWord'
    const mode = localStorage.getItem('listeningMode');
    return mode === 'wakeWord';
  });
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const currentLocationRef = useRef(location.pathname);

  // Track location changes
  useEffect(() => {
    currentLocationRef.current = location.pathname;
  }, [location]);

  // Watch for localStorage changes (from Layout toggle)
  useEffect(() => {
    const handleStorageChange = () => {
      const mode = localStorage.getItem('listeningMode');
      const enabled = mode === 'wakeWord';
      if (enabled !== isEnabled) {
        setIsEnabled(enabled);
        // Only log state changes, no toast here (Layout already shows toast)
        console.log('🔊 Wake word listener:', enabled ? 'ENABLED' : 'DISABLED');
      }
    };

    // Listen for storage events (cross-tab)
    window.addEventListener('storage', handleStorageChange);
    
    // Check for changes every 3 seconds (reduced frequency)
    const interval = setInterval(handleStorageChange, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isEnabled]);

  useEffect(() => {
    const mode = localStorage.getItem('listeningMode');
    
    // Don't run wake word listener when disabled
    if (mode === 'disabled' || !isEnabled) {
      // Stop and cleanup if exists
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (e) {
          // Ignore errors
        }
      }
      setIsListening(false);
      return;
    }
    
    // Don't run wake word listener when AI Assistant is active globally
    if (mode === 'aiAssistant') {
      // Stop and cleanup
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (e) {
          // Ignore errors
        }
      }
      setIsListening(false);
      return;
    }

    // Don't run wake word listener on AI Assistant page (to avoid conflicts)
    if (location.pathname === '/voice-assistant') {
      // Stop and cleanup
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (e) {
          // Ignore errors
        }
      }
      setIsListening(false);
      return;
    }

    // Don't initialize if already exists
    if (recognitionRef.current) {
      return;
    }

    // Initialize wake word recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true; // Keep listening
      recognition.interimResults = true; // Get partial results
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('🎤 Wake word listener started - Say "Hey Sanitas Mind" to activate');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const results = Array.from(event.results);
        const transcript = results
          .map(result => result[0].transcript)
          .join('')
          .toLowerCase()
          .trim();

        // Always log for debugging (temporarily)
        console.log('👂 Heard:', transcript);

        // FLEXIBLE wake word patterns - speech recognition often mishears "Sanitas Mind"
        // Extract just the last phrase from concatenated results (more accurate)
        const phrases = transcript.split('.').filter(p => p.trim().length > 0);
        const lastPhraseRaw = phrases[phrases.length - 1]?.trim() || transcript;
        
        // Remove punctuation (apostrophes, commas, etc.) for better matching
        const cleanTranscript = transcript.replace(/[''',]/g, '').replace(/\s+/g, ' ').trim();
        const lastPhrase = lastPhraseRaw.replace(/[''',]/g, '').replace(/\s+/g, ' ').trim();


        const wakeWordPatterns = [
          // Correct pronunciations
          'hey sanitas mind',
          'hey sanitas mine',
          'hey sanitize mind',
          'hey sanitized mind',
          'hey sanitas',
          'hey sanita',
          'hey sunita',
          'hey sanit',
          // Common misrecognitions - full phrases
          'hey senator',
          'hey santa',
          'hey sam',
          'he sent us mine',      // Hears "he sent us mine" for "hey sanitas mind"
          'he sent us',           // Partial
          'ace anytime',          // Hears this for "sanitas mind"
          'seneca',               // Hears "seneca" for "sanitas"
          'sunita',               // Already common
          'antoine',              // Hears "antoine" sometimes
          // Combinations with "mind"
          'sam it',
          'senator mind',
          'senators mind',        // Possessive form
          'santa mind',
          'santas mind',          // Possessive form (santa's → santas)
          'anita mind',
          'anitas mind',          // Possessive form
          'anita smile',
          'anita fine',
          'seneca mind',
          'senecas mind',         // Possessive form
          // Without "hey"
          'sanitas mind',
          'sanita mind',
          'sunita mind',
          'sunitas mind',         // Possessive form
          'a sanitas mind',
          'sanitize mind',
          'sanitized mind'
        ];

        // Check both full transcript and last phrase
        const matchedPatternFull = wakeWordPatterns.find(pattern => 
          cleanTranscript.includes(pattern)
        );
        
        const matchedPatternLast = wakeWordPatterns.find(pattern => 
          lastPhrase.includes(pattern)
        );
        
        const matchedPattern = matchedPatternLast || matchedPatternFull;

        if (matchedPattern) {
          console.log(`✨ Wake word detected! Matched: "${matchedPattern}" in "${lastPhrase}" (original: "${lastPhraseRaw}")`);
          
          // Show visual feedback
          toast.success('AI Assistant activated! I\'m listening from anywhere...', {
            icon: '🎤',
            duration: 3000,
            style: {
              background: '#10b981',
              color: 'white',
            }
          });

          // Stop wake word listener
          recognition.stop();
          
          // Activate Global AI Assistant mode (no navigation needed!)
          localStorage.setItem('listeningMode', 'aiAssistant');
          console.log('🌐 Global AI Assistant activated - hands-free mode enabled!');
          
          // Trigger global assistant activation event
          window.dispatchEvent(new CustomEvent('globalAssistantActivated'));
        } else {
          // Only log if transcript contains similar words (reduce noise)
          const hasSimilarWords = cleanTranscript.includes('sanit') || cleanTranscript.includes('mind') || 
            cleanTranscript.includes('senator') || cleanTranscript.includes('santa') || 
            cleanTranscript.includes('sent us') || cleanTranscript.includes('seneca');
          
          if (hasSimilarWords) {
            console.log('👂 No match. Last phrase:', lastPhrase, '| Full:', cleanTranscript);
          }
        }
      };

      recognition.onerror = (event) => {
        // Only log real errors, not normal operation issues
        if (event.error === 'not-allowed') {
          console.error('❌ Microphone permission denied');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('⚠️ Wake word error:', event.error);
        }
        
        // Restart after error (except for not-allowed which means no permission)
        if (event.error !== 'not-allowed') {
          scheduleRestart();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Auto-restart to keep listening
        scheduleRestart();
      };

      recognitionRef.current = recognition;

      // Start listening only if enabled
      if (isEnabled) {
        startListening();
      }

      // Cleanup
      return () => {
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
      };
    } else {
      console.warn('Speech recognition not supported for wake word listening');
    }
  }, [location.pathname, isEnabled]); // Removed navigate to prevent re-initialization

  const startListening = () => {
    // Don't start if on AI Assistant page
    if (currentLocationRef.current === '/voice-assistant') {
      return;
    }

    // Only start if enabled
    if (!isEnabled) {
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        // Silently ignore "already started" errors
        if (!error.message?.includes('already started')) {
          console.error('❌ Error starting wake word listener:', error);
        }
      }
    }
  };

  const scheduleRestart = () => {
    // Don't restart if on AI Assistant page
    if (currentLocationRef.current === '/voice-assistant') {
      return;
    }

    // Don't restart if disabled or AI Assistant is active
    const mode = localStorage.getItem('listeningMode');
    if (!isEnabled || mode === 'aiAssistant') {
      return;
    }

    // Clear any existing restart timeout
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    // Restart after a short delay
    restartTimeoutRef.current = setTimeout(() => {
      const currentMode = localStorage.getItem('listeningMode');
      if (currentMode === 'wakeWord') {
        startListening();
      }
    }, 1500);
  };

  // This component doesn't render anything
  return null;
}

export default WakeWordListener;
