import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Create test doctor account
const passwordHash = await bcrypt.hash('TestDoctor123!', 10);

const doctorData = {
  email: 'test.doctor@meditriage.iq',
  name: 'Dr. Test Doctor',
  password_hash: passwordHash,
  login_method: 'email',
  role: 'clinician',
  verified: true,
  email_verified: true,
  specialty: 'Internal Medicine',
  license_number: 'TEST-DOC-2024',
  availability_status: 'available',
  created_at: new Date(),
  updated_at: new Date()
};

try {
  const result = await connection.execute(
    `INSERT INTO users (email, name, password_hash, login_method, role, verified, email_verified, specialty, license_number, availability_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     password_hash = VALUES(password_hash),
     verified = VALUES(verified),
     email_verified = VALUES(email_verified),
     specialty = VALUES(specialty),
     license_number = VALUES(license_number),
     availability_status = VALUES(availability_status),
     updated_at = VALUES(updated_at)`,
    [
      doctorData.email,
      doctorData.name,
      doctorData.password_hash,
      doctorData.login_method,
      doctorData.role,
      doctorData.verified,
      doctorData.email_verified,
      doctorData.specialty,
      doctorData.license_number,
      doctorData.availability_status,
      doctorData.created_at,
      doctorData.updated_at
    ]
  );
  
  console.log('✅ Test doctor account created/updated successfully!');
  console.log('\n📧 Email: test.doctor@meditriage.iq');
  console.log('🔑 Password: TestDoctor123!');
  console.log('👨‍⚕️ Role: Clinician (Doctor)');
  console.log('✓ Verified: Yes');
  console.log('🏥 Specialty: Internal Medicine');
  console.log('📋 License: TEST-DOC-2024');
  console.log('🟢 Status: Available\n');
} catch (error) {
  console.error('Error creating test doctor:', error);
}

await connection.end();
