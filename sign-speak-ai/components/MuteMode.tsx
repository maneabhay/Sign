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
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence'>('word');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 🎥 Initialize Camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error(err);
        setCameraError("Camera permission denied.");
      }
    };

    initCamera();

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // 🎤 Speak Result
  const speakOutput = (text: string) => {
    if (!text || text === 'No gesture detected.') return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language;

    const voices = window.speechSynthesis.getVoices();
    const selected = voices.find(v =>
      v.lang.startsWith(language.split('-')[0])
    );

    if (selected) utter.voice = selected;

    window.speechSynthesis.speak(utter);
  };

  // 📸 Capture Frame
  const takeSnapshot = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0);

    return canvasRef.current.toDataURL('image/jpeg').split(',')[1];
  };

  // 🧠 Analyze
  const handleAnalysis = async (images: string | string[]) => {
    setIsLoading(true);
    setPrediction('');

    try {
      const result = await recognizeGesture(images, language);
      setPrediction(result);

      if (result && result !== 'No gesture detected.') {
        speakOutput(result);
        onLog({
          mode: AppMode.MUTE,
          input: analysisType === 'word' ? 'Single Sign' : 'Sign Sequence',
          output: result
        });
      }

    } catch (err) {
      console.error(err);
      setPrediction("Recognition failed. Try again.");
    }

    setIsLoading(false);
  };

  // 🖐 Word Mode
  const startWordMode = () => {
    const img = takeSnapshot();
    if (img) handleAnalysis(img);
  };

  // 🎬 Sentence Mode (3 sec recording)
  const startSentenceMode = () => {
    setIsRecording(true);
    setPrediction('');

    const frames: string[] = [];
    const duration = 3000;
    const fps = 4;
    const interval = 1000 / fps;
    const startTime = Date.now();

    const capture = setInterval(() => {
      const frame = takeSnapshot();
      if (frame) frames.push(frame);

      if (Date.now() - startTime >= duration) {
        clearInterval(capture);
        setIsRecording(false);
        handleAnalysis(frames);
      }
    }, interval);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 uppercase">
          Mute Mode
        </h2>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setAnalysisType('word')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold ${
              analysisType === 'word'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100'
            }`}
          >
            WORD
          </button>

          <button
            onClick={() => setAnalysisType('sentence')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold ${
              analysisType === 'sentence'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100'
            }`}
          >
            SENTENCE
          </button>
        </div>
      </div>

      {/* Camera */}
      <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-lg">
        {cameraError ? (
          <div className="flex items-center justify-center h-full text-white">
            {cameraError}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-3xl shadow border border-slate-100 text-center space-y-4">
        {analysisType === 'word' ? (
          <button
            onClick={startWordMode}
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold"
          >
            {isLoading ? "Analyzing..." : "Capture Sign"}
          </button>
        ) : (
          <button
            onClick={startSentenceMode}
            disabled={isLoading || isRecording}
            className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold"
          >
            {isRecording ? "Recording..." : "Record Sentence"}
          </button>
        )}

        {prediction && (
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900">
              {prediction}
            </p>

            {prediction !== 'No gesture detected.' && (
              <button
                onClick={() => speakOutput(prediction)}
                className="mt-4 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold"
              >
                🔊 Speak
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MuteMode;
