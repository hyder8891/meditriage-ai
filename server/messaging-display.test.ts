import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, messages } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Messaging Display Name Tests", () => {
  let testUser1Id: number;
  let testUser2Id: number;
  let testUser3Id: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create test users with different name scenarios
    const timestamp = Date.now();
    
    // User 1: Has a proper name
    const [user1] = await db.insert(users).values({
      name: "Dr. Ahmed Hassan",
      email: `ahmed${timestamp}@test.com`,
      phoneNumber: `+96477012${timestamp.toString().slice(-5)}`,
      role: "doctor",
      specialty: "Cardiology",
    });
    testUser1Id = user1.insertId;

    // User 2: Has generic "User [ID]" name (simulating the bug)
    const [user2] = await db.insert(users).values({
      name: `User ${timestamp}`,
      email: null,
      phoneNumber: `+96477098${timestamp.toString().slice(-5)}`,
      role: "patient",
    });
    testUser2Id = user2.insertId;

    // User 3: Has null name
    const [user3] = await db.insert(users).values({
      name: null,
      email: `patient${timestamp}@test.com`,
      phoneNumber: null,
      role: "patient",
    });
    testUser3Id = user3.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test users
    await db.delete(users).where(eq(users.id, testUser1Id));
    await db.delete(users).where(eq(users.id, testUser2Id));
    await db.delete(users).where(eq(users.id, testUser3Id));
  });

  it("should return proper name for user with real name", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
      })
      .from(users)
      .where(eq(users.id, testUser1Id))
      .limit(1);

    // Display name logic
    let displayName = user?.name || '';
    if (!displayName || displayName.startsWith('User ')) {
      displayName = user?.phoneNumber || user?.email || `User ${user?.id}`;
    }

    expect(displayName).toBe("Dr. Ahmed Hassan");
    expect(displayName).not.toContain("User ");
  });

  it("should use phone number for user with generic 'User [ID]' name", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
      })
      .from(users)
      .where(eq(users.id, testUser2Id))
      .limit(1);

    // Display name logic (same as in b2b2c-router.ts)
    let displayName = user?.name || '';
    if (!displayName || displayName.startsWith('User ')) {
      displayName = user?.phoneNumber || user?.email || `User ${user?.id}`;
    }

    expect(displayName).toMatch(/^\+96477098\d{5}$/);
    expect(displayName).not.toMatch(/^User \d+$/);
  });

  it("should use email for user with null name and no phone", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
      })
      .from(users)
      .where(eq(users.id, testUser3Id))
      .limit(1);

    // Display name logic
    let displayName = user?.name || '';
    if (!displayName || displayName.startsWith('User ')) {
      displayName = user?.phoneNumber || user?.email || `User ${user?.id}`;
    }

    expect(displayName).toMatch(/^patient\d+@test\.com$/);
  });

  it("should fallback to 'User [ID]' only when no other info available", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create a user with absolutely no identifying info
    const [user] = await db.insert(users).values({
      name: null,
      email: null,
      phoneNumber: null,
      role: "patient",
    });
    const userId = user.insertId;

    const [fetchedUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Display name logic
    let displayName = fetchedUser?.name || '';
    if (!displayName || displayName.startsWith('User ')) {
      displayName = fetchedUser?.phoneNumber || fetchedUser?.email || `User ${fetchedUser?.id}`;
    }

    expect(displayName).toBe(`User ${userId}`);

    // Clean up
    await db.delete(users).where(eq(users.id, userId));
  });
});
