import { Mic, MicOff, Volume2, Send, Keyboard } from 'lucide-react';
import { useState, useEffect } from 'react';
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
    try {
      // Prepare conversation history (last 10 messages)
      const historyToSend = conversationHistory.slice(-10);
      
      const res = await axios.post('/api/voice/process-command', { 
        command,
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
      
      // Update conversation history
      const newHistory = [
        ...conversationHistory,
        { role: 'user', content: command },
        { role: 'assistant', content: responseText }
      ];
      setConversationHistory(newHistory);
      
      setResponse(responseText);
      speak(responseText);
    } catch (error) {
      console.error('Error processing command:', error);
      const errorMsg = error.response?.data?.error || 'Sorry, I could not process that command';
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

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1.08;
      utterance.volume = 0.95;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Voice Assistant</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Control ReceiptHealth with your voice or text
        </p>
      </div>

      <div className="card max-w-2xl mx-auto">
        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 p-1">
            <button
              onClick={() => setUseTextMode(false)}
              className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                !useTextMode
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Voice</span>
            </button>
            <button
              onClick={() => setUseTextMode(true)}
              className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                useTextMode
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Text</span>
            </button>
          </div>
        </div>

        {useTextMode ? (
          /* Text Input Mode */
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Type your command
            </h2>
            <div className="flex space-x-3 mb-6">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !processing && handleTextSubmit()}
                placeholder="e.g., Show my recent receipts..."
                className="input flex-1"
                disabled={processing}
              />
              <button
                onClick={handleTextSubmit}
                disabled={processing}
                className="btn-primary flex items-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        ) : (
          /* Voice Input Mode */
          <div className="text-center mb-6">
            <div className="mb-8">
              <button
                onClick={listening ? stopListening : startListening}
                disabled={processing}
                className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${
                  listening 
                    ? 'bg-gradient-to-br from-red-500 to-pink-500 animate-pulse shadow-2xl' 
                    : 'bg-gradient-to-br from-primary-500 to-secondary-500 hover:shadow-2xl'
                }`}
              >
                {listening ? (
                  <Mic className="w-16 h-16 text-white" />
                ) : (
                  <MicOff className="w-16 h-16 text-white" />
                )}
              </button>
            </div>

            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {listening ? 'Listening...' : processing ? 'Processing...' : 'Tap to speak'}
            </h2>
          </div>
        )}
        
        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="mb-6 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Conversation History:</p>
              <button
                onClick={() => {
                  setConversationHistory([]);
                  const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                  setSessionId(newSessionId);
                  sessionStorage.setItem('voiceAssistantSessionId', newSessionId);
                  setTranscript('');
                  setResponse('');
                }}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Clear History
              </button>
            </div>
            <div className="space-y-3">
              {conversationHistory.map((msg, idx) => (
                <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                  msg.role === 'user' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
                    : 'bg-green-50 dark:bg-green-900/20 border-green-500'
                }`}>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    {msg.role === 'user' ? 'You' : 'Assistant'}:
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Transcript */}
        {transcript && !conversationHistory.some(m => m.content === transcript) && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">You said:</p>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-900 dark:text-white">{transcript}</p>
            </div>
          </div>
        )}

        {/* Response */}
        {response && !conversationHistory.some(m => m.content === response) && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assistant:</p>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
              <p className="text-gray-900 dark:text-white">{response}</p>
            </div>
          </div>
        )}

        {/* Example Commands */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Try saying or typing:
          </p>
          <div className="space-y-2">
            {[
              'Show my recent receipts',
              'What\'s my spending this month?',
              'Create a meal plan',
              'Add milk to shopping list',
              'Generate a healthy shopping list',
              'Show me my achievements'
            ].map((example, idx) => (
              <div 
                key={idx} 
                onClick={() => useTextMode ? setTextInput(example) : null}
                className={`flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg ${
                  useTextMode ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                }`}
              >
                <Volume2 className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{example}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceAssistant;
