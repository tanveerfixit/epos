import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Smartphone, Eye, EyeOff, Loader, Shield, Lock } from 'lucide-react';

interface Props {
  onGoSignup: () => void;
  onForgotPassword: () => void;
  onAdminLogin: () => void;
}

export default function LoginPage({ onGoSignup, onForgotPassword, onAdminLogin }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-sans">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white shadow-sm rounded-md mb-6 border border-slate-200 ring-4 ring-slate-50 transition-transform hover:scale-105 duration-300">
            <Smartphone size={32} className="text-slate-950" />
          </div>
          <h1 className="text-3xl font-bold text-slate-950 tracking-tight">EPOS NODE CONNECT</h1>
          <p className="text-slate-500 font-semibold mt-2 text-xs uppercase tracking-widest">Protocol Version 4.1.0</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-md p-10 shadow-sm border border-slate-200">
          <div className="mb-8 border-l-4 border-blue-600 pl-4">
            <h2 className="text-xl font-bold text-slate-950 uppercase tracking-tight">Authorized Access Only</h2>
            <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Please enter secondary credentials</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-sm p-4 mb-6 text-xs font-bold flex items-center gap-3 animate-shake">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full scale-125" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Universal Identifier (Email)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="name@company.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-sm px-4 py-3.5 text-slate-950 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security Key (Password)</label>
                <button 
                  type="button" 
                  onClick={onForgotPassword} 
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase"
                >
                  Reset Route
                </button>
              </div>
              <div className="relative group">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-sm px-4 py-3.5 pr-12 text-slate-950 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-200"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-950 hover:bg-black disabled:bg-slate-300 text-white font-bold py-4 rounded-sm shadow-md transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <>
                  <span className="text-xs uppercase tracking-widest font-bold">Initiate Connection</span>
                  <Lock size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              No registered node?{' '}
              <button 
                onClick={onGoSignup} 
                className="text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-2 transition-all"
              >
                Enroll Staff
              </button>
            </p>
          </div>
        </div>

        {/* Admin Login / Control Panel Entry */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="h-px w-12 bg-slate-200" />
          <button 
            onClick={onAdminLogin}
            title="Developer Control Panel"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 group"
          >
            <div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center group-hover:bg-blue-600/10 transition-colors">
              <Shield size={16} className="group-hover:text-blue-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Developer Panel Access</span>
          </button>
        </div>
      </div>
    </div>
  );
}
