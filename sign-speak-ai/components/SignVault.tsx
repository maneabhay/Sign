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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ---------------- Load Stored Signs ---------------- */
  useEffect(() => {
    const storedSigns = localStorage.getItem(`custom_signs_${user?.id || 'guest'}`);
    if (storedSigns) setSigns(JSON.parse(storedSigns));
  }, [user]);

  /* ---------------- Save Helper ---------------- */
  const saveSigns = (updatedSigns: CustomSign[]) => {
    setSigns(updatedSigns);
    localStorage.setItem(
      `custom_signs_${user?.id || 'guest'}`,
      JSON.stringify(updatedSigns)
    );
  };

  /* ---------------- Camera Control ---------------- */
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCapturing(true);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Camera permission denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

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

  /* ---------------- Add Sign ---------------- */
  const addSign = async () => {
    if (!newSignLabel || !capturedImage) return;

    setIsSaving(true);

    const newSign: CustomSign = {
      id: crypto.randomUUID(),
      label: newSignLabel.trim(),
      imageUrl: capturedImage,
      timestamp: Date.now()
    };

    saveSigns([newSign, ...signs]);

    setTimeout(() => {
      setNewSignLabel('');
      setCapturedImage(null);
      setIsAdding(false);
      setIsSaving(false);
    }, 400);
  };

  const deleteSign = (id: string) => {
    saveSigns(signs.filter(s => s.id !== id));
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors"
        >
          ← Back
        </button>

        <button
          onClick={() => setIsAdding(true)}
          className="px-6 py-3 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-amber-600 transition-all"
        >
          Add New Sign
        </button>
      </div>

      {/* Intro Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-[2.5rem] border border-amber-100 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl shadow">
          🔐
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase">
            Your Personal Sign Vault
          </h2>
          <p className="text-amber-700 text-sm opacity-80">
            Store your own custom gestures. These are saved privately to your device.
          </p>
        </div>
      </div>

      {/* Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">

            <h3 className="text-xl font-black text-center mb-6 uppercase">
              Create New Sign
            </h3>

            <div className="space-y-6">

              <input
                type="text"
                placeholder="Enter sign meaning (e.g. Family)"
                value={newSignLabel}
                onChange={(e) => setNewSignLabel(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-amber-500 font-bold text-center"
              />

              <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative">

                {isCapturing ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : capturedImage ? (
                  <img
                    src={capturedImage}
                    className="w-full h-full object-cover"
                    alt="Captured"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/40 text-4xl">
                    🎥
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>

              {cameraError && (
                <p className="text-rose-500 text-xs text-center">{cameraError}</p>
              )}

              {/* Camera Controls */}
              <div className="flex gap-3">
                {!isCapturing && !capturedImage && (
                  <button
                    onClick={startCamera}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase"
                  >
                    Start Camera
                  </button>
                )}

                {isCapturing && (
                  <button
                    onClick={capture}
                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase animate-pulse"
                  >
                    Capture
                  </button>
                )}

                {capturedImage && (
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      startCamera();
                    }}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase"
                  >
                    Retake
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    stopCamera();
                  }}
                  className="flex-1 py-3 text-slate-400 font-bold text-xs uppercase"
                >
                  Cancel
                </button>

                <button
                  onClick={addSign}
                  disabled={!newSignLabel || !capturedImage || isSaving}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg disabled:opacity-30"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Sign Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {signs.map(sign => (
          <div
            key={sign.id}
            className="group relative bg-white p-4 rounded-2xl shadow border hover:shadow-xl transition-all"
          >
            <div className="aspect-square rounded-xl overflow-hidden mb-3">
              <img
                src={sign.imageUrl}
                alt={sign.label}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-center font-black text-xs uppercase tracking-wider">
              {sign.label}
            </p>

            <button
              onClick={() => deleteSign(sign.id)}
              className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ))}

        {signs.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-20 flex flex-col items-center">
            <span className="text-7xl mb-4">📭</span>
            <p className="font-black uppercase tracking-widest text-sm">
              Vault is Empty
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignVault;
