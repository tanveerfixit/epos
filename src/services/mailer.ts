import nodemailer from 'nodemailer';
import { queryOne } from '../mysql.js';

async function getTransporter() {
  const settings = await queryOne('SELECT * FROM smtp_settings WHERE business_id = 1') as any;
  if (!settings || !settings.user || !settings.pass) {
    // Fallback to env vars
    if (!process.env.SMTP_USER) throw new Error('SMTP not configured. Please set up email settings in Admin Portal.');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== 'false',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return nodemailer.createTransport({
    host: settings.host || 'smtp.hostinger.com',
    port: settings.port || 465,
    secure: settings.secure === 1,
    auth: { user: settings.user, pass: settings.pass },
  });
}

async function getFromAddress() {
  const settings = await queryOne('SELECT * FROM smtp_settings WHERE business_id = 1') as any;
  const name = settings?.from_name || process.env.SMTP_FROM_NAME || 'iCover EPOS';
  const email = settings?.from_email || settings?.user || process.env.SMTP_USER || 'noreply@example.com';
  return `"${name}" <${email}>`;
}

async function sendMail(to: string, subject: string, html: string) {
  const transporter = await getTransporter();
  const from = await getFromAddress();
  await transporter.sendMail({ from, to, subject, html });
}

const baseStyle = `font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:8px;`;
const btnStyle = `display:inline-block;background:#2980b9;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;`;

export async function sendAccountPending(user: { name: string; email: string }) {
  const html = `<div style="${baseStyle}">
    <h2 style="color:#2c3e50;">Hi ${user.name},</h2>
    <p>Your account has been created and is currently <strong>pending approval</strong> by an administrator.</p>
    <p>You will receive an email once your account has been reviewed.</p>
    <p style="color:#7f8c8d;font-size:13px;">If you did not request this account, please ignore this email.</p>
  </div>`;
  await sendMail(user.email, 'Account Pending Approval', html);
}

export async function sendAccountApproved(user: { name: string; email: string }) {
  const html = `<div style="${baseStyle}">
    <h2 style="color:#27ae60;">Hi ${user.name}, your account is approved! ✓</h2>
    <p>An administrator has approved your account. You can now log in to the EPOS system.</p>
  </div>`;
  await sendMail(user.email, 'Account Approved ✓', html);
}

export async function sendAccountRejected(user: { name: string; email: string }) {
  const html = `<div style="${baseStyle}">
    <h2 style="color:#e74c3c;">Hi ${user.name},</h2>
    <p>Unfortunately, your account registration has been <strong>rejected</strong> by an administrator.</p>
    <p>If you believe this is a mistake, please contact your administrator directly.</p>
  </div>`;
  await sendMail(user.email, 'Account Registration Rejected', html);
}

export async function sendAccountDeactivated(user: { name: string; email: string }) {
  const html = `<div style="${baseStyle}">
    <h2 style="color:#e67e22;">Hi ${user.name},</h2>
    <p>Your EPOS account has been <strong>deactivated</strong> by an administrator.</p>
    <p>Please contact your administrator if you have any questions.</p>
  </div>`;
  await sendMail(user.email, 'Account Deactivated', html);
}

export async function sendPasswordReset(user: { name: string; email: string }, resetLink: string) {
  const html = `<div style="${baseStyle}">
    <h2 style="color:#2c3e50;">Password Reset Request</h2>
    <p>Hi ${user.name},</p>
    <p>You requested a password reset. Click the button below:</p>
    <a href="${resetLink}" style="${btnStyle}">Reset My Password</a>
    <p style="margin-top:24px;color:#7f8c8d;font-size:13px;">This link expires in 1 hour. Ignore if you didn't request this.</p>
  </div>`;
  await sendMail(user.email, 'Password Reset Request', html);
}

export async function sendOtpCode(user: { name: string; email: string }, otp: string) {
  const html = `<div style="${baseStyle}">
    <h2 style="color:#2c3e50;">Password Reset OTP</h2>
    <p>Hi ${user.name},</p>
    <p>Use the following code to reset your password. It expires in <strong>10 minutes</strong>.</p>
    <div style="font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;padding:24px;background:#fff;border:2px solid #2980b9;border-radius:8px;margin:20px 0;color:#2980b9;">${otp}</div>
    <p style="color:#7f8c8d;font-size:13px;">If you did not request this, please ignore this email.</p>
  </div>`;
  await sendMail(user.email, 'Your EPOS Password Reset Code', html);
}

export async function sendGeneratedPassword(user: { name: string; email: string }, password: string) {
  const html = `<div style="${baseStyle}">
    <h2 style="color:#2c3e50;">Your EPOS Account Password</h2>
    <p>Hi ${user.name},</p>
    <p>An administrator has set a new password for your EPOS account:</p>
    <div style="font-size:22px;font-weight:bold;text-align:center;padding:16px;background:#fff;border:2px solid #27ae60;border-radius:8px;margin:20px 0;color:#27ae60;font-family:monospace;">${password}</div>
    <p>Please log in and change your password immediately.</p>
    <p style="color:#7f8c8d;font-size:13px;">If you did not expect this email, contact your administrator.</p>
  </div>`;
  await sendMail(user.email, 'Your EPOS Account Password', html);
}

export async function sendTestEmail(toEmail: string) {
  const html = `<div style="${baseStyle}">
    <h2 style="color:#2980b9;">✓ SMTP Test Successful</h2>
    <p>Your Hostinger SMTP email settings are configured correctly and working.</p>
    <p style="color:#7f8c8d;font-size:13px;">Sent from your EPOS Admin Portal.</p>
  </div>`;
  await sendMail(toEmail, 'EPOS SMTP Test Email', html);
}
