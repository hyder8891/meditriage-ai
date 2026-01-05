import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq, like, or } from 'drizzle-orm';

describe('User ID Check', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database connection failed');
  });

  it('should find Hhwaljanabi user and show all IDs', async () => {
    const results = await db!
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        openId: users.openId,
      })
      .from(users)
      .where(
        or(
          like(users.name, '%Hhwal%'),
          like(users.email, '%Hhwal%')
        )
      );

    console.log('\n=== Hhwaljanabi Users ===');
    for (const user of results) {
      console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}, OpenID: ${user.openId}`);
    }

    expect(results.length).toBeGreaterThan(0);
  });

  it('should find all users with role clinician or doctor', async () => {
    const results = await db!
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        openId: users.openId,
      })
      .from(users)
      .where(
        or(
          eq(users.role, 'clinician'),
          eq(users.role, 'doctor')
        )
      )
      .limit(10);

    console.log('\n=== Clinicians/Doctors ===');
    for (const user of results) {
      console.log(`ID: ${user.id}, Name: ${user.name}, Role: ${user.role}, OpenID: ${user.openId}`);
    }

    expect(results.length).toBeGreaterThan(0);
  });

  it('should check if there are duplicate users', async () => {
    // Check for users with same email but different IDs
    const allUsers = await db!
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        openId: users.openId,
      })
      .from(users)
      .where(
        or(
          like(users.name, '%Hhwal%'),
          like(users.email, '%Hhwal%'),
          like(users.name, '%Wen%'),
          like(users.email, '%nanjing%')
        )
      );

    console.log('\n=== Relevant Users ===');
    for (const user of allUsers) {
      console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, OpenID: ${user.openId}`);
    }

    expect(allUsers.length).toBeGreaterThan(0);
  });
});
