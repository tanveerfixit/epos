import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  GitBranch, 
  Mail, 
  CheckCircle, 
  XCircle, 
  UserX, 
  Edit2, 
  Trash2, 
  Plus, 
  Send, 
  Loader, 
  Save, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  RefreshCw, 
  Key, 
  Shield, 
  ToggleLeft, 
  ToggleRight,
  LogOut,
  ChevronRight,
  UserPlus,
  Building,
  Sun,
  Moon
} from 'lucide-react';

type Tab = 'users' | 'branches' | 'smtp' | 'access' | 'businesses';

const statusColors: Record<string, string> = {
  approved: 'bg-[#71C02B]/10 text-[#71C02B] border-[#71C02B]/20',
  pending: 'bg-[#FFC100]/10 text-[#FFC100] border-[#FFC100]/20',
  rejected: 'bg-[#FF4747]/10 text-[#FF4747] border-[#FF4747]/20',
  inactive: 'bg-slate-800/80 text-slate-400 border-white/10',
};

export default function AdminPortal({ onClose }: { onClose: () => void }) {
  const { token, currentUser } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [theme, setTheme] = useState<'dark' | 'grey'>('dark');
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [smtp, setSmtp] = useState<any>({ host: 'smtp.hostinger.com', port: 465, secure: true, user: '', pass: '', from_name: 'Phone Lab EPOS', from_email: '' });
  const [showPass, setShowPass] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState('');
  const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' });
  const [editUser, setEditUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [accessSettings, setAccessSettings] = useState({ allow_signup: true, allow_signin: true });
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessMsg, setAccessMsg] = useState('');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [editBusiness, setEditBusiness] = useState<any>(null);

  const loadUsers = () => fetch('/api/admin/users', { headers }).then(r => r.json()).then(d => Array.isArray(d) ? setUsers(d) : null);
  const loadBranches = () => fetch('/api/admin/branches', { headers }).then(r => r.json()).then(d => Array.isArray(d) ? setBranches(d) : null);
  const loadSmtp = () => fetch('/api/admin/smtp', { headers }).then(r => r.json()).then(setSmtp);
  const loadAccess = () => fetch('/api/settings', { headers }).then(r => r.json()).then(s => {
    if (s) setAccessSettings({ allow_signup: s.allow_signup !== 0, allow_signin: s.allow_signin !== 0 });
  });
  const loadBusinesses = () => {
    if (currentUser?.role === 'developer') {
      fetch('/api/admin/system/businesses', { headers })
        .then(r => r.json())
        .then(d => Array.isArray(d) ? setBusinesses(d) : null);
    }
  };

  useEffect(() => { loadUsers(); loadBranches(); loadSmtp(); loadAccess(); loadBusinesses(); }, []);

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const pendingBusinessCount = businesses.filter(b => b.status === 'inactive' || b.status === 'pending').length;

  const showMsg = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };
  const showSmtpMsg = (msg: string) => { setSmtpMsg(msg); setTimeout(() => setSmtpMsg(''), 4000); };
  const showAccessMsg = (msg: string) => { setAccessMsg(msg); setTimeout(() => setAccessMsg(''), 4000); };

  const updateStatus = async (userId: number, status: string) => {
    await fetch(`/api/admin/users/${userId}/status`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    loadUsers();
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Remove this user permanently?')) return;
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', headers });
    loadUsers();
  };

  const saveUser = async () => {
    if (!editUser) return;
    setLoading(true);
    await fetch(`/api/admin/users/${editUser.id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ name: editUser.name, branch_id: editUser.branch_id, role: editUser.role, password: editUser.newPassword || undefined }),
    });
    setEditUser(null); setLoading(false); loadUsers();
  };

  const resetUserPassword = async (userId: number, userName: string) => {
    if (!confirm(`Reset password for ${userName} and send it by email?`)) return;
    setLoading(true);
    const r = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST', headers });
    const data = await r.json();
    showMsg(r.ok ? `✓ ${data.message}` : `✗ ${data.error}`);
    setLoading(false);
  };

  const resendUserPassword = async (userId: number, userName: string) => {
    if (!confirm(`Resend last generated password to ${userName}?`)) return;
    setLoading(true);
    const r = await fetch(`/api/admin/users/${userId}/resend-password`, { method: 'POST', headers });
    const data = await r.json();
    showMsg(r.ok ? `✓ ${data.message}` : `✗ ${data.error}`);
    setLoading(false);
  };

  const createBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/branches', { method: 'POST', headers, body: JSON.stringify(newBranch) });
    setNewBranch({ name: '', address: '', phone: '' });
    loadBranches();
  };

  const saveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpLoading(true); setSmtpMsg('');
    try {
      const res = await fetch('/api/admin/smtp', { method: 'PUT', headers, body: JSON.stringify({ ...smtp, secure: smtp.secure ? 1 : 0 }) });
      showSmtpMsg(res.ok ? '✓ SMTP settings saved' : '✗ Failed to save');
    } finally { setSmtpLoading(false); }
  };

  const testSmtp = async () => {
    setSmtpLoading(true); setSmtpMsg('');
    try {
      const res = await fetch('/api/admin/smtp/test', { method: 'POST', headers });
      const data = await res.json();
      showSmtpMsg(res.ok ? `✓ ${data.message}` : `✗ ${data.error}`);
    } finally { setSmtpLoading(false); }
  };

  const saveAccess = async () => {
    setAccessLoading(true); setAccessMsg('');
    try {
      const res = await fetch('/api/settings/auth', { method: 'POST', headers, body: JSON.stringify(accessSettings) });
      showAccessMsg(res.ok ? '✓ Access settings saved' : '✗ Failed to save');
    } finally { setAccessLoading(false); }
  };

  const updateBusinessStatus = async (businessId: number, status: string) => {
    await fetch(`/api/admin/system/businesses/${businessId}/status`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    loadBusinesses();
  };

  const saveBusiness = async () => {
    if (!editBusiness) return;
    setLoading(true);
    await fetch(`/api/admin/system/businesses/${editBusiness.id}`, {
      method: 'PUT', headers,
      body: JSON.stringify(editBusiness),
    });
    setEditBusiness(null); setLoading(false); loadBusinesses();
  };

  return (
    <div className={`fixed inset-0 z-[60] flex flex-col font-sans overflow-hidden animate-in fade-in zoom-in duration-300 selection:bg-blue-500/30 ${theme === 'dark' ? 'bg-slate-950 text-slate-300' : 'bg-[#e5e7eb] text-slate-700'}`}>
      {theme === 'dark' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,58,138,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(88,28,135,0.15),transparent_40%)] pointer-events-none" />}
      
      {/* Upper Navigation / Status Bar */}
      <header className={`backdrop-blur-md border-b h-16 shrink-0 flex items-center justify-between px-8 z-10 ${theme === 'dark' ? 'bg-slate-900/50 border-white/5' : 'bg-white shadow-sm border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center border border-white/10">
            <Shield size={20} className="text-white drop-shadow-md" />
          </div>
          <div>
            <h1 className={`text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r tracking-tight leading-none ${theme === 'dark' ? 'from-white to-slate-400' : 'from-slate-900 to-slate-600'}`}>
              {currentUser?.name === 'Developer Panel' ? 'Developer Command Center' : 'System Control Node'}
            </h1>
            <p className="text-[10px] font-bold text-blue-400/80 mt-1 uppercase tracking-[0.2em]">Administrative Interface</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {actionMsg && (
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold animate-in slide-in-from-top-2 flex items-center gap-2 ${
              actionMsg.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${actionMsg.startsWith('✓') ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {actionMsg}
            </div>
          )}

          <div className={`h-8 w-px backdrop-blur-md/5 ${theme === 'dark' ? 'bg-slate-900/60' : 'bg-slate-300'}`} />
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{currentUser?.name}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{currentUser?.role}</div>
            </div>
            <button 
              onClick={() => setTheme(t => t === 'dark' ? 'grey' : 'dark')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group border border-transparent mr-2 ${theme === 'dark' ? 'hover:bg-slate-900/60 hover:border-white/10' : 'hover:bg-slate-100 hover:border-slate-300'}`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} className="text-slate-400 group-hover:text-amber-400" /> : <Moon size={20} className="text-slate-500 group-hover:text-indigo-600" />}
            </button>
            <button 
              onClick={onClose}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group border border-transparent ${theme === 'dark' ? 'hover:bg-slate-900/60 hover:border-white/10' : 'hover:bg-slate-100 hover:border-slate-300'}`}
              title="Return to System"
            >
              <LogOut size={20} className="text-slate-400 group-hover:text-rose-400 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden z-10">
        {/* Sidebar */}
        <aside className={`backdrop-blur-xl border-r p-6 flex flex-col gap-1.5 shrink-0 w-72 ${theme === 'dark' ? 'bg-slate-900/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-4 mb-4 mt-2">Main Navigation</div>
          {[
            { id: 'users', label: 'User Access', icon: Users, badge: pendingCount, desc: 'Manage staff and permissions' },
            { id: 'branches', label: 'Branch Network', icon: GitBranch, badge: 0, desc: 'Configure physical nodes' },
            { id: 'smtp', label: 'Email Bridge', icon: Mail, badge: 0, desc: 'Secure SMTP transmission' },
            { id: 'access', label: 'System Policy', icon: Shield, badge: 0, desc: 'Global security rules' },
            ...(currentUser?.role === 'developer'
              ? [{ id: 'businesses', label: 'Business Hub', icon: Building, badge: pendingBusinessCount, desc: 'Manage active businesses' }] : []),
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id as Tab)}
              className={`flex items-center gap-4 p-3.5 rounded-xl transition-all duration-200 group text-left relative overflow-hidden ${
                tab === t.id 
                  ? (theme === 'dark' ? 'bg-blue-600/10 border-blue-500/20 text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] border' : 'bg-white border-blue-200 text-blue-700 shadow-sm border')
                  : (theme === 'dark' ? 'hover:bg-slate-900/60 backdrop-blur-md/5 text-slate-400 border border-transparent hover:border-white/5' : 'hover:bg-white text-slate-600 border border-transparent hover:border-slate-300')
              }`}
            >
              {tab === t.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                tab === t.id ? (theme === 'dark' ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-blue-50 border border-blue-200 text-blue-600') : (theme === 'dark' ? 'bg-slate-800 border border-white/5 text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-700' : 'bg-slate-100 border border-slate-200 text-slate-500 group-hover:text-slate-700 group-hover:bg-white')
              }`}>
                <t.icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-[13px] flex items-center justify-between tracking-wide">
                  {t.label}
                  {t.badge > 0 && (
                    <span className="bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(225,29,72,0.3)]">
                      {t.badge} PENDING
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-semibold mt-0.5 leading-tight text-slate-500 line-clamp-1">
                  {t.desc}
                </div>
              </div>
              <ChevronRight size={14} className={`opacity-0 group-hover:opacity-40 transition-all transform group-hover:translate-x-1 ${tab === t.id ? 'hidden' : ''}`} />
            </button>
          ))}

          <div className="mt-auto p-4 bg-slate-900/50 rounded-xl border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">System Health</h4>
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold tracking-widest relative z-10">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              STATUS: NOMINAL
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-2">v2.1.4 • {new Date().toISOString().split('T')[0]}</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-transparent overflow-auto p-10 relative custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* USERS TAB */}
            {tab === 'users' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}`}>User Access Management</h2>
                    <p className={`font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-[#6C7383]'}`}>Control who has access to the web app and POS system</p>
                  </div>
                  {pendingCount > 0 && (
                    <div className="bg-[#FFC100]/10 text-[#FFC100] border-[#FFC100]/20 px-4 py-2 rounded-xl text-xs font-black border border-yellow-200">
                      {pendingCount} PENDING REQUESTS
                    </div>
                  )}
                </div>

                {editUser && (
                  <div className={`p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 ${theme === 'dark' ? 'bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md shadow-sm' : 'bg-[#FFFFFF] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] rounded-[15px]'}`}>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-slate-800/80 rounded-sm flex items-center justify-center border border-white/10">
                        <Edit2 size={20} className="text-white" />
                      </div>
                      <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}`}>Modify User: {editUser.name}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                        <input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md px-4 py-3 text-white font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assigned Branch</label>
                        <select value={editUser.branch_id} onChange={e => setEditUser({ ...editUser, branch_id: e.target.value })}
                          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md px-4 py-3 text-white font-semibold appearance-none cursor-pointer outline-none">
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">System Role</label>
                        <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md px-4 py-3 text-white font-semibold outline-none">
                          <option value="staff">Staff Member</option>
                          <option value="admin">Administrator</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Set New Password</label>
                        <input type="password" placeholder="Leave blank to keep current"
                          onChange={e => setEditUser({ ...editUser, newPassword: e.target.value })}
                          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md px-4 py-3 text-white font-semibold outline-none" />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={saveUser} disabled={loading} className="bg-[#F5A623] hover:bg-[#e0961b] text-white shadow-[#F5A623]/20 font-bold px-6 py-3 rounded-md transition shadow-md flex items-center gap-2">
                        {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                      </button>
                      <button onClick={() => setEditUser(null)} className="bg-[#248AFD] hover:bg-[#1f7ae6] text-white border-transparent font-bold px-6 py-3 rounded-md transition">Cancel</button>
                    </div>
                  </div>
                )}

                <div className={`overflow-hidden divide-y ${theme === 'dark' ? 'bg-slate-900/60 backdrop-blur-md rounded-md shadow-sm border border-white/10 divide-slate-100/10' : 'bg-[#FFFFFF] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] rounded-[15px] divide-slate-100'}`}>
                  {users.map(u => (
                    <div key={u.id} className={`p-5 flex items-center gap-6 group transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/30/80' : 'hover:bg-slate-50'}`}>
                      <div className="w-12 h-12 bg-slate-800/80 rounded-sm flex items-center justify-center border border-white/10 shrink-0">
                        <div className="text-lg font-bold text-slate-400">{u.name.charAt(0)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className={`text-base font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{u.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm border border-[#248AFD]/20">{u.email}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border uppercase tracking-wider ${statusColors[u.status] || statusColors.inactive}`}>{u.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 font-semibold text-[10px] mt-1 uppercase tracking-wider">
                        <span className="text-slate-300">{u.branch_name}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-blue-500">{u.role}</span>
                      </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.status === 'pending' && <>
                          <button onClick={() => updateStatus(u.id, 'approved')} title="Approve"
                            className="p-2 bg-[#71C02B]/10 text-[#71C02B] rounded-md hover:bg-[#71C02B] hover:text-white transition-all border border-[#71C02B]/20"><CheckCircle size={16} /></button>
                          <button onClick={() => updateStatus(u.id, 'rejected')} title="Reject"
                            className="p-2 bg-[#FF4747]/10 text-[#FF4747] rounded-md hover:bg-[#FF4747] hover:text-white transition-all border border-[#FF4747]/20"><XCircle size={16} /></button>
                        </>}
                        {u.status === 'approved' && (
                          <button onClick={() => updateStatus(u.id, 'inactive')} title="Deactivate"
                            className="p-2 bg-slate-800/80 text-slate-400 rounded-md hover:bg-slate-600 hover:text-white transition-all border border-white/10"><UserX size={16} /></button>
                        )}
                        {u.status === 'inactive' && (
                          <button onClick={() => updateStatus(u.id, 'approved')} title="Reactivate"
                            className="p-2 bg-[#71C02B]/10 text-[#71C02B] rounded-md hover:bg-[#71C02B] hover:text-white transition-all border border-[#71C02B]/20"><CheckCircle size={16} /></button>
                        )}

                        <div className="w-px h-8 bg-slate-800/80 mx-1" />

                        <button onClick={() => resetUserPassword(u.id, u.name)} title="Reset & Email Password"
                          className="p-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-600 hover:text-white transition-all border border-purple-100"><Key size={16} /></button>
                        
                        <button onClick={() => resendUserPassword(u.id, u.name)} title="Resend Credentials"
                          className="p-2 bg-cyan-50 text-cyan-600 rounded-md hover:bg-cyan-600 hover:text-white transition-all border border-cyan-100"><RefreshCw size={16} /></button>
                        
                        <button onClick={() => setEditUser({ ...u, newPassword: '' })} title="Edit Profile"
                          className="p-2 bg-[#248AFD]/10 text-[#248AFD] rounded-md hover:bg-[#248AFD] hover:text-white transition-all border border-[#248AFD]/20"><Edit2 size={16} /></button>
                        
                        <button onClick={() => deleteUser(u.id)} title="Purge Account"
                          className="p-2 bg-[#FF4747]/10 text-[#FF4747] rounded-md hover:bg-[#FF4747] hover:text-white transition-all border border-[#FF4747]/20"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BRANCHES TAB */}
            {tab === 'branches' && (
              <div className="space-y-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}`}>Branch Network</h2>
                    <p className={`font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-[#6C7383]'}`}>Node distribution and location management</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {/* New Branch Form */}
                  <form onSubmit={createBranch} className={`flex flex-col items-center text-center justify-center group overflow-hidden relative ${theme === 'dark' ? 'bg-slate-900/60 backdrop-blur-md rounded-md p-8 shadow-sm border border-white/10' : 'bg-[#FFFFFF] p-8 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] rounded-[15px]'}`}>
                    <div className="absolute inset-0 bg-slate-800 hover:bg-slate-700 opacity-0 group-hover:opacity-[0.01] transition-opacity" />
                    <div className="w-12 h-12 bg-slate-800/30 border border-white/10 rounded-sm flex items-center justify-center mb-6 text-slate-400 transition-transform group-hover:scale-105">
                      <Plus size={24} />
                    </div>
                    <h3 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}`}>Initialize Node</h3>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-[#6C7383]'}`}>Create new network entry</p>
                    
                    <div className="w-full space-y-3">
                      <input value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} required 
                        placeholder="Branch Name (e.g. London City)"
                        className={`w-full rounded-sm px-4 py-2.5 text-xs font-semibold focus:outline-none transition-all ${theme === 'dark' ? 'bg-slate-800/30 border border-white/10 text-white focus:bg-slate-900/60' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white'}`} />
                      <input value={newBranch.address} onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                        placeholder="Full Address"
                        className={`w-full rounded-sm px-4 py-2.5 text-xs font-semibold focus:outline-none transition-all ${theme === 'dark' ? 'bg-slate-800/30 border border-white/10 text-white focus:bg-slate-900/60' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white'}`} />
                      <input value={newBranch.phone} onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })}
                        placeholder="Contact Phone"
                        className={`w-full rounded-sm px-4 py-2.5 text-xs font-semibold focus:outline-none transition-all ${theme === 'dark' ? 'bg-slate-800/30 border border-white/10 text-white focus:bg-slate-900/60' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white'}`} />
                      
                      <button type="submit" className="w-full bg-[#F5A623] hover:bg-[#e0961b] text-white shadow-[#F5A623]/20 font-bold py-3 rounded-sm text-xs flex items-center justify-center gap-2 transition hover:bg-slate-900 shadow-sm mt-2">
                         Deploy Entry
                      </button>
                    </div>
                  </form>

                  {/* Existing Branches */}
                  {branches.map(b => (
                    <div key={b.id} className={`transition-all duration-300 group ${theme === 'dark' ? 'bg-slate-900/60 backdrop-blur-md rounded-md p-8 shadow-sm border border-white/10 hover:border-blue-500/30' : 'bg-[#FFFFFF] p-8 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] rounded-[15px]'}`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 bg-slate-800/30 text-white rounded-sm flex items-center justify-center font-bold border border-white/10 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-[#248AFD]/20 transition-colors">
                          {b.name.charAt(0)}
                        </div>
                        <div className={`text-[10px] font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-[#6C7383]'}`}>NODE ID: {b.id}</div>
                      </div>
                      <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}`}>{b.name}</h3>
                      <div className={`space-y-3 pt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-2 text-slate-500 font-semibold text-[10px] uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          Network Active
                        </div>
                        <p className={`text-xs leading-relaxed font-medium line-clamp-2 ${theme === 'dark' ? 'text-slate-500' : 'text-[#6C7383]'}`}>{b.address || 'No address specified'}</p>
                        <p className={`text-[11px] font-bold tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{b.phone || '00-000-000'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SMTP TAB */}
            {tab === 'smtp' && (
              <div className="max-w-2xl">
                  <div className="mb-10">
                    <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}`}>Email Infrastructure</h2>
                    <p className={`font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-[#6C7383]'}`}>SMTP gateway configuration for system transmissions</p>
                  </div>

                  <div className={`rounded-[15px] p-8 mb-8 flex gap-5 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border border-white/5' : 'bg-[#FFFFFF] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]'}`}>
                    <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-sm flex items-center justify-center shrink-0 border border-blue-500/20">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}`}>Deployment Recommendation</h4>
                      <p className={`text-xs mt-1 font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-[#6C7383]'}`}>
                        Utilize SSL-enabled gateways for secure credential relay. Hostinger SMTP is pre-verified for this node cluster.
                      </p>
                    </div>
                  </div>

                <form onSubmit={saveSmtp} className={`space-y-8 ${theme === 'dark' ? 'bg-slate-900/60 backdrop-blur-md rounded-md p-10 shadow-sm border border-white/10' : 'bg-[#FFFFFF] p-10 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] rounded-[15px]'}`}>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">SMTP Gateway Host</label>
                      <input value={smtp.host} onChange={e => setSmtp({ ...smtp, host: e.target.value })}
                        className={`w-full rounded-sm px-4 py-3 font-semibold transition-all outline-none ${theme === 'dark' ? 'bg-slate-800/30 border border-white/10 text-white focus:bg-slate-900/60 focus:border-blue-500' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#248AFD]'}`} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Secure Port</label>
                      <input type="number" value={smtp.port} onChange={e => setSmtp({ ...smtp, port: Number(e.target.value) })}
                        className={`w-full rounded-sm px-4 py-3 font-semibold transition-all outline-none ${theme === 'dark' ? 'bg-slate-800/30 border border-white/10 text-white focus:bg-slate-900/60 focus:border-blue-500' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#248AFD]'}`} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-sm border border-white/10">
                    <button 
                      type="button"
                      onClick={() => setSmtp({ ...smtp, secure: !smtp.secure })}
                      className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-1 ${smtp.secure ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-slate-900/60 backdrop-blur-md rounded-full transition-transform ${smtp.secure ? 'translate-x-5' : ''}`} />
                    </button>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-tight">Enable SSL Security Overlay</label>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Terminal Authentication (User)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="email" value={smtp.user} onChange={e => setSmtp({ ...smtp, user: e.target.value })}
                          className="w-full bg-slate-800/30 border border-white/10 rounded-sm pl-12 pr-4 py-3 text-white font-semibold focus:bg-slate-900/60 backdrop-blur-md focus:border-blue-500 transition-all outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Terminal Security Key (Password)</label>
                      <div className="relative">
                        <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type={showPass ? 'text' : 'password'} value={smtp.pass} onChange={e => setSmtp({ ...smtp, pass: e.target.value })}
                          className="w-full bg-slate-800/30 border border-white/10 rounded-sm pl-12 pr-12 py-3 text-white font-semibold focus:bg-slate-900/60 backdrop-blur-md focus:border-blue-500 transition-all outline-none" />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Display Descriptor</label>
                      <input value={smtp.from_name} onChange={e => setSmtp({ ...smtp, from_name: e.target.value })}
                        className="w-full bg-slate-800/30 border border-white/10 rounded-sm px-4 py-3 text-white font-semibold focus:bg-slate-900/60 backdrop-blur-md transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Origin Address</label>
                      <input type="email" value={smtp.from_email} onChange={e => setSmtp({ ...smtp, from_email: e.target.value })}
                        className="w-full bg-slate-800/30 border border-white/10 rounded-sm px-4 py-3 text-white font-semibold focus:bg-slate-900/60 backdrop-blur-md transition-all outline-none" />
                    </div>
                  </div>

                  {smtpMsg && (
                    <div className={`p-4 rounded-2xl text-sm font-black flex items-center gap-3 animate-in fade-in zoom-in ${
                      smtpMsg.startsWith('✓') ? 'bg-green-50 text-green-600 border border-[#71C02B]/20' : 'bg-red-50 text-red-600 border border-[#FF4747]/20'
                    }`}>
                       <div className={`w-2 h-2 rounded-full ${smtpMsg.startsWith('✓') ? 'bg-green-500' : 'bg-red-500'}`} />
                       {smtpMsg}
                    </div>
                  )}

                  <div className="flex gap-3 pt-6">
                    <button type="submit" disabled={smtpLoading}
                      className="flex-1 bg-[#F5A623] hover:bg-[#e0961b] text-white shadow-[#F5A623]/20 font-bold py-4 rounded-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                      {smtpLoading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />} Save Gateway
                    </button>
                    <button type="button" onClick={testSmtp} disabled={smtpLoading}
                      className="bg-[#248AFD] hover:bg-[#1f7ae6] text-white border-transparent font-bold px-8 py-4 rounded-sm transition flex items-center justify-center gap-2 disabled:opacity-50 border border-white/10">
                      {smtpLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />} Test Route
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* BUSINESSES TAB */}
            {tab === 'businesses' && currentUser?.role === 'developer' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}`}>Developer Business Hub</h2>
                    <p className={`font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-[#6C7383]'}`}>Global control of registered businesses across the network</p>
                  </div>
                  {pendingBusinessCount > 0 && (
                    <div className="bg-[#FFC100]/10 text-[#FFC100] border-[#FFC100]/20 px-4 py-2 rounded-xl text-xs font-black border border-yellow-200">
                      {pendingBusinessCount} PENDING APPROVAL
                    </div>
                  )}
                </div>

                {editBusiness && (
                  <div className={`p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 ${theme === 'dark' ? 'bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md shadow-sm' : 'bg-[#FFFFFF] p-8 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] rounded-[15px]'}`}>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-slate-800/80 rounded-sm flex items-center justify-center border border-white/10">
                        <Building size={20} className="text-white" />
                      </div>
                      <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}`}>Edit Business: {editBusiness.name}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Business Name</label>
                        <input value={editBusiness.name || ''} onChange={e => setEditBusiness({ ...editBusiness, name: e.target.value })}
                          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md px-4 py-3 text-white font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                        <input type="email" value={editBusiness.email || ''} onChange={e => setEditBusiness({ ...editBusiness, email: e.target.value })}
                          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md px-4 py-3 text-white font-semibold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                        <input value={editBusiness.phone || ''} onChange={e => setEditBusiness({ ...editBusiness, phone: e.target.value })}
                          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md px-4 py-3 text-white font-semibold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Address</label>
                        <input value={editBusiness.address || ''} onChange={e => setEditBusiness({ ...editBusiness, address: e.target.value })}
                          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md px-4 py-3 text-white font-semibold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">City</label>
                        <input value={editBusiness.city || ''} onChange={e => setEditBusiness({ ...editBusiness, city: e.target.value })}
                          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md px-4 py-3 text-white font-semibold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">State / Region</label>
                        <input value={editBusiness.state || ''} onChange={e => setEditBusiness({ ...editBusiness, state: e.target.value })}
                          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md px-4 py-3 text-white font-semibold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Postal Code</label>
                        <input value={editBusiness.zip_code || ''} onChange={e => setEditBusiness({ ...editBusiness, zip_code: e.target.value })}
                          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md px-4 py-3 text-white font-semibold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Country</label>
                        <input value={editBusiness.country || ''} onChange={e => setEditBusiness({ ...editBusiness, country: e.target.value })}
                          className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-md px-4 py-3 text-white font-semibold outline-none" />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={saveBusiness} disabled={loading} className="bg-[#F5A623] hover:bg-[#e0961b] text-white shadow-[#F5A623]/20 font-bold px-6 py-3 rounded-md transition shadow-md flex items-center gap-2">
                        {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                      </button>
                      <button onClick={() => setEditBusiness(null)} className="bg-[#248AFD] hover:bg-[#1f7ae6] text-white border-transparent font-bold px-6 py-3 rounded-md transition">Cancel</button>
                    </div>
                  </div>
                )}

                <div className={`overflow-hidden divide-y ${theme === 'dark' ? 'bg-slate-900/60 backdrop-blur-md rounded-md shadow-sm border border-white/10 divide-slate-100/10' : 'bg-[#FFFFFF] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] rounded-[15px] divide-slate-100'}`}>
                  {businesses.map(b => (
                    <div key={b.id} className={`p-5 flex items-center gap-6 group transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/30/80' : 'hover:bg-slate-50'}`}>
                      <div className="w-12 h-12 bg-slate-800/80 rounded-sm flex items-center justify-center border border-white/10 shrink-0">
                        <div className="text-lg font-bold text-slate-400">{b.name.charAt(0)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className={`text-base font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{b.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm border border-[#248AFD]/20">{b.email}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border uppercase tracking-wider ${statusColors[b.status] || statusColors.inactive}`}>{b.status}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-semibold text-[10px] mt-1 uppercase tracking-wider">
                          <span className="text-slate-300">ID: {b.id}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="text-slate-500">{new Date(b.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(b.status === 'inactive' || b.status === 'pending') && (
                          <button onClick={() => updateBusinessStatus(b.id, 'active')} title="Approve Business"
                            className="p-2 bg-[#71C02B]/10 text-[#71C02B] rounded-md hover:bg-[#71C02B] hover:text-white transition-all border border-[#71C02B]/20"><CheckCircle size={16} /></button>
                        )}
                        {b.status === 'active' && (
                          <button onClick={() => updateBusinessStatus(b.id, 'inactive')} title="Deactivate Business"
                            className="p-2 bg-slate-800/80 text-slate-400 rounded-md hover:bg-slate-600 hover:text-white transition-all border border-white/10"><XCircle size={16} /></button>
                        )}

                        <div className="w-px h-8 bg-slate-800/80 mx-1" />

                        <button onClick={() => setEditBusiness(b)} title="Edit Details"
                          className="p-2 bg-[#248AFD]/10 text-[#248AFD] rounded-md hover:bg-[#248AFD] hover:text-white transition-all border border-[#248AFD]/20"><Edit2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACCESS CONTROL */}
            {tab === 'access' && (
              <div className="max-w-2xl space-y-10">
                <div className="mb-10">
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}`}>Security Policy Engine</h2>
                  <p className={`font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-[#6C7383]'}`}>Control global entry points and node accessibility</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Public Sign-Up */}
                  <div className={`flex items-center justify-between group ${theme === 'dark' ? 'bg-slate-900/60 backdrop-blur-md rounded-md p-8 shadow-sm border border-white/10' : 'bg-[#FFFFFF] p-8 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] rounded-[15px]'}`}>
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all border ${
                        accessSettings.allow_signup ? 'bg-blue-50 text-blue-600 border-[#248AFD]/20' : 'bg-slate-800/30 text-slate-400 border-white/10'
                      }`}>
                        <UserPlus size={24} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}`}>Staff Enrollment Node</h3>
                        <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-[#6C7383]'}`}>Allow new staff to initiate account requests</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAccessSettings(a => ({ ...a, allow_signup: !a.allow_signup }))}
                      className={`w-24 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
                        accessSettings.allow_signup 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {accessSettings.allow_signup ? 'Active' : 'Locked'}
                    </button>
                  </div>

                  {/* Staff Sign-In */}
                  <div className={`flex items-center justify-between group ${theme === 'dark' ? 'bg-slate-900/60 backdrop-blur-md rounded-md p-8 shadow-sm border border-white/10' : 'bg-[#FFFFFF] p-8 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] rounded-[15px]'}`}>
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all border ${
                        accessSettings.allow_signin ? 'bg-blue-50 text-blue-600 border-[#248AFD]/20' : 'bg-slate-800/30 text-slate-400 border-white/10'
                      }`}>
                        <Shield size={24} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}`}>Global Node Access</h3>
                        <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-[#6C7383]'}`}>Master kill-switch for all standard client connections</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAccessSettings(a => ({ ...a, allow_signin: !a.allow_signin }))}
                      className={`w-24 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
                        accessSettings.allow_signin 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {accessSettings.allow_signin ? 'Live' : 'offline'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center pt-8">
                  <button onClick={saveAccess} disabled={accessLoading}
                    className="w-full bg-[#F5A623] hover:bg-[#e0961b] text-white shadow-[#F5A623]/20 font-bold py-4 rounded-sm text-xs uppercase tracking-[0.2em] transition hover:bg-black shadow-md flex items-center justify-center gap-2">
                    {accessLoading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />} Commit Logic Updates
                  </button>
                  {accessMsg && (
                    <div className={`mt-6 text-sm font-black ${accessMsg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                      {accessMsg}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
