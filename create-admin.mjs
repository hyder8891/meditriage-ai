import { drizzle } from "drizzle-orm/mysql2";
import { users } from "./drizzle/schema.js";
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

async function createAdminUser() {
  const email = 'admin@mydoctor.iq';
  const password = 'Admin123!';
  const passwordHash = await bcrypt.hash(password, 10);
  
  try {
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existing.length > 0) {
      // Update existing user
      await db.update(users)
        .set({
          password_hash: passwordHash,
          role: 'admin',
          loginMethod: 'email',
          name: 'Admin User'
        })
        .where(eq(users.email, email));
      console.log(`✅ Updated admin user: ${email}`);
    } else {
      // Create new user
      await db.insert(users).values({
        email,
        password_hash: passwordHash,
        role: 'admin',
        loginMethod: 'email',
        name: 'Admin User',
        openId: `email_${Date.now()}`,
        lastSignedIn: new Date()
      });
      console.log(`✅ Created admin user: ${email}`);
    }
    
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`\nYou can now login with these credentials!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

createAdminUser();
