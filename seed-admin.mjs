import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

async function seedAdmin() {
  try {
    // Hash the password
    const passwordHash = await bcrypt.hash('admin', 10);
    
    // Insert admin user (using correct column name: password_hash)
    await connection.execute(
      `INSERT INTO users (name, email, password_hash, role, loginMethod, verified, email_verified, token_version, createdAt, updatedAt, lastSignedIn)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['Admin User', 'admin', passwordHash, 'admin', 'email', true, true, 0]
    );
    
    console.log('✅ Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin');
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await connection.end();
  }
}

seedAdmin();
