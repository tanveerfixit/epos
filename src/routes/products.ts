import { Router } from 'express';
import { pool, query, queryOne, execute } from '../mysql.js';

const router = Router();

// GET /api/products
router.get('/', async (req: any, res) => {
  try {
    const branchId = req.user?.branch_id || 1;
    const products = await query(`
      SELECT s.id, p.name as product_name, s.sku_code, s.barcode,
             s.selling_price, s.cost_price, p.product_type,
             c.name as category_name, m.name as manufacturer_name,
             p.id as product_id,
             (SELECT SUM(quantity) FROM branch_stock WHERE sku_id = s.id) as total_stock
      FROM product_skus s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.deleted_at IS NULL AND p.business_id = 1
    `);
    const mapped = products.map((p: any) => ({
      ...p,
      name: p.product_name + (p.sku_code ? ` (${p.sku_code})` : '')
    }));
    res.json(mapped);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/products/:id
router.get('/:id', async (req: any, res) => {
  try {
    const businessId = req.user.business_id;
    const product = await queryOne(`
      SELECT s.id, p.name as product_name, s.sku_code, s.barcode,
             s.selling_price, s.cost_price, p.product_type,
             c.name as category_name, m.name as manufacturer_name,
             p.id as product_id, p.category_id, p.manufacturer_id
      FROM product_skus s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE s.id = ? AND p.business_id = ?
    `, [req.params.id, businessId]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const stock = await query(`
      SELECT b.name as branch_name, b.id as branch_id, COALESCE(bs.quantity,0) as quantity
      FROM branches b
      LEFT JOIN branch_stock bs ON b.id = bs.branch_id AND bs.sku_id = ?
      WHERE b.business_id = ?
    `, [req.params.id, businessId]);
    res.json({ ...product, stock });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/products/:id
router.put('/:id', async (req: any, res) => {
  const { product_name, category_id, manufacturer_id, sku_code, barcode, selling_price, cost_price, product_type } = req.body;
  const skuId = req.params.id;
  const businessId = req.user.business_id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [skuRows] = await conn.execute('SELECT s.*, p.business_id FROM product_skus s JOIN products p ON s.product_id = p.id WHERE s.id = ? AND p.business_id = ?', [skuId, businessId]);
    const sku = (skuRows as any[])[0];
    if (!sku) throw new Error('Product not found in your business catalog');
    await conn.execute('UPDATE product_skus SET sku_code=?,barcode=?,selling_price=?,cost_price=? WHERE id=?',
      [sku_code, barcode, selling_price, cost_price, skuId]);
    await conn.execute('UPDATE products SET name=?,category_id=?,manufacturer_id=?,product_type=? WHERE id=?',
      [product_name, category_id, manufacturer_id, product_type, sku.product_id]);
    await conn.execute('INSERT INTO product_activity (sku_id,user_id,activity,details) VALUES (?,?,?,?)',
      [skuId, req.userId, 'Product Updated', 'Product details updated via edit form']);
    await conn.commit();
    res.json({ success: true });
  } catch (e: any) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

// POST /api/products
router.post('/', async (req: any, res) => {
  const { name, category_id, manufacturer_id, selling_price, cost_price, product_type, sku_code, barcode, allow_overselling } = req.body;
  const businessId = req.user.business_id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [pr] = await conn.execute(
      'INSERT INTO products (business_id,name,category_id,manufacturer_id,product_type,allow_overselling) VALUES (?,?,?,?,?,?)',
      [businessId, name, category_id, manufacturer_id, product_type, allow_overselling === false ? 0 : 1]
    );
    const productId = (pr as any).insertId;
    let finalSku = sku_code?.trim() || ('SKU-' + Math.random().toString(36).substring(2, 9).toUpperCase());
    const [sr] = await conn.execute(
      'INSERT INTO product_skus (product_id,sku_code,barcode,cost_price,selling_price) VALUES (?,?,?,?,?)',
      [productId, finalSku, barcode || finalSku, cost_price, selling_price]
    );
    const skuId = (sr as any).insertId;
    await conn.execute('INSERT INTO product_activity (sku_id,user_id,activity,details) VALUES (?,?,?,?)',
      [skuId, req.userId, 'Product Created', `Product "${name}" created with SKU ${finalSku}`]);
    await conn.commit();
    res.json({ id: skuId });
  } catch (e: any) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

// DELETE /api/products/:id
router.delete('/:id', async (req: any, res) => {
  try {
    const businessId = req.user.business_id;
    await execute('UPDATE products SET deleted_at=NOW() WHERE business_id=? AND id=(SELECT product_id FROM product_skus WHERE id=?)', [businessId, req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/products/:id/activity
router.get('/:id/activity', async (req, res) => {
  try {
    const acts = await query(`
      SELECT a.*, u.name as user_name FROM product_activity a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.sku_id = ? ORDER BY a.created_at DESC
    `, [req.params.id]);
    res.json(acts);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/products/:skuId/devices
router.get('/:skuId/devices', async (req, res) => {
  try {
    const devices = await query(`
      SELECT d.id, d.imei, d.color, d.gb, d.\`condition\`, d.status, d.created_at, inv.invoice_number
      FROM devices d
      LEFT JOIN invoice_items ii ON d.id = ii.device_id
      LEFT JOIN invoices inv ON ii.invoice_id = inv.id
      WHERE d.sku_id = ? ORDER BY d.created_at DESC
    `, [req.params.skuId]);
    res.json(devices);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/products/:skuId/available-devices
router.get('/:skuId/available-devices', async (req, res) => {
  try {
    const devices = await query(`SELECT id,imei,cost_price,status,created_at FROM devices WHERE sku_id=? AND status='in_stock'`, [req.params.skuId]);
    res.json(devices);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/categories
router.get('/categories/all', async (req: any, res) => {
  try { res.json(await query('SELECT * FROM categories WHERE business_id=?', [req.user.business_id])); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/manufacturers
router.get('/manufacturers/all', async (req: any, res) => {
  try { res.json(await query('SELECT * FROM manufacturers WHERE business_id=?', [req.user.business_id])); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
