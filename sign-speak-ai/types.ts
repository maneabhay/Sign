
export enum AppMode {
  IDLE = 'IDLE',
  ONBOARDING = 'ONBOARDING',
  SELECTOR = 'SELECTOR',
  DEAF = 'DEAF',
  MUTE = 'MUTE',
  LEARNING = 'LEARNING',
  AUTH = 'AUTH',
  VAULT = 'VAULT'
}

export enum Language {
  ENGLISH = 'en-US',
  ENGLISH_UK = 'en-GB',
  HINDI = 'hi-IN',
  MARATHI = 'mr-IN'
}

export const LanguageNames = {
  [Language.ENGLISH]: 'English (US)',
  [Language.ENGLISH_UK]: 'English (UK)',
  [Language.HINDI]: 'हिंदी (Hindi)',
  [Language.MARATHI]: 'मराठी (Marathi)'
};

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface CustomSign {
  id: string;
  label: string;
  imageUrl: string;
  timestamp: number;
}

export interface HistoryLog {
  id: string;
  timestamp: number;
  mode: AppMode;
  input: string;
  output: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  description: string;
  targetGesture: string;
}
