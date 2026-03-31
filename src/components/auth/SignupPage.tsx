import { useState, useEffect } from 'react';
import { Smartphone, Eye, EyeOff, Loader, CheckCircle, ArrowLeft, Building2, UserPlus, Search } from 'lucide-react';

interface Props { onGoLogin: () => void; }

type SignupMode = 'staff-join' | 'business-register';

export default function SignupPage({ onGoLogin }: Props) {
  const [mode, setMode] = useState<SignupMode>('staff-join');
  const [branches, setBranches] = useState<any[]>([]);
  const [businessEmail, setBusinessEmail] = useState('');
  const [searchingBranches, setSearchingBranches] = useState(false);
  const [branchesError, setBranchesError] = useState('');
  
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirm: '', 
    branch_id: '',
    business_name: '',
    branch_name: '' 
  });
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const lookupBranches = async () => {
    if (!businessEmail) return;
    setSearchingBranches(true);
    setBranchesError('');
    try {
      const res = await fetch(`/api/auth/branches-lookup?email=${encodeURIComponent(businessEmail)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Business not found');
      setBranches(data);
    } catch (err: any) {
      setBranchesError(err.message);
      setBranches([]);
    } finally {
      setSearchingBranches(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode: mode === 'business-register' ? 'business_register' : 'staff_join',
          name: form.name, 
          email: form.email, 
          password: form.password, 
          branch_id: mode === 'staff-join' ? Number(form.branch_id) : undefined,
          business_name: mode === 'business-register' ? form.business_name : undefined,
          branch_name: mode === 'business-register' ? form.branch_name : undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-[2.5rem] p-12 shadow-soft border border-slate-100">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">
              {mode === 'business-register' ? 'Registration Complete!' : 'Request Sent!'}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              {mode === 'business-register' 
                ? 'Your business has been registered successfully. You can now sign in as the administrator.'
                : 'Your account is pending admin approval. We\'ll notify you via email as soon as an admin reviews your request.'}
            </p>
            <button 
              onClick={onGoLogin} 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all"
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <button 
          onClick={onGoLogin} 
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Login</span>
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Get Started</h1>
          <p className="text-slate-500 font-medium mt-2">Choose how you want to join the platform</p>
        </div>

        {/* Mode Toggle */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center mb-8 shadow-inner">
          <button 
            onClick={() => setMode('staff-join')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${mode === 'staff-join' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserPlus size={14} />
            Join Branch
          </button>
          <button 
            onClick={() => setMode('business-register')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${mode === 'business-register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Building2 size={14} />
            New Business
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-slate-100">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 mb-6 text-sm font-medium flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Full Name</label>
                <input type="text" value={form.name} onChange={set('name')} required placeholder="John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Your Email</label>
                <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm" />
              </div>
            </div>

            {mode === 'business-register' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Business Name</label>
                  <input type="text" value={form.business_name} onChange={set('business_name')} required placeholder="e.g. Phone Lab, iCover"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">First Branch Name</label>
                  <input type="text" value={form.branch_name} onChange={set('branch_name')} required placeholder="e.g. Manchester Central"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm" />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Find Business</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={businessEmail} 
                      onChange={(e) => setBusinessEmail(e.target.value)} 
                      placeholder="Admin email to find branches..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-12 py-3 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm" 
                    />
                    <button 
                      type="button"
                      onClick={lookupBranches}
                      disabled={searchingBranches}
                      className="absolute right-2 top-2 p-1.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all"
                    >
                      {searchingBranches ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
                    </button>
                  </div>
                  {branchesError && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 uppercase tracking-tight">{branchesError}</p>}
                </div>

                {branches.length > 0 && (
                  <div className="space-y-1.5 animate-in slide-in-from-top duration-300">
                    <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Select Branch</label>
                    <select value={form.branch_id} onChange={set('branch_id')} required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all appearance-none cursor-pointer text-sm font-medium">
                      <option value="">Select your branch...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Password</label>
                <input type="password" value={form.password} onChange={set('password')} required placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Confirm</label>
                <input type="password" value={form.confirm} onChange={set('confirm')} required placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-slate-200"
            >
              {loading ? <Loader size={20} className="animate-spin" /> : (mode === 'business-register' ? 'Create My Business' : 'Request Access')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
