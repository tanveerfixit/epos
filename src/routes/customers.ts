import { Router } from 'express';
import { pool, query, queryOne, execute } from '../mysql.js';

const router = Router();

router.get('/', async (req: any, res) => {
  try {
    res.json(await query('SELECT * FROM customers WHERE business_id=1 AND deleted_at IS NULL'));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const c = await queryOne('SELECT * FROM customers WHERE id=?', [req.params.id]);
    if (!c) return res.status(404).json({ error: 'Customer not found' });
    res.json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { name, phone, email, first_name, last_name, secondary_phone, fax, offers_email,
    company, customer_type, address_line1, address_line2, city, state, zip_code, country, website, alert_message } = req.body;
  try {
    const r = await execute(`
      INSERT INTO customers (business_id,name,phone,email,first_name,last_name,secondary_phone,fax,offers_email,
        company,customer_type,address_line1,address_line2,city,state,zip_code,country,website,alert_message)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [1, name, phone, email, first_name, last_name, secondary_phone, fax, offers_email ? 1 : 0,
       company, customer_type, address_line1, address_line2, city, state, zip_code, country, website, alert_message]);
    res.json({ id: r.insertId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { name, phone, email, address, first_name, last_name, secondary_phone, fax, offers_email,
    company, customer_type, address_line1, address_line2, city, state, zip_code, country, website, alert_message } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [oldRows] = await conn.execute('SELECT * FROM customers WHERE id=?', [req.params.id]);
    const old = (oldRows as any[])[0];
    if (!old) throw new Error('Customer not found');
    await conn.execute(`
      UPDATE customers SET name=?,phone=?,email=?,address=?,first_name=?,last_name=?,secondary_phone=?,fax=?,offers_email=?,
        company=?,customer_type=?,address_line1=?,address_line2=?,city=?,state=?,zip_code=?,country=?,website=?,alert_message=?
      WHERE id=?`,
      [name, phone, email, address, first_name, last_name, secondary_phone, fax, offers_email ? 1 : 0,
       company, customer_type, address_line1, address_line2, city, state, zip_code, country, website, alert_message, req.params.id]);
    const changes: string[] = [];
    if (old.name !== name) changes.push(`Name: ${old.name} -> ${name}`);
    if (old.phone !== phone) changes.push(`Phone: ${old.phone} -> ${phone}`);
    if (changes.length) {
      await conn.execute('INSERT INTO customer_activity (customer_id,user_id,activity,details) VALUES (?,?,?,?)',
        [req.params.id, 1, 'Profile Updated', changes.join(', ')]);
    }
    await conn.commit();
    res.json({ success: true });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

router.delete('/:id', async (req, res) => {
  try {
    await execute('UPDATE customers SET deleted_at=NOW() WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/invoices', async (req, res) => {
  try {
    res.json(await query('SELECT * FROM invoices WHERE customer_id=? ORDER BY created_at DESC', [req.params.id]));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/payments', async (req, res) => {
  try {
    res.json(await query(`
      SELECT p.*, i.invoice_number FROM payments p
      LEFT JOIN invoices i ON p.invoice_id=i.id
      WHERE p.customer_id=? ORDER BY p.paid_at DESC
    `, [req.params.id]));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/ledger', async (req, res) => {
  try {
    res.json(await query(`
      SELECT p.*, i.invoice_number FROM payments p
      LEFT JOIN invoices i ON p.invoice_id=i.id
      WHERE p.customer_id=? ORDER BY p.paid_at DESC
    `, [req.params.id]));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/activity', async (req, res) => {
  try {
    res.json(await query(`
      SELECT a.*, u.name as user_name FROM customer_activity a
      LEFT JOIN users u ON a.user_id=u.id
      WHERE a.customer_id=? ORDER BY a.created_at DESC
    `, [req.params.id]));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/payments', async (req: any, res) => {
  const { amount, method, note } = req.body;
  const numAmount = Number(amount);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute("INSERT INTO payments (customer_id,type,method,amount) VALUES (?,?,?,?)",
      [req.params.id, 'deposit', method || 'Cash', numAmount]);
    await conn.execute("UPDATE customers SET wallet_balance=COALESCE(wallet_balance,0)+? WHERE id=?", [numAmount, req.params.id]);
    await conn.execute("INSERT INTO customer_activity (customer_id,user_id,activity,details) VALUES (?,?,?,?)",
      [req.params.id, 1, 'Deposit Received', `Deposit of €${numAmount.toFixed(2)} received via ${method}. ${note || ''}`]);
    await conn.commit();
    res.json({ success: true });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

export default router;
