import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('Testing clinics data...\n');

// Count total clinics
const allClinics = await db.select().from(schema.clinics);
console.log(`✓ Total clinics in database: ${allClinics.length}`);

// Group by city
const cityCounts = {};
allClinics.forEach(clinic => {
  cityCounts[clinic.city] = (cityCounts[clinic.city] || 0) + 1;
});

console.log('\n📍 Clinics by city:');
Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).forEach(([city, count]) => {
  console.log(`  ${city}: ${count} facilities`);
});

// Sample facilities
console.log('\n🏥 Sample facilities:');
allClinics.slice(0, 5).forEach(clinic => {
  console.log(`  - ${clinic.name} (${clinic.arabicName})`);
  console.log(`    📍 ${clinic.city} | 📞 ${clinic.phone || 'N/A'}`);
  console.log(`    🏷️  ${clinic.subscriptionTier} tier`);
});

await connection.end();
console.log('\n✅ Test complete!');
