import { Router } from 'express';
import { pool, query, queryOne, execute } from '../mysql.js';

const router = Router();

// GET /api/reports/eod-data
router.get('/eod-data', async (req: any, res) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  try {
    const isSuper = req.user.role === 'superadmin';
    const branchId = req.user.branch_id;

    const invoicePayments = await query(`
      SELECT p.*, u.name as user_name, i.invoice_number, c.name as customer_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id=i.id
      LEFT JOIN users u ON i.user_id=u.id
      LEFT JOIN customers c ON p.customer_id=c.id
      WHERE DATE(p.paid_at)=? AND i.business_id=? 
      ${!isSuper ? 'AND i.branch_id=?' : ''}
    `, !isSuper ? [date, req.user.business_id, branchId] : [date, req.user.business_id]);

    const otherMovements = await query(`
      SELECT p.*, u.name as user_name, c.name as customer_name 
      FROM payments p
      LEFT JOIN users u ON p.user_id=u.id
      LEFT JOIN customers c ON p.customer_id=c.id
      WHERE DATE(p.paid_at)=? AND p.invoice_id IS NULL AND c.business_id=?
      ${!isSuper ? 'AND c.branch_id=?' : ''}
    `, !isSuper ? [date, req.user.business_id, branchId] : [date, req.user.business_id]);

    const summary = await query(`
      SELECT method, type, SUM(amount) as total FROM payments p
      JOIN customers c ON p.customer_id=c.id
      WHERE DATE(p.paid_at)=? AND c.business_id=? ${!isSuper ? 'AND c.branch_id=?' : ''}
      GROUP BY method, type
    `, !isSuper ? [date, req.user.business_id, branchId] : [date, req.user.business_id]);

    res.json({ invoicePayments, otherMovements, summary, date });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/reports/eod
router.post('/eod', async (req: any, res) => {
  const { report_date, starting_balance, cash_counted, calculated_cash, difference,
    total_sales, total_deposits, total_cash_in_drawer, comments, payment_summaries } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute(`
      INSERT INTO closing_reports
        (business_id,branch_id,user_id,report_date,starting_balance,cash_counted,calculated_cash,difference,
         total_sales,total_deposits,total_cash_in_drawer,comments)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.business_id, req.user.branch_id, req.userId, report_date, starting_balance, cash_counted, calculated_cash, difference,
       total_sales, total_deposits, total_cash_in_drawer, comments]);
    const reportId = (r as any).insertId;
    for (const s of payment_summaries) {
      await conn.execute(
        'INSERT INTO closing_report_payments (report_id,payment_type,calculated,counted,difference) VALUES (?,?,?,?,?)',
        [reportId, s.payment_type, s.calculated, s.counted, s.difference]
      );
    }
    await conn.commit();
    res.json({ success: true, id: reportId });
  } catch (e: any) { await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { conn.release(); }
});

// GET /api/reports/eod-list
router.get('/eod-list', async (req: any, res) => {
  try {
    const isSuper = req.user.role === 'superadmin';
    const sql = `
      SELECT r.*, u.name as user_name FROM closing_reports r
      JOIN users u ON r.user_id=u.id 
      WHERE r.business_id=? ${!isSuper ? 'AND r.branch_id=?' : ''}
      ORDER BY r.report_date DESC
    `;
    const params = !isSuper ? [req.user.business_id, req.user.branch_id] : [req.user.business_id];
    res.json(await query(sql, params));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
