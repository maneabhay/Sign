
import React, { useState, useEffect } from 'react';
import { AppMode, HistoryLog, Language, LanguageNames, User } from './types';
import Onboarding from './components/Onboarding';
import ModeSelector from './components/ModeSelector';
import DeafMode from './components/DeafMode';
import MuteMode from './components/MuteMode';
import LearningMode from './components/LearningMode';
import Auth from './components/Auth';
import SignVault from './components/SignVault';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.ONBOARDING);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedLogs = localStorage.getItem('sign_speak_logs');
    const storedUser = localStorage.getItem('sign_speak_user');
    if (storedLogs) setLogs(JSON.parse(storedLogs));
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setMode(AppMode.SELECTOR);
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('sign_speak_user', JSON.stringify(userData));
    setMode(AppMode.SELECTOR);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sign_speak_user');
    setMode(AppMode.SELECTOR);
  };

  const addLog = (log: Omit<HistoryLog, 'id' | 'timestamp'>) => {
    const newLog: HistoryLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    setLogs(updatedLogs);
    localStorage.setItem('sign_speak_logs', JSON.stringify(updatedLogs));
  };

  const renderContent = () => {
    switch (mode) {
      case AppMode.ONBOARDING:
        return <Onboarding onComplete={() => setMode(user ? AppMode.SELECTOR : AppMode.AUTH)} />;
      case AppMode.AUTH:
        return <Auth onLogin={handleLogin} onSkip={() => setMode(AppMode.SELECTOR)} />;
      case AppMode.SELECTOR:
        return <ModeSelector onSelect={setMode} user={user} />;
      case AppMode.DEAF:
        return <DeafMode onBack={() => setMode(AppMode.SELECTOR)} onLog={addLog} language={language} />;
      case AppMode.MUTE:
        return <MuteMode onBack={() => setMode(AppMode.SELECTOR)} onLog={addLog} language={language} />;
      case AppMode.LEARNING:
        return <LearningMode onBack={() => setMode(AppMode.SELECTOR)} language={language} />;
      case AppMode.VAULT:
        return <SignVault onBack={() => setMode(AppMode.SELECTOR)} user={user} />;
      default:
        return <ModeSelector onSelect={setMode} user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-50 glass border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMode(AppMode.SELECTOR)}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              S
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 hidden sm:block">
              SIGN SPEAK AI
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            >
              {Object.entries(LanguageNames).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>

            {user ? (
              <div className="flex items-center gap-3 bg-slate-100 p-1 pr-3 rounded-full border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <button onClick={handleLogout} className="text-[10px] font-black uppercase text-slate-500 hover:text-rose-500 transition-colors">Logout</button>
              </div>
            ) : (
              mode !== AppMode.AUTH && (
                <button 
                  onClick={() => setMode(AppMode.AUTH)}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-md hover:bg-indigo-700 transition-all"
                >
                  Login
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        {renderContent()}
      </main>

      <footer className="py-8 text-center text-slate-400 text-xs uppercase tracking-widest">
        &copy; {new Date().getFullYear()} SIGN SPEAK AI • Bridging worlds with Gemini
      </footer>
    </div>
  );
};

export default App;
