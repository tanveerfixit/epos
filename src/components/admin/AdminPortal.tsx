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
    <div className="fixed inset-0 bg-[#f1f5f9] z-[60] flex flex-col font-sans overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* Upper Navigation / Status Bar */}
      <header className="bg-white border-b border-slate-200 h-16 shrink-0 flex items-center justify-between px-8 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-950 rounded-sm flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-950 tracking-tight leading-none">
              {currentUser?.name === 'Developer Panel' ? 'Developer Control Center' : 'System Control Panel'}
            </h1>
            <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">Administrative Management Interface</p>
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
              className="w-10 h-10 rounded-sm hover:bg-slate-100 flex items-center justify-center transition-colors group"
              title="Return to EPOS"
            >
              <LogOut size={20} className="text-slate-400 group-hover:text-red-600 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-slate-950 p-6 flex flex-col gap-1 shrink-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4 mb-4">Main Navigation</div>
          {[
            { id: 'users', label: 'User Access', icon: Users, badge: pendingCount, desc: 'Manage staff and permissions' },
            { id: 'branches', label: 'Branch Network', icon: GitBranch, desc: 'Configure locations' },
            { id: 'smtp', label: 'Email Bridge', icon: Mail, desc: 'SMTP & Notifications' },
            { id: 'access', label: 'System Policy', icon: Shield, desc: 'Global security rules' },
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id as Tab)}
              className={`flex items-center gap-4 p-3 rounded-md transition-all duration-150 group text-left ${
                tab === t.id 
                  ? 'bg-white/10 text-white border-l-4 border-blue-500 rounded-l-none' 
                  : 'hover:bg-white/5 text-slate-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-sm flex items-center justify-center transition-colors ${
                tab === t.id ? 'bg-blue-600/20 text-blue-400' : 'bg-white/5 text-slate-500 group-hover:text-slate-300'
              }`}>
                <t.icon size={16} />
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

          <div className="mt-auto p-4 bg-slate-900 rounded-md border border-white/5">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">System Health</h4>
            <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              SQL NODE ACTIVE
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
                  <div className="bg-white border border-slate-200 rounded-md p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-slate-100 rounded-sm flex items-center justify-center border border-slate-200">
                        <Edit2 size={20} className="text-slate-950" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-950">Modify User: {editUser.name}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                        <input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-slate-950 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assigned Branch</label>
                        <select value={editUser.branch_id} onChange={e => setEditUser({ ...editUser, branch_id: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-slate-950 font-semibold appearance-none cursor-pointer outline-none">
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">System Role</label>
                        <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-slate-950 font-semibold outline-none">
                          <option value="staff">Staff Member</option>
                          <option value="admin">Administrator</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Set New Password</label>
                        <input type="password" placeholder="Leave blank to keep current"
                          onChange={e => setEditUser({ ...editUser, newPassword: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-slate-950 font-semibold outline-none" />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={saveUser} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-md transition shadow-md flex items-center gap-2">
                        {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                      </button>
                      <button onClick={() => setEditUser(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-md transition">Cancel</button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {users.map(u => (
                    <div key={u.id} className="p-5 flex items-center gap-6 group hover:bg-slate-50/80 transition-colors">
                      <div className="w-12 h-12 bg-slate-100 rounded-sm flex items-center justify-center border border-slate-200 shrink-0">
                        <div className="text-lg font-bold text-slate-400">{u.name.charAt(0)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-slate-900 truncate">{u.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-100">{u.email}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border uppercase tracking-wider ${statusColors[u.status] || statusColors.inactive}`}>{u.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 font-semibold text-[10px] mt-1 uppercase tracking-wider">
                        <span className="text-slate-700">{u.branch_name}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-blue-500">{u.role}</span>
                      </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.status === 'pending' && <>
                          <button onClick={() => updateStatus(u.id, 'approved')} title="Approve"
                            className="p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-600 hover:text-white transition-all border border-green-100"><CheckCircle size={16} /></button>
                          <button onClick={() => updateStatus(u.id, 'rejected')} title="Reject"
                            className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-all border border-red-100"><XCircle size={16} /></button>
                        </>}
                        {u.status === 'approved' && (
                          <button onClick={() => updateStatus(u.id, 'inactive')} title="Deactivate"
                            className="p-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-600 hover:text-white transition-all border border-slate-200"><UserX size={16} /></button>
                        )}
                        {u.status === 'inactive' && (
                          <button onClick={() => updateStatus(u.id, 'approved')} title="Reactivate"
                            className="p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-600 hover:text-white transition-all border border-green-100"><CheckCircle size={16} /></button>
                        )}

                        <div className="w-px h-8 bg-slate-100 mx-1" />

                        <button onClick={() => resetUserPassword(u.id, u.name)} title="Reset & Email Password"
                          className="p-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-600 hover:text-white transition-all border border-purple-100"><Key size={16} /></button>
                        
                        <button onClick={() => resendUserPassword(u.id, u.name)} title="Resend Credentials"
                          className="p-2 bg-cyan-50 text-cyan-600 rounded-md hover:bg-cyan-600 hover:text-white transition-all border border-cyan-100"><RefreshCw size={16} /></button>
                        
                        <button onClick={() => setEditUser({ ...u, newPassword: '' })} title="Edit Profile"
                          className="p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all border border-blue-100"><Edit2 size={16} /></button>
                        
                        <button onClick={() => deleteUser(u.id)} title="Purge Account"
                          className="p-2 bg-red-50 text-red-400 rounded-md hover:bg-red-600 hover:text-white transition-all border border-red-100"><Trash2 size={16} /></button>
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
                    <h2 className="text-2xl font-bold text-slate-950">Branch Network</h2>
                    <p className="text-slate-500 font-medium">Node distribution and location management</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {/* New Branch Form */}
                  <form onSubmit={createBranch} className="bg-white rounded-md p-8 shadow-sm border border-slate-200 flex flex-col items-center text-center justify-center group overflow-hidden relative">
                    <div className="absolute inset-0 bg-slate-950 opacity-0 group-hover:opacity-[0.01] transition-opacity" />
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-center mb-6 text-slate-400 transition-transform group-hover:scale-105">
                      <Plus size={24} />
                    </div>
                    <h3 className="font-bold text-slate-950 mb-1">Initialize Node</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-6">Create new network entry</p>
                    
                    <div className="w-full space-y-3">
                      <input value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} required 
                        placeholder="Branch Name (e.g. London City)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm px-4 py-2.5 text-xs font-semibold focus:bg-white transition-all outline-none" />
                      <input value={newBranch.address} onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                        placeholder="Full Address"
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm px-4 py-2.5 text-xs font-semibold focus:bg-white transition-all outline-none" />
                      <input value={newBranch.phone} onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })}
                        placeholder="Contact Phone"
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm px-4 py-2.5 text-xs font-semibold focus:bg-white transition-all outline-none" />
                      
                      <button type="submit" className="w-full bg-slate-950 text-white font-bold py-3 rounded-sm text-xs flex items-center justify-center gap-2 transition hover:bg-slate-900 shadow-sm mt-2">
                         Deploy Entry
                      </button>
                    </div>
                  </form>

                  {/* Existing Branches */}
                  {branches.map(b => (
                    <div key={b.id} className="bg-white rounded-md p-8 shadow-sm border border-slate-200 hover:border-blue-500/30 transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 bg-slate-50 text-slate-950 rounded-sm flex items-center justify-center font-bold border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                          {b.name.charAt(0)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-300">NODE ID: {b.id}</div>
                      </div>
                      <h3 className="text-lg font-bold text-slate-950 mb-1">{b.name}</h3>
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 font-semibold text-[10px] uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          Network Active
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">{b.address || 'No address specified'}</p>
                        <p className="text-[11px] text-slate-950 font-bold tracking-widest">{b.phone || '00-000-000'}</p>
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
                    <h2 className="text-2xl font-bold text-slate-950">Email Infrastructure</h2>
                    <p className="text-slate-500 font-medium">SMTP gateway configuration for system transmissions</p>
                  </div>

                  <div className="bg-slate-950 border border-white/5 rounded-md p-8 mb-8 flex gap-5">
                    <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-sm flex items-center justify-center shrink-0 border border-blue-500/20">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">Deployment Recommendation</h4>
                      <p className="text-slate-400 text-xs mt-1 font-medium leading-relaxed">
                        Utilize SSL-enabled gateways for secure credential relay. Hostinger SMTP is pre-verified for this node cluster.
                      </p>
                    </div>
                  </div>

                <form onSubmit={saveSmtp} className="bg-white rounded-md p-10 shadow-sm border border-slate-200 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">SMTP Gateway Host</label>
                      <input value={smtp.host} onChange={e => setSmtp({ ...smtp, host: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm px-4 py-3 text-slate-950 font-semibold focus:bg-white focus:border-blue-500 transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Secure Port</label>
                      <input type="number" value={smtp.port} onChange={e => setSmtp({ ...smtp, port: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm px-4 py-3 text-slate-950 font-semibold focus:bg-white focus:border-blue-500 transition-all outline-none" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-sm border border-slate-200">
                    <button 
                      type="button"
                      onClick={() => setSmtp({ ...smtp, secure: !smtp.secure })}
                      className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-1 ${smtp.secure ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${smtp.secure ? 'translate-x-5' : ''}`} />
                    </button>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">Enable SSL Security Overlay</label>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Terminal Authentication (User)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="email" value={smtp.user} onChange={e => setSmtp({ ...smtp, user: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-sm pl-12 pr-4 py-3 text-slate-950 font-semibold focus:bg-white focus:border-blue-500 transition-all outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Terminal Security Key (Password)</label>
                      <div className="relative">
                        <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type={showPass ? 'text' : 'password'} value={smtp.pass} onChange={e => setSmtp({ ...smtp, pass: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-sm pl-12 pr-12 py-3 text-slate-950 font-semibold focus:bg-white focus:border-blue-500 transition-all outline-none" />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Display Descriptor</label>
                      <input value={smtp.from_name} onChange={e => setSmtp({ ...smtp, from_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm px-4 py-3 text-slate-950 font-semibold focus:bg-white transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Origin Address</label>
                      <input type="email" value={smtp.from_email} onChange={e => setSmtp({ ...smtp, from_email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm px-4 py-3 text-slate-950 font-semibold focus:bg-white transition-all outline-none" />
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

                  <div className="flex gap-3 pt-6">
                    <button type="submit" disabled={smtpLoading}
                      className="flex-1 bg-slate-950 hover:bg-black text-white font-bold py-4 rounded-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                      {smtpLoading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />} Save Gateway
                    </button>
                    <button type="button" onClick={testSmtp} disabled={smtpLoading}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-8 py-4 rounded-sm transition flex items-center justify-center gap-2 disabled:opacity-50 border border-slate-200">
                      {smtpLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />} Test Route
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ACCESS CONTROL */}
            {tab === 'access' && (
              <div className="max-w-2xl space-y-10">
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-950">Security Policy Engine</h2>
                  <p className="text-slate-500 font-medium">Control global entry points and node accessibility</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Public Sign-Up */}
                  <div className="bg-white rounded-md p-8 shadow-sm border border-slate-200 flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all border ${
                        accessSettings.allow_signup ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                        <UserPlus size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-950">Staff Enrollment Node</h3>
                        <p className="text-xs text-slate-500 font-medium">Allow new staff to initiate account requests</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAccessSettings(a => ({ ...a, allow_signup: !a.allow_signup }))}
                      className={`w-24 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
                        accessSettings.allow_signup 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {accessSettings.allow_signup ? 'Active' : 'Locked'}
                    </button>
                  </div>

                  {/* Staff Sign-In */}
                  <div className="bg-white rounded-md p-8 shadow-sm border border-slate-200 flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all border ${
                        accessSettings.allow_signin ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                        <Shield size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-950">Global Node Access</h3>
                        <p className="text-xs text-slate-500 font-medium">Master kill-switch for all standard client connections</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAccessSettings(a => ({ ...a, allow_signin: !a.allow_signin }))}
                      className={`w-24 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
                        accessSettings.allow_signin 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {accessSettings.allow_signin ? 'Live' : 'offline'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center pt-8">
                  <button onClick={saveAccess} disabled={accessLoading}
                    className="w-full bg-slate-950 text-white font-bold py-4 rounded-sm text-xs uppercase tracking-[0.2em] transition hover:bg-black shadow-md flex items-center justify-center gap-2">
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
