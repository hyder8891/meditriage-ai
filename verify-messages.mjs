import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;
const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🔍 Verifying seeded data...\n');

// Count messages
const messages = await db.select().from(schema.messages);
console.log(`✅ Total messages: ${messages.length}`);

// Count connections
const connections = await db.select().from(schema.doctorPatientRelationships);
console.log(`✅ Total doctor-patient connections: ${connections.length}`);

// Show sample messages
console.log('\n📧 Sample messages:');
for (let i = 0; i < Math.min(5, messages.length); i++) {
  const msg = messages[i];
  console.log(`   ${i+1}. From user ${msg.senderId} to ${msg.recipientId}: ${msg.content.substring(0, 50)}...`);
}

await connection.end();
