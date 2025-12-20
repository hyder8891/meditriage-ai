import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('💬 Seeding database with doctor-patient connections and messages...\n');

try {
  // Find existing users
  console.log('🔍 Finding existing users...');
  
  const doctors = await db.select().from(schema.users).where(eq(schema.users.role, 'doctor'));
  const patients = await db.select().from(schema.users).where(eq(schema.users.role, 'patient'));
  const admin = await db.select().from(schema.users).where(eq(schema.users.email, 'admin@admin.com'));
  
  if (doctors.length === 0 || patients.length === 0) {
    console.error('❌ No doctors or patients found. Please run seed-profiles.mjs first.');
    process.exit(1);
  }
  
  console.log(`  ✓ Found ${doctors.length} doctors and ${patients.length} patients\n`);
  
  // ==================== DOCTOR-PATIENT CONNECTIONS ====================
  console.log('🔗 Creating doctor-patient connections...');
  
  const connections = [
    {
      doctorId: doctors[0].id, // Dr. Ahmed Al-Husseini (Emergency Medicine)
      patientId: patients[1].id, // Ali Khalil (chest pain patient)
      status: 'active',
      connectionDate: new Date('2025-12-15'),
    },
    {
      doctorId: doctors[1].id, // Dr. Fatima Al-Najjar (Pediatrics)
      patientId: patients[4].id, // Noor Abdullah (child with fever)
      status: 'active',
      connectionDate: new Date('2025-12-16'),
    },
    {
      doctorId: doctors[2].id, // Dr. Omar Al-Jubouri (Cardiology)
      patientId: patients[1].id, // Ali Khalil (chest pain patient - also connected to cardiologist)
      status: 'active',
      connectionDate: new Date('2025-12-17'),
    },
    {
      doctorId: doctors[3].id, // Dr. Layla Hassan (OB/GYN)
      patientId: patients[0].id, // Sara Mohammed (postpartum patient)
      status: 'active',
      connectionDate: new Date('2025-12-14'),
    },
    {
      doctorId: doctors[4].id, // Dr. Karim Al-Baghdadi (Internal Medicine)
      patientId: patients[2].id, // Mariam Youssef (diabetes patient)
      status: 'active',
      connectionDate: new Date('2025-12-18'),
    },
  ];
  
  for (const connection of connections) {
    await db.insert(schema.doctorPatientRelationships).values(connection);
    const doctor = doctors.find(d => d.id === connection.doctorId);
    const patient = patients.find(p => p.id === connection.patientId);
    console.log(`  ✓ Connected: ${doctor.name} ↔ ${patient.name}`);
  }
  
  console.log('\n✅ 5 doctor-patient connections created\n');
  
  // ==================== MESSAGES ====================
  console.log('💬 Creating message conversations...');
  
  const messages = [
    // Conversation 1: Dr. Ahmed (Emergency) ↔ Ali Khalil (chest pain)
    {
      senderId: patients[1].id,
      recipientId: doctors[0].id,
      content: 'دكتور أحمد، أنا قلق بشأن الألم في صدري. هل يمكنك مساعدتي؟',
      isRead: true,
      createdAt: new Date('2025-12-15T10:30:00'),
    },
    {
      senderId: doctors[0].id,
      recipientId: patients[1].id,
      content: 'مرحباً علي، أنا هنا لمساعدتك. متى بدأ الألم؟ وهل يمتد إلى أي مكان آخر؟',
      isRead: true,
      createdAt: new Date('2025-12-15T10:35:00'),
    },
    {
      senderId: patients[1].id,
      recipientId: doctors[0].id,
      content: 'بدأ منذ ساعتين. الألم يمتد إلى ذراعي الأيسر وأشعر بضيق في التنفس.',
      isRead: true,
      createdAt: new Date('2025-12-15T10:37:00'),
    },
    {
      senderId: doctors[0].id,
      recipientId: patients[1].id,
      content: 'هذه أعراض خطيرة. يجب أن تذهب إلى الطوارئ فوراً. اتصل بالإسعاف (122) أو اطلب من أحد أن يأخذك إلى المستشفى. لا تقود بنفسك.',
      isRead: true,
      createdAt: new Date('2025-12-15T10:38:00'),
    },
    {
      senderId: patients[1].id,
      recipientId: doctors[0].id,
      content: 'شكراً دكتور، أنا في الطريق إلى المستشفى الآن.',
      isRead: true,
      createdAt: new Date('2025-12-15T10:45:00'),
    },
    {
      senderId: doctors[0].id,
      recipientId: patients[1].id,
      content: 'ممتاز. تابع معي بعد الفحص في المستشفى. سأحولك أيضاً إلى الدكتور عمر الجبوري، أخصائي القلب، للمتابعة.',
      isRead: false,
      createdAt: new Date('2025-12-15T11:00:00'),
    },
    
    // Conversation 2: Dr. Fatima (Pediatrics) ↔ Noor Abdullah (child fever)
    {
      senderId: patients[4].id,
      recipientId: doctors[1].id,
      content: 'دكتورة فاطمة، ابني لا يزال يعاني من الحمى. ماذا أفعل؟',
      isRead: true,
      createdAt: new Date('2025-12-16T14:20:00'),
    },
    {
      senderId: doctors[1].id,
      recipientId: patients[4].id,
      content: 'مرحباً نور، كم يوماً استمرت الحمى؟ وما هي درجة الحرارة الآن؟',
      isRead: true,
      createdAt: new Date('2025-12-16T14:25:00'),
    },
    {
      senderId: patients[4].id,
      recipientId: doctors[1].id,
      content: 'ثلاثة أيام. درجة الحرارة الآن 38.7 درجة.',
      isRead: true,
      createdAt: new Date('2025-12-16T14:27:00'),
    },
    {
      senderId: doctors[1].id,
      recipientId: patients[4].id,
      content: 'أعطيه باراسيتامول (Paracetamol) حسب وزنه. تأكدي من شرب السوائل بكثرة. إذا استمرت الحمى أكثر من 5 أيام أو تجاوزت 39 درجة، أحضريه للعيادة.',
      isRead: true,
      createdAt: new Date('2025-12-16T14:30:00'),
    },
    {
      senderId: patients[4].id,
      recipientId: doctors[1].id,
      content: 'شكراً دكتورة. هل يمكنني إعطاؤه أي شيء آخر للسعال؟',
      isRead: false,
      createdAt: new Date('2025-12-16T15:00:00'),
    },
    
    // Conversation 3: Dr. Omar (Cardiology) ↔ Ali Khalil (follow-up)
    {
      senderId: patients[1].id,
      recipientId: doctors[2].id,
      content: 'دكتور عمر، أنا علي خليل. حولني إليك الدكتور أحمد بعد زيارتي للطوارئ.',
      isRead: true,
      createdAt: new Date('2025-12-17T09:00:00'),
    },
    {
      senderId: doctors[2].id,
      recipientId: patients[1].id,
      content: 'أهلاً علي، نعم راجعت ملفك الطبي. كيف تشعر الآن؟ هل لديك نتائج الفحوصات من المستشفى؟',
      isRead: true,
      createdAt: new Date('2025-12-17T09:15:00'),
    },
    {
      senderId: patients[1].id,
      recipientId: doctors[2].id,
      content: 'أشعر بتحسن. قالوا في المستشفى أنه ذبحة صدرية. أعطوني أدوية. هل يمكنني إرسال التقرير؟',
      isRead: true,
      createdAt: new Date('2025-12-17T09:20:00'),
    },
    {
      senderId: doctors[2].id,
      recipientId: patients[1].id,
      content: 'نعم، أرسل التقرير من فضلك. سأراجعه وأحدد موعداً لك في العيادة لإجراء فحص شامل للقلب.',
      isRead: false,
      createdAt: new Date('2025-12-17T09:25:00'),
    },
    
    // Conversation 4: Dr. Layla (OB/GYN) ↔ Sara Mohammed (postpartum)
    {
      senderId: patients[0].id,
      recipientId: doctors[3].id,
      content: 'دكتورة ليلى، الألم في ثديي يزداد سوءاً. هل يجب أن أتوقف عن الرضاعة؟',
      isRead: true,
      createdAt: new Date('2025-12-14T16:00:00'),
    },
    {
      senderId: doctors[3].id,
      recipientId: patients[0].id,
      content: 'لا يا سارة، لا تتوقفي عن الرضاعة. هذا التهاب في الثدي (mastitis). سأصف لك مضاداً حيوياً. استمري في الرضاعة لأن ذلك يساعد في التعافي.',
      isRead: true,
      createdAt: new Date('2025-12-14T16:10:00'),
    },
    {
      senderId: patients[0].id,
      recipientId: doctors[3].id,
      content: 'حسناً دكتورة. هل يمكنني استخدام كمادات دافئة؟',
      isRead: true,
      createdAt: new Date('2025-12-14T16:15:00'),
    },
    {
      senderId: doctors[3].id,
      recipientId: patients[0].id,
      content: 'نعم، الكمادات الدافئة ممتازة قبل الرضاعة. وتأكدي من شرب الكثير من الماء. إذا لم تتحسني خلال 48 ساعة، اتصلي بي فوراً.',
      isRead: true,
      createdAt: new Date('2025-12-14T16:18:00'),
    },
    {
      senderId: patients[0].id,
      recipientId: doctors[3].id,
      content: 'شكراً جزيلاً دكتورة. أشعر بتحسن بعد يومين من المضاد الحيوي.',
      isRead: false,
      createdAt: new Date('2025-12-16T10:00:00'),
    },
    
    // Conversation 5: Dr. Karim (Internal Medicine) ↔ Mariam Youssef (diabetes)
    {
      senderId: patients[2].id,
      recipientId: doctors[4].id,
      content: 'دكتور كريم، مستوى السكر لا يزال مرتفعاً رغم الأدوية. 280 ملغ/ديسيلتر.',
      isRead: true,
      createdAt: new Date('2025-12-18T11:00:00'),
    },
    {
      senderId: doctors[4].id,
      recipientId: patients[2].id,
      content: 'مرحباً مريم، هذا مقلق. هل تتناولين الأدوية بانتظام؟ وماذا عن نظامك الغذائي؟',
      isRead: true,
      createdAt: new Date('2025-12-18T11:15:00'),
    },
    {
      senderId: patients[2].id,
      recipientId: doctors[4].id,
      content: 'نعم، أتناول الأدوية بانتظام. لكن أحياناً أنسى قياس السكر بعد الأكل.',
      isRead: true,
      createdAt: new Date('2025-12-18T11:20:00'),
    },
    {
      senderId: doctors[4].id,
      recipientId: patients[2].id,
      content: 'يجب قياس السكر بعد الأكل بساعتين. سأزيد جرعة الميتفورمين. أيضاً، أريدك أن تسجلي كل ما تأكلينه لمدة أسبوع.',
      isRead: true,
      createdAt: new Date('2025-12-18T11:25:00'),
    },
    {
      senderId: patients[2].id,
      recipientId: doctors[4].id,
      content: 'حسناً دكتور. هل يمكنني تناول التمر؟ أحبه كثيراً.',
      isRead: false,
      createdAt: new Date('2025-12-18T12:00:00'),
    },
    {
      senderId: doctors[4].id,
      recipientId: patients[2].id,
      content: 'التمر يحتوي على سكر عالٍ. يمكنك تناول حبة أو حبتين فقط في اليوم، ويفضل بعد وجبة رئيسية وليس على معدة فارغة.',
      isRead: false,
      createdAt: new Date('2025-12-18T12:10:00'),
    },
  ];
  
  for (const message of messages) {
    await db.insert(schema.messages).values(message);
    const sender = [...doctors, ...patients].find(u => u.id === message.senderId);
    const receiver = [...doctors, ...patients].find(u => u.id === message.recipientId);
    console.log(`  ✓ Message: ${sender.name} → ${receiver.name}`);
  }
  
  console.log(`\n✅ ${messages.length} messages created successfully\n`);
  
  // ==================== SUMMARY ====================
  console.log('═══════════════════════════════════════════════════');
  console.log('🎉 Message seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • ${connections.length} doctor-patient connections created`);
  console.log(`   • ${messages.length} messages created\n`);
  
  console.log('💬 Conversations Created:');
  console.log('   1. Dr. Ahmed Al-Husseini ↔ Ali Khalil (6 messages - Emergency chest pain)');
  console.log('   2. Dr. Fatima Al-Najjar ↔ Noor Abdullah (5 messages - Pediatric fever)');
  console.log('   3. Dr. Omar Al-Jubouri ↔ Ali Khalil (4 messages - Cardiology follow-up)');
  console.log('   4. Dr. Layla Hassan ↔ Sara Mohammed (5 messages - Postpartum mastitis)');
  console.log('   5. Dr. Karim Al-Baghdadi ↔ Mariam Youssef (6 messages - Diabetes management)\n');
  
  console.log('👨‍💼 Admin Access:');
  if (admin.length > 0) {
    console.log(`   • Admin can view all messages at: /clinician/messages`);
    console.log(`   • Login: admin@admin.com / admin880088`);
  } else {
    console.log('   ⚠️  No admin account found. Create one to view messages.');
  }
  
  console.log('\n✨ Next Steps:');
  console.log('   1. Login as admin: admin@admin.com / admin880088');
  console.log('   2. Navigate to Messages page in clinician dashboard');
  console.log('   3. View all doctor-patient conversations');
  console.log('   4. Test messaging functionality\n');
  
} catch (error) {
  console.error('❌ Error seeding messages:', error);
  process.exit(1);
} finally {
  await connection.end();
  console.log('🔌 Database connection closed');
}
