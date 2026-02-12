import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useState } from 'react';

function VoiceAssistant() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Voice Assistant</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Control ReceiptHealth with your voice
        </p>
      </div>

      <div className="card max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <button
            onClick={() => setListening(!listening)}
            className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${
              listening 
                ? 'bg-gradient-to-br from-red-500 to-pink-500 animate-pulse-slow shadow-2xl' 
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
          {listening ? 'Listening...' : 'Tap to speak'}
        </h2>
        
        {transcript && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
            <p className="text-gray-900 dark:text-white">{transcript}</p>
          </div>
        )}

        <div className="space-y-2 text-left">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Try saying:
          </p>
          <div className="space-y-2">
            {[
              '"Show my recent receipts"',
              '"What\'s my spending this month?"',
              '"Create a meal plan"',
              '"Add milk to shopping list"'
            ].map((example, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
