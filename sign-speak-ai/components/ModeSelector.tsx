import React from 'react';
import { AppMode, User } from '../types';

interface ModeSelectorProps {
  onSelect: (mode: AppMode) => void;
  user: User | null;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect, user }) => {

  const ModeCard = ({
    icon,
    title,
    description,
    bg,
    hoverBorder,
    buttonText,
    onClick,
  }: {
    icon: string;
    title: string;
    description: string;
    bg: string;
    hoverBorder: string;
    buttonText: string;
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`group cursor-pointer ${bg} p-8 rounded-3xl shadow-lg border-2 border-transparent hover:${hoverBorder} hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center`}
    >
      <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-2 uppercase">
        {title}
      </h2>

      <p className="text-slate-500 font-medium text-sm">
        {description}
      </p>

      <div className="mt-8 px-8 py-2.5 bg-white text-slate-700 rounded-full font-bold text-sm shadow group-hover:scale-105 transition-transform">
        {buttonText}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 py-8 animate-in fade-in duration-500">

      <div className="grid md:grid-cols-2 gap-8">

        {/* Deaf Mode */}
        <ModeCard
          icon="👂"
          title="Deaf Mode"
          description="Convert speech into visual sign language instantly."
          bg="bg-white"
          hoverBorder="border-indigo-500"
          buttonText="Enter Mode"
          onClick={() => onSelect(AppMode.DEAF)}
        />

        {/* Mute Mode */}
        <ModeCard
          icon="✋"
          title="Mute Mode"
          description="Translate hand gestures into readable speech."
          bg="bg-white"
          hoverBorder="border-violet-500"
          buttonText="Enter Mode"
          onClick={() => onSelect(AppMode.MUTE)}
        />

      </div>

      <div className="grid md:grid-cols-2 gap-8">

        {/* Learning Center */}
        <ModeCard
          icon="🎓"
          title="Learning Center"
          description="Practice and improve with AI-powered feedback."
          bg="bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
          hoverBorder="border-emerald-400"
          buttonText="Start Learning"
          onClick={() => onSelect(AppMode.LEARNING)}
        />

        {/* Sign Vault */}
        <ModeCard
          icon="🔒"
          title="Sign Vault"
          description="Store and manage your custom signs."
          bg="bg-gradient-to-br from-amber-500 to-orange-600 text-white"
          hoverBorder="border-amber-400"
          buttonText={user ? "Open Vault" : "Login to Create"}
          onClick={() =>
            user
              ? onSelect(AppMode.VAULT)
              : onSelect(AppMode.AUTH)
          }
        />

      </div>
    </div>
  );
};

export default ModeSelector;
