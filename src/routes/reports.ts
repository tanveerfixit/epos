import { Router } from 'express';
import { pool, query, queryOne, execute } from '../mysql.js';

const router = Router();

// GET /api/reports/eod-data
router.get('/eod-data', async (req, res) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  try {
    const invoicePayments = await query(`
      SELECT p.*, u.name as user_name, i.invoice_number, c.name as customer_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id=i.id
      LEFT JOIN users u ON i.user_id=u.id
      LEFT JOIN customers c ON i.customer_id=c.id
      WHERE DATE(p.paid_at)=? AND p.type='sale_payment'
    `, [date]);
    const otherMovements = await query(`
      SELECT p.*, c.name as customer_name FROM payments p
      LEFT JOIN customers c ON p.customer_id=c.id
      WHERE DATE(p.paid_at)=? AND p.type!='sale_payment'
    `, [date]);
    const summary = await query(`
      SELECT method, type, SUM(amount) as total FROM payments
      WHERE DATE(paid_at)=? GROUP BY method, type
    `, [date]);
    res.json({ invoicePayments, otherMovements, summary, date });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/reports/eod
router.post('/eod', async (req, res) => {
  const { report_date, starting_balance, cash_counted, calculated_cash, difference,
    total_sales, total_deposits, total_cash_in_drawer, comments, payment_summaries } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute(`
      INSERT INTO closing_reports
        (branch_id,user_id,report_date,starting_balance,cash_counted,calculated_cash,difference,
         total_sales,total_deposits,total_cash_in_drawer,comments)
      VALUES (1,1,?,?,?,?,?,?,?,?,?)`,
      [report_date, starting_balance, cash_counted, calculated_cash, difference,
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
router.get('/eod-list', async (req, res) => {
  try {
    res.json(await query(`
      SELECT r.*, u.name as user_name FROM closing_reports r
      JOIN users u ON r.user_id=u.id ORDER BY r.report_date DESC
    `));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
