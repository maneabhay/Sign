
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  onSkip: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onSkip }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!isLogin && !name)) return;
    
    onLogin({
      id: crypto.randomUUID(),
      name: name || email.split('@')[0],
      email: email
    });
  };

  return (
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔐</span>
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-slate-400 font-medium mb-8">
          {isLogin ? 'Login to access your custom sign library' : 'Start your inclusive communication journey'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Your Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-600 font-bold transition-all"
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-600 font-bold transition-all"
          />
          
          <button 
            type="submit"
            className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform active:scale-95"
          >
            {isLogin ? 'Login Now' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-4">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
          
          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-slate-100 flex-1"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase">OR</span>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>

          <button 
            onClick={onSkip} 
            className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
