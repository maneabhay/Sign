
import React, { useState, useEffect, useRef } from 'react';
import { AppMode, HistoryLog, Language } from '../types';
import { generateSignImage, generateSignVideo, describeSignStream } from '../services/geminiService';

const INSTANT_SIGNS: Record<string, string> = {
  'hello': '👋', 'hi': '👋', 'thank you': '🙏', 'thanks': '🙏',
  'yes': '✅', 'no': '❌', 'help': '🆘', 'please': '🤲',
  'sorry': '😔', 'goodbye': '👋'
};

const LOADING_STATUSES = [
  "Drafting hand gestures...",
  "Rendering 3D model...",
  "Applying fluid motion...",
  "Polishing visual details...",
  "Almost ready for you..."
];

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
  const [statusIdx, setStatusIdx] = useState(0);
  const [textDescription, setTextDescription] = useState('');
  const [instantIcon, setInstantIcon] = useState<string | null>(null);
  const [isHD, setIsHD] = useState(false);
  const [mediaResult, setMediaResult] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    let interval: number;
    if (isLoading && isHD) {
      interval = window.setInterval(() => {
        setStatusIdx(prev => (prev + 1) % LOADING_STATUSES.length);
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [isLoading, isHD]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; 
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          text += event.results[i][0].transcript;
        }
        setTranscript(text);
      };

      recognitionRef.current.onend = () => { if (isListening) recognitionRef.current?.start(); };
    }
    return () => recognitionRef.current?.stop();
  }, [isListening, language]);

  const handleTranslate = async (text: string) => {
    const cleanText = text.toLowerCase().trim();
    if (!cleanText) return;
    
    setFinalTranscript(text);
    setIsLoading(true);
    setTextDescription('');
    setMediaResult(null);
    setError(null);

    setInstantIcon(INSTANT_SIGNS[cleanText] || null);

    const describePromise = describeSignStream(text, language, (chunk) => {
      setTextDescription(prev => prev + chunk);
    });

    try {
      if (isHD) {
        const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio?.openSelectKey();
        }
        
        const videoUrl = await generateSignVideo(text, language);
        if (videoUrl) {
          setMediaResult({ url: videoUrl, type: 'video' });
          onLog({ mode: AppMode.DEAF, input: text, output: `Video Generated`, mediaUrl: videoUrl, mediaType: 'video' });
        }
      } else {
        const imageUrl = await generateSignImage(text, language);
        if (imageUrl) {
          setMediaResult({ url: imageUrl, type: 'image' });
          onLog({ mode: AppMode.DEAF, input: text, output: `Image Generated`, mediaUrl: imageUrl, mediaType: 'image' });
        }
      }
    } catch (err: any) {
      if (err.message === "KEY_REQUIRED") {
        setError("AI Key setup required for HD Video. Please select a paid API key.");
        await (window as any).aistudio?.openSelectKey();
      } else {
        setError("Visual generation failed. You can still use the text instructions.");
      }
    } finally {
      setIsLoading(false);
    }
    
    await describePromise;
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (transcript.trim()) handleTranslate(transcript);
    } else {
      setTranscript(''); setManualText(''); setFinalTranscript(''); setTextDescription(''); setInstantIcon(null); setMediaResult(null); setError(null);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">Deaf Mode</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit mt-3">
              <button 
                onClick={() => setIsHD(false)} 
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${!isHD ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                IMAGE
              </button>
              <button 
                onClick={() => setIsHD(true)} 
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${isHD ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                HD VIDEO
              </button>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
            <button 
              onClick={() => { setInputMethod('voice'); setIsListening(false); }}
              className={`flex-1 sm:px-6 py-2 rounded-xl text-xs font-black transition-all ${inputMethod === 'voice' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              VOICE
            </button>
            <button 
              onClick={() => { setInputMethod('text'); setIsListening(false); }}
              className={`flex-1 sm:px-6 py-2 rounded-xl text-xs font-black transition-all ${inputMethod === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              TEXT
            </button>
          </div>
        </div>

        {isHD && (
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl text-[10px] text-blue-700 font-medium">
            🎬 <strong>HD Video:</strong> Generation uses your paid AI Key and takes 1-3 mins.
          </div>
        )}

        <div className="min-h-[160px] flex items-center justify-center">
          {inputMethod === 'voice' ? (
            <div className="flex flex-col items-center gap-4 w-full">
              <button 
                onClick={toggleListening} 
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform active:scale-95 ${isListening ? 'bg-rose-500 text-white animate-pulse shadow-xl shadow-rose-200' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:scale-105'}`}
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
              </button>
              <p className={`text-sm font-black uppercase tracking-[0.2em] ${isListening ? 'text-rose-500' : 'text-slate-300'}`}>
                {isListening ? 'Listening...' : 'Tap to Speak'}
              </p>
              {transcript && (
                <div className="bg-slate-50 p-4 rounded-2xl w-full border border-slate-100 animate-in fade-in slide-in-from-top-2">
                  <p className="text-slate-600 font-medium italic text-center">"{transcript}"</p>
                </div>
              )}
            </div>
          ) : (
            <form 
              onSubmit={(e) => { e.preventDefault(); if (manualText.trim()) handleTranslate(manualText); }} 
              className="w-full space-y-4"
            >
              <div className="relative">
                <textarea 
                  value={manualText} 
                  onChange={(e) => setManualText(e.target.value)} 
                  placeholder="Type a sentence to translate to sign..." 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-6 text-xl focus:outline-none focus:border-indigo-500 font-bold transition-all min-h-[140px] resize-none"
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !manualText.trim()} 
                  className="absolute right-4 bottom-4 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs disabled:opacity-30 shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700"
                >
                  {isLoading ? '...' : 'TRANSLATE'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {(textDescription || instantIcon || finalTranscript || transcript || error) && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl flex items-center gap-6 relative overflow-hidden">
             <div className="absolute -right-4 -top-4 text-white opacity-10 text-9xl font-black rotate-12 select-none pointer-events-none">ASL</div>
            {instantIcon && <div className="text-7xl animate-bounce z-10">{instantIcon}</div>}
            <div className="flex-1 z-10">
              <span className="text-[10px] font-black opacity-60 uppercase tracking-widest block mb-2">AI SIGNING GUIDE</span>
              <p className="text-xl font-bold leading-snug">
                {textDescription || (isLoading ? "Thinking..." : "...") }
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm min-h-[400px] flex items-center justify-center relative overflow-hidden">
            {isLoading && !mediaResult && (
              <div className="flex flex-col items-center gap-6 text-center max-w-xs">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                  {isHD && <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-indigo-600">HD</div>}
                </div>
                <div>
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2">
                    {isHD ? LOADING_STATUSES[statusIdx] : "Visualizing Sign..."}
                  </p>
                </div>
              </div>
            )}
            
            {mediaResult && (
              <div className="w-full animate-in zoom-in duration-500">
                {mediaResult.type === 'video' ? (
                  <video src={mediaResult.url} controls autoPlay loop className="w-full rounded-[2rem] shadow-2xl aspect-video bg-black" />
                ) : (
                  <img src={mediaResult.url} className="w-full aspect-square object-contain rounded-[2rem]" alt="Sign Gesture" />
                )}
              </div>
            )}

            {error && !isLoading && (
              <div className="text-center p-12 space-y-6">
                <div className="text-5xl">⚠️</div>
                <p className="text-rose-500 font-black text-sm max-w-xs mx-auto">{error}</p>
                <button 
                  onClick={() => isHD ? (window as any).aistudio?.openSelectKey() : handleTranslate(finalTranscript)} 
                  className="px-8 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black shadow-sm"
                >
                  {isHD ? 'SETUP KEY' : 'RETRY GENERATION'}
                </button>
              </div>
            )}
            
            {!isLoading && !mediaResult && !instantIcon && !error && (
              <div className="flex flex-col items-center opacity-10 select-none grayscale">
                <div className="text-9xl mb-6">🤟</div>
                <div className="text-slate-900 text-6xl font-black tracking-tighter uppercase">SIGN SPEAK</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeafMode;
