import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import { users } from "./drizzle/schema.ts";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Create test doctor with simple password
const email = "doctor@test.com";
const password = "doctor123";
const passwordHash = await bcrypt.hash(password, 10);

try {
  await db.insert(users).values({
    email,
    passwordHash,
    role: "clinician",
    verified: true,
    name: "Dr. Test Doctor",
    emailVerified: true,
  });
  
  console.log("✅ Test doctor created successfully!");
  console.log("Email:", email);
  console.log("Password:", password);
} catch (error) {
  if (error.code === "ER_DUP_ENTRY") {
    console.log("⚠️ Doctor already exists, updating password...");
    await db.update(users)
      .set({ passwordHash, verified: true })
      .where(eq(users.email, email));
    console.log("✅ Password updated!");
    console.log("Email:", email);
    console.log("Password:", password);
  } else {
    console.error("Error:", error.message);
  }
}

await connection.end();
