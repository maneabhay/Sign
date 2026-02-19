import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Lesson, Language } from '../types';
import { generateSignImage, recognizeGesture } from '../services/geminiService';

interface LearningModeProps {
  onBack: () => void;
  language: Language;
}

const LearningMode: React.FC<LearningModeProps> = ({ onBack, language }) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lessonImage, setLessonImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (selectedLesson) {
      loadLessonMedia();
    }
  }, [selectedLesson]);

  const loadLessonMedia = async () => {
    setLessonImage(null);
    if (selectedLesson) {
      const img = await generateSignImage(selectedLesson.targetGesture, language);
      setLessonImage(img);
    }
  };

  const startPractice = async () => {
    setIsPracticing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopPractice = () => {
    setIsPracticing(false);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach(track => track.stop());
    }
  };

  const checkSign = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedLesson) return;

    setIsLoading(true);
    setFeedback(null);

    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0);

    const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];

    try {
      // 🔥 Backend recognition
      const prediction = await recognizeGesture(base64, language);

      if (prediction.toLowerCase().includes(selectedLesson.title.toLowerCase())) {
        setFeedback("🎉 Great job! Your sign looks correct!");
      } else {
        setFeedback("💡 Almost there! Try adjusting your hand position slightly.");
      }

    } catch (err) {
      console.error(err);
      setFeedback("Recognition failed. Please try again.");
    }

    setIsLoading(false);
  };

  if (selectedLesson) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedLesson(null);
            stopPractice();
          }}
          className="text-indigo-600 font-bold"
        >
          ← Back
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-3xl font-bold">{selectedLesson.title}</h2>
            <p className="text-slate-500 mt-2">{selectedLesson.description}</p>

            <div className="mt-6 aspect-square bg-slate-50 rounded-xl flex items-center justify-center">
              {lessonImage ? (
                <img src={lessonImage} className="w-full h-full object-contain" />
              ) : (
                <div className="w-6 h-6 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
              )}
            </div>
          </div>

          <div>
            {!isPracticing ? (
              <button
                onClick={startPractice}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold"
              >
                Start Practice
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {feedback && (
                  <div className="p-4 bg-slate-100 rounded-xl font-medium">
                    {feedback}
                  </div>
                )}

                <button
                  onClick={checkSign}
                  disabled={isLoading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold"
                >
                  {isLoading ? "Analyzing..." : "Check My Sign"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {curriculum.map((lesson) => (
        <div
          key={lesson.id}
          onClick={() => setSelectedLesson(lesson)}
          className="cursor-pointer bg-white p-6 rounded-2xl shadow hover:shadow-xl transition"
        >
          <h3 className="text-xl font-bold">{lesson.title}</h3>
          <p className="text-slate-500 text-sm mt-2">{lesson.description}</p>
        </div>
      ))}
    </div>
  );
};

export default LearningMode;
