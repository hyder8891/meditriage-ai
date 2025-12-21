import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true },
};

async function fixMessaging() {
  const conn = await mysql.createConnection(config);

  try {
    console.log('🔧 FIXING MESSAGING SYSTEM\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const patientId = 3150028;
    const doctorId = 3150029;
    const hyderDoctorId = 900079;

    // 1. Verify accounts exist
    console.log('1. Verifying test accounts...');
    const [accounts] = await conn.execute(
      'SELECT id, email, name, role, verified, availability_status FROM users WHERE id IN (?, ?)',
      [patientId, doctorId]
    );
    
    if (accounts.length < 2) {
      console.log('❌ Test accounts missing!');
      process.exit(1);
    }
    console.log('✅ Test accounts exist\n');

    // 2. Ensure doctors are available
    console.log('2. Setting doctors to available...');
    await conn.execute(
      'UPDATE users SET availability_status = ? WHERE id IN (?, ?)',
      ['available', doctorId, hyderDoctorId]
    );
    console.log('✅ Doctors set to available\n');

    // 3. Ensure relationships exist and are active
    console.log('3. Checking/creating relationships...');
    
    // Patient <-> Test Doctor
    const [rel1] = await conn.execute(
      'SELECT id FROM doctor_patient_relationships WHERE doctor_id = ? AND patient_id = ?',
      [doctorId, patientId]
    );
    
    if (rel1.length === 0) {
      await conn.execute(
        `INSERT INTO doctor_patient_relationships 
         (doctor_id, patient_id, relationship_type, status, can_view_records, can_prescribe, can_message, can_schedule_appointments)
         VALUES (?, ?, 'primary', 'active', 1, 1, 1, 1)`,
        [doctorId, patientId]
      );
      console.log('  ✅ Created Patient <-> Test Doctor relationship');
    } else {
      await conn.execute(
        'UPDATE doctor_patient_relationships SET status = ?, can_message = 1 WHERE id = ?',
        ['active', rel1[0].id]
      );
      console.log('  ✅ Updated Patient <-> Test Doctor relationship');
    }

    // Patient <-> Hyder
    const [rel2] = await conn.execute(
      'SELECT id FROM doctor_patient_relationships WHERE doctor_id = ? AND patient_id = ?',
      [hyderDoctorId, patientId]
    );
    
    if (rel2.length === 0) {
      await conn.execute(
        `INSERT INTO doctor_patient_relationships 
         (doctor_id, patient_id, relationship_type, status, can_view_records, can_prescribe, can_message, can_schedule_appointments)
         VALUES (?, ?, 'primary', 'active', 1, 1, 1, 1)`,
        [hyderDoctorId, patientId]
      );
      console.log('  ✅ Created Patient <-> Hyder relationship');
    } else {
      await conn.execute(
        'UPDATE doctor_patient_relationships SET status = ?, can_message = 1 WHERE id = ?',
        ['active', rel2[0].id]
      );
      console.log('  ✅ Updated Patient <-> Hyder relationship');
    }
    console.log();

    // 4. Clear old test messages and create fresh ones
    console.log('4. Creating test messages...');
    await conn.execute(
      'DELETE FROM messages WHERE (sender_id = ? OR recipient_id = ?) AND (sender_id = ? OR recipient_id = ?)',
      [patientId, patientId, doctorId, doctorId]
    );
    
    // Create conversation
    await conn.execute(
      'INSERT INTO messages (sender_id, recipient_id, content, `read`, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [patientId, doctorId, 'Hello Doctor! I need to discuss my symptoms.', false]
    );
    
    await conn.execute(
      'INSERT INTO messages (sender_id, recipient_id, content, `read`, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [doctorId, patientId, 'Hello! I\'m here to help. Please tell me about your symptoms.', false]
    );
    
    await conn.execute(
      'INSERT INTO messages (sender_id, recipient_id, content, `read`, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [patientId, doctorId, 'I\'ve been experiencing headaches for the past week.', false]
    );
    
    console.log('✅ Created 3 test messages\n');

    // 5. Verify everything
    console.log('5. Final verification...');
    const [msgs] = await conn.execute(
      'SELECT COUNT(*) as count FROM messages WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)',
      [patientId, doctorId, doctorId, patientId]
    );
    
    console.log(`  ✅ ${msgs[0].count} messages in database\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 MESSAGING SYSTEM FIXED!\n');
    console.log('📝 Test Instructions:');
    console.log('1. Login as patient: patient.test@meditriage.com / test123');
    console.log('   Go to /patient/messages');
    console.log('   You should see "Dr. Test Doctor" with 3 messages');
    console.log();
    console.log('2. Login as doctor: doctor.test@meditriage.com / test123');
    console.log('   Go to /clinician/messages');
    console.log('   You should see "Test Patient" with 3 messages');
    console.log();
    console.log('3. Try sending messages back and forth!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

fixMessaging().catch(console.error);
