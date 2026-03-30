import { Router } from 'express';
import { pool, query, queryOne, execute } from '../mysql.js';

const router = Router();

// POST /api/inventory/add
router.post('/add', async (req: any, res) => {
  const { sku_id, branch_id, quantity, cost_price, selling_price, supplier_id, po_number, items } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [piRows] = await conn.execute(`
      SELECT p.id as product_id, p.name as product_name, p.product_type
      FROM product_skus s JOIN products p ON s.product_id=p.id WHERE s.id=?
    `, [sku_id]);
    const productInfo = (piRows as any[])[0];
    if (!productInfo) throw new Error('Product not found');

    let finalPoNumber = po_number?.trim();
    if (!finalPoNumber) {
      const [lastPo] = await conn.execute('SELECT id FROM purchase_orders ORDER BY id DESC LIMIT 1');
      const nextSerial = String(((lastPo as any[])[0]?.id || 0) + 1).padStart(2, '0');
      finalPoNumber = `PO${nextSerial}`;
    }
    const [existPo] = await conn.execute('SELECT id FROM purchase_orders WHERE po_number=? AND business_id=1', [finalPoNumber]);
    const totalAmount = (cost_price || 0) * (quantity || (items?.length || 0));
    let poId: number;
    if ((existPo as any[]).length === 0) {
      const [pr] = await conn.execute(
        "INSERT INTO purchase_orders (business_id,branch_id,supplier_id,po_number,status,total,expected_at) VALUES (1,?,?,?,'received',?,NOW())",
        [branch_id || 1, supplier_id || null, finalPoNumber, totalAmount]
      );
      poId = (pr as any).insertId;
    } else {
      poId = (existPo as any[])[0].id;
      await conn.execute('UPDATE purchase_orders SET total=total+? WHERE id=?', [totalAmount, poId]);
    }
    await conn.execute(
      'INSERT INTO purchase_order_items (po_id,product_id,description,ordered_qty,received_qty,unit_cost,total) VALUES (?,?,?,?,?,?,?)',
      [poId, productInfo.product_id, productInfo.product_name,
       quantity || items?.length || 0, quantity || items?.length || 0, cost_price || 0, totalAmount]
    );

    if (productInfo.product_type === 'serialized') {
      for (const item of items) {
        await conn.execute(
          "INSERT INTO devices (business_id,branch_id,sku_id,imei,cost_price,selling_price,color,gb,`condition`,po_number,status) VALUES (1,?,?,?,?,?,?,?,?,?,'in_stock')",
          [branch_id, sku_id, item.imei, cost_price, selling_price, item.color, item.gb, item.condition, finalPoNumber]
        );
        await conn.execute(
          'INSERT INTO branch_stock (branch_id,sku_id,quantity) VALUES (?,?,1) ON DUPLICATE KEY UPDATE quantity=quantity+1',
          [branch_id, sku_id]
        );
      }
    } else {
      await conn.execute(
        'INSERT INTO branch_stock (branch_id,sku_id,quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity)',
        [branch_id, sku_id, quantity]
      );
    }
    await conn.execute(
      "INSERT INTO inventory_movements (business_id,branch_id,sku_id,movement_type,quantity,unit_cost,reference_type,reference_id) VALUES (1,?,?,'purchase',?,?,?,?)",
      [branch_id, sku_id, quantity || items?.length, cost_price, 'purchase_order', finalPoNumber]
    );
    await conn.commit();
    res.json({ success: true });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

// GET /api/purchase-orders
router.get('/purchase-orders', async (req, res) => {
  try {
    res.json(await query(`
      SELECT po.*, s.name as supplier_name FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id=s.id
      WHERE po.business_id=1 ORDER BY po.created_at DESC
    `));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/purchase-orders/by-number/:number', async (req, res) => {
  try {
    const po = await queryOne('SELECT id FROM purchase_orders WHERE po_number=? AND business_id=1', [req.params.number]);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    res.json(po);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/purchase-orders/:id', async (req, res) => {
  try {
    const po = await queryOne(`
      SELECT po.*, s.name as supplier_name, s.email as supplier_email FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id=s.id
      WHERE po.id=? AND po.business_id=1
    `, [req.params.id]);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    const items = await query('SELECT * FROM purchase_order_items WHERE po_id=?', [req.params.id]);
    res.json({ ...po, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/devices
router.get('/devices', async (req, res) => {
  const status = req.query.status || 'in_stock';
  try {
    res.json(await query(`
      SELECT d.id, d.sku_id, d.imei, d.color, d.gb, d.\`condition\`, d.po_number, d.status, d.created_at,
             p.name as product_name, s.sku_code, inv.invoice_number
      FROM devices d
      JOIN product_skus s ON d.sku_id=s.id
      JOIN products p ON s.product_id=p.id
      LEFT JOIN invoice_items ii ON d.id=ii.device_id
      LEFT JOIN invoices inv ON ii.invoice_id=inv.id
      WHERE d.business_id=1 AND d.status=? ORDER BY d.created_at DESC
    `, [status]));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/devices/search
router.get('/devices/search', async (req: any, res) => {
  const { imei, branch_id } = req.query;
  try {
    let sql = `
      SELECT d.*, p.name as product_name, s.sku_code, b.name as branch_name
      FROM devices d JOIN product_skus s ON d.sku_id=s.id
      JOIN products p ON s.product_id=p.id
      LEFT JOIN branches b ON d.branch_id=b.id WHERE d.status='in_stock'
    `;
    const params: any[] = [];
    if (imei) { sql += ' AND d.imei LIKE ?'; params.push(`%${imei}%`); }
    if (branch_id) { sql += ' AND d.branch_id=?'; params.push(branch_id); }
    sql += ' LIMIT 20';
    res.json(await query(sql, params));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/transfers
router.post('/transfers', async (req: any, res) => {
  const { device_id, sku_id, quantity, to_branch_id, notes } = req.body;
  if (!to_branch_id) return res.status(400).json({ error: 'Destination branch is required' });
  if (!device_id && !sku_id) return res.status(400).json({ error: 'Device or SKU is required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let from_branch_id: any;
    if (device_id) {
      const [dr] = await conn.execute('SELECT * FROM devices WHERE id=?', [device_id]);
      const device = (dr as any[])[0];
      if (!device) throw new Error('Device not found');
      if (device.status !== 'in_stock') throw new Error('Device is not available for transfer');
      from_branch_id = device.branch_id;
      await conn.execute("UPDATE devices SET status='transfer' WHERE id=?", [device_id]);
    } else {
      const [sr] = await conn.execute('SELECT * FROM branch_stock WHERE sku_id=? AND quantity>=?', [sku_id, quantity||1]);
      const stock = (sr as any[])[0];
      if (!stock) throw new Error('Insufficient stock for transfer');
      from_branch_id = stock.branch_id;
    }
    if (String(from_branch_id) === String(to_branch_id)) throw new Error('Source and destination branches must be different');
    const [tr] = await conn.execute(
      "INSERT INTO device_transfers (business_id,from_branch_id,to_branch_id,device_id,sku_id,quantity,status,initiated_by,notes) VALUES (1,?,?,?,?,?,'in_transit',?,?)",
      [from_branch_id, to_branch_id, device_id||null, sku_id||null, quantity||1, req.userId||1, notes||null]
    );
    await conn.commit();
    res.json({ success: true, id: (tr as any).insertId });
  } catch (e: any) { await conn.rollback(); res.status(400).json({ error: e.message }); }
  finally { conn.release(); }
});

// GET /api/transfers
router.get('/transfers', async (req, res) => {
  try {
    res.json(await query(`
      SELECT t.*, fb.name as from_branch_name, tb.name as to_branch_name,
             d.imei, d.color, d.gb, d.\`condition\`,
             p.name as product_name, s.sku_code, u.name as initiated_by_name
      FROM device_transfers t
      LEFT JOIN branches fb ON t.from_branch_id=fb.id
      LEFT JOIN branches tb ON t.to_branch_id=tb.id
      LEFT JOIN devices d ON t.device_id=d.id
      LEFT JOIN product_skus s ON COALESCE(d.sku_id, t.sku_id)=s.id
      LEFT JOIN products p ON s.product_id=p.id
      LEFT JOIN users u ON t.initiated_by=u.id
      WHERE t.business_id=1 ORDER BY t.created_at DESC
    `));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/transfers/:id/complete
router.put('/transfers/:id/complete', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [tr] = await conn.execute('SELECT * FROM device_transfers WHERE id=?', [req.params.id]);
    const transfer = (tr as any[])[0];
    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status === 'completed') throw new Error('Transfer already completed');
    await conn.execute("UPDATE device_transfers SET status='completed',completed_at=NOW() WHERE id=?", [transfer.id]);
    if (transfer.device_id) {
      await conn.execute("UPDATE devices SET branch_id=?,status='in_stock' WHERE id=?", [transfer.to_branch_id, transfer.device_id]);
      const [dr] = await conn.execute('SELECT sku_id FROM devices WHERE id=?', [transfer.device_id]);
      const dsku = (dr as any[])[0]?.sku_id;
      await conn.execute('INSERT INTO branch_stock (branch_id,sku_id,quantity) VALUES (?,?,-1) ON DUPLICATE KEY UPDATE quantity=quantity-1', [transfer.from_branch_id, dsku]);
      await conn.execute('INSERT INTO branch_stock (branch_id,sku_id,quantity) VALUES (?,?,1) ON DUPLICATE KEY UPDATE quantity=quantity+1', [transfer.to_branch_id, dsku]);
    } else if (transfer.sku_id) {
      await conn.execute('INSERT INTO branch_stock (branch_id,sku_id,quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity=quantity-VALUES(quantity)', [transfer.from_branch_id, transfer.sku_id, transfer.quantity]);
      await conn.execute('INSERT INTO branch_stock (branch_id,sku_id,quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity)', [transfer.to_branch_id, transfer.sku_id, transfer.quantity]);
    }
    await conn.commit();
    res.json({ success: true });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

// PUT /api/transfers/:id/cancel
router.put('/transfers/:id/cancel', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [tr] = await conn.execute('SELECT * FROM device_transfers WHERE id=?', [req.params.id]);
    const transfer = (tr as any[])[0];
    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status === 'completed') throw new Error('Cannot cancel a completed transfer');
    await conn.execute("UPDATE device_transfers SET status='cancelled' WHERE id=?", [transfer.id]);
    if (transfer.device_id) await conn.execute("UPDATE devices SET status='in_stock' WHERE id=?", [transfer.device_id]);
    await conn.commit();
    res.json({ success: true });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

// GET /api/transfers/device/:imei
router.get('/transfers/device/:imei', async (req, res) => {
  try {
    const device = await queryOne('SELECT * FROM devices WHERE imei=?', [req.params.imei]);
    if (!device) return res.status(404).json({ error: 'No device found with this IMEI' });
    const transfers = await query(`
      SELECT t.*, fb.name as from_branch_name, tb.name as to_branch_name, u.name as initiated_by_name
      FROM device_transfers t
      LEFT JOIN branches fb ON t.from_branch_id=fb.id
      LEFT JOIN branches tb ON t.to_branch_id=tb.id
      LEFT JOIN users u ON t.initiated_by=u.id
      WHERE t.device_id=? ORDER BY t.created_at DESC
    `, [(device as any).id]);
    const currentBranch = await queryOne('SELECT * FROM branches WHERE id=?', [(device as any).branch_id]);
    res.json({ device, currentBranch, transfers });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/repairs
router.get('/repairs', async (req, res) => {
  try {
    res.json(await query(`
      SELECT j.*, c.name as customer_name FROM jobs j
      LEFT JOIN customers c ON j.customer_id=c.id
      WHERE j.business_id=1 ORDER BY j.created_at DESC
    `));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/repairs
router.post('/repairs', async (req: any, res) => {
  const { customer_id, device_model, issue, status } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute(
      "INSERT INTO jobs (business_id,branch_id,customer_id,device_model,issue,status) VALUES (1,1,?,?,?,?)",
      [customer_id, device_model, issue, status || 'new']
    );
    const jobId = (r as any).insertId;
    if (customer_id) {
      await conn.execute('INSERT INTO customer_activity (customer_id,user_id,activity,details) VALUES (?,?,?,?)',
        [customer_id, 1, 'Repair Job Created', `New repair job for ${device_model}: ${issue}`]);
    }
    await conn.commit();
    res.json({ id: jobId });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

// GET /api/search
router.get('/search', async (req, res) => {
  const q = req.query.q as string;
  const type = req.query.type as string;
  if (!q || q.length < 2) return res.json([]);
  try {
    if (type === 'customers') {
      return res.json(await query(`
        SELECT * FROM customers WHERE (name LIKE ? OR phone LIKE ? OR email LIKE ?)
        AND business_id=1 AND deleted_at IS NULL LIMIT 15
      `, [`%${q}%`, `%${q}%`, `%${q}%`]));
    }
    const products = await query(`
      SELECT s.id, p.name as product_name, s.sku_code, s.barcode, s.selling_price,
             p.product_type, p.allow_overselling,
             (SELECT SUM(quantity) FROM branch_stock WHERE sku_id=s.id) as total_stock
      FROM product_skus s JOIN products p ON s.product_id=p.id
      WHERE (p.name LIKE ? OR s.sku_code LIKE ? OR s.barcode LIKE ?) AND p.deleted_at IS NULL LIMIT 15
    `, [`%${q}%`, `%${q}%`, `%${q}%`]);
    const devices = await query(`
      SELECT s.id, p.name as product_name, s.sku_code, s.barcode, s.selling_price,
             p.product_type, p.allow_overselling, d.imei, d.id as device_id, 1 as total_stock
      FROM devices d JOIN product_skus s ON d.sku_id=s.id
      JOIN products p ON s.product_id=p.id
      WHERE (d.imei LIKE ? OR p.name LIKE ? OR s.sku_code LIKE ?) AND d.status='in_stock' LIMIT 15
    `, [`%${q}%`, `%${q}%`, `%${q}%`]);
    const results: any[] = [...devices];
    for (const p of products) {
      if (!results.find((r: any) => r.id === (p as any).id && !r.device_id)) results.push(p);
    }
    res.json(results);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/payments/:id (update method)
router.put('/payments/:id', async (req, res) => {
  try {
    await execute('UPDATE payments SET method=? WHERE id=?', [req.body.method, req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
