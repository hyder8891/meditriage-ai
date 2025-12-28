import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [columns] = await connection.execute('DESCRIBE users');
  console.log('Users table columns:');
  columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
} catch (error) {
  console.error('Error:', error);
} finally {
  await connection.end();
}
