import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const email = 'test@patient.com';
const password = 'Test123456';
const passwordHash = await bcrypt.hash(password, 10);

try {
  await connection.execute(
    `INSERT INTO users (name, email, passwordHash, role, loginMethod, verified, emailVerified) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Test Patient', email, passwordHash, 'patient', 'email', true, true]
  );
  console.log('✅ Test patient created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
} catch (err) {
  if (err.code === 'ER_DUP_ENTRY') {
    console.log('⚠️  Account already exists');
    console.log('Email:', email);
    console.log('Password:', password);
  } else {
    console.error('Error:', err.message);
  }
}

await connection.end();
