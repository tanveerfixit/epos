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
  UserPlus
} from 'lucide-react';

type Tab = 'users' | 'branches' | 'smtp' | 'access';

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AdminPortal({ onClose }: { onClose: () => void }) {
  const { token, currentUser } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

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

  const loadUsers = () => fetch('/api/admin/users', { headers }).then(r => r.json()).then(d => Array.isArray(d) ? setUsers(d) : null);
  const loadBranches = () => fetch('/api/admin/branches', { headers }).then(r => r.json()).then(d => Array.isArray(d) ? setBranches(d) : null);
  const loadSmtp = () => fetch('/api/admin/smtp', { headers }).then(r => r.json()).then(setSmtp);
  const loadAccess = () => fetch('/api/settings', { headers }).then(r => r.json()).then(s => {
    if (s) setAccessSettings({ allow_signup: s.allow_signup !== 0, allow_signin: s.allow_signin !== 0 });
  });

  useEffect(() => { loadUsers(); loadBranches(); loadSmtp(); loadAccess(); }, []);

  const pendingCount = users.filter(u => u.status === 'pending').length;

  const showMsg = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

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
      setSmtpMsg(res.ok ? '✓ SMTP settings saved' : '✗ Failed to save');
    } finally { setSmtpLoading(false); }
  };

  const testSmtp = async () => {
    setSmtpLoading(true); setSmtpMsg('');
    try {
      const res = await fetch('/api/admin/smtp/test', { method: 'POST', headers });
      const data = await res.json();
      setSmtpMsg(res.ok ? `✓ ${data.message}` : `✗ ${data.error}`);
    } finally { setSmtpLoading(false); }
  };

  const saveAccess = async () => {
    setAccessLoading(true); setAccessMsg('');
    try {
      const res = await fetch('/api/settings/auth', { method: 'POST', headers, body: JSON.stringify(accessSettings) });
      setAccessMsg(res.ok ? '✓ Access settings saved' : '✗ Failed to save');
    } finally { setAccessLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-[#f8fafc] z-[60] flex flex-col font-sans overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* Upper Navigation / Status Bar */}
      <header className="bg-white border-b border-slate-200 h-16 shrink-0 flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
              {currentUser?.business_name || 'Phone Lab'} Control
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">Management Interface</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {actionMsg && (
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold animate-in slide-in-from-top-2 flex items-center gap-2 ${
              actionMsg.startsWith('✓') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${actionMsg.startsWith('✓') ? 'bg-green-500' : 'bg-red-500'}`} />
              {actionMsg}
            </div>
          )}

          <div className="h-8 w-px bg-slate-200" />
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-black text-slate-900">{currentUser?.name}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentUser?.role}</div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors group"
              title="Return to EPOS"
            >
              <LogOut size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-2 shrink-0">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">Main Menu</div>
          
          {[
            { id: 'users', label: 'User Access', icon: Users, badge: pendingCount, desc: 'Manage staff and permissions' },
            { id: 'branches', label: 'Branch Network', icon: GitBranch, desc: 'Configure locations' },
            { id: 'smtp', label: 'Email Bridge', icon: Mail, desc: 'SMTP & Notifications' },
            { id: 'access', label: 'System Policy', icon: Shield, desc: 'Global security rules' },
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id as Tab)}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group text-left ${
                tab === t.id 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                tab === t.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-900 shadow-sm'
              }`}>
                <t.icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm flex items-center justify-between">
                  {t.label}
                  {t.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white">
                      {t.badge}
                    </span>
                  )}
                </div>
                <div className={`text-[10px] font-medium mt-0.5 leading-tight ${tab === t.id ? 'text-slate-400' : 'text-slate-400'}`}>
                  {t.desc}
                </div>
              </div>
              <ChevronRight size={14} className={`opacity-0 group-hover:opacity-40 transition-opacity ${tab === t.id ? 'hidden' : ''}`} />
            </button>
          ))}

          <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">System Health</h4>
            <div className="flex items-center gap-2 text-green-600 text-[10px] font-black">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              CONNECTED TO DB
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-slate-50 overflow-auto p-10">
          <div className="max-w-5xl mx-auto">
            
            {/* USERS TAB */}
            {tab === 'users' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">User Access Management</h2>
                    <p className="text-slate-500 font-medium">Control who has access to the web app and POS system</p>
                  </div>
                  {pendingCount > 0 && (
                    <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-xs font-black border border-yellow-200">
                      {pendingCount} PENDING REQUESTS
                    </div>
                  )}
                </div>

                {editUser && (
                  <div className="bg-white border-2 border-slate-900 rounded-[2rem] p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Edit2 size={20} className="text-slate-900" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">Modify User: {editUser.name}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                        <input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:bg-white transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Branch</label>
                        <select value={editUser.branch_id} onChange={e => setEditUser({ ...editUser, branch_id: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold appearance-none cursor-pointer">
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Role</label>
                        <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold">
                          <option value="staff">Staff Member</option>
                          <option value="admin">Administrator</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Set New Password</label>
                        <input type="password" placeholder="Leave blank to keep current"
                          onChange={e => setEditUser({ ...editUser, newPassword: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold" />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={saveUser} disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-4 rounded-2xl transition shadow-lg flex items-center gap-2">
                        {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />} Update Profile
                      </button>
                      <button onClick={() => setEditUser(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-black px-8 py-4 rounded-2xl transition">Cancel</button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-[2.5rem] p-2 shadow-soft border border-slate-100 divide-y divide-slate-50">
                  {users.map(u => (
                    <div key={u.id} className="p-6 flex items-center gap-6 group hover:bg-slate-50/50 transition-colors rounded-[1.5rem]">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shrink-0">
                        <div className="text-xl font-black text-slate-300">{u.name.charAt(0)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-slate-900 truncate">{u.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{u.email}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusColors[u.status] || statusColors.inactive}`}>{u.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] mt-1.5 uppercase tracking-widest">
                        <span className="text-slate-900">{u.branch_name}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[#3498db]">{u.role}</span>
                      </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.status === 'pending' && <>
                          <button onClick={() => updateStatus(u.id, 'approved')} title="Approve"
                            className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all ring-1 ring-green-100"><CheckCircle size={18} /></button>
                          <button onClick={() => updateStatus(u.id, 'rejected')} title="Reject"
                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all ring-1 ring-red-100"><XCircle size={18} /></button>
                        </>}
                        {u.status === 'approved' && (
                          <button onClick={() => updateStatus(u.id, 'inactive')} title="Deactivate"
                            className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all ring-1 ring-orange-100"><UserX size={18} /></button>
                        )}
                        {u.status === 'inactive' && (
                          <button onClick={() => updateStatus(u.id, 'approved')} title="Reactivate"
                            className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all ring-1 ring-green-100"><CheckCircle size={18} /></button>
                        )}

                        <div className="w-px h-8 bg-slate-100 mx-1" />

                        <button onClick={() => resetUserPassword(u.id, u.name)} title="Reset & Email Password"
                          className="p-2.5 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all ring-1 ring-purple-100"><Key size={18} /></button>
                        
                        <button onClick={() => resendUserPassword(u.id, u.name)} title="Resend Credentials"
                          className="p-2.5 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-600 hover:text-white transition-all ring-1 ring-teal-100"><RefreshCw size={18} /></button>
                        
                        <button onClick={() => setEditUser({ ...u, newPassword: '' })} title="Edit Profile"
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all ring-1 ring-blue-100"><Edit2 size={18} /></button>
                        
                        <button onClick={() => deleteUser(u.id)} title="Purge Account"
                          className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all ring-1 ring-red-100"><Trash2 size={18} /></button>
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
                    <h2 className="text-2xl font-black text-slate-900">Branch Network</h2>
                    <p className="text-slate-500 font-medium">Register and manage your business locations</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  {/* New Branch Form */}
                  <form onSubmit={createBranch} className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-slate-100 flex flex-col items-center text-center justify-center group overflow-hidden relative">
                    <div className="absolute inset-0 bg-slate-900 opacity-0 group-hover:opacity-[0.02] transition-opacity" />
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-400 transition-transform group-hover:scale-110">
                      <Plus size={32} />
                    </div>
                    <h3 className="font-black text-slate-900 mb-2">Initialize Branch</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">Click to Expand Form</p>
                    
                    <div className="w-full space-y-4">
                      <input value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} required 
                        placeholder="Branch Name (e.g. London City)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white transition-all" />
                      <input value={newBranch.address} onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                        placeholder="Full Address"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white transition-all" />
                      <input value={newBranch.phone} onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })}
                        placeholder="Contact Phone"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white transition-all" />
                      
                      <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-xl text-xs flex items-center justify-center gap-2 transition hover:bg-slate-800">
                         Create Network Entry
                      </button>
                    </div>
                  </form>

                  {/* Existing Branches */}
                  {branches.map(b => (
                    <div key={b.id} className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-slate-100 hover:shadow-xl transition-all duration-300">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                          {b.name.charAt(0)}
                        </div>
                        <div className="text-[10px] font-black text-slate-300">ID: {b.id}</div>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">{b.name}</h3>
                      <div className="space-y-3 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                          <CheckCircle size={14} className="text-green-500" />
                          Active Node
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">{b.address || 'No address specified'}</p>
                        <p className="text-xs text-slate-900 font-black tracking-widest">{b.phone || '00-000-000'}</p>
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
                  <h2 className="text-2xl font-black text-slate-900">Communication Infrastructure</h2>
                  <p className="text-slate-500 font-medium">Configure SMTP settings for automated system emails</p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-8 mb-8 flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-blue-900 font-black text-sm">Provider Recommendation</h4>
                    <p className="text-blue-700 text-xs mt-1 font-medium leading-relaxed">
                      We recommend using **Hostinger SMTP** (smtp.hostinger.com) on port **465** for maximum reliability. 
                      Ensure your from-email matches the username.
                    </p>
                  </div>
                </div>

                <form onSubmit={saveSmtp} className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-slate-100 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">SMTP Gateway</label>
                      <input value={smtp.host} onChange={e => setSmtp({ ...smtp, host: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:bg-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Traffic Port</label>
                      <input type="number" value={smtp.port} onChange={e => setSmtp({ ...smtp, port: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:bg-white transition-all" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <button 
                      type="button"
                      onClick={() => setSmtp({ ...smtp, secure: !smtp.secure })}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${smtp.secure ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${smtp.secure ? 'translate-x-6' : ''}`} />
                    </button>
                    <label className="text-sm font-black text-slate-700 uppercase tracking-tighter">Enable SSL Acceleration (Recommended)</label>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Terminal (Username)</label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="email" value={smtp.user} onChange={e => setSmtp({ ...smtp, user: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-5 py-4 text-slate-900 font-bold focus:bg-white transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Terminal Auth (Password)</label>
                      <div className="relative">
                        <Key size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type={showPass ? 'text' : 'password'} value={smtp.pass} onChange={e => setSmtp({ ...smtp, pass: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-12 py-4 text-slate-900 font-bold focus:bg-white transition-all" />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
                          {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Display Origin Name</label>
                      <input value={smtp.from_name} onChange={e => setSmtp({ ...smtp, from_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:bg-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Origin Email ID</label>
                      <input type="email" value={smtp.from_email} onChange={e => setSmtp({ ...smtp, from_email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:bg-white transition-all" />
                    </div>
                  </div>

                  {smtpMsg && (
                    <div className={`p-4 rounded-2xl text-sm font-black flex items-center gap-3 animate-in fade-in zoom-in ${
                      smtpMsg.startsWith('✓') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                       <div className={`w-2 h-2 rounded-full ${smtpMsg.startsWith('✓') ? 'bg-green-500' : 'bg-red-500'}`} />
                       {smtpMsg}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={smtpLoading}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl transition shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50">
                      {smtpLoading ? <Loader size={20} className="animate-spin" /> : <Save size={20} />} Save Infrastructure
                    </button>
                    <button type="button" onClick={testSmtp} disabled={smtpLoading}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-black px-10 py-5 rounded-2xl transition flex items-center justify-center gap-3 disabled:opacity-50">
                      {smtpLoading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />} Test Sync
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ACCESS CONTROL */}
            {tab === 'access' && (
              <div className="max-w-2xl space-y-10">
                <div className="mb-10">
                  <h2 className="text-2xl font-black text-slate-900">System Security Policy</h2>
                  <p className="text-slate-500 font-medium">Control global entry points and staff registration rules</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Public Sign-Up */}
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                        accessSettings.allow_signup ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'
                      }`}>
                        <UserPlus size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">Public Staff Enrollment</h3>
                        <p className="text-sm text-slate-400 font-medium mt-1">Allow new users to request accounts from the login page</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAccessSettings(a => ({ ...a, allow_signup: !a.allow_signup }))}
                      className={`w-28 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                        accessSettings.allow_signup 
                          ? 'bg-green-100 text-green-700 ring-1 ring-green-200' 
                          : 'bg-red-50 text-red-600 ring-1 ring-red-100 opacity-60'
                      }`}
                    >
                      {accessSettings.allow_signup ? 'Enabled' : 'Restricted'}
                    </button>
                  </div>

                  {/* Staff Sign-In */}
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                        accessSettings.allow_signin ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'
                      }`}>
                        <Shield size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">Global Staff Sign-In</h3>
                        <p className="text-sm text-slate-400 font-medium mt-1">Kill switch for all non-admin system access</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAccessSettings(a => ({ ...a, allow_signin: !a.allow_signin }))}
                      className={`w-28 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                        accessSettings.allow_signin 
                          ? 'bg-green-100 text-green-700 ring-1 ring-green-200' 
                          : 'bg-red-50 text-red-600 ring-1 ring-red-100 opacity-60'
                      }`}
                    >
                      {accessSettings.allow_signin ? 'Live' : 'Locked'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center pt-10">
                  <div className="w-16 h-px bg-slate-200 mb-8" />
                  <button onClick={saveAccess} disabled={accessLoading}
                    className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl text-sm uppercase tracking-[0.2em] transition hover:bg-black shadow-xl shadow-slate-200 flex items-center justify-center gap-3">
                    {accessLoading ? <Loader size={20} className="animate-spin" /> : <Save size={20} />} Commit Policy Updates
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
