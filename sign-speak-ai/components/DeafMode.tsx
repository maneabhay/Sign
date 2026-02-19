import React, { useState, useEffect, useRef } from 'react';
import { AppMode, HistoryLog, Language } from '../types';
import { generateSignImage, generateSignVideo, describeSignStream } from '../services/geminiService';

const INSTANT_SIGNS: Record<string, string> = {
  'hello': '👋', 'hi': '👋', 'thank you': '🙏', 'thanks': '🙏',
  'yes': '✅', 'no': '❌', 'help': '🆘', 'please': '🤲',
  'sorry': '😔', 'goodbye': '👋'
};

interface DeafModeProps {
  onBack: () => void;
  onLog: (log: Omit<HistoryLog, 'id' | 'timestamp'>) => void;
  language: Language;
}

const DeafMode: React.FC<DeafModeProps> = ({ onBack, onLog, language }) => {
  const [inputMethod, setInputMethod] = useState<'voice' | 'text'>('voice');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [textDescription, setTextDescription] = useState('');
  const [instantIcon, setInstantIcon] = useState<string | null>(null);
  const [isHD, setIsHD] = useState(false);
  const [mediaResult, setMediaResult] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // 🎙 Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleTranslate(text);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }

    return () => recognitionRef.current?.stop();
  }, [language]);

  // 🚀 Main Translate Function (Backend Only)
  const handleTranslate = async (text: string) => {
    const cleanText = text.toLowerCase().trim();
    if (!cleanText) return;

    setFinalTranscript(text);
    setIsLoading(true);
    setTextDescription('');
    setMediaResult(null);
    setError(null);
    setInstantIcon(INSTANT_SIGNS[cleanText] || null);

    try {
      // 1️⃣ Stream description
      await describeSignStream(text, language, (chunk) => {
        setTextDescription(prev => prev + chunk);
      });

      // 2️⃣ Generate media
      if (isHD) {
        const videoUrl = await generateSignVideo(text, language);
        if (videoUrl) {
          setMediaResult({ url: videoUrl, type: 'video' });
          onLog({ mode: AppMode.DEAF, input: text, output: 'Video Generated', mediaUrl: videoUrl, mediaType: 'video' });
        }
      } else {
        const imageUrl = await generateSignImage(text, language);
        if (imageUrl) {
          setMediaResult({ url: imageUrl, type: 'image' });
          onLog({ mode: AppMode.DEAF, input: text, output: 'Image Generated', mediaUrl: imageUrl, mediaType: 'image' });
        }
      }

    } catch (err) {
      console.error(err);
      setError("Generation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Deaf Mode</h2>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsHD(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${!isHD ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
          >
            IMAGE
          </button>
          <button
            onClick={() => setIsHD(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${isHD ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
          >
            VIDEO
          </button>
        </div>

        {/* Voice / Text Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setInputMethod('voice')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold ${inputMethod === 'voice' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
          >
            VOICE
          </button>
          <button
            onClick={() => setInputMethod('text')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold ${inputMethod === 'text' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
          >
            TEXT
          </button>
        </div>

        {/* Voice Input */}
        {inputMethod === 'voice' && (
          <button
            onClick={toggleListening}
            className={`w-full py-4 rounded-xl font-bold ${isListening ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}
          >
            {isListening ? "Listening..." : "Tap to Speak"}
          </button>
        )}

        {/* Text Input */}
        {inputMethod === 'text' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTranslate(manualText);
            }}
            className="space-y-3"
          >
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Type something..."
              className="w-full p-4 rounded-xl border border-slate-200"
            />
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold"
            >
              Translate
            </button>
          </form>
        )}
      </div>

      {/* Result Section */}
      {(textDescription || mediaResult || error) && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
          {textDescription && (
            <p className="text-slate-700 font-medium">{textDescription}</p>
          )}

          {mediaResult?.type === 'image' && (
            <img src={mediaResult.url} className="w-full rounded-xl" />
          )}

          {mediaResult?.type === 'video' && (
            <video src={mediaResult.url} controls className="w-full rounded-xl" />
          )}

          {error && (
            <p className="text-rose-500 font-semibold">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DeafMode;
