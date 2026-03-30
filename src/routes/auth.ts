import { Router } from 'express';
import { pool, query, queryOne, execute } from '../mysql.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendAccountPending, sendAccountApproved, sendAccountRejected, sendAccountDeactivated, sendPasswordReset, sendOtpCode, sendGeneratedPassword, sendTestEmail } from '../services/mailer.js';

const router = Router();
export const sessions = new Map<string, number>();

export function requireAuth(req: any, res: any, next: any) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  req._sessionToken = token;
  next();
}

export async function requireAuthAsync(req: any, res: any, next: any) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  const userId = sessions.get(token);
  try {
    const user = await queryOne('SELECT * FROM users WHERE id=?', [userId]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.userId = userId;
    req.user = user;
    next();
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}

export async function requireAdminAsync(req: any, res: any, next: any) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  const userId = sessions.get(token);
  try {
    const user = await queryOne('SELECT * FROM users WHERE id=?', [userId]) as any;
    if (!user || !['admin','superadmin'].includes(user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.userId = userId;
    req.user = user;
    next();
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, branch_id } = req.body;
  if (!name || !email || !password || !branch_id) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    // Check if signup is allowed
    const settings = await queryOne('SELECT allow_signup FROM settings WHERE business_id=1') as any;
    if (settings && settings.allow_signup === 0) {
      return res.status(403).json({ error: 'Sign-up is currently disabled by the administrator.' });
    }
    const existing = await queryOne('SELECT id FROM users WHERE email=?', [email]);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });
    const password_hash = await bcrypt.hash(password, 10);
    await execute(
      "INSERT INTO users (business_id,branch_id,name,email,password,password_hash,role,status) VALUES (1,?,?,?,?,?,'staff','pending')",
      [branch_id, name, email, password, password_hash]
    );
    try { await sendAccountPending({ name, email }); } catch {}
    res.json({ success: true, message: 'Account created. Awaiting admin approval.' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await queryOne('SELECT * FROM users WHERE email=? AND deleted_at IS NULL', [email]) as any;
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    // Check signin lockdown (superadmin always allowed)
    if (user.role !== 'superadmin') {
      const settings = await queryOne('SELECT allow_signin FROM settings WHERE business_id=1') as any;
      if (settings && settings.allow_signin === 0 && user.role !== 'admin') {
        return res.status(403).json({ error: 'Sign-in is currently disabled. Contact your administrator.' });
      }
    }

    if (user.status === 'pending') return res.status(403).json({ error: 'Your account is pending admin approval.' });
    if (user.status === 'rejected') return res.status(403).json({ error: 'Your account registration was rejected.' });
    if (user.status === 'inactive') return res.status(403).json({ error: 'Your account has been deactivated.' });

    let valid = false;
    if (user.password_hash) {
      valid = await bcrypt.compare(password, user.password_hash);
    } else {
      valid = user.password === password;
      if (valid) {
        const hash = await bcrypt.hash(password, 10);
        await execute('UPDATE users SET password_hash=? WHERE id=?', [hash, user.id]);
      }
    }
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = crypto.randomUUID();
    sessions.set(token, user.id);
    await execute('UPDATE users SET last_login=NOW() WHERE id=?', [user.id]);
    const branch = await queryOne('SELECT * FROM branches WHERE id=?', [user.branch_id]) as any;
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, branch_id: user.branch_id, branch_name: branch?.name }
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token) sessions.delete(token);
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', requireAuthAsync, async (req: any, res) => {
  try {
    const user = await queryOne('SELECT u.*, b.name as branch_name FROM users u LEFT JOIN branches b ON u.branch_id=b.id WHERE u.id=?', [req.userId]) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, password_hash, reset_token, otp_code, ...safeUser } = user;
    res.json(safeUser);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/forgot-password  (OTP flow)
router.post('/forgot-password', async (req, res) => {
  res.json({ success: true, message: 'If this email exists, an OTP code has been sent.' });
  try {
    const user = await queryOne('SELECT * FROM users WHERE email=?', [req.body.email]) as any;
    if (!user) return;
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await execute('UPDATE users SET otp_code=?,otp_expires=? WHERE id=?', [otp, expires, user.id]);
    try { await sendOtpCode({ name: user.name, email: user.email }, otp); } catch {}
  } catch {}
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
  try {
    const user = await queryOne('SELECT * FROM users WHERE email=?', [email]) as any;
    if (!user || user.otp_code !== String(otp)) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }
    if (!user.otp_expires || new Date(user.otp_expires) < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    const reset_token = crypto.randomUUID();
    const tokenExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await execute('UPDATE users SET otp_code=NULL,otp_expires=NULL,reset_token=?,reset_token_expires=? WHERE id=?',
      [reset_token, tokenExpires, user.id]);
    res.json({ success: true, reset_token });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
  try {
    const user = await queryOne('SELECT * FROM users WHERE reset_token=?', [token]) as any;
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    await execute('UPDATE users SET password_hash=?,password=?,reset_token=NULL,reset_token_expires=NULL WHERE id=?',
      [password_hash, password, user.id]);
    res.json({ success: true, message: 'Password updated. You can now log in.' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', requireAdminAsync, async (req, res) => {
  try {
    res.json(await query(`
      SELECT u.id,u.name,u.email,u.role,u.status,u.last_login,u.created_at,b.name as branch_name,b.id as branch_id
      FROM users u LEFT JOIN branches b ON u.branch_id=b.id
      WHERE u.business_id=1 AND u.deleted_at IS NULL ORDER BY u.created_at DESC
    `));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', requireAdminAsync, async (req, res) => {
  const { status } = req.body;
  if (!['approved','rejected','inactive','pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const user = await queryOne('SELECT * FROM users WHERE id=?', [req.params.id]) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });
    await execute('UPDATE users SET status=? WHERE id=?', [status, req.params.id]);
    try {
      if (status==='approved') await sendAccountApproved({ name: user.name, email: user.email });
      else if (status==='rejected') await sendAccountRejected({ name: user.name, email: user.email });
      else if (status==='inactive') await sendAccountDeactivated({ name: user.name, email: user.email });
    } catch {}
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/admin/users/:id
router.put('/users/:id', requireAdminAsync, async (req, res) => {
  const { name, branch_id, role, password } = req.body;
  try {
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      await execute('UPDATE users SET name=?,branch_id=?,role=?,password=?,password_hash=? WHERE id=?',
        [name, branch_id, role, password, password_hash, req.params.id]);
    } else {
      await execute('UPDATE users SET name=?,branch_id=?,role=? WHERE id=?', [name, branch_id, role, req.params.id]);
    }
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdminAsync, async (req, res) => {
  try {
    await execute('UPDATE users SET deleted_at=NOW() WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/users/:id/reset-password  (admin generates & emails new password)
router.post('/users/:id/reset-password', requireAdminAsync, async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id=?', [req.params.id]) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newPass = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g,'').slice(0, 10) + '!';
    const hash = await bcrypt.hash(newPass, 10);
    await execute('UPDATE users SET password=?,password_hash=?,last_generated_password=? WHERE id=?',
      [newPass, hash, newPass, user.id]);
    try { await sendGeneratedPassword({ name: user.name, email: user.email }, newPass); } catch {}
    res.json({ success: true, message: `Password reset and emailed to ${user.email}` });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/users/:id/resend-password  (resend last generated password)
router.post('/users/:id/resend-password', requireAdminAsync, async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id=?', [req.params.id]) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.last_generated_password) {
      return res.status(400).json({ error: 'No generated password on record. Use Reset Password instead.' });
    }
    try { await sendGeneratedPassword({ name: user.name, email: user.email }, user.last_generated_password); } catch {}
    res.json({ success: true, message: `Password resent to ${user.email}` });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/branches
router.get('/branches', requireAdminAsync, async (req, res) => {
  try {
    res.json(await query('SELECT * FROM branches WHERE business_id=1 AND deleted_at IS NULL'));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/branches
router.post('/branches', requireAdminAsync, async (req, res) => {
  const { name, address, phone } = req.body;
  try {
    const r = await execute('INSERT INTO branches (business_id,name,address,phone) VALUES (1,?,?,?)', [name, address, phone]);
    res.json({ id: r.insertId, name, address, phone });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/smtp
router.get('/smtp', requireAdminAsync, async (req, res) => {
  try {
    const s = await queryOne('SELECT * FROM smtp_settings WHERE business_id=1') as any;
    if (s) {
      const { pass, ...safe } = s;
      res.json({ ...safe, pass: pass ? '••••••••' : '' });
    } else {
      res.json({ host:'smtp.hostinger.com', port:465, secure:1, user:'', pass:'', from_name:'EPOS System', from_email:'' });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/admin/smtp
router.put('/smtp', requireAdminAsync, async (req, res) => {
  const { host, port, secure, user, pass, from_name, from_email } = req.body;
  try {
    const existing = await queryOne('SELECT id FROM smtp_settings WHERE business_id=1');
    if (existing) {
      if (pass && pass !== '••••••••') {
        await execute('UPDATE smtp_settings SET host=?,port=?,secure=?,`user`=?,pass=?,from_name=?,from_email=? WHERE business_id=1',
          [host, port, secure?1:0, user, pass, from_name, from_email]);
      } else {
        await execute('UPDATE smtp_settings SET host=?,port=?,secure=?,`user`=?,from_name=?,from_email=? WHERE business_id=1',
          [host, port, secure?1:0, user, from_name, from_email]);
      }
    } else {
      await execute('INSERT INTO smtp_settings (business_id,host,port,secure,`user`,pass,from_name,from_email) VALUES (1,?,?,?,?,?,?,?)',
        [host, port, secure?1:0, user, pass, from_name, from_email]);
    }
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/smtp/test
router.post('/smtp/test', requireAdminAsync, async (req: any, res) => {
  try {
    const admin = await queryOne('SELECT email FROM users WHERE id=?', [req.userId]) as any;
    await sendTestEmail(admin.email);
    res.json({ success: true, message: `Test email sent to ${admin.email}` });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
