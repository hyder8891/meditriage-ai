import { getDb } from '../server/db.ts';
import { users } from '../drizzle/schema.ts';

const db = await getDb();
const allUsers = await db.select({
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  phoneNumber: users.phoneNumber,
  verified: users.verified,
  emailVerified: users.emailVerified,
  loginMethod: users.loginMethod
}).from(users);

console.log('=== ALL USER ACCOUNTS IN DATABASE ===\n');
console.log('Total users:', allUsers.length);

console.log('\n--- ADMINS ---');
const admins = allUsers.filter(u => u.role === 'admin');
if (admins.length === 0) {
  console.log('(No admin accounts)');
} else {
  admins.forEach(u => {
    console.log(`  • ${u.email} - ${u.name} (ID: ${u.id})`);
  });
}

console.log('\n--- DOCTORS/CLINICIANS ---');
const doctors = allUsers.filter(u => u.role === 'clinician' || u.role === 'doctor');
if (doctors.length === 0) {
  console.log('(No doctor accounts)');
} else {
  doctors.forEach(u => {
    console.log(`  • ${u.email} - ${u.name} (ID: ${u.id}, Verified: ${u.verified})`);
  });
}

console.log('\n--- PATIENTS ---');
const patients = allUsers.filter(u => u.role === 'patient');
if (patients.length === 0) {
  console.log('(No patient accounts)');
} else {
  patients.forEach(u => {
    console.log(`  • ${u.email || u.phoneNumber} - ${u.name} (ID: ${u.id})`);
  });
}

console.log('\n--- EMAIL SUMMARY ---');
const withEmail = allUsers.filter(u => u.email && u.email.length > 0);
const withoutEmail = allUsers.filter(u => !u.email || u.email.length === 0);
console.log(`Users with email: ${withEmail.length}`);
console.log(`Users without email (phone only): ${withoutEmail.length}`);

process.exit(0);
