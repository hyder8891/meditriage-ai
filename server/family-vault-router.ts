/**
 * Family Health Vault Router
 * Manage health records for family members
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { familyMembers } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const familyVaultRouter = router({
  /**
   * Get all family members for the current user
   */
  getMembers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const members = await db!
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, ctx.user.id))
      .orderBy(desc(familyMembers.createdAt));
    
    return members.map(member => ({
      ...member,
      allergies: member.allergies ? JSON.parse(member.allergies) : [],
      conditions: member.conditions ? JSON.parse(member.conditions) : [],
    }));
  }),

  /**
   * Add a new family member
   */
  addMember: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      relationship: z.string().min(1),
      dateOfBirth: z.string().optional(),
      bloodType: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      const [member] = await db!
        .insert(familyMembers)
        .values({
          userId: ctx.user.id,
          name: input.name,
          relationship: input.relationship,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          bloodType: input.bloodType || null,
          allergies: input.allergies ? JSON.stringify(input.allergies) : null,
          conditions: input.conditions ? JSON.stringify(input.conditions) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return {
        ...member,
        allergies: input.allergies || [],
        conditions: input.conditions || [],
      };
    }),

  /**
   * Update a family member
   */
  updateMember: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      relationship: z.string().optional(),
      dateOfBirth: z.string().optional(),
      bloodType: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      if (input.name) updateData.name = input.name;
      if (input.relationship) updateData.relationship = input.relationship;
      if (input.dateOfBirth) updateData.dateOfBirth = new Date(input.dateOfBirth);
      if (input.bloodType !== undefined) updateData.bloodType = input.bloodType || null;
      if (input.allergies) updateData.allergies = JSON.stringify(input.allergies);
      if (input.conditions) updateData.conditions = JSON.stringify(input.conditions);
      
      const [member] = await db!
        .update(familyMembers)
        .set(updateData)
        .where(and(
          eq(familyMembers.id, input.id),
          eq(familyMembers.userId, ctx.user.id)
        ))
        .returning();
      
      return {
        ...member,
        allergies: member.allergies ? JSON.parse(member.allergies) : [],
        conditions: member.conditions ? JSON.parse(member.conditions) : [],
      };
    }),

  /**
   * Delete a family member
   */
  deleteMember: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      await db!
        .delete(familyMembers)
        .where(and(
          eq(familyMembers.id, input.id),
          eq(familyMembers.userId, ctx.user.id)
        ));
      
      return { success: true };
    }),

  /**
   * Get a specific family member by ID
   */
  getMember: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      
      const [member] = await db!
        .select()
        .from(familyMembers)
        .where(and(
          eq(familyMembers.id, input.id),
          eq(familyMembers.userId, ctx.user.id)
        ))
        .limit(1);
      
      if (!member) {
        return null;
      }
      
      return {
        ...member,
        allergies: member.allergies ? JSON.parse(member.allergies) : [],
        conditions: member.conditions ? JSON.parse(member.conditions) : [],
      };
    }),
});

export type FamilyVaultRouter = typeof familyVaultRouter;
