import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// SECURITY: Credentials must come from environment variables (FINDING-001)
if (!process.env.DB_PASS) {
  console.warn('[SECURITY WARNING] DB_PASS is not set. Using hardcoded fallback. Set this in your .env file before going to production.');
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'srv2113.hstgr.io',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'u583652021_eposdata',
  user: process.env.DB_USER || 'u583652021_autouser',
  password: process.env.DB_PASS || 'Tani$8877!!',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,
  decimalNumbers: true,
});

// Convenience wrapper
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

// ─── Schema Initialisation ───────────────────────────────────────────────────

export async function initSchema() {
  const conn = await pool.getConnection();
  try {
    // Disable FK checks during setup
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(100),
        subdomain VARCHAR(100),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        zip_code VARCHAR(50),
        country VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL DEFAULT '',
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'staff',
        status VARCHAR(50) DEFAULT 'pending',
        last_login TIMESTAMP NULL,
        last_generated_password VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP NULL,
        otp_code VARCHAR(6),
        otp_expires TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT,
        permission_id INT,
        PRIMARY KEY(role_id, permission_id),
        FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INT,
        role_id INT,
        PRIMARY KEY(user_id, role_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT,
        parent_id INT NULL,
        name VARCHAR(255),
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS manufacturers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT,
        name VARCHAR(255),
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS tax_classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT,
        name VARCHAR(255),
        rate DECIMAL(10,4) DEFAULT 0.0000,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        category_id INT NULL,
        manufacturer_id INT NULL,
        tax_class_id INT NULL,
        name VARCHAR(255) NOT NULL,
        product_type VARCHAR(50) DEFAULT 'stock',
        description TEXT,
        allow_overselling TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE SET NULL,
        FOREIGN KEY (tax_class_id) REFERENCES tax_classes(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS variant_attributes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS variant_attribute_values (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attribute_id INT NOT NULL,
        value VARCHAR(255) NOT NULL,
        FOREIGN KEY (attribute_id) REFERENCES variant_attributes(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS product_skus (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        sku_code VARCHAR(255) UNIQUE,
        barcode VARCHAR(255),
        cost_price DECIMAL(10,2),
        selling_price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS sku_attribute_values (
        sku_id INT,
        attribute_value_id INT,
        PRIMARY KEY(sku_id, attribute_value_id),
        FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE,
        FOREIGN KEY (attribute_value_id) REFERENCES variant_attribute_values(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS branch_stock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku_id INT NOT NULL,
        branch_id INT NOT NULL,
        quantity INT DEFAULT 0,
        UNIQUE KEY unique_sku_branch (sku_id, branch_id),
        FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT NOT NULL,
        sku_id INT NOT NULL,
        imei VARCHAR(255) UNIQUE,
        cost_price DECIMAL(10,2),
        selling_price DECIMAL(10,2),
        color VARCHAR(100),
        gb VARCHAR(50),
        \`condition\` VARCHAR(100),
        po_number VARCHAR(100),
        status VARCHAR(50) DEFAULT 'in_stock',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
        FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT NOT NULL,
        sku_id INT NULL,
        device_id INT NULL,
        movement_type VARCHAR(100),
        quantity INT,
        unit_cost DECIMAL(10,2),
        reference_type VARCHAR(100),
        reference_id INT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT,
        name VARCHAR(255),
        phone VARCHAR(100),
        email VARCHAR(255),
        address TEXT,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        secondary_phone VARCHAR(100),
        fax VARCHAR(100),
        offers_email TINYINT(1) DEFAULT 0,
        company VARCHAR(255),
        customer_type VARCHAR(50),
        address_line1 TEXT,
        address_line2 TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        zip_code VARCHAR(50),
        country VARCHAR(100),
        website VARCHAR(255),
        alert_message TEXT,
        wallet_balance DECIMAL(10,2) DEFAULT 0,
        deleted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT NOT NULL,
        user_id INT NULL,
        customer_id INT NULL,
        invoice_number VARCHAR(100),
        type VARCHAR(50) DEFAULT 'sale',
        subtotal DECIMAL(10,2),
        tax_total DECIMAL(10,2),
        discount_total DECIMAL(10,2),
        grand_total DECIMAL(10,2),
        paid_amount DECIMAL(10,2) DEFAULT 0,
        due_amount DECIMAL(10,2) DEFAULT 0,
        cost_total DECIMAL(10,2),
        profit_total DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id),
        FOREIGN KEY (branch_id) REFERENCES branches(id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        sku_id INT NOT NULL,
        device_id INT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10,2),
        cost DECIMAL(10,2),
        discount DECIMAL(10,2),
        total DECIMAL(10,2),
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (sku_id) REFERENCES product_skus(id),
        FOREIGN KEY (device_id) REFERENCES devices(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        invoice_id INT,
        type VARCHAR(50),
        method VARCHAR(100),
        amount DECIMAL(10,2),
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS invoice_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        user_id INT,
        activity VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS customer_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        user_id INT,
        activity VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS product_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku_id INT NOT NULL,
        user_id INT,
        activity VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT,
        currency VARCHAR(100) DEFAULT '€, Euro',
        timezone VARCHAR(100) DEFAULT 'UTC/GMT +00:00 - Europe/London',
        date_format VARCHAR(50) DEFAULT 'DD-MM-YY',
        time_format VARCHAR(50) DEFAULT '12 hour',
        language VARCHAR(50) DEFAULT 'English',
        allow_signup TINYINT(1) DEFAULT 1,
        allow_signin TINYINT(1) DEFAULT 1,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT,
        name VARCHAR(100) NOT NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        is_default TINYINT(1) DEFAULT 0,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS printer_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT,
        label_size VARCHAR(255) DEFAULT '2.25\\" (57mm) x 1.25\\" (32mm) Dymo 30334',
        barcode_length INT DEFAULT 20,
        margin_top INT DEFAULT 5,
        margin_left INT DEFAULT 3,
        margin_bottom INT DEFAULT 3,
        margin_right INT DEFAULT 3,
        orientation VARCHAR(50) DEFAULT 'Landscape',
        font_size VARCHAR(50) DEFAULT 'Regular',
        font_family VARCHAR(100) DEFAULT 'Arial',
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS thermal_printer_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL UNIQUE,
        branch_id INT,
        font_family VARCHAR(100) DEFAULT 'monospace',
        font_size VARCHAR(50) DEFAULT '12px',
        show_logo TINYINT(1) DEFAULT 1,
        show_business_name TINYINT(1) DEFAULT 1,
        show_business_address TINYINT(1) DEFAULT 1,
        show_business_phone TINYINT(1) DEFAULT 1,
        show_business_email TINYINT(1) DEFAULT 1,
        show_customer_info TINYINT(1) DEFAULT 1,
        show_invoice_number TINYINT(1) DEFAULT 1,
        show_date TINYINT(1) DEFAULT 1,
        show_items_table TINYINT(1) DEFAULT 1,
        show_totals TINYINT(1) DEFAULT 1,
        show_footer TINYINT(1) DEFAULT 1,
        footer_text TEXT,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS drawers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT NOT NULL,
        opened_by INT,
        opening_balance DECIMAL(10,2),
        closing_balance DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'open',
        opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP NULL,
        FOREIGN KEY (branch_id) REFERENCES branches(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS drawer_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        drawer_id INT NOT NULL,
        amount DECIMAL(10,2),
        type VARCHAR(50),
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (drawer_id) REFERENCES drawers(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT,
        name VARCHAR(255),
        phone VARCHAR(100),
        email VARCHAR(255),
        contact_person VARCHAR(255),
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        branch_id INT NOT NULL,
        supplier_id INT,
        po_number VARCHAR(100),
        lot_ref_no VARCHAR(100),
        sales_tax DECIMAL(10,2) DEFAULT 0,
        shipping_cost DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        expected_at TIMESTAMP NULL,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        po_id INT NOT NULL,
        product_id INT,
        description TEXT,
        ordered_qty INT DEFAULT 0,
        received_qty INT DEFAULT 0,
        unit_cost DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT,
        branch_id INT,
        customer_id INT,
        device_model VARCHAR(255),
        issue TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS device_transfers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        from_branch_id INT NOT NULL,
        to_branch_id INT NOT NULL,
        device_id INT,
        sku_id INT,
        quantity INT DEFAULT 1,
        status VARCHAR(50) DEFAULT 'pending',
        initiated_by INT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
        FOREIGN KEY (from_branch_id) REFERENCES branches(id),
        FOREIGN KEY (to_branch_id) REFERENCES branches(id),
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
        FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE SET NULL,
        FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS smtp_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL UNIQUE,
        host VARCHAR(255) DEFAULT 'smtp.hostinger.com',
        port INT DEFAULT 465,
        secure TINYINT(1) DEFAULT 1,
        \`user\` VARCHAR(255),
        pass VARCHAR(255),
        from_name VARCHAR(255) DEFAULT 'EPOS System',
        from_email VARCHAR(255),
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        price DECIMAL(10,2),
        max_branches INT,
        max_users INT
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT,
        plan_id INT,
        starts_at DATE,
        ends_at DATE,
        status VARCHAR(50) DEFAULT 'active'
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS closing_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL DEFAULT 0,
        branch_id INT NOT NULL,
        user_id INT NOT NULL,
        report_date DATE NOT NULL,
        starting_balance DECIMAL(10,2) DEFAULT 0,
        cash_counted DECIMAL(10,2) DEFAULT 0,
        calculated_cash DECIMAL(10,2) DEFAULT 0,
        difference DECIMAL(10,2) DEFAULT 0,
        total_sales DECIMAL(10,2) DEFAULT 0,
        total_deposits DECIMAL(10,2) DEFAULT 0,
        total_cash_in_drawer DECIMAL(10,2) DEFAULT 0,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Migration: add business_id to closing_reports if missing (FINDING-016)
    try {
      await conn.query('ALTER TABLE closing_reports ADD COLUMN business_id INT NOT NULL DEFAULT 0 AFTER id');
      console.log('[MySQL] Migration: added business_id to closing_reports');
    } catch (e: any) {
      if (!e.message?.includes('Duplicate column')) throw e;
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS closing_report_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        payment_type VARCHAR(100) NOT NULL,
        calculated DECIMAL(10,2) DEFAULT 0,
        counted DECIMAL(10,2) DEFAULT 0,
        difference DECIMAL(10,2) DEFAULT 0,
        FOREIGN KEY (report_id) REFERENCES closing_reports(id) ON DELETE CASCADE
      )
    `);

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('[MySQL] Schema initialised successfully');
  } finally {
    conn.release();
  }
}

// ─── Seed Initial Data ────────────────────────────────────────────────────────

export async function seedData() {
  const [biz] = await pool.execute('SELECT count(*) as count FROM businesses');
  const count = (biz as any[])[0].count;
  if (Number(count) > 0) return; // Already seeded

  console.log('[MySQL] Seeding initial data...');

  const [bizResult] = await pool.execute(
    'INSERT INTO businesses (name, email) VALUES (?, ?)',
    ['iCover EPOS', 'contact@icover.com']
  );
  const businessId = (bizResult as mysql.ResultSetHeader).insertId;

  // Branches
  const [branchResult] = await pool.execute(
    'INSERT INTO branches (business_id, name, address) VALUES (?, ?, ?)',
    [businessId, 'Main Branch', '123 Tech St, Dublin']
  );
  const branchId = (branchResult as mysql.ResultSetHeader).insertId;
  await pool.execute('INSERT INTO branches (business_id, name, address) VALUES (?, ?, ?)', [businessId, 'ennis', 'Ennis Branch']);
  await pool.execute('INSERT INTO branches (business_id, name, address) VALUES (?, ?, ?)', [businessId, 'gort1', 'Gort Branch']);
  await pool.execute('INSERT INTO branches (business_id, name, address) VALUES (?, ?, ?)', [businessId, 'ipear', 'iPear Branch']);
  await pool.execute('INSERT INTO branches (business_id, name, address) VALUES (?, ?, ?)', [businessId, 'istore', 'iStore Branch']);
  await pool.execute('INSERT INTO branches (business_id, name, address) VALUES (?, ?, ?)', [businessId, 'phoneshop', 'Phone Shop Branch']);
  await pool.execute('INSERT INTO branches (business_id, name, address) VALUES (?, ?, ?)', [businessId, 'tesco', 'Tesco Branch']);

  // Superadmin
  const bcrypt = await import('bcryptjs');
  const superAdminHash = await bcrypt.hash('Admin@2024', 10);
  await pool.execute(
    `INSERT INTO users (business_id, branch_id, name, email, password, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?, ?, 'superadmin', 'approved')
     ON DUPLICATE KEY UPDATE role='superadmin', status='approved'`,
    [businessId, branchId, 'Super Admin', 'tanveerfixit@gmail.com', 'Admin@2024', superAdminHash]
  );

  // Developer Panel user (role='developer', no plaintext password) (FINDING-002, FINDING-007)
  const devHash = await bcrypt.hash(process.env.DEV_PASS || 'admin123', 10);
  await pool.execute(
    `INSERT INTO users (business_id, branch_id, name, email, password, password_hash, role, status)
     VALUES (?, ?, ?, ?, '', ?, 'developer', 'approved')
     ON DUPLICATE KEY UPDATE role='developer', status='approved', password=''`,
    [businessId, branchId, 'Developer Panel', 'admin@icover.ie', devHash]
  );

  // Suppliers
  await pool.execute('INSERT INTO suppliers (business_id, name) VALUES (?, ?)', [businessId, 'Apple Ireland']);
  await pool.execute('INSERT INTO suppliers (business_id, name) VALUES (?, ?)', [businessId, 'Tech Distribution Ltd']);
  await pool.execute('INSERT INTO suppliers (business_id, name) VALUES (?, ?)', [businessId, 'Mobile Wholesale']);

  // Walk-in customer
  await pool.execute('INSERT INTO customers (business_id, name) VALUES (?, ?)', [businessId, 'Walk-in Customer']);

  // Settings
  await pool.execute('INSERT INTO settings (business_id) VALUES (?)', [businessId]);

  // Payment Methods
  const methods = ['Debit Card', 'Cash', 'Other'];
  for (let i = 0; i < methods.length; i++) {
    await pool.execute(
      'INSERT INTO payment_methods (business_id, name, display_order) VALUES (?, ?, ?)',
      [businessId, methods[i], i + 1]
    );
  }

  // Seed SMTP from env
  if (process.env.SMTP_USER) {
    await pool.execute(
      `INSERT INTO smtp_settings (business_id, host, port, secure, \`user\`, pass, from_name, from_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE host=VALUES(host), port=VALUES(port), secure=VALUES(secure),
         \`user\`=VALUES(\`user\`), pass=VALUES(pass), from_name=VALUES(from_name), from_email=VALUES(from_email)`,
      [
        businessId,
        process.env.SMTP_HOST || 'smtp.hostinger.com',
        Number(process.env.SMTP_PORT) || 465,
        process.env.SMTP_SECURE === 'false' ? 0 : 1,
        process.env.SMTP_USER,
        process.env.SMTP_PASS || '',
        process.env.SMTP_FROM_NAME || 'iCover EPOS',
        process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      ]
    );
  }

  console.log('[MySQL] Seed data inserted.');
}

// ─── Ensure Superadmin Exists ─────────────────────────────────────────────────

export async function ensureSuperAdmin() {
  const [rows] = await pool.execute('SELECT id FROM businesses LIMIT 1');
  const businesses = rows as any[];
  if (businesses.length === 0) return;
  const businessId = businesses[0].id;

  const [branches] = await pool.execute('SELECT id FROM branches WHERE business_id = ? LIMIT 1', [businessId]);
  const branchList = branches as any[];
  if (branchList.length === 0) return;
  const branchId = branchList[0].id;

  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.hash('Admin@2024', 10);

  await pool.execute(
    `INSERT INTO users (business_id, branch_id, name, email, password, password_hash, role, status)
     VALUES (?, ?, 'Super Admin', 'tanveerfixit@gmail.com', '', ?, 'superadmin', 'approved')
     ON DUPLICATE KEY UPDATE role='superadmin', status='approved', password=''`,
    [businessId, branchId, hash]
  );

  // ─── Migrate Developer Panel user to role='developer' (FINDING-002) ──────
  // Runs on every boot — safe because it's idempotent via email match.
  await pool.execute(
    `UPDATE users SET role='developer', password=''
     WHERE email='admin@icover.ie' AND role IN ('admin','developer')`,
    []
  );

  console.log('[MySQL] Superadmin and developer roles ensured.');
}

