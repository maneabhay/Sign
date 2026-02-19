
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Lesson, Language } from '../types';
import { generateSignImage, evaluatePractice } from '../services/geminiService';

const CURRICULA: Record<string, Lesson[]> = {
  [Language.ENGLISH]: [
    { id: '1', title: 'A', category: 'Alphabets', description: 'Make a fist with the thumb on the side.', targetGesture: 'Alphabet A' },
    { id: '2', title: 'B', category: 'Alphabets', description: 'Open palm, thumb folded in.', targetGesture: 'Alphabet B' },
    { id: '3', title: 'Hello', category: 'Basics', description: 'A flat hand starting from the forehead out.', targetGesture: 'Hello' },
    { id: '4', title: 'Thank You', category: 'Basics', description: 'Touch your chin and move hand forward.', targetGesture: 'Thank You' },
    { id: '5', title: 'Emergency', category: 'Emergency', description: 'Shake a fist with thumb between fingers.', targetGesture: 'Help' },
  ],
  [Language.ENGLISH_UK]: [
    { id: '1', title: 'A', category: 'Alphabets', description: 'Form a fist with your thumb resting against the side.', targetGesture: 'Alphabet A' },
    { id: '2', title: 'B', category: 'Alphabets', description: 'Flat palm with the thumb tucked across the palm.', targetGesture: 'Alphabet B' },
    { id: '3', title: 'Hello', category: 'Basics', description: 'A salute-like motion starting from the temple.', targetGesture: 'Hello' },
    { id: '4', title: 'Cheers / Thanks', category: 'Basics', description: 'Touch your chin with fingertips and move outward.', targetGesture: 'Thank You' },
    { id: '5', title: 'SOS', category: 'Emergency', description: 'Vigorously shake a closed fist.', targetGesture: 'Help' },
  ],
  [Language.HINDI]: [
    { id: '1', title: 'अ (A)', category: 'वर्णमाला', description: 'अंगूठे को बगल में रखते हुए मुट्ठी बनाएं।', targetGesture: 'Alphabet A' },
    { id: '2', title: 'ब (B)', category: 'वर्णमाला', description: 'खुली हथेली, अंगूठा अंदर की ओर मुड़ा हुआ।', targetGesture: 'Alphabet B' },
    { id: '3', title: 'नमस्ते (Hello)', category: 'बुनियादी', description: 'माथे से बाहर की ओर जाती हुई सपाट हथेली।', targetGesture: 'Hello' },
    { id: '4', title: 'धन्यवाद (Thank You)', category: 'बुनियादी', description: 'ठोड़ी को छुएं और हाथ को आगे बढ़ाएं।', targetGesture: 'Thank You' },
    { id: '5', title: 'आपातकालीन (Emergency)', category: 'आपातकालीन', description: 'उंगलियों के बीच अंगूठा रखकर मुट्ठी हिलाएं।', targetGesture: 'Help' },
  ],
  [Language.MARATHI]: [
    { id: '1', title: 'अ (A)', category: 'मुळाक्षरे', description: 'अंगठा बाजूला ठेवून मूठ तयार करा.', targetGesture: 'Alphabet A' },
    { id: '2', title: 'ब (B)', category: 'मुळाक्षरे', description: 'उघडा तळहात, अंगठा आतल्या बाजूला दुमडलेला.', targetGesture: 'Alphabet B' },
    { id: '3', title: 'नमस्कार (Hello)', category: 'मूलभूत', description: 'कपाळापासून बाहेरच्या दिशेला जाणारा सपाट हात.', targetGesture: 'Hello' },
    { id: '4', title: 'धन्यवाद (Thank You)', category: 'मूलभूत', description: 'हनुवटीला स्पर्श करा आणि हात समोर न्या.', targetGesture: 'Thank You' },
    { id: '5', title: 'तात्काळ मदत (Emergency)', category: 'तात्काळ', description: 'बोटांमध्ये अंगठा ठेवून मूठ हलवा.', targetGesture: 'Help' },
  ],
};

