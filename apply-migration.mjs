import mysql from 'mysql2/promise';
import fs from 'fs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const sql = fs.readFileSync('drizzle/0015_small_wasp.sql', 'utf8');
const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));

for (const stmt of statements) {
  try {
    await connection.query(stmt);
    console.log('✓ Applied');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('⊙ Column already exists');
    } else {
      console.error('✗ Error:', err.message.substring(0, 100));
    }
  }
}

await connection.end();
console.log('Migration complete!');
