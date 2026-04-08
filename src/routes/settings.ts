import { Router } from 'express';
import { pool, query, queryOne, execute } from '../mysql.js';

const router = Router();

// ─── Settings ────────────────────────────────────────────────────────────────

router.get('/settings', async (req: any, res) => {
  try {
    let s = await queryOne('SELECT * FROM settings WHERE business_id=?', [req.user.business_id]);
    if (!s) {
      await execute('INSERT INTO settings (business_id) VALUES (?)', [req.user.business_id]);
      s = await queryOne('SELECT * FROM settings WHERE business_id=?', [req.user.business_id]);
    }
    res.json(s || {});
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/settings', async (req: any, res) => {
  const { timezone, date_format, time_format, language } = req.body;
  try {
    await execute('UPDATE settings SET timezone=?,date_format=?,time_format=?,language=? WHERE business_id=?',
      [timezone, date_format, time_format, language, req.user.business_id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Auth Settings (admin) ────────────────────────────────────────────────────

router.post('/settings/auth', async (req: any, res) => {
  const { allow_signup, allow_signin } = req.body;
  try {
    await execute('UPDATE settings SET allow_signup=?,allow_signin=? WHERE business_id=?',
      [allow_signup ? 1 : 0, allow_signin ? 1 : 0, req.user.business_id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Company ─────────────────────────────────────────────────────────────────

router.get('/company', async (req: any, res) => {
  try {
    let c = await queryOne('SELECT * FROM businesses WHERE id=?', [req.user.business_id]);
    res.json(c || {});
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/company', async (req: any, res) => {
  const { name, email, phone, subdomain, address, city, state, zip_code, country } = req.body;
  try {
    await execute('UPDATE businesses SET name=?,email=?,phone=?,subdomain=?,address=?,city=?,state=?,zip_code=?,country=? WHERE id=?',
      [name, email, phone, subdomain, address, city, state, zip_code, country, req.user.business_id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Payment Methods ──────────────────────────────────────────────────────────

router.get('/payment-methods', async (req: any, res) => {
  try {
    res.json(await query('SELECT * FROM payment_methods WHERE business_id=? AND is_active=1 ORDER BY display_order ASC', [req.user.business_id]));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/payment-methods', async (req: any, res) => {
  const { methods } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('UPDATE payment_methods SET is_active=0 WHERE business_id=?', [req.user.business_id]);
    for (let i = 0; i < methods.length; i++) {
      const m = methods[i];
      if (m.id) {
        await conn.execute('UPDATE payment_methods SET name=?,display_order=?,is_active=1 WHERE id=? AND business_id=?',
          [m.name, i+1, m.id, req.user.business_id]);
      } else {
        await conn.execute('INSERT INTO payment_methods (business_id,name,display_order,is_active) VALUES (?,?,?,1)',
          [req.user.business_id, m.name, i+1]);
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
    const branchId = req.user?.branch_id;
    let s = await queryOne('SELECT * FROM printer_settings WHERE business_id=? AND branch_id=?', [req.user.business_id, branchId]);
    if (!s) {
      await execute('INSERT INTO printer_settings (business_id,branch_id) VALUES (?,?)', [req.user.business_id, branchId]);
      s = await queryOne('SELECT * FROM printer_settings WHERE business_id=? AND branch_id=?', [req.user.business_id, branchId]);
    }
    res.json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/printer-settings', async (req: any, res) => {
  const branchId = req.user?.branch_id;
  const { label_size, barcode_length, margin_top, margin_left, margin_bottom, margin_right, orientation, font_size, font_family } = req.body;
  try {
    await execute('UPDATE printer_settings SET label_size=?,barcode_length=?,margin_top=?,margin_left=?,margin_bottom=?,margin_right=?,orientation=?,font_size=?,font_family=? WHERE business_id=? AND branch_id=?',
      [label_size, barcode_length, margin_top, margin_left, margin_bottom, margin_right, orientation, font_size, font_family, req.user.business_id, branchId]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Thermal Printer Settings ─────────────────────────────────────────────────

router.get('/thermal-printer-settings', async (req: any, res) => {
  try {
    const branchId = req.user?.branch_id;
    let s = await queryOne('SELECT * FROM thermal_printer_settings WHERE business_id=? AND branch_id=?', [req.user.business_id, branchId]);
    if (!s) {
      await execute('INSERT INTO thermal_printer_settings (business_id,branch_id) VALUES (?,?)', [req.user.business_id, branchId]);
      s = await queryOne('SELECT * FROM thermal_printer_settings WHERE business_id=? AND branch_id=?', [req.user.business_id, branchId]);
    }
    res.json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/thermal-printer-settings', async (req: any, res) => {
  const branchId = req.user?.branch_id;
  const m = req.body;
  try {
    // Atomic upsert — no data loss if server crashes mid-write (FINDING-019)
    await execute(`
      INSERT INTO thermal_printer_settings
        (business_id,branch_id,font_family,font_size,show_logo,show_business_name,show_business_address,
         show_business_phone,show_business_email,show_customer_info,show_invoice_number,show_date,
         show_items_table,show_totals,show_footer,footer_text)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        branch_id=VALUES(branch_id),font_family=VALUES(font_family),font_size=VALUES(font_size),
        show_logo=VALUES(show_logo),show_business_name=VALUES(show_business_name),
        show_business_address=VALUES(show_business_address),show_business_phone=VALUES(show_business_phone),
        show_business_email=VALUES(show_business_email),show_customer_info=VALUES(show_customer_info),
        show_invoice_number=VALUES(show_invoice_number),show_date=VALUES(show_date),
        show_items_table=VALUES(show_items_table),show_totals=VALUES(show_totals),
        show_footer=VALUES(show_footer),footer_text=VALUES(footer_text)`,
      [req.user.business_id, branchId, m.font_family||'monospace', m.font_size||'12px', m.show_logo?1:0,
       m.show_business_name?1:0, m.show_business_address?1:0, m.show_business_phone?1:0,
       m.show_business_email?1:0, m.show_customer_info?1:0, m.show_invoice_number?1:0,
       m.show_date?1:0, m.show_items_table?1:0, m.show_totals?1:0, m.show_footer?1:0,
       m.footer_text||'Thank you for your business!']
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});


// ─── Categories / Manufacturers ───────────────────────────────────────────────

router.get('/categories', async (req: any, res) => {
  try { res.json(await query('SELECT * FROM categories WHERE business_id=?', [req.user.business_id])); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/categories', async (req: any, res) => {
  const { name } = req.body;
  try {
    const r = await execute('INSERT INTO categories (business_id,name) VALUES (?,?)', [req.user.business_id, name]);
    res.json({ id: r.insertId, name });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/manufacturers', async (req: any, res) => {
  try { res.json(await query('SELECT * FROM manufacturers WHERE business_id=?', [req.user.business_id])); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/manufacturers', async (req: any, res) => {
  const { name } = req.body;
  try {
    const r = await execute('INSERT INTO manufacturers (business_id,name) VALUES (?,?)', [req.user.business_id, name]);
    res.json({ id: r.insertId, name });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Suppliers ────────────────────────────────────────────────────────────────

router.get('/suppliers', async (req: any, res) => {
  try { res.json(await query('SELECT * FROM suppliers WHERE business_id=?', [req.user.business_id])); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/suppliers', async (req: any, res) => {
  const { name, phone, email, contact_person } = req.body;
  try {
    const r = await execute('INSERT INTO suppliers (business_id,name,phone,email,contact_person) VALUES (?,?,?,?,?)',
      [req.user.business_id, name, phone, email, contact_person]);
    res.json({ id: r.insertId, name, phone, email, contact_person });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── Branches ─────────────────────────────────────────────────────────────────

router.get('/branches', async (req: any, res) => {
  try { res.json(await query('SELECT * FROM branches WHERE business_id=?', [req.user.business_id])); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
