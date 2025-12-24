/**
 * Air Quality tRPC Router
 * 
 * Exposes air quality monitoring endpoints for Baghdad and other Iraqi cities.
 * Provides real-time AQI data, health alerts, and historical tracking.
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  IRAQI_CITIES,
  IraqiCity,
  fetchAirQuality,
  storeAQIReading,
  checkAndCreateAlert,
  getCurrentAQI,
  getAQIHistory,
  getActiveAlerts,
  subscribeToAlerts,
  logAQIImpact,
  refreshAllCitiesAQI,
} from "../air-quality-service";

const iraqiCitySchema = z.enum([
  "Baghdad",
  "Basra",
  "Erbil",
  "Mosul",
  "Najaf",
  "Karbala",
  "Sulaymaniyah",
  "Kirkuk",
] as const);

export const airQualityRouter = router({
  /**
   * Get current air quality for a specific city
   */
  getCurrentAQI: publicProcedure
    .input(z.object({
      city: iraqiCitySchema,
    }))
    .query(async ({ input }) => {
      const current = await getCurrentAQI(input.city);
      
      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No air quality data available for ${input.city}`,
        });
      }
      
      return {
        city: current.city,
        aqi: current.aqi,
        category: current.aqiCategory,
        pollutants: {
          pm25: parseFloat(current.pm25 || "0"),
          pm10: parseFloat(current.pm10 || "0"),
          o3: parseFloat(current.o3 || "0"),
          no2: parseFloat(current.no2 || "0"),
          so2: parseFloat(current.so2 || "0"),
          co: parseFloat(current.co || "0"),
        },
        dominantPollutant: current.dominantPollutant,
        weather: {
          temperature: parseFloat(current.temperature || "0"),
          humidity: current.humidity || 0,
          windSpeed: parseFloat(current.windSpeed || "0"),
        },
        timestamp: current.timestamp,
        dataSource: current.dataSource,
      };
    }),

  /**
   * Get AQI history for a city
   */
  getAQIHistory: publicProcedure
    .input(z.object({
      city: iraqiCitySchema,
      hoursBack: z.number().min(1).max(168).default(24), // Max 1 week
    }))
    .query(async ({ input }) => {
      const history = await getAQIHistory(input.city, input.hoursBack);
      
      return history.map(reading => ({
        aqi: reading.aqi,
        category: reading.aqiCategory,
        pm25: parseFloat(reading.pm25 || "0"),
        pm10: parseFloat(reading.pm10 || "0"),
        timestamp: reading.timestamp,
      }));
    }),

  /**
   * Get active alerts for a city (or all cities)
   */
  getActiveAlerts: publicProcedure
    .input(z.object({
      city: iraqiCitySchema.optional(),
    }).optional())
    .query(async ({ input }) => {
      const alerts = await getActiveAlerts(input?.city);
      
      return alerts.map(alert => ({
        id: alert.id,
        city: alert.city,
        alertType: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        healthRecommendations: JSON.parse(alert.healthRecommendations),
        affectedGroups: JSON.parse(alert.affectedGroups),
        triggerAQI: alert.triggerAQI,
        startTime: alert.startTime,
      }));
    }),

  /**
   * Refresh air quality data for a specific city
   */
  refreshCityAQI: publicProcedure
    .input(z.object({
      city: iraqiCitySchema,
    }))
    .mutation(async ({ input }) => {
      try {
        const data = await fetchAirQuality(input.city);
        await storeAQIReading(input.city, data);
        const alertResult = await checkAndCreateAlert(input.city, data);
        
        return {
          success: true,
          aqi: data.aqi,
          category: data.category,
          alertCreated: alertResult.alertCreated,
          alertType: "alertType" in alertResult ? alertResult.alertType : undefined,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to refresh AQI data",
        });
      }
    }),

  /**
   * Refresh all Iraqi cities (admin/cron use)
   */
  refreshAllCities: publicProcedure
    .mutation(async () => {
      const results = await refreshAllCitiesAQI();
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      return {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results,
      };
    }),

  /**
   * Subscribe to air quality alerts (protected - requires login)
   */
  subscribeToAlerts: protectedProcedure
    .input(z.object({
      city: iraqiCitySchema,
      minAlertSeverity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      notifyViaEmail: z.boolean().default(false),
      notifyViaPush: z.boolean().default(true),
      hasRespiratoryCondition: z.boolean().default(false),
      hasCardiacCondition: z.boolean().default(false),
      isPregnant: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await subscribeToAlerts(ctx.user.id, input.city, {
        minAlertSeverity: input.minAlertSeverity,
        notifyViaEmail: input.notifyViaEmail,
        notifyViaPush: input.notifyViaPush,
        hasRespiratoryCondition: input.hasRespiratoryCondition,
        hasCardiacCondition: input.hasCardiacCondition,
        isPregnant: input.isPregnant,
      });
      
      return {
        success: true,
        subscriptionId: subscription.insertId,
      };
    }),

  /**
   * Log AQI impact on patient symptoms (protected)
   */
  logAQIImpact: protectedProcedure
    .input(z.object({
      triageRecordId: z.number().nullable(),
      symptoms: z.array(z.string()),
      symptomSeverity: z.enum(["mild", "moderate", "severe"]),
      city: iraqiCitySchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const log = await logAQIImpact(
        ctx.user.id,
        input.triageRecordId,
        input.symptoms,
        input.symptomSeverity,
        input.city
      );
      
      if (!log) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No current AQI data available for correlation",
        });
      }
      
      return {
        success: true,
        logId: log.insertId,
        likelyAQIRelated: log.likelyAQIRelated,
        correlationConfidence: log.correlationConfidence,
      };
    }),

  /**
   * Get list of available Iraqi cities
   */
  getCities: publicProcedure
    .query(() => {
      return Object.entries(IRAQI_CITIES).map(([name, coords]) => ({
        name: name as IraqiCity,
        latitude: coords.lat,
        longitude: coords.lon,
      }));
    }),

  /**
   * Get AQI health recommendations based on current level
   */
  getHealthRecommendations: publicProcedure
    .input(z.object({
      aqi: z.number().min(0).max(500),
      hasRespiratoryCondition: z.boolean().default(false),
      hasCardiacCondition: z.boolean().default(false),
      isPregnant: z.boolean().default(false),
      isElderly: z.boolean().default(false),
      isChild: z.boolean().default(false),
    }))
    .query(({ input }) => {
      const { aqi, hasRespiratoryCondition, hasCardiacCondition, isPregnant, isElderly, isChild } = input;
      
      const sensitiveGroup = hasRespiratoryCondition || hasCardiacCondition || isPregnant || isElderly || isChild;
      
      let category: string;
      let recommendations: string[];
      let riskLevel: string;
      
      if (aqi <= 50) {
        category = "Good";
        riskLevel = "low";
        recommendations = [
          "Air quality is satisfactory",
          "Ideal for outdoor activities",
          "No health concerns for any group",
        ];
      } else if (aqi <= 100) {
        category = "Moderate";
        riskLevel = sensitiveGroup ? "medium" : "low";
        recommendations = [
          "Air quality is acceptable for most",
          sensitiveGroup ? "Consider reducing prolonged outdoor exertion" : "Enjoy outdoor activities",
          "Monitor symptoms if you have respiratory conditions",
        ];
      } else if (aqi <= 150) {
        category = "Unhealthy for Sensitive Groups";
        riskLevel = sensitiveGroup ? "high" : "medium";
        recommendations = [
          sensitiveGroup ? "Limit outdoor activities" : "Reduce prolonged outdoor exertion",
          "Wear masks if you must go outside",
          "Keep windows closed",
          "Use air purifiers indoors",
          sensitiveGroup ? "Have rescue medications accessible" : "Monitor air quality updates",
        ];
      } else if (aqi <= 200) {
        category = "Unhealthy";
        riskLevel = "high";
        recommendations = [
          "Everyone should limit outdoor activities",
          "Wear N95 masks when outside",
          "Close all windows and doors",
          "Use air purifiers",
          "Avoid strenuous activities",
          sensitiveGroup ? "Consider staying indoors entirely" : "Monitor symptoms closely",
        ];
      } else if (aqi <= 300) {
        category = "Very Unhealthy";
        riskLevel = "critical";
        recommendations = [
          "Stay indoors as much as possible",
          "Wear N95 masks if you must go outside",
          "Seal windows and doors",
          "Run air purifiers continuously",
          "Avoid all outdoor physical activities",
          "Have emergency medications ready",
          sensitiveGroup ? "Consider relocating temporarily if possible" : "Monitor health closely",
        ];
      } else {
        category = "Hazardous";
        riskLevel = "critical";
        recommendations = [
          "⚠️ STAY INDOORS - Do not go outside",
          "Seal all windows and doors with tape if possible",
          "Run air purifiers on maximum",
          "Avoid any physical exertion",
          "Have emergency contacts ready",
          "Monitor news for evacuation orders",
          sensitiveGroup ? "Seek medical attention if symptoms worsen" : "Everyone is at risk",
        ];
      }
      
      return {
        aqi,
        category,
        riskLevel,
        recommendations,
        sensitiveGroup,
      };
    }),
});