const UI_TEXT: Record<string, any> = {
  [Language.ENGLISH]: { back: "Back to Curriculum", title: "LEARNING CENTER", sub: "Master sign language with beginner-friendly AI feedback.", check: "CHECK MY SIGN", practicing: "Ready to try it?", start: "START PRACTICE", analyzing: "ANALYZING...", perfect: "Great Job!", tryAgain: "Keep Going!" },
  [Language.ENGLISH_UK]: { back: "Return to Lessons", title: "STUDY CENTRE", sub: "Master sign language with helpful AI guidance.", check: "EVALUATE MY SIGN", practicing: "Ready for a go?", start: "BEGIN PRACTICE", analyzing: "PROCESSING...", perfect: "Brilliant!", tryAgain: "Nearly there!" },
  [Language.HINDI]: { back: "पाठ्यक्रम पर वापस जाएं", title: "शिक्षा केंद्र", sub: "AI फीडबैक के साथ आसानी से सांकेतिक भाषा सीखें।", check: "मेरे संकेत की जाँच करें", practicing: "क्या आप तैयार हैं?", start: "अभ्यास शुरू करें", analyzing: "विश्लेषण हो रहा है...", perfect: "बहुत अच्छे!", tryAgain: "कोशिश जारी रखें!" },
  [Language.MARATHI]: { back: "अभ्यासक्रमावर परत जा", title: "शिक्षण केंद्र", sub: "AI फीडबॅकसह सोप्या पद्धतीने सांकेतिक भाषा शिका.", check: "माझ्या खुणेची तपासणी करा", practicing: "तुम्ही तयार आहात का?", start: "सराव सुरू करा", analyzing: "विशलेषण सुरू आहे...", perfect: "खूप छान!", tryAgain: "प्रयत्न करत राहा!" },
};

interface LearningModeProps {
  onBack: () => void;
  language: Language;
}

const LearningMode: React.FC<LearningModeProps> = ({ onBack, language }) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lessonImage, setLessonImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; feedback: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const curriculum = useMemo(() => CURRICULA[language] || CURRICULA[Language.ENGLISH], [language]);
  const t = useMemo(() => UI_TEXT[language] || UI_TEXT[Language.ENGLISH], [language]);

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
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
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
    const result = await evaluatePractice(base64, selectedLesson.targetGesture);
    setFeedback({ correct: result.correct, feedback: result.feedback });
    setIsLoading(false);
  };

  if (selectedLesson) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        <button onClick={() => { setSelectedLesson(null); stopPractice(); }} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          {t.back}
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{selectedLesson.category}</span>
              <h2 className="text-4xl font-black text-slate-900 mt-4 mb-2">{selectedLesson.title}</h2>
              <p className="text-slate-500 font-medium leading-relaxed">{selectedLesson.description}</p>
              
              <div className="mt-8 aspect-square bg-slate-50 rounded-3xl overflow-hidden flex items-center justify-center relative border border-slate-100">
                {lessonImage ? (
                  <img src={lessonImage} className="w-full h-full object-contain" alt={selectedLesson.title} />
                ) : (
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {!isPracticing ? (
              <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <div className="text-8xl">🖖</div>
                </div>
                <div className="text-6xl mb-6">🎥</div>
                <h3 className="text-2xl font-black mb-2">{t.practicing}</h3>
                <p className="opacity-80 mb-8">AI is here to help you learn, not to judge. Let's see those signs!</p>
                <button onClick={startPractice} className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black shadow-lg hover:scale-105 transition-transform">LET'S START</button>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col gap-4">
                <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-100">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider">Learning Assistant Active</div>
                </div>
                
                {feedback && (
                  <div className={`p-6 rounded-2xl flex items-center gap-4 animate-in zoom-in duration-300 ${feedback.correct ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                    <div className="text-2xl">{feedback.correct ? '🎉' : '💡'}</div>
                    <div className="flex-1">
                      <p className="font-black text-sm uppercase tracking-wider">{feedback.correct ? t.perfect : t.tryAgain}</p>
                      <p className="text-xs font-medium opacity-90">{feedback.feedback}</p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={checkSign} 
                  disabled={isLoading} 
                  className={`w-full py-5 rounded-2xl font-black text-white transition-all transform active:scale-95 ${isLoading ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100'}`}
                >
                  {isLoading ? t.analyzing : t.check}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center max-w-lg mx-auto">
        <h2 className="text-5xl font-black text-slate-900 tracking-tight">{t.title}</h2>
        <p className="text-slate-500 font-medium mt-3">{t.sub}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {curriculum.map((lesson) => (
          <div 
            key={lesson.id} 
            onClick={() => setSelectedLesson(lesson)}
            className="group cursor-pointer bg-white p-6 rounded-[2rem] border-2 border-transparent hover:border-indigo-500 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{lesson.category}</span>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{lesson.title}</h3>
            <p className="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed">{lesson.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningMode;
