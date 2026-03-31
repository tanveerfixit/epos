import { pool } from './src/mysql';

async function update() {
  try {
    const [result] = await pool.execute(
      "UPDATE users SET name = 'Developer Panel' WHERE email = 'admin@icover.ie'"
    );
    console.log('Update successful:', result);
    process.exit(0);
  } catch (err) {
    console.error('Update failed:', err);
    process.exit(1);
  }
}

update();
