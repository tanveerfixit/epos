import { pool } from './src/mysql.ts';

async function check() {
  try {
    const [rows] = await pool.execute('DESCRIBE suppliers');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
