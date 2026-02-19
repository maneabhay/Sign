
import React, { useState, useRef, useEffect } from 'react';
import { User, CustomSign } from '../types';

interface SignVaultProps {
  onBack: () => void;
  user: User | null;
}

const SignVault: React.FC<SignVaultProps> = ({ onBack, user }) => {
  const [signs, setSigns] = useState<CustomSign[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSignLabel, setNewSignLabel] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const storedSigns = localStorage.getItem(`custom_signs_${user?.id || 'guest'}`);
    if (storedSigns) setSigns(JSON.parse(storedSigns));
  }, [user]);

  const saveSigns = (updatedSigns: CustomSign[]) => {
    setSigns(updatedSigns);
    localStorage.setItem(`custom_signs_${user?.id || 'guest'}`, JSON.stringify(updatedSigns));
  };

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    setIsCapturing(false);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0);
    const base64 = canvasRef.current.toDataURL('image/jpeg');
    setCapturedImage(base64);
    stopCamera();
  };

  const addSign = () => {
    if (!newSignLabel || !capturedImage) return;
    const newSign: CustomSign = {
      id: crypto.randomUUID(),
      label: newSignLabel,
      imageUrl: capturedImage,
      timestamp: Date.now()
    };
    saveSigns([newSign, ...signs]);
    setNewSignLabel('');
    setCapturedImage(null);
    setIsAdding(false);
  };

  const deleteSign = (id: string) => {
    saveSigns(signs.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <button 
          onClick={() => setIsAdding(true)} 
          className="px-6 py-3 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all"
        >
          Add New Sign
        </button>
      </div>

      <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl shadow-sm">🔐</div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Your Personal Sign Vault</h2>
          <p className="text-amber-700 font-medium opacity-80 text-sm">Create and store your own unique gestures. These are private to your account.</p>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6 text-center">Map New Sign</h3>
            
            <div className="space-y-6">
              <input 
                type="text" 
                placeholder="What does this sign mean? (e.g. Family)" 
                value={newSignLabel}
                onChange={(e) => setNewSignLabel(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-amber-500 font-bold transition-all text-center"
              />

              <div className="aspect-video bg-slate-900 rounded-[2rem] overflow-hidden relative border-4 border-slate-50 shadow-inner">
                {isCapturing ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                ) : capturedImage ? (
                  <img src={capturedImage} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                    <span className="text-5xl mb-4">🎥</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">Camera Ready</p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex gap-4">
                {!isCapturing && !capturedImage && (
                  <button onClick={startCamera} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Start Camera</button>
                )}
                {isCapturing && (
                  <button onClick={capture} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all animate-pulse">Snap Portrait</button>
                )}
                {capturedImage && (
                  <button onClick={() => { setCapturedImage(null); startCamera(); }} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Retake</button>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => { setIsAdding(false); stopCamera(); }} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest">Cancel</button>
                <button 
                  onClick={addSign} 
                  disabled={!newSignLabel || !capturedImage}
                  className="flex-1 py-4 bg-amber-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100 disabled:opacity-20"
                >
                  Save to Vault
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {signs.map((sign) => (
          <div key={sign.id} className="group relative bg-white p-4 rounded-[2rem] shadow-md border border-slate-100 hover:shadow-xl transition-all duration-300">
            <div className="aspect-square rounded-2xl overflow-hidden mb-3">
              <img src={sign.imageUrl} className="w-full h-full object-cover" alt={sign.label} />
            </div>
            <p className="text-center font-black text-slate-800 uppercase text-xs tracking-wider">{sign.label}</p>
            <button 
              onClick={() => deleteSign(sign.id)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
            >
              ×
            </button>
          </div>
        ))}
        {signs.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-20 grayscale flex flex-col items-center">
            <span className="text-9xl mb-4">📭</span>
            <p className="font-black text-xl uppercase tracking-[0.3em]">Vault is Empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignVault;
