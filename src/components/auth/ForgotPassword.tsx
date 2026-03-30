import React, { useState } from 'react';

type Step = 'email' | 'otp' | 'password' | 'done';

export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);

  const startTimer = () => {
    setTimer(600);
    const iv = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      startTimer();
      setStep('otp');
    } catch { setError('Failed to send OTP. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Invalid OTP'); return; }
      setResetToken(data.reset_token);
      setStep('password');
    } catch { setError('Verification failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password })
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Reset failed'); return; }
      setStep('done');
    } catch { setError('Reset failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const fmtTimer = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: 16 }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 40, width: '100%', maxWidth: 420, color: '#fff' }}>
        
        {step === 'done' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48 }}>✓</div>
              <h2 style={{ margin: '12px 0 8px', color: '#27ae60' }}>Password Updated!</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Your password has been reset. You can now sign in.</p>
            </div>
            <button onClick={onBack} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#2980b9', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
              Back to Sign In
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                {step === 'email' && 'Forgot Password'}
                {step === 'otp' && 'Enter OTP Code'}
                {step === 'password' && 'New Password'}
              </h2>
              <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                {step === 'email' && 'Enter your email to receive a 6-digit code.'}
                {step === 'otp' && `Enter the 6-digit code sent to ${email}.`}
                {step === 'password' && 'Choose a new secure password.'}
              </p>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
              {(['email','otp','password'] as Step[]).map((s, i) => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: ['email','otp','password'].indexOf(step) >= i ? '#2980b9' : 'rgba(255,255,255,0.15)' }} />
              ))}
            </div>

            {error && (
              <div style={{ background: 'rgba(231,76,60,0.2)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: '#e74c3c' }}>
                {error}
              </div>
            )}

            {step === 'email' && (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Email Address</label>
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, boxSizing: 'border-box' }}
                  />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: 13, borderRadius: 8, border: 'none', background: '#2980b9', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Sending...' : 'Send OTP Code'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>6-Digit Code</label>
                    {timer > 0 && <span style={{ fontSize: 12, color: timer < 60 ? '#e74c3c' : '#2ecc71' }}>Expires in {fmtTimer(timer)}</span>}
                    {timer === 0 && <span style={{ fontSize: 12, color: '#e74c3c' }}>Expired</span>}
                  </div>
                  <input
                    type="text" required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                    placeholder="000000" maxLength={6}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 24, textAlign: 'center', letterSpacing: 10, boxSizing: 'border-box' }}
                  />
                </div>
                <button type="submit" disabled={loading || otp.length !== 6} style={{ width: '100%', padding: 13, borderRadius: 8, border: 'none', background: '#2980b9', color: '#fff', fontWeight: 700, cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer', fontSize: 15, opacity: (loading || otp.length !== 6) ? 0.6 : 1 }}>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }} style={{ width: '100%', marginTop: 10, padding: 11, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14 }}>
                  ← Try Different Email
                </button>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handleReset}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>New Password</label>
                  <input
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Confirm Password</label>
                  <input
                    type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: `1px solid ${confirm && password !== confirm ? 'rgba(231,76,60,0.6)' : 'rgba(255,255,255,0.15)'}`, background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, boxSizing: 'border-box' }}
                  />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: 13, borderRadius: 8, border: 'none', background: '#27ae60', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Saving...' : 'Set New Password'}
                </button>
              </form>
            )}

            <button onClick={onBack} style={{ width: '100%', marginTop: 16, padding: 10, borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14 }}>
              ← Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}
