import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';
import { initSchema, seedData, ensureSuperAdmin } from './src/mysql.js';
import { requireAuthAsync } from './src/routes/auth.js';

dotenv.config();

function logError(message: string, error: any) {
  const entry = `[${new Date().toISOString()}] ${message}: ${error?.message}\n${error?.stack}\n\n`;
  fs.appendFileSync('server_errors.log', entry);
}

async function startServer() {
  // ─── Init MySQL ───────────────────────────────────────────────────────────
  try {
    await initSchema();
    await seedData();
    await ensureSuperAdmin();
  } catch (err: any) {
    console.error('[MySQL] Failed to initialise:', err.message);
    logError('MySQL init failed', err);
    process.exit(1);
  }

  const app = express();
  const PORT = 3000;
  app.use(express.json({ limit: '10mb' }));

  // ─── Import Route Modules ─────────────────────────────────────────────────
  const { default: authRouter, default: adminRouter } = await import('./src/routes/auth.js');
  const { default: productsRouter } = await import('./src/routes/products.js');
  const { default: customersRouter } = await import('./src/routes/customers.js');
  const { default: invoicesRouter } = await import('./src/routes/invoices.js');
  const { default: reportsRouter } = await import('./src/routes/reports.js');
  const { default: settingsRouter } = await import('./src/routes/settings.js');
  const { default: inventoryRouter } = await import('./src/routes/inventory.js');

  // ─── Public Auth Routes (no auth required) ────────────────────────────────
  app.use('/api/auth', authRouter);

  // ─── Admin Routes (have their own requireAdminAsync inside) ───────────────
  app.use('/api/admin', adminRouter);

  // ─── Protected API Routes (auth required for everything below) ───────────
  app.use('/api', requireAuthAsync);

  // ─── Resource Routes ──────────────────────────────────────────────────────
  app.use('/api/products', productsRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/invoices', invoicesRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/inventory', inventoryRouter);

  // Settings-style routes (flat /api/settings, /api/company, etc.)
  app.use('/api', settingsRouter);

  // Top-level inventory routes (/api/search, /api/devices, /api/transfers, /api/repairs, /api/purchase-orders, /api/payments)
  app.use('/api', inventoryRouter);

  // ─── Import Products ──────────────────────────────────────────────────────
  app.post('/api/import-products', async (req: any, res) => {
    const { products } = req.body;
    const { pool } = await import('./src/mysql.js');
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const p of products) {
        let categoryId: any = null;
        if (p.category_name) {
          const [cr] = await conn.execute('SELECT id FROM categories WHERE business_id=1 AND name=?', [p.category_name]);
          if ((cr as any[]).length) { categoryId = (cr as any[])[0].id; }
          else { const [ins] = await conn.execute('INSERT INTO categories (business_id,name) VALUES (1,?)', [p.category_name]); categoryId = (ins as any).insertId; }
        }
        let manufacturerId: any = null;
        if (p.manufacturer_name) {
          const [mr] = await conn.execute('SELECT id FROM manufacturers WHERE business_id=1 AND name=?', [p.manufacturer_name]);
          if ((mr as any[]).length) { manufacturerId = (mr as any[])[0].id; }
          else { const [ins] = await conn.execute('INSERT INTO manufacturers (business_id,name) VALUES (1,?)', [p.manufacturer_name]); manufacturerId = (ins as any).insertId; }
        }
        let productType = 'stock';
        if (p.product_type === 'Mobile Devices') productType = 'serialized';
        else if (p.product_type === 'Labor/Services') productType = 'service';

        const [pr] = await conn.execute('SELECT id FROM products WHERE business_id=1 AND name=?', [p.product_name]);
        let productId: any;
        if ((pr as any[]).length) {
          productId = (pr as any[])[0].id;
          await conn.execute('UPDATE products SET category_id=?,manufacturer_id=?,product_type=?,allow_overselling=? WHERE id=?',
            [categoryId, manufacturerId, productType, p.allow_overselling === 'Yes' ? 1 : 0, productId]);
        } else {
          const [ins] = await conn.execute(
            'INSERT INTO products (business_id,category_id,manufacturer_id,name,product_type,allow_overselling) VALUES (1,?,?,?,?,?)',
            [categoryId, manufacturerId, p.product_name, productType, p.allow_overselling === 'Yes' ? 1 : 0]
          );
          productId = (ins as any).insertId;
        }
        const [sr] = await conn.execute('SELECT id FROM product_skus WHERE product_id=? AND sku_code=?', [productId, p.sku]);
        let skuId: any;
        if ((sr as any[]).length) {
          skuId = (sr as any[])[0].id;
          await conn.execute('UPDATE product_skus SET cost_price=?,selling_price=? WHERE id=?',
            [parseFloat(p.cost_price) || 0, parseFloat(p.selling_price) || 0, skuId]);
        } else {
          const [ins] = await conn.execute(
            'INSERT INTO product_skus (product_id,sku_code,cost_price,selling_price) VALUES (?,?,?,?)',
            [productId, p.sku, parseFloat(p.cost_price) || 0, parseFloat(p.selling_price) || 0]
          );
          skuId = (ins as any).insertId;
        }
        const quantity = parseInt(p.current_inventory) || 0;
        await conn.execute(
          'INSERT INTO branch_stock (sku_id,branch_id,quantity) VALUES (?,1,?) ON DUPLICATE KEY UPDATE quantity=VALUES(quantity)',
          [skuId, quantity]
        );
      }
      await conn.commit();
      res.json({ success: true });
    } catch (e: any) {
      await conn.rollback();
      res.status(500).json({ error: e.message });
    } finally { conn.release(); }
  });

  // ─── Vite Dev Middleware ──────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  logError('Server startup failed', err);
  console.error('Fatal startup error:', err);
  process.exit(1);
});
