import { Router } from 'express';
import { pool, query, queryOne, execute } from '../mysql.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.json(await query(`
      SELECT i.*, c.name as customer_name FROM invoices i
      LEFT JOIN customers c ON i.customer_id=c.id
      WHERE i.business_id=1 ORDER BY i.created_at DESC
    `));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await queryOne(`
      SELECT i.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
      FROM invoices i LEFT JOIN customers c ON i.customer_id=c.id WHERE i.id=?
    `, [req.params.id]) as any;
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const items = await query(`
      SELECT ii.*, p.name as product_name, s.sku_code, d.imei
      FROM invoice_items ii
      JOIN product_skus s ON ii.sku_id=s.id
      JOIN products p ON s.product_id=p.id
      LEFT JOIN devices d ON ii.device_id=d.id
      WHERE ii.invoice_id=?
    `, [req.params.id]);
    const payments = await query('SELECT * FROM payments WHERE invoice_id=?', [req.params.id]) as any[];
    const activities = await query(`
      SELECT a.*, u.name as user_name FROM invoice_activity a
      LEFT JOIN users u ON a.user_id=u.id
      WHERE a.invoice_id=? ORDER BY a.created_at DESC
    `, [req.params.id]);
    const paymentMethod = payments.length > 1 ? 'Split' : (payments[0]?.method || 'Cash');
    res.json({
      ...invoice, items, payments, activities, payment_method: paymentMethod,
      customer: { name: invoice.customer_name, phone: invoice.customer_phone, email: invoice.customer_email }
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { customer_id, items, subtotal, tax_total, discount_total, grand_total, payments, activities } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let finalCustomerId = customer_id;
    if (!finalCustomerId) {
      const [wRows] = await conn.execute("SELECT id FROM customers WHERE name='Walk-in Customer' LIMIT 1");
      finalCustomerId = (wRows as any[])[0]?.id || null;
    }
    const now = new Date();
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const day = days[now.getDay()];
    const dateStr = now.toISOString().slice(0,10).replace(/-/g,'');
    const [lastInv] = await conn.execute('SELECT id FROM invoices ORDER BY id DESC LIMIT 1');
    const nextSerial = String(((lastInv as any[])[0]?.id || 0) + 1).padStart(2, '0');
    const invoiceNumber = `INV${nextSerial}-${day}-${dateStr}`;
    const totalPaid = (payments || []).reduce((s: number, p: any) => s + p.amount, 0);
    const dueAmount = Math.max(0, grand_total - totalPaid);
    let status = 'paid';
    if (dueAmount > 0) status = totalPaid > 0 ? 'partial' : 'credit';
    const [invR] = await conn.execute(
      'INSERT INTO invoices (business_id,branch_id,customer_id,invoice_number,subtotal,tax_total,discount_total,grand_total,paid_amount,due_amount,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [1, 1, finalCustomerId, invoiceNumber, subtotal, tax_total, discount_total, grand_total, totalPaid, dueAmount, status]
    );
    const invoiceId = (invR as any).insertId;
    for (const item of items) {
      const skuId = item.id || item.sku_id;
      const [piRows] = await conn.execute(`
        SELECT p.product_type, p.allow_overselling
        FROM product_skus s JOIN products p ON s.product_id=p.id WHERE s.id=?
      `, [skuId]);
      const productInfo = (piRows as any[])[0];
      await conn.execute('INSERT INTO invoice_items (invoice_id,sku_id,device_id,quantity,price,total) VALUES (?,?,?,?,?,?)',
        [invoiceId, skuId, item.device_id || null, item.quantity, item.price, item.total]);
      if (productInfo?.product_type === 'stock') {
        await conn.execute(`
          INSERT INTO branch_stock (branch_id,sku_id,quantity) VALUES (1,?,?)
          ON DUPLICATE KEY UPDATE quantity=quantity-VALUES(quantity)
        `, [skuId, item.quantity]);
      } else if (item.device_id) {
        await conn.execute("UPDATE devices SET status='sold' WHERE id=?", [item.device_id]);
        await conn.execute(`
          INSERT INTO branch_stock (branch_id,sku_id,quantity) VALUES (1,?,-1)
          ON DUPLICATE KEY UPDATE quantity=quantity-1
        `, [skuId]);
      }
    }
    for (const p of (payments || [])) {
      const type = (p.method==='Store Credit'||p.method==='Wallet') ? 'wallet_use' : 'sale_payment';
      await conn.execute('INSERT INTO payments (customer_id,invoice_id,type,method,amount) VALUES (?,?,?,?,?)',
        [finalCustomerId, invoiceId, type, p.method, p.amount]);
      if (type==='wallet_use') {
        await conn.execute('UPDATE customers SET wallet_balance=wallet_balance-? WHERE id=?', [p.amount, finalCustomerId]);
      }
    }
    await conn.execute('INSERT INTO customer_activity (customer_id,user_id,activity,details) VALUES (?,?,?,?)',
      [finalCustomerId, 1, 'Invoice Created', `Invoice ${invoiceNumber} created for €${grand_total.toFixed(2)}`]);
    await conn.execute('INSERT INTO invoice_activity (invoice_id,user_id,activity,details) VALUES (?,?,?,?)',
      [invoiceId, 1, 'Invoice Created', `Invoice ${invoiceNumber} created for €${grand_total.toFixed(2)}`]);
    for (const act of (activities || [])) {
      await conn.execute('INSERT INTO invoice_activity (invoice_id,user_id,activity,details) VALUES (?,?,?,?)',
        [invoiceId, 1, act.action || act.activity, act.details]);
    }
    await conn.commit();
    res.json({ id: invoiceId });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

router.post('/:id/refund', async (req, res) => {
  const { method } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [invRows] = await conn.execute('SELECT * FROM invoices WHERE id=?', [req.params.id]);
    const invoice = (invRows as any[])[0];
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status==='void') throw new Error('Invoice already refunded');
    await conn.execute("UPDATE invoices SET status='void' WHERE id=?", [req.params.id]);
    await conn.execute('INSERT INTO payments (invoice_id,method,amount) VALUES (?,?,?)',
      [req.params.id, `Refund (${method})`, -invoice.grand_total]);
    const [itemRows] = await conn.execute('SELECT * FROM invoice_items WHERE invoice_id=?', [req.params.id]);
    for (const item of itemRows as any[]) {
      await conn.execute(`
        INSERT INTO branch_stock (branch_id,sku_id,quantity) VALUES (1,?,?)
        ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity)
      `, [item.sku_id, item.quantity]);
      if (item.device_id) await conn.execute("UPDATE devices SET status='in_stock' WHERE id=?", [item.device_id]);
    }
    await conn.execute('INSERT INTO invoice_activity (invoice_id,user_id,activity,details) VALUES (?,?,?,?)',
      [req.params.id, 1, 'Refund Created', `Refund issued via ${method} for €${invoice.grand_total.toFixed(2)}`]);
    await conn.commit();
    res.json({ success: true });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

router.put('/payments/:id', async (req, res) => {
  try {
    await execute('UPDATE payments SET method=? WHERE id=?', [req.body.method, req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
