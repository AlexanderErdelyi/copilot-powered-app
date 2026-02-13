import { Mic, MicOff, Volume2, Send, Keyboard, Settings, Volume1 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function VoiceAssistant() {
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
  const audioRef = useRef(null);
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
        toast.error('Speech recognition error');
      };

      recognitionInstance.onend = () => {
        setListening(false);
      };

      setRecognition(recognitionInstance);
    }
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
        recognition.start();
        setListening(true);
        setResponse('');
      } catch (error) {
        console.error('Error starting recognition:', error);
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
    const userMessage = { role: 'user', content: command };
    setConversationHistory(prev => [...prev, userMessage]);
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
      
      // Add assistant response to history
      const assistantMessage = { role: 'assistant', content: responseText };
      setConversationHistory(prev => [...prev, assistantMessage]);
      
      setResponse(responseText);
      speak(responseText);
      
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
      
      // Add error message to history
      const errorMessage = { role: 'assistant', content: errorMsg };
      setConversationHistory(prev => [...prev, errorMessage]);
      
      setResponse(errorMsg);
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
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
    if (!autoSpeak) return;
    
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
        };
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error speaking:', error);
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.08;
        utterance.volume = 0.95;
        speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <audio ref={audioRef} style={{ display: 'none' }} />
      {/* Header */}
      <div className="mb-3 sm:mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Voice Assistant</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
          Chat with your AI assistant using voice or text
        </p>
      </div>

      {/* Chat Container - Google Assistant Style */}
      <div className="flex-1 min-h-0 card flex flex-col max-w-4xl mx-auto w-full">
        {/* Mode Toggle and Settings */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 p-1 flex-1 sm:flex-initial">
              <button
                onClick={() => setUseTextMode(false)}
                className={`px-3 sm:px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2 flex-1 sm:flex-initial ${
                  !useTextMode
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span className="text-sm sm:text-base">Voice</span>
              </button>
              <button
                onClick={() => setUseTextMode(true)}
                className={`px-3 sm:px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2 flex-1 sm:flex-initial ${
                  useTextMode
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span className="text-sm sm:text-base">Text</span>
              </button>
            </div>
            
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
                const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                setSessionId(newSessionId);
                sessionStorage.setItem('voiceAssistantSessionId', newSessionId);
                setTranscript('');
                setResponse('');
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
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="rounded border-gray-300 text-purple-500 focus:ring-purple-500 mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Auto-speak responses</span>
              </label>
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
          {conversationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Hi! I'm your ReceiptHealth Assistant
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
                    onClick={() => useTextMode ? setTextInput(example) : null}
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
          
          {/* Processing indicator */}
          {processing && (
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

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
          {useTextMode ? (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !processing && handleTextSubmit()}
                placeholder="Type your message..."
                className="input flex-1 text-sm sm:text-base"
                disabled={processing}
              />
              <button
                onClick={handleTextSubmit}
                disabled={processing || !textInput.trim()}
                className="btn-primary flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <button
                onClick={listening ? stopListening : startListening}
                disabled={processing}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  listening 
                    ? 'bg-gradient-to-br from-red-500 to-pink-500 animate-pulse shadow-2xl' 
                    : 'bg-gradient-to-br from-primary-500 to-secondary-500 hover:shadow-xl'
                }`}
              >
                {listening ? (
                  <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                ) : (
                  <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                )}
              </button>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 sm:mt-3">
                {listening ? 'Listening...' : processing ? 'Processing...' : 'Tap to speak'}
              </p>
              {transcript && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                  "{transcript}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceAssistant;
