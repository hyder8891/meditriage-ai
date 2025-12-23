import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.query('SELECT id FROM users WHERE openId = ?', [process.env.OWNER_OPEN_ID]);
console.log(rows[0]?.id || 1); // Default to 1 if not found
await connection.end();
