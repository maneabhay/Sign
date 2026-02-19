
import React, { useState, useRef, useEffect } from 'react';
import { AppMode, HistoryLog, Language } from '../types';
import { recognizeGesture } from '../services/geminiService';

interface MuteModeProps {
  onBack: () => void;
  onLog: (log: Omit<HistoryLog, 'id' | 'timestamp'>) => void;
  language: Language;
}

const MuteMode: React.FC<MuteModeProps> = ({ onBack, onLog, language }) => {
  const [prediction, setPrediction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence'>('word');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Constants for circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Force voice list to load (some browsers need this)
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  const getBestVoice = (lang: string, gender: 'male' | 'female') => {
    const voices = window.speechSynthesis.getVoices();
    // Filter by language first
    const langCode = lang.split('-')[0];
    const langVoices = voices.filter(v => v.lang.startsWith(langCode));
    
    if (langVoices.length === 0) return null;

    // Search for gender indicators in voice names
    const femaleKeywords = ['female', 'woman', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'veena', 'google uk english female'];
    const maleKeywords = ['male', 'man', 'alex', 'daniel', 'fred', 'rishi', 'google uk english male'];

    const targets = gender === 'female' ? femaleKeywords : maleKeywords;
    
    const found = langVoices.find(v => 
      targets.some(keyword => v.name.toLowerCase().includes(keyword))
    );

    return found || langVoices[0];
  };

  const speakOutput = (text: string) => {
    if (!text || text === 'No gesture detected.') return;
    window.speechSynthesis.cancel();
    
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language;
    
    const selectedVoice = getBestVoice(language, voiceGender);
    if (selectedVoice) {
      utter.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utter);
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0);
    return canvasRef.current.toDataURL('image/jpeg').split(',')[1];
  };

  const handleAnalysis = async (images: string | string[]) => {
    setIsLoading(true);
    setPrediction('');
    const result = await recognizeGesture(images, language);
    setPrediction(result);
    if (result && result !== 'No gesture detected.') {
      speakOutput(result);
      onLog({ mode: AppMode.MUTE, input: analysisType === 'word' ? 'Single Sign' : 'Sign Sequence', output: result });
    }
    setIsLoading(false);
  };

  const startWordMode = () => {
    setAnalysisType('word');
    const img = takeSnapshot();
    if (img) handleAnalysis(img);
  };

  const startSentenceMode = () => {
    setAnalysisType('sentence');
    setIsRecording(true);
    setRecordProgress(0);
    setPrediction('');
    
    const frames: string[] = [];
    const duration = 3000; // 3 seconds
    const fps = 5; 
    const interval = 1000 / fps;
    const startTime = Date.now();

    const captureInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setRecordProgress(progress);

      const frame = takeSnapshot();
      if (frame) frames.push(frame);

      if (elapsed >= duration) {
        clearInterval(captureInterval);
        setIsRecording(false);
        handleAnalysis(frames);
      }
    }, interval);
  };

  const strokeDashoffset = circumference - (recordProgress / 100) * circumference;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">Mute Mode</h2>
            <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">AI Gesture Bridge</p>
          </div>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
            <button 
              onClick={() => { setAnalysisType('word'); setPrediction(''); }}
              className={`flex-1 sm:px-6 py-2 rounded-xl text-xs font-black transition-all ${analysisType === 'word' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              1 WORD
            </button>
            <button 
              onClick={() => { setAnalysisType('sentence'); setPrediction(''); }}
              className={`flex-1 sm:px-6 py-2 rounded-xl text-xs font-black transition-all ${analysisType === 'sentence' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              SENTENCE
            </button>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          {analysisType === 'word' ? (
            <button 
              onClick={startWordMode}
              disabled={isLoading}
              className={`flex-1 py-5 rounded-[2rem] font-black text-white flex items-center justify-center gap-3 transition-all transform active:scale-95 ${isLoading ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {isLoading ? 'ANALYZING...' : 'CLICK PICTURE'}
            </button>
          ) : (
            <button 
              onClick={startSentenceMode}
              disabled={isLoading || isRecording}
              className={`flex-1 py-5 rounded-[2rem] font-black text-white flex items-center justify-center gap-3 transition-all transform active:scale-95 ${isLoading || isRecording ? 'bg-slate-300' : 'bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-100'}`}
            >
              {isRecording ? (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  RECORDING PHRASE...
                </div>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  {isLoading ? 'ANALYZING...' : 'RECORD & ANALYZE'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <div className="relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white group">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
          
          {isRecording && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/20 backdrop-blur-[2px]">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#f43f5e"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.1s linear' }}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white text-xl font-black">{Math.round(recordProgress)}%</span>
                  <span className="text-white text-[8px] font-bold uppercase tracking-widest mt-1">Recording</span>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-6 left-6 flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></div>
            <span className="text-white text-[10px] font-black uppercase tracking-widest">{isRecording ? 'Recording Gesture...' : 'Camera Live'}</span>
          </div>
          
          <div className="absolute top-6 right-6">
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[10px] font-black uppercase tracking-wider border border-white/20">
              {analysisType === 'word' ? 'SNAPSHOT MODE' : 'SENTENCE MODE'}
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50">
            {isLoading && (
              <div className="h-full bg-indigo-600 animate-[loading_2s_ease-in-out_infinite]"></div>
            )}
          </div>

          <div className="w-full flex justify-between items-center mb-6">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">AI Speech Synthesis</span>
            
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button 
                onClick={() => setVoiceGender('female')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${voiceGender === 'female' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
              >
                <span className="text-lg">👩‍💼</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Female</span>
              </button>
              <button 
                onClick={() => setVoiceGender('male')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${voiceGender === 'male' ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-400'}`}
              >
                <span className="text-lg">👨‍💼</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Male</span>
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center gap-6 animate-in fade-in py-8">
              <div className="w-14 h-14 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-xs font-black text-slate-400 tracking-wider">CONVERTING SIGNS TO SPEECH...</p>
            </div>
          ) : (
            <div className="max-w-md w-full animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center py-4">
              <p className={`text-4xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8 ${!prediction ? 'opacity-10 italic' : ''}`}>
                {prediction || (analysisType === 'word' ? "Perform sign and click capture" : "Record a sequence of signs")}
              </p>
              
              {prediction && prediction !== 'No gesture detected.' && (
                <button 
                  onClick={() => speakOutput(prediction)}
                  className={`group flex items-center gap-4 px-8 py-4 rounded-2xl font-black transition-all transform active:scale-95 shadow-md border ${voiceGender === 'female' ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-rose-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-100'}`}
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                  <span className="tracking-wider uppercase text-xs">Speak with {voiceGender} voice</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { width: 0%; left: 0%; }
          50% { width: 30%; left: 35%; }
          100% { width: 0%; left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default MuteMode;
