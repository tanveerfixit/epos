import { Router } from 'express';
import { pool, query, queryOne, execute } from '../mysql.js';

const router = Router();

router.get('/', async (req: any, res) => {
  try {
    const isSuper = req.user.role === 'superadmin';
    const sql = isSuper 
      ? 'SELECT * FROM customers WHERE business_id=? AND deleted_at IS NULL'
      : 'SELECT * FROM customers WHERE business_id=? AND branch_id=? AND deleted_at IS NULL';
    const params = isSuper ? [req.user.business_id] : [req.user.business_id, req.user.branch_id];
    res.json(await query(sql, params));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req: any, res) => {
  try {
    const isSuper = req.user.role === 'superadmin';
    const sql = isSuper 
      ? 'SELECT * FROM customers WHERE id=? AND business_id=?'
      : 'SELECT * FROM customers WHERE id=? AND business_id=? AND branch_id=?';
    const params = isSuper ? [req.params.id, req.user.business_id] : [req.params.id, req.user.business_id, req.user.branch_id];
    const c = await queryOne(sql, params);
    if (!c) return res.status(404).json({ error: 'Customer not found' });
    res.json(c);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req: any, res) => {
  const { name, phone, email, first_name, last_name, secondary_phone, fax, offers_email,
    company, customer_type, address_line1, address_line2, city, state, zip_code, country, website, alert_message } = req.body;
  try {
    const r = await execute(`
      INSERT INTO customers (business_id,branch_id,name,phone,email,first_name,last_name,secondary_phone,fax,offers_email,
        company,customer_type,address_line1,address_line2,city,state,zip_code,country,website,alert_message)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.business_id, req.user.branch_id, name, phone, email, first_name, last_name, secondary_phone, fax, offers_email ? 1 : 0,
       company, customer_type, address_line1, address_line2, city, state, zip_code, country, website, alert_message]);
    res.json({ id: r.insertId });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req: any, res) => {
  const { name, phone, email, address, first_name, last_name, secondary_phone, fax, offers_email,
    company, customer_type, address_line1, address_line2, city, state, zip_code, country, website, alert_message, wallet_balance } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const isSuper = req.user.role === 'superadmin';
    const checkSql = isSuper 
      ? 'SELECT * FROM customers WHERE id=? AND business_id=?'
      : 'SELECT * FROM customers WHERE id=? AND business_id=? AND branch_id=?';
    const checkParams = isSuper ? [req.params.id, req.user.business_id] : [req.params.id, req.user.business_id, req.user.branch_id];
    
    const [oldRows] = await conn.execute(checkSql, checkParams);
    const old = (oldRows as any[])[0];
    if (!old) throw new Error('Customer not found or access denied');

    await conn.execute(`
      UPDATE customers SET name=?,phone=?,email=?,address=?,first_name=?,last_name=?,secondary_phone=?,fax=?,offers_email=?,
        company=?,customer_type=?,address_line1=?,address_line2=?,city=?,state=?,zip_code=?,country=?,website=?,alert_message=?,wallet_balance=?
      WHERE id=?`,
      [name, phone, email, address, first_name, last_name, secondary_phone, fax, offers_email ? 1 : 0,
       company, customer_type, address_line1, address_line2, city, state, zip_code, country, website, alert_message, wallet_balance || 0, req.params.id]);
    
    const changes: string[] = [];
    if (old.name !== name) changes.push(`Name: ${old.name} -> ${name}`);
    if (old.phone !== phone) changes.push(`Phone: ${old.phone} -> ${phone}`);
    if (old.wallet_balance !== wallet_balance) changes.push(`Wallet: ${old.wallet_balance} -> ${wallet_balance}`);
    
    if (changes.length) {
      await conn.execute('INSERT INTO customer_activity (customer_id,user_id,activity,details) VALUES (?,?,?,?)',
        [req.params.id, req.userId, 'Profile Updated', changes.join(', ')]);
    }
    await conn.commit();
    res.json({ success: true });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const isSuper = req.user.role === 'superadmin';
    const sql = isSuper 
      ? 'UPDATE customers SET deleted_at=NOW() WHERE id=? AND business_id=?'
      : 'UPDATE customers SET deleted_at=NOW() WHERE id=? AND business_id=? AND branch_id=?';
    const params = isSuper ? [req.params.id, req.user.business_id] : [req.params.id, req.user.business_id, req.user.branch_id];
    const r = await execute(sql, params);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Customer not found or access denied' });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/invoices', async (req: any, res) => {
  try {
    const sql = `
      SELECT i.* FROM invoices i
      JOIN customers c ON i.customer_id=c.id
      WHERE i.customer_id=? AND c.business_id=? ${req.user.role !== 'superadmin' ? 'AND c.branch_id=?' : ''}
      ORDER BY i.created_at DESC
    `;
    const params = req.user.role !== 'superadmin' ? [req.params.id, req.user.business_id, req.user.branch_id] : [req.params.id, req.user.business_id];
    res.json(await query(sql, params));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/payments', async (req: any, res) => {
  try {
    res.json(await query(`
      SELECT p.*, i.invoice_number FROM payments p
      LEFT JOIN invoices i ON p.invoice_id=i.id
      JOIN customers c ON p.customer_id=c.id
      WHERE p.customer_id=? AND c.business_id=? ORDER BY p.paid_at DESC
    `, [req.params.id, req.user.business_id]));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/ledger', async (req: any, res) => {
  try {
    res.json(await query(`
      SELECT p.*, i.invoice_number FROM payments p
      LEFT JOIN invoices i ON p.invoice_id=i.id
      JOIN customers c ON p.customer_id=c.id
      WHERE p.customer_id=? AND c.business_id=? ORDER BY p.paid_at DESC
    `, [req.params.id, req.user.business_id]));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/activity', async (req: any, res) => {
  try {
    const sql = `
      SELECT a.*, u.name as user_name FROM customer_activity a
      LEFT JOIN users u ON a.user_id=u.id
      JOIN customers c ON a.customer_id=c.id
      WHERE a.customer_id=? AND c.business_id=? ${req.user.role !== 'superadmin' ? 'AND c.branch_id=?' : ''}
      ORDER BY a.created_at DESC
    `;
    const params = req.user.role !== 'superadmin' ? [req.params.id, req.user.business_id, req.user.branch_id] : [req.params.id, req.user.business_id];
    res.json(await query(sql, params));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/payments', async (req: any, res) => {
  const { amount, method, note } = req.body;
  const numAmount = Number(amount);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Validate ownership
    const isSuper = req.user.role === 'superadmin';
    const checkSql = isSuper 
      ? 'SELECT id FROM customers WHERE id=? AND business_id=?'
      : 'SELECT id FROM customers WHERE id=? AND business_id=? AND branch_id=?';
    const checkParams = isSuper ? [req.params.id, req.user.business_id] : [req.params.id, req.user.business_id, req.user.branch_id];
    const [cRows] = await conn.execute(checkSql, checkParams);
    if ((cRows as any[]).length === 0) throw new Error('Customer not found or access denied');

    await conn.execute("INSERT INTO payments (customer_id,type,method,amount) VALUES (?,?,?,?)",
      [req.params.id, 'deposit', method || 'Cash', numAmount]);
    await conn.execute("UPDATE customers SET wallet_balance=COALESCE(wallet_balance,0)+? WHERE id=?", [numAmount, req.params.id]);
    await conn.execute("INSERT INTO customer_activity (customer_id,user_id,activity,details) VALUES (?,?,?,?)",
      [req.params.id, req.userId, 'Deposit Received', `Deposit of €${numAmount.toFixed(2)} received via ${method}. ${note || ''}`]);
    await conn.commit();
    res.json({ success: true });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

export default router;
