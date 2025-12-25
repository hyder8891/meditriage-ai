import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🌱 Seeding database with hypothetical profiles...\n');

// Hash password helper
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

try {
  // ==================== DOCTOR PROFILES ====================
  console.log('👨‍⚕️ Creating doctor profiles...');
  
  const doctors = [
    {
      name: 'Dr. Ahmed Al-Husseini',
      email: 'ahmed.husseini@mydoctor.iq',
      passwordHash: await hashPassword('doctor123'),
      loginMethod: 'email',
      role: 'doctor',
      licenseNumber: 'IQ-MED-2018-4521',
      specialty: 'Emergency Medicine',
      verified: true,
      availabilityStatus: 'available',
      currentPatientCount: 2,
      maxPatientsPerDay: 40,
      autoOfflineMinutes: 15,
      emailVerified: true,
    },
    {
      name: 'Dr. Fatima Al-Najjar',
      email: 'fatima.najjar@mydoctor.iq',
      passwordHash: await hashPassword('doctor123'),
      loginMethod: 'email',
      role: 'doctor',
      licenseNumber: 'IQ-MED-2015-3892',
      specialty: 'Pediatrics',
      verified: true,
      availabilityStatus: 'busy',
      currentPatientCount: 5,
      maxPatientsPerDay: 35,
      autoOfflineMinutes: 20,
      emailVerified: true,
    },
    {
      name: 'Dr. Omar Al-Jubouri',
      email: 'omar.jubouri@mydoctor.iq',
      passwordHash: await hashPassword('doctor123'),
      loginMethod: 'email',
      role: 'doctor',
      licenseNumber: 'IQ-MED-2012-2156',
      specialty: 'Cardiology',
      verified: true,
      availabilityStatus: 'available',
      currentPatientCount: 1,
      maxPatientsPerDay: 30,
      autoOfflineMinutes: 10,
      emailVerified: true,
    },
    {
      name: 'Dr. Layla Hassan',
      email: 'layla.hassan@mydoctor.iq',
      passwordHash: await hashPassword('doctor123'),
      loginMethod: 'email',
      role: 'doctor',
      licenseNumber: 'IQ-MED-2019-5634',
      specialty: 'Obstetrics & Gynecology',
      verified: true,
      availabilityStatus: 'offline',
      currentPatientCount: 0,
      maxPatientsPerDay: 25,
      autoOfflineMinutes: 15,
      emailVerified: true,
    },
    {
      name: 'Dr. Karim Al-Baghdadi',
      email: 'karim.baghdadi@mydoctor.iq',
      passwordHash: await hashPassword('doctor123'),
      loginMethod: 'email',
      role: 'doctor',
      licenseNumber: 'IQ-MED-2016-4123',
      specialty: 'Internal Medicine',
      verified: true,
      availabilityStatus: 'available',
      currentPatientCount: 3,
      maxPatientsPerDay: 45,
      autoOfflineMinutes: 15,
      emailVerified: true,
    },
  ];

  const insertedDoctors = [];
  for (const doctor of doctors) {
    const [result] = await db.insert(schema.users).values(doctor);
    insertedDoctors.push({ ...doctor, id: result.insertId });
    console.log(`  ✓ Created: ${doctor.name} (${doctor.specialty})`);
  }

  console.log('\n✅ 5 doctors created successfully\n');

  // ==================== PATIENT PROFILES ====================
  console.log('👥 Creating patient profiles...');

  const patients = [
    {
      name: 'Sara Mohammed',
      email: 'sara.mohammed@example.iq',
      passwordHash: await hashPassword('patient123'),
      loginMethod: 'email',
      role: 'patient',
      emailVerified: true,
      // Scenario: Young mother with postpartum concerns
    },
    {
      name: 'Ali Khalil',
      email: 'ali.khalil@example.iq',
      passwordHash: await hashPassword('patient123'),
      loginMethod: 'email',
      role: 'patient',
      emailVerified: true,
      // Scenario: Middle-aged man with chest pain and family history of heart disease
    },
    {
      name: 'Mariam Youssef',
      email: 'mariam.youssef@example.iq',
      passwordHash: await hashPassword('patient123'),
      loginMethod: 'email',
      role: 'patient',
      emailVerified: true,
      // Scenario: Elderly woman with diabetes management issues
    },
    {
      name: 'Hassan Al-Amiri',
      email: 'hassan.amiri@example.iq',
      passwordHash: await hashPassword('patient123'),
      loginMethod: 'email',
      role: 'patient',
      emailVerified: true,
      // Scenario: Young adult with sports injury
    },
    {
      name: 'Noor Abdullah',
      email: 'noor.abdullah@example.iq',
      passwordHash: await hashPassword('patient123'),
      loginMethod: 'email',
      role: 'patient',
      emailVerified: true,
      // Scenario: Child (represented by parent account) with recurring fever
    },
  ];

  const insertedPatients = [];
  for (const patient of patients) {
    const [result] = await db.insert(schema.users).values(patient);
    insertedPatients.push({ ...patient, id: result.insertId });
    console.log(`  ✓ Created: ${patient.name}`);
  }

  console.log('\n✅ 5 patients created successfully\n');

  // ==================== SAMPLE TRIAGE RECORDS ====================
  console.log('📋 Creating sample triage records...');

  const triageRecords = [
    {
      userId: insertedPatients[0].id, // Sara Mohammed
      language: 'ar',
      conversationHistory: JSON.stringify([
        { role: 'assistant', content: 'مرحباً، كيف يمكنني مساعدتك اليوم؟' },
        { role: 'user', content: 'أشعر بألم في الثدي وأنا أرضع طفلي' },
        { role: 'assistant', content: 'متى بدأ هذا الألم؟ وهل تعانين من حمى؟' },
        { role: 'user', content: 'منذ يومين، ولدي حمى خفيفة' },
      ]),
      urgencyLevel: 'moderate',
      chiefComplaint: 'Breast pain while breastfeeding with mild fever',
      symptoms: JSON.stringify(['breast_pain', 'fever', 'breastfeeding_difficulty']),
      assessment: 'Possible mastitis - breast infection common in breastfeeding mothers. Requires medical evaluation and possible antibiotics.',
      recommendations: 'Consult with OB/GYN or family medicine doctor. Continue breastfeeding. Apply warm compresses. Stay hydrated.',
      redFlags: JSON.stringify(['fever', 'severe_pain']),
      duration: 420,
      messageCount: 12,
    },
    {
      userId: insertedPatients[1].id, // Ali Khalil
      language: 'ar',
      conversationHistory: JSON.stringify([
        { role: 'assistant', content: 'مرحباً، ما هي الأعراض التي تعاني منها؟' },
        { role: 'user', content: 'أشعر بألم في الصدر وضيق في التنفس' },
        { role: 'assistant', content: 'هل الألم يمتد إلى الذراع أو الفك؟' },
        { role: 'user', content: 'نعم، إلى الذراع الأيسر' },
      ]),
      urgencyLevel: 'high',
      chiefComplaint: 'Chest pain radiating to left arm with shortness of breath',
      symptoms: JSON.stringify(['chest_pain', 'shortness_of_breath', 'arm_pain', 'sweating']),
      assessment: 'URGENT: Possible cardiac event (heart attack). Immediate medical attention required.',
      recommendations: 'CALL EMERGENCY SERVICES IMMEDIATELY. Do not drive yourself. Chew aspirin if available and not allergic.',
      redFlags: JSON.stringify(['chest_pain', 'radiating_pain', 'shortness_of_breath', 'cardiac_symptoms']),
      duration: 180,
      messageCount: 8,
    },
    {
      userId: insertedPatients[2].id, // Mariam Youssef
      language: 'ar',
      conversationHistory: JSON.stringify([
        { role: 'assistant', content: 'كيف يمكنني مساعدتك؟' },
        { role: 'user', content: 'مستوى السكر في الدم مرتفع جداً' },
        { role: 'assistant', content: 'ما هو مستوى السكر الحالي؟' },
        { role: 'user', content: '320 ملغ/ديسيلتر' },
      ]),
      urgencyLevel: 'moderate',
      chiefComplaint: 'Uncontrolled blood sugar levels in diabetic patient',
      symptoms: JSON.stringify(['hyperglycemia', 'thirst', 'frequent_urination', 'fatigue']),
      assessment: 'Blood glucose significantly elevated (320 mg/dL). Requires medication adjustment and dietary review.',
      recommendations: 'Contact your endocrinologist or internal medicine doctor for medication adjustment. Increase water intake. Monitor blood sugar every 2-4 hours.',
      redFlags: JSON.stringify(['very_high_blood_sugar', 'diabetic_complications']),
      duration: 540,
      messageCount: 15,
    },
    {
      userId: insertedPatients[3].id, // Hassan Al-Amiri
      language: 'en',
      conversationHistory: JSON.stringify([
        { role: 'assistant', content: 'Hello, how can I help you today?' },
        { role: 'user', content: 'I twisted my ankle playing football' },
        { role: 'assistant', content: 'Can you put weight on it? Is it swollen?' },
        { role: 'user', content: 'It\'s very swollen and I can\'t walk on it' },
      ]),
      urgencyLevel: 'low',
      chiefComplaint: 'Ankle injury from sports activity',
      symptoms: JSON.stringify(['ankle_pain', 'swelling', 'difficulty_walking', 'sports_injury']),
      assessment: 'Likely ankle sprain (possible grade 2-3). May require X-ray to rule out fracture.',
      recommendations: 'RICE protocol: Rest, Ice (20 min every 2-3 hours), Compression, Elevation. See orthopedic doctor or sports medicine specialist if pain persists beyond 48 hours.',
      redFlags: JSON.stringify(['severe_swelling', 'inability_to_bear_weight']),
      duration: 300,
      messageCount: 10,
    },
    {
      userId: insertedPatients[4].id, // Noor Abdullah
      language: 'ar',
      conversationHistory: JSON.stringify([
        { role: 'assistant', content: 'مرحباً، كيف يمكنني مساعدتك؟' },
        { role: 'user', content: 'ابني عمره 4 سنوات ولديه حمى متكررة' },
        { role: 'assistant', content: 'ما هي درجة الحرارة؟ وهل يعاني من أعراض أخرى؟' },
        { role: 'user', content: '38.5 درجة، ويعاني من سعال وسيلان الأنف' },
      ]),
      urgencyLevel: 'low',
      chiefComplaint: 'Recurring fever in 4-year-old child with respiratory symptoms',
      symptoms: JSON.stringify(['fever', 'cough', 'runny_nose', 'pediatric']),
      assessment: 'Likely viral upper respiratory infection (common cold). Monitor for complications.',
      recommendations: 'Consult pediatrician if fever persists >3 days or exceeds 39°C. Ensure adequate hydration. Acetaminophen for fever relief. Rest.',
      redFlags: JSON.stringify(['high_fever', 'difficulty_breathing', 'dehydration']),
      duration: 480,
      messageCount: 14,
    },
  ];

  for (let i = 0; i < triageRecords.length; i++) {
    await db.insert(schema.triageRecords).values(triageRecords[i]);
    console.log(`  ✓ Created triage record for ${insertedPatients[i].name}`);
  }

  console.log('\n✅ 5 triage records created successfully\n');

  // ==================== SUMMARY ====================
  console.log('═══════════════════════════════════════════════════');
  console.log('🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • ${doctors.length} doctors created`);
  console.log(`   • ${patients.length} patients created`);
  console.log(`   • ${triageRecords.length} triage records created\n`);
  
  console.log('👨‍⚕️ Doctor Accounts:');
  doctors.forEach(d => {
    console.log(`   • ${d.email} / doctor123 (${d.specialty})`);
  });
  
  console.log('\n👥 Patient Accounts:');
  patients.forEach(p => {
    console.log(`   • ${p.email} / patient123`);
  });
  
  console.log('\n📋 Medical Scenarios Created:');
  console.log('   1. Sara Mohammed - Postpartum mastitis (moderate urgency)');
  console.log('   2. Ali Khalil - Possible cardiac event (HIGH urgency)');
  console.log('   3. Mariam Youssef - Uncontrolled diabetes (moderate urgency)');
  console.log('   4. Hassan Al-Amiri - Sports ankle injury (low urgency)');
  console.log('   5. Noor Abdullah - Child with viral infection (low urgency)');
  
  console.log('\n═══════════════════════════════════════════════════');

} catch (error) {
  console.error('❌ Error seeding database:', error);
  process.exit(1);
} finally {
  await connection.end();
}
