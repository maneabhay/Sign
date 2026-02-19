
import React from 'react';
import { AppMode, User } from '../types';

interface ModeSelectorProps {
  onSelect: (mode: AppMode) => void;
  user: User | null;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect, user }) => {
  return (
    <div className="space-y-8 py-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div 
          onClick={() => onSelect(AppMode.DEAF)}
          className="group cursor-pointer bg-white p-8 rounded-3xl shadow-lg border-2 border-transparent hover:border-indigo-500 hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">
            👂
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 uppercase">Deaf Mode</h2>
          <p className="text-slate-500 font-medium text-sm">Translate voice into sign language images and videos instantly.</p>
          <div className="mt-8 px-8 py-2.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            Enter Mode
          </div>
        </div>

        <div 
          onClick={() => onSelect(AppMode.MUTE)}
          className="group cursor-pointer bg-white p-8 rounded-3xl shadow-lg border-2 border-transparent hover:border-violet-500 hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">
            ✋
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 uppercase">Mute Mode</h2>
          <p className="text-slate-500 font-medium text-sm">Detect your hand gestures and translate them into spoken words.</p>
          <div className="mt-8 px-8 py-2.5 bg-violet-50 text-violet-700 rounded-full font-bold text-sm group-hover:bg-violet-600 group-hover:text-white transition-colors">
            Enter Mode
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div 
          onClick={() => onSelect(AppMode.LEARNING)}
          className="group cursor-pointer bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden h-full"
        >
          <div className="absolute right-[-10px] bottom-[-10px] text-white opacity-10 text-9xl font-black pointer-events-none select-none">LEARN</div>
          <div className="relative z-10 flex flex-col items-center text-center h-full">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:rotate-12 transition-transform">
              🎓
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Learning Center</h2>
            <p className="text-emerald-50 font-medium opacity-90 text-xs mt-2">Practice signs with real-time AI feedback.</p>
            <div className="mt-6 px-6 py-2 bg-white text-emerald-600 rounded-full font-black text-[10px] uppercase shadow-lg group-hover:scale-105 transition-transform">
              Start Learning
            </div>
          </div>
        </div>

        <div 
          onClick={() => user ? onSelect(AppMode.VAULT) : onSelect(AppMode.AUTH)}
          className="group cursor-pointer bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden h-full"
        >
          <div className="absolute right-[-10px] bottom-[-10px] text-white opacity-10 text-9xl font-black pointer-events-none select-none">NEW</div>
          <div className="relative z-10 flex flex-col items-center text-center h-full">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:rotate-12 transition-transform">
              🔒
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Sign Vault</h2>
            <p className="text-amber-50 font-medium opacity-90 text-xs mt-2">Record and add your own custom signs.</p>
            <div className="mt-6 px-6 py-2 bg-white text-amber-600 rounded-full font-black text-[10px] uppercase shadow-lg group-hover:scale-105 transition-transform">
              {user ? 'Open Vault' : 'Login to Create'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
