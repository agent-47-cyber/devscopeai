import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config.js';
import { X, ArrowRight, Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react';
// We don't need AuthModal.css anymore since we are using Tailwind

export default function AuthModal({ onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? `${API_BASE_URL}/api/auth/login` : `${API_BASE_URL}/api/auth/register`;
    const payload = isLogin 
      ? { email, password } 
      : { username, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('devscope_token', data.token);
        localStorage.setItem('devscope_user', JSON.stringify(data.user));
        
        // Success animation state could go here before closing
        setTimeout(() => {
          onAuthSuccess(data.user, data.token);
          handleClose();
        }, 500);
      } else {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Connection to auth server failed.');
      setLoading(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 transition-all duration-500 ease-in-out ${
        mounted ? 'bg-black/60 backdrop-blur-md opacity-100' : 'bg-transparent backdrop-blur-none opacity-0'
      }`}
      onClick={handleClose}
      style={{ isolation: 'isolate' }}
    >
      <div 
        className={`relative w-full max-w-md overflow-hidden bg-[#050505] border border-[#252525] rounded-2xl shadow-2xl transition-all duration-500 ease-out transform ${
          mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#FF7A1A] to-transparent opacity-30"></div>
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-[#c7c6c6] hover:text-white bg-[#111111] hover:bg-[#151515] rounded-md transition-colors border border-transparent hover:border-[#353535] z-10"
        >
          <X size={16} />
        </button>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-sm text-[#D0D0D0]">
              {isLogin ? 'Enter your credentials to access your intelligence dashboard.' : 'Start analyzing your developer presence today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#c7c6c6] tracking-wide uppercase">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-[#564334]" />
                  </div>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-[#252525] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A]/50 transition-all placeholder-[#464747]"
                    placeholder="johndoe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#c7c6c6] tracking-wide uppercase">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-[#564334]" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-[#252525] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A]/50 transition-all placeholder-[#464747]"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#c7c6c6] tracking-wide uppercase">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-[#564334]" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-[#252525] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A]/50 transition-all placeholder-[#464747]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 mt-4 bg-[#93000a]/10 border border-[#93000a]/30 rounded-lg flex items-start gap-2">
                <div className="text-[#ffb4ab] mt-0.5"><AlertCircle size={14} /></div>
                <p className="text-sm text-[#ffb4ab] leading-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 py-2.5 px-4 mt-6 bg-[#FF7A1A] hover:bg-[#FF7A1A]/90 text-black font-semibold rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              {loading ? (
                <Loader2 size={18} className="animate-spin relative z-10" />
              ) : (
                <span className="relative z-10 flex items-center gap-2">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center relative z-10">
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-[#D0D0D0] hover:text-[#FF7A1A] transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
