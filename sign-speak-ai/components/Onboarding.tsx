
import React, { useState } from 'react';
import { OnboardingStep } from '../types';

interface OnboardingProps {
  onComplete: () => void;
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to SIGN SPEAK AI",
    description: "An AI-powered bridge between sign language and spoken words. Designed for everyone to communicate freely.",
    icon: "👋"
  },
  {
    title: "Deaf Mode",
    description: "Converts spoken voice into visual sign language using AI-generated images for short words and animations for longer sentences.",
    icon: "👂"
  },
  {
    title: "Mute Mode",
    description: "Captures your hand gestures via camera and translates them into clear spoken voice using high-quality TTS.",
    icon: "✋"
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);

  const next = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-lg mx-auto">
      <div className="text-6xl mb-8 animate-bounce">{steps[activeStep].icon}</div>
      <h2 className="text-3xl font-bold text-slate-800 mb-4">{steps[activeStep].title}</h2>
      <p className="text-slate-600 mb-12 leading-relaxed">{steps[activeStep].description}</p>
      
      <div className="flex items-center gap-2 mb-10">
        {steps.map((_, i) => (
          <div 
            key={i} 
            className={`h-2 rounded-full transition-all duration-300 ${i === activeStep ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`}
          />
        ))}
      </div>

      <div className="flex w-full gap-4">
        <button 
          onClick={onComplete}
          className="flex-1 py-3 px-6 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors"
        >
          Skip
        </button>
        <button 
          onClick={next}
          className="flex-1 py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          {activeStep === steps.length - 1 ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
