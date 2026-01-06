/**
 * Clinic Finder Router
 * API endpoints for finding clinics in Iraq based on location
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { 
  getClinicsByGovernorate, 
  getClinicsByCity, 
  searchClinics, 
  getClinicById,
  getAllClinics,
  getClinicCountByGovernorate,
  getEmergencyClinics,
  getRecommendedClinics,
  getTotalClinicCount
} from "./clinics";
import { getUserLocation, getAllGovernorates, getGovernorateByName } from "./geolocation";

export const clinicFinderRouter = router({
  /**
   * Get user's location from IP and return nearby clinics
   */
  getNearbyClinics: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(5),
      urgencyLevel: z.enum(['critical', 'urgent', 'standard', 'non-urgent']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      // Get client IP from request headers
      const forwardedFor = ctx.req?.headers?.['x-forwarded-for'];
      const realIp = ctx.req?.headers?.['x-real-ip'];
      let clientIp = '127.0.0.1';
      
      if (typeof forwardedFor === 'string') {
        clientIp = forwardedFor.split(',')[0].trim();
      } else if (typeof realIp === 'string') {
        clientIp = realIp;
      } else if (ctx.req?.socket?.remoteAddress) {
        clientIp = ctx.req.socket.remoteAddress;
      }
      
      // Get location from IP
      const location = await getUserLocation(clientIp);
      
      if (!location || !location.governorate) {
        // Default to Baghdad if location detection fails
        const clinics = await getClinicsByGovernorate('Baghdad', input?.limit || 5);
        return {
          location: {
            governorate: 'Baghdad',
            governorateArabic: 'بغداد',
            city: 'Baghdad',
            country: 'Iraq',
            detected: false,
          },
          clinics,
        };
      }
      
      // Get clinics based on urgency level if provided
      let clinics;
      if (input?.urgencyLevel) {
        clinics = await getRecommendedClinics(
          location.governorate,
          input.urgencyLevel,
          undefined,
          input?.limit || 5
        );
      } else {
        clinics = await getClinicsByGovernorate(location.governorate, input?.limit || 5);
      }
      
      // Get governorate details for Arabic name
      const governorate = await getGovernorateByName(location.governorate);
      
      return {
        location: {
          governorate: location.governorate,
          governorateArabic: governorate?.nameArabic || location.governorate,
          city: location.city,
          country: location.country,
          detected: true,
        },
        clinics,
      };
    }),

  /**
   * Get clinics by governorate name
   */
  getByGovernorate: publicProcedure
    .input(z.object({
      governorate: z.string(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }) => {
      const clinics = await getClinicsByGovernorate(input.governorate, input.limit);
      const governorate = await getGovernorateByName(input.governorate);
      
      return {
        governorate: {
          name: input.governorate,
          nameArabic: governorate?.nameArabic,
          capital: governorate?.capital,
        },
        clinics,
        total: clinics.length,
      };
    }),

  /**
   * Get clinics by city name
   */
  getByCity: publicProcedure
    .input(z.object({
      city: z.string(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }) => {
      const clinics = await getClinicsByCity(input.city, input.limit);
      return {
        city: input.city,
        clinics,
        total: clinics.length,
      };
    }),

  /**
   * Search clinics with filters
   */
  search: publicProcedure
    .input(z.object({
      governorate: z.string().optional(),
      city: z.string().optional(),
      facilityType: z.enum([
        'teaching_hospital',
        'general_hospital',
        'private_hospital',
        'military_hospital',
        'maternity_hospital',
        'children_hospital',
        'specialized_hospital',
        'medical_city',
        'clinic',
        'health_center',
        'emergency_center'
      ]).optional(),
      hasEmergency: z.boolean().optional(),
      has24Hours: z.boolean().optional(),
      limit: z.number().min(1).max(50).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const clinics = await searchClinics(input);
      return {
        clinics,
        total: clinics.length,
        hasMore: clinics.length === input.limit,
      };
    }),

  /**
   * Get clinic by ID
   */
  getById: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const clinic = await getClinicById(input.id);
      if (!clinic) {
        throw new Error('Clinic not found');
      }
      return clinic;
    }),

  /**
   * Get all governorates with clinic counts
   */
  getGovernorates: publicProcedure
    .query(async () => {
      const [governorates, clinicCounts] = await Promise.all([
        getAllGovernorates(),
        getClinicCountByGovernorate(),
      ]);
      
      // Merge clinic counts with governorate data
      const result = governorates.map(gov => {
        const countData = clinicCounts.find(c => c.governorate === gov.name);
        return {
          ...gov,
          clinicCount: countData?.count || 0,
        };
      });
      
      return result;
    }),

  /**
   * Get emergency clinics in a governorate
   */
  getEmergency: publicProcedure
    .input(z.object({
      governorate: z.string(),
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ input }) => {
      const clinics = await getEmergencyClinics(input.governorate, input.limit);
      return {
        governorate: input.governorate,
        clinics,
        total: clinics.length,
      };
    }),

  /**
   * Get recommended clinics based on triage assessment
   */
  getRecommended: publicProcedure
    .input(z.object({
      governorate: z.string(),
      urgencyLevel: z.enum(['critical', 'urgent', 'standard', 'non-urgent']),
      specialty: z.string().optional(),
      limit: z.number().min(1).max(10).default(3),
    }))
    .query(async ({ input }) => {
      const clinics = await getRecommendedClinics(
        input.governorate,
        input.urgencyLevel,
        input.specialty,
        input.limit
      );
      
      const governorate = await getGovernorateByName(input.governorate);
      
      return {
        governorate: {
          name: input.governorate,
          nameArabic: governorate?.nameArabic,
        },
        urgencyLevel: input.urgencyLevel,
        clinics,
        total: clinics.length,
      };
    }),

  /**
   * Get clinic statistics
   */
  getStats: publicProcedure
    .query(async () => {
      const [totalClinics, clinicsByGovernorate, governorates] = await Promise.all([
        getTotalClinicCount(),
        getClinicCountByGovernorate(),
        getAllGovernorates(),
      ]);
      
      return {
        totalClinics,
        totalGovernorates: governorates.length,
        clinicsByGovernorate,
      };
    }),
});
