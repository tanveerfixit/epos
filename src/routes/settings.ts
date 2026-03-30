import { Router } from 'express';
import { pool, query, queryOne, execute } from '../mysql.js';

const router = Router();

// ─── Settings ────────────────────────────────────────────────────────────────

router.get('/settings', async (req, res) => {
  try {
    let s = await queryOne('SELECT * FROM settings WHERE business_id=1');
    if (!s) {
      await execute('INSERT INTO settings (business_id) VALUES (1)');
      s = await queryOne('SELECT * FROM settings WHERE business_id=1');
    }
    res.json(s || {});
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/settings', async (req, res) => {
  const { timezone, date_format, time_format, language } = req.body;
  try {
    await execute('UPDATE settings SET timezone=?,date_format=?,time_format=?,language=? WHERE business_id=1',
      [timezone, date_format, time_format, language]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Auth Settings (admin) ────────────────────────────────────────────────────

router.post('/settings/auth', async (req, res) => {
  const { allow_signup, allow_signin } = req.body;
  try {
    await execute('UPDATE settings SET allow_signup=?,allow_signin=? WHERE business_id=1',
      [allow_signup ? 1 : 0, allow_signin ? 1 : 0]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Company ─────────────────────────────────────────────────────────────────

router.get('/company', async (req, res) => {
  try {
    let c = await queryOne('SELECT * FROM businesses WHERE id=1');
    if (!c) {
      await execute("INSERT INTO businesses (name,email) VALUES ('iCover EPOS','contact@icover.com')");
      c = await queryOne('SELECT * FROM businesses WHERE id=1');
    }
    res.json(c || {});
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/company', async (req, res) => {
  const { name, email, phone, subdomain, address, city, state, zip_code, country } = req.body;
  try {
    await execute('UPDATE businesses SET name=?,email=?,phone=?,subdomain=?,address=?,city=?,state=?,zip_code=?,country=? WHERE id=1',
      [name, email, phone, subdomain, address, city, state, zip_code, country]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Payment Methods ──────────────────────────────────────────────────────────

router.get('/payment-methods', async (req, res) => {
  try {
    res.json(await query('SELECT * FROM payment_methods WHERE business_id=1 AND is_active=1 ORDER BY display_order ASC'));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/payment-methods', async (req, res) => {
  const { methods } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('UPDATE payment_methods SET is_active=0 WHERE business_id=1');
    for (let i = 0; i < methods.length; i++) {
      const m = methods[i];
      if (m.id) {
        await conn.execute('UPDATE payment_methods SET name=?,display_order=?,is_active=1 WHERE id=? AND business_id=1',
          [m.name, i+1, m.id]);
      } else {
        await conn.execute('INSERT INTO payment_methods (business_id,name,display_order,is_active) VALUES (?,?,?,1)',
          [1, m.name, i+1]);
      }
    }
    await conn.commit();
    res.json({ success: true });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

// ─── Printer Settings ─────────────────────────────────────────────────────────

router.get('/printer-settings', async (req: any, res) => {
  try {
    const branchId = req.user?.branch_id || 1;
    let s = await queryOne('SELECT * FROM printer_settings WHERE business_id=1 AND branch_id=?', [branchId]);
    if (!s) {
      await execute('INSERT INTO printer_settings (business_id,branch_id) VALUES (1,?)', [branchId]);
      s = await queryOne('SELECT * FROM printer_settings WHERE business_id=1 AND branch_id=?', [branchId]);
    }
    res.json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/printer-settings', async (req: any, res) => {
  const branchId = req.user?.branch_id || 1;
  const { label_size, barcode_length, margin_top, margin_left, margin_bottom, margin_right, orientation, font_size, font_family } = req.body;
  try {
    await execute('UPDATE printer_settings SET label_size=?,barcode_length=?,margin_top=?,margin_left=?,margin_bottom=?,margin_right=?,orientation=?,font_size=?,font_family=? WHERE business_id=1 AND branch_id=?',
      [label_size, barcode_length, margin_top, margin_left, margin_bottom, margin_right, orientation, font_size, font_family, branchId]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Thermal Printer Settings ─────────────────────────────────────────────────

router.get('/thermal-printer-settings', async (req: any, res) => {
  try {
    const branchId = req.user?.branch_id || 1;
    let s = await queryOne('SELECT * FROM thermal_printer_settings WHERE business_id=1 AND branch_id=?', [branchId]);
    if (!s) {
      await execute('INSERT INTO thermal_printer_settings (business_id,branch_id) VALUES (1,?)', [branchId]);
      s = await queryOne('SELECT * FROM thermal_printer_settings WHERE business_id=1', []);
    }
    res.json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/thermal-printer-settings', async (req: any, res) => {
  const branchId = req.user?.branch_id || 1;
  const m = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM thermal_printer_settings WHERE business_id=1 AND branch_id=?', [branchId]);
    await conn.execute(`
      INSERT INTO thermal_printer_settings
        (business_id,branch_id,font_family,font_size,show_logo,show_business_name,show_business_address,
         show_business_phone,show_business_email,show_customer_info,show_invoice_number,show_date,
         show_items_table,show_totals,show_footer,footer_text)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [1, branchId, m.font_family||'monospace', m.font_size||'12px', m.show_logo?1:0, m.show_business_name?1:0,
       m.show_business_address?1:0, m.show_business_phone?1:0, m.show_business_email?1:0,
       m.show_customer_info?1:0, m.show_invoice_number?1:0, m.show_date?1:0,
       m.show_items_table?1:0, m.show_totals?1:0, m.show_footer?1:0,
       m.footer_text||'Thank you for your business!']);
    await conn.commit();
    res.json({ success: true });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

// ─── Categories / Manufacturers ───────────────────────────────────────────────

router.get('/categories', async (req, res) => {
  try { res.json(await query('SELECT * FROM categories WHERE business_id=1')); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/categories', async (req, res) => {
  const { name } = req.body;
  try {
    const r = await execute('INSERT INTO categories (business_id,name) VALUES (1,?)', [name]);
    res.json({ id: r.insertId, name });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/manufacturers', async (req, res) => {
  try { res.json(await query('SELECT * FROM manufacturers WHERE business_id=1')); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/manufacturers', async (req, res) => {
  const { name } = req.body;
  try {
    const r = await execute('INSERT INTO manufacturers (business_id,name) VALUES (1,?)', [name]);
    res.json({ id: r.insertId, name });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Suppliers ────────────────────────────────────────────────────────────────

router.get('/suppliers', async (req, res) => {
  try { res.json(await query('SELECT * FROM suppliers WHERE business_id=1')); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/suppliers', async (req, res) => {
  const { name, phone, email, contact_person } = req.body;
  try {
    const r = await execute('INSERT INTO suppliers (business_id,name,phone,email,contact_person) VALUES (1,?,?,?,?)',
      [name, phone, email, contact_person]);
    res.json({ id: r.insertId, name, phone, email, contact_person });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Branches ─────────────────────────────────────────────────────────────────

router.get('/branches', async (req, res) => {
  try { res.json(await query('SELECT * FROM branches WHERE business_id=1')); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
