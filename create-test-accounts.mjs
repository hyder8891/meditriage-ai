import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

// Parse DATABASE_URL
const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true },
};

async function createTestAccounts() {
  const connection = await mysql.createConnection(config);

  try {
    console.log('🔐 Creating test accounts...\n');

    // Hash password for both accounts
    const password = 'test123';
    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Create test patient account
    const patientEmail = 'patient.test@meditriage.com';
    await connection.execute(
      `INSERT INTO users (email, name, role, password_hash, openId, createdAt, updatedAt, lastSignedIn)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       name = VALUES(name),
       updatedAt = NOW()`,
      [patientEmail, 'Test Patient', 'patient', passwordHash, `test-patient-${Date.now()}`]
    );

    console.log('✅ Patient Account Created:');
    console.log('   Email: patient.test@meditriage.com');
    console.log('   Password: test123');
    console.log('   Role: patient\n');

    // 2. Create test doctor account
    const doctorEmail = 'doctor.test@meditriage.com';
    await connection.execute(
      `INSERT INTO users (email, name, role, password_hash, openId, createdAt, updatedAt, lastSignedIn)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       name = VALUES(name),
       updatedAt = NOW()`,
      [doctorEmail, 'Dr. Test Doctor', 'clinician', passwordHash, `test-doctor-${Date.now()}`]
    );

    console.log('✅ Doctor Account Created:');
    console.log('   Email: doctor.test@meditriage.com');
    console.log('   Password: test123');
    console.log('   Role: clinician\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Test accounts ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📝 How to test messaging:');
    console.log('1. Open two browser windows (or use incognito mode)');
    console.log('2. Window 1: Login as patient (patient.test@meditriage.com / test123)');
    console.log('3. Window 2: Login as doctor (doctor.test@meditriage.com / test123)');
    console.log('4. Go to /test-notifications in both windows');
    console.log('5. Send test notifications and watch them appear in real-time!');
    console.log('6. Verify Redis is distributing messages correctly\n');

  } catch (error) {
    console.error('❌ Error creating test accounts:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createTestAccounts()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
