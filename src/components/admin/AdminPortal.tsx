import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, GitBranch, Mail, CheckCircle, XCircle, UserX, Edit2, Trash2, Plus, Send, Loader, Save, Eye, EyeOff, AlertCircle, RefreshCw, Key, Shield, ToggleLeft, ToggleRight } from 'lucide-react';

type Tab = 'users' | 'branches' | 'smtp' | 'access';

const statusColors: Record<string, string> = {
  approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  inactive: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

export default function AdminPortal({ onClose }: { onClose: () => void }) {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [smtp, setSmtp] = useState<any>({ host: 'smtp.hostinger.com', port: 465, secure: true, user: '', pass: '', from_name: 'iCover EPOS', from_email: '' });
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-[#3498db]" />
            <h2 className="text-lg font-bold text-white">Admin Portal</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl transition">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4 flex-wrap">
          {([
            { id: 'users', label: 'Users', icon: Users, badge: pendingCount },
            { id: 'branches', label: 'Branches', icon: GitBranch },
            { id: 'smtp', label: 'Email (SMTP)', icon: Mail },
            { id: 'access', label: 'Access Control', icon: Shield },
          ] as any[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition relative ${tab === t.id ? 'bg-[#3498db] text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <t.icon size={15} />
              {t.label}
              {t.badge > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className={`mx-5 mt-3 text-sm px-3 py-2 rounded-lg ${actionMsg.startsWith('✓') ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
            {actionMsg}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">

          {/* USERS TAB */}
          {tab === 'users' && (
            <div>
              {editUser && (
                <div className="bg-[#0f172a] border border-[#3498db]/30 rounded-xl p-4 mb-4">
                  <h3 className="text-white font-semibold mb-3">Edit User: {editUser.name}</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Name</label>
                      <input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Branch</label>
                      <select value={editUser.branch_id} onChange={e => setEditUser({ ...editUser, branch_id: e.target.value })}
                        className="w-full bg-[#1e293b] border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]">
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Role</label>
                      <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                        className="w-full bg-[#1e293b] border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]">
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">New Password (optional)</label>
                      <input type="password" placeholder="Leave blank to keep current"
                        onChange={e => setEditUser({ ...editUser, newPassword: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveUser} disabled={loading} className="bg-[#3498db] hover:bg-[#2980b9] text-white text-sm px-4 py-2 rounded-lg transition flex items-center gap-2">
                      {loading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />} Save
                    </button>
                    <button onClick={() => setEditUser(null)} className="bg-white/10 hover:bg-white/20 text-slate-300 text-sm px-4 py-2 rounded-lg transition">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="bg-[#0f172a] border border-white/5 rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">{u.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[u.status] || statusColors.inactive}`}>{u.status}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full border border-slate-600 text-slate-400">{u.role}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{u.email} · {u.branch_name}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {u.status === 'pending' && <>
                        <button onClick={() => updateStatus(u.id, 'approved')} title="Approve"
                          className="p-1.5 bg-green-500/20 hover:bg-green-500/40 rounded-lg text-green-400 transition"><CheckCircle size={15} /></button>
                        <button onClick={() => updateStatus(u.id, 'rejected')} title="Reject"
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 transition"><XCircle size={15} /></button>
                      </>}
                      {u.status === 'approved' && (
                        <button onClick={() => updateStatus(u.id, 'inactive')} title="Deactivate"
                          className="p-1.5 bg-orange-500/20 hover:bg-orange-500/40 rounded-lg text-orange-400 transition"><UserX size={15} /></button>
                      )}
                      {u.status === 'inactive' && (
                        <button onClick={() => updateStatus(u.id, 'approved')} title="Reactivate"
                          className="p-1.5 bg-green-500/20 hover:bg-green-500/40 rounded-lg text-green-400 transition"><CheckCircle size={15} /></button>
                      )}
                      {/* Reset Password */}
                      <button onClick={() => resetUserPassword(u.id, u.name)} title="Reset & Email New Password"
                        className="p-1.5 bg-purple-500/20 hover:bg-purple-500/40 rounded-lg text-purple-400 transition"><Key size={15} /></button>
                      {/* Resend Password */}
                      <button onClick={() => resendUserPassword(u.id, u.name)} title="Resend Last Password"
                        className="p-1.5 bg-teal-500/20 hover:bg-teal-500/40 rounded-lg text-teal-400 transition"><RefreshCw size={15} /></button>
                      <button onClick={() => setEditUser({ ...u, newPassword: '' })} title="Edit"
                        className="p-1.5 bg-[#3498db]/20 hover:bg-[#3498db]/40 rounded-lg text-[#3498db] transition"><Edit2 size={15} /></button>
                      <button onClick={() => deleteUser(u.id)} title="Remove"
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/30 rounded-lg text-red-400 transition"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BRANCHES TAB */}
          {tab === 'branches' && (
            <div className="space-y-4">
              <form onSubmit={createBranch} className="bg-[#0f172a] border border-white/5 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Plus size={16} />Add Branch</h3>
                <div className="grid grid-cols-3 gap-3">
                  <input value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} required placeholder="Branch name"
                    className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#3498db]" />
                  <input value={newBranch.address} onChange={e => setNewBranch({ ...newBranch, address: e.target.value })} placeholder="Address"
                    className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#3498db]" />
                  <input value={newBranch.phone} onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })} placeholder="Phone"
                    className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#3498db]" />
                </div>
                <button type="submit" className="mt-3 bg-[#3498db] hover:bg-[#2980b9] text-white text-sm px-4 py-2 rounded-lg transition flex items-center gap-2">
                  <Plus size={14} />Create Branch
                </button>
              </form>
              <div className="space-y-2">
                {branches.map(b => (
                  <div key={b.id} className="bg-[#0f172a] border border-white/5 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-white text-sm font-medium">{b.name}</div>
                      <div className="text-slate-500 text-xs">{b.address || 'No address'}{b.phone ? ` · ${b.phone}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SMTP TAB */}
          {tab === 'smtp' && (
            <div className="max-w-lg">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-5 flex gap-2 text-sm text-blue-300">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>Enter your Hostinger email credentials. The password is stored securely.</span>
              </div>
              <form onSubmit={saveSmtp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">SMTP Host</label>
                    <input value={smtp.host} onChange={e => setSmtp({ ...smtp, host: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Port</label>
                    <input type="number" value={smtp.port} onChange={e => setSmtp({ ...smtp, port: Number(e.target.value) })}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="secure" checked={!!smtp.secure} onChange={e => setSmtp({ ...smtp, secure: e.target.checked })}
                    className="w-4 h-4 accent-[#3498db]" />
                  <label htmlFor="secure" className="text-sm text-slate-300">Use SSL/TLS (recommended — port 465)</label>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email Username</label>
                  <input type="email" value={smtp.user} onChange={e => setSmtp({ ...smtp, user: e.target.value })} placeholder="you@yourdomain.com"
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={smtp.pass} onChange={e => setSmtp({ ...smtp, pass: e.target.value })} placeholder="Your email password"
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 pr-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">From Name</label>
                    <input value={smtp.from_name} onChange={e => setSmtp({ ...smtp, from_name: e.target.value })} placeholder="iCover EPOS"
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">From Email</label>
                    <input type="email" value={smtp.from_email} onChange={e => setSmtp({ ...smtp, from_email: e.target.value })} placeholder="noreply@yourdomain.com"
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]" />
                  </div>
                </div>
                {smtpMsg && (
                  <div className={`text-sm px-3 py-2 rounded-lg ${smtpMsg.startsWith('✓') ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                    {smtpMsg}
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="submit" disabled={smtpLoading}
                    className="bg-[#3498db] hover:bg-[#2980b9] text-white text-sm px-5 py-2 rounded-lg transition flex items-center gap-2 disabled:opacity-60">
                    {smtpLoading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />} Save Settings
                  </button>
                  <button type="button" onClick={testSmtp} disabled={smtpLoading}
                    className="bg-white/10 hover:bg-white/20 text-slate-300 text-sm px-5 py-2 rounded-lg transition flex items-center gap-2 disabled:opacity-60">
                    {smtpLoading ? <Loader size={14} className="animate-spin" /> : <Send size={14} />} Send Test Email
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ACCESS CONTROL TAB */}
          {tab === 'access' && (
            <div className="max-w-lg space-y-4">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex gap-2 text-sm text-orange-300">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>Control who can sign up and sign in. Super Admin is never affected by these settings.</span>
              </div>

              {/* Allow Signup */}
              <div className="bg-[#0f172a] border border-white/5 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Public Sign-Up</div>
                    <div className="text-slate-400 text-sm mt-0.5">Allow new users to register accounts</div>
                  </div>
                  <button
                    onClick={() => setAccessSettings(a => ({ ...a, allow_signup: !a.allow_signup }))}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${accessSettings.allow_signup ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    {accessSettings.allow_signup ? <><ToggleRight size={18} /> Enabled</> : <><ToggleLeft size={18} /> Disabled</>}
                  </button>
                </div>
              </div>

              {/* Allow Signin */}
              <div className="bg-[#0f172a] border border-white/5 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Staff Sign-In</div>
                    <div className="text-slate-400 text-sm mt-0.5">Allow staff users to sign in (admins & superadmin always allowed)</div>
                  </div>
                  <button
                    onClick={() => setAccessSettings(a => ({ ...a, allow_signin: !a.allow_signin }))}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${accessSettings.allow_signin ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    {accessSettings.allow_signin ? <><ToggleRight size={18} /> Enabled</> : <><ToggleLeft size={18} /> Disabled</>}
                  </button>
                </div>
              </div>

              {accessMsg && (
                <div className={`text-sm px-3 py-2 rounded-lg ${accessMsg.startsWith('✓') ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                  {accessMsg}
                </div>
              )}

              <button onClick={saveAccess} disabled={accessLoading}
                className="bg-[#3498db] hover:bg-[#2980b9] text-white text-sm px-5 py-2 rounded-lg transition flex items-center gap-2 disabled:opacity-60">
                {accessLoading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />} Save Access Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
