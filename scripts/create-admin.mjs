import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function createAdminUser() {
  console.log('Connecting to database...');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  const email = 'admin@admin.com';
  const password = 'admin880088';
  const name = 'Admin User';

  console.log('Hashing password...');
  const passwordHash = await bcrypt.hash(password, 10);

  console.log('Creating admin user...');
  
  try {
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('Admin user already exists, updating password...');
      await connection.execute(
        'UPDATE users SET password_hash = ?, role = ?, verified = ?, email_verified = ? WHERE email = ?',
        [passwordHash, 'admin', true, true, email]
      );
      console.log('✅ Admin user updated successfully!');
    } else {
      console.log('Creating new admin user...');
      await connection.execute(
        'INSERT INTO users (name, email, password_hash, role, loginMethod, verified, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, passwordHash, 'admin', 'email', true, true]
      );
      console.log('✅ Admin user created successfully!');
    }

    console.log('\nAdmin credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: admin');
    console.log('\nYou can now login with these credentials on both patient and clinician login pages.');

  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createAdminUser();
