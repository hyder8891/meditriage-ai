/**
 * Wearable Integration tRPC Router
 * API endpoints for connecting and syncing wearable devices
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  connectWearableDevice,
  disconnectWearableDevice,
  getUserWearableConnections,
  syncAppleWatchData,
  syncFitbitData,
  getRecentWearableData,
  getMetricData,
  getDailySummary,
  computeDailySummary,
  getWearableContextForAI,
} from "./wearable-integration";

// ============================================================================
// Input Schemas
// ============================================================================

const deviceTypeSchema = z.enum(["apple_watch", "fitbit"]);

const metricTypeSchema = z.enum([
  "heart_rate",
  "steps",
  "distance",
  "calories",
  "active_minutes",
  "sleep_duration",
  "sleep_quality",
  "blood_oxygen",
  "hrv",
  "resting_heart_rate",
  "blood_pressure_systolic",
  "blood_pressure_diastolic",
  "respiratory_rate",
  "body_temperature",
  "weight",
  "bmi",
]);

const connectDeviceSchema = z.object({
  deviceType: deviceTypeSchema,
  deviceId: z.string().min(1),
  deviceName: z.string().optional(),
  deviceModel: z.string().optional(),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().optional(), // ISO date string
  enabledMetrics: z.array(metricTypeSchema),
});

const disconnectDeviceSchema = z.object({
  connectionId: z.number().int().positive(),
});

const syncDeviceSchema = z.object({
  connectionId: z.number().int().positive(),
});

const getMetricDataSchema = z.object({
  metricType: metricTypeSchema,
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
});

const getDailySummarySchema = z.object({
  date: z.string(), // ISO date string (YYYY-MM-DD)
});

const computeSummarySchema = z.object({
  date: z.string(), // ISO date string (YYYY-MM-DD)
});

// ============================================================================
// Router
// ============================================================================

export const wearableRouter = router({
  /**
   * Connect a new wearable device
   */
  connectDevice: protectedProcedure.input(connectDeviceSchema).mutation(async ({ ctx, input }) => {
    const tokenExpiresAt = input.tokenExpiresAt ? new Date(input.tokenExpiresAt) : undefined;

    const connection = await connectWearableDevice({
      userId: ctx.user.id,
      deviceType: input.deviceType,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      deviceModel: input.deviceModel,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiresAt,
      enabledMetrics: input.enabledMetrics,
    });

    return {
      success: true,
      connectionId: connection.insertId,
      message: `${input.deviceType === "apple_watch" ? "Apple Watch" : "Fitbit"} connected successfully`,
    };
  }),

  /**
   * Disconnect a wearable device
   */
  disconnectDevice: protectedProcedure
    .input(disconnectDeviceSchema)
    .mutation(async ({ ctx, input }) => {
      await disconnectWearableDevice(input.connectionId, ctx.user.id);

      return {
        success: true,
        message: "Device disconnected successfully",
      };
    }),

  /**
   * Get all connected devices for current user
   */
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    const connections = await getUserWearableConnections(ctx.user.id);

    return {
      connections: connections.map((conn) => ({
        id: conn.id,
        deviceType: conn.deviceType,
        deviceName: conn.deviceName,
        deviceModel: conn.deviceModel,
        status: conn.status,
        lastSyncAt: conn.lastSyncAt,
        syncEnabled: conn.syncEnabled,
        enabledMetrics: JSON.parse(conn.enabledMetrics),
        createdAt: conn.createdAt,
      })),
    };
  }),

  /**
   * Sync data from a connected device
   */
  syncDevice: protectedProcedure.input(syncDeviceSchema).mutation(async ({ ctx, input }) => {
    // Get connection to determine device type
    const connections = await getUserWearableConnections(ctx.user.id);
    const connection = connections.find((c) => c.id === input.connectionId);

    if (!connection) {
      throw new Error("Connection not found");
    }

    let result;
    if (connection.deviceType === "apple_watch") {
      result = await syncAppleWatchData(input.connectionId, ctx.user.id);
    } else if (connection.deviceType === "fitbit") {
      result = await syncFitbitData(input.connectionId, ctx.user.id);
    } else {
      throw new Error("Unsupported device type");
    }

    return result;
  }),

  /**
   * Get recent wearable data (last 24 hours by default)
   */
  getRecentData: protectedProcedure
    .input(z.object({ hoursBack: z.number().int().positive().optional().default(24) }))
    .query(async ({ ctx, input }) => {
      const data = await getRecentWearableData(ctx.user.id, input.hoursBack);

      return {
        dataPoints: data.map((point) => ({
          id: point.id,
          metricType: point.metricType,
          value: parseFloat(point.value),
          unit: point.unit,
          measuredAt: point.measuredAt,
          confidence: parseFloat(point.confidence),
          sourceDevice: point.sourceDevice,
          syncedAt: point.syncedAt,
        })),
      };
    }),

  /**
   * Get specific metric data within a time range
   */
  getMetricData: protectedProcedure.input(getMetricDataSchema).query(async ({ ctx, input }) => {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    const data = await getMetricData(ctx.user.id, input.metricType, startDate, endDate);

    return {
      metricType: input.metricType,
      dataPoints: data.map((point) => ({
        value: parseFloat(point.value),
        unit: point.unit,
        measuredAt: point.measuredAt,
        confidence: parseFloat(point.confidence),
      })),
    };
  }),

  /**
   * Get daily summary for a specific date
   */
  getDailySummary: protectedProcedure.input(getDailySummarySchema).query(async ({ ctx, input }) => {
    const date = new Date(input.date);
    const summary = await getDailySummary(ctx.user.id, date);

    if (summary.length === 0) {
      return { summary: null, message: "No summary available for this date" };
    }

    const s = summary[0];
    return {
      summary: {
        date: input.date,
        avgHeartRate: s.avgHeartRate ? parseFloat(s.avgHeartRate) : null,
        minHeartRate: s.minHeartRate,
        maxHeartRate: s.maxHeartRate,
        restingHeartRate: s.restingHeartRate,
        avgHRV: s.avgHRV ? parseFloat(s.avgHRV) : null,
        totalSteps: s.totalSteps,
        totalDistance: s.totalDistance ? parseFloat(s.totalDistance) : null,
        totalCalories: s.totalCalories,
        totalActiveMinutes: s.totalActiveMinutes,
        avgSleepDuration: s.avgSleepDuration ? parseFloat(s.avgSleepDuration) : null,
        avgSleepQuality: s.avgSleepQuality ? parseFloat(s.avgSleepQuality) : null,
        avgBloodOxygen: s.avgBloodOxygen ? parseFloat(s.avgBloodOxygen) : null,
        avgRespiratoryRate: s.avgRespiratoryRate ? parseFloat(s.avgRespiratoryRate) : null,
        dataCompleteness: parseFloat(s.dataCompleteness),
        measurementCount: s.measurementCount,
        anomalies: s.anomalies ? JSON.parse(s.anomalies) : [],
      },
    };
  }),

  /**
   * Compute and store daily summary (admin/background job)
   */
  computeDailySummary: protectedProcedure
    .input(computeSummarySchema)
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.date);
      const summary = await computeDailySummary(ctx.user.id, date);

      if (!summary) {
        return {
          success: false,
          message: "No data available to compute summary",
        };
      }

      return {
        success: true,
        summary,
        message: "Daily summary computed successfully",
      };
    }),

  /**
   * Get wearable context for AI (used by Context Vector)
   */
  getContextForAI: protectedProcedure.query(async ({ ctx }) => {
    const context = await getWearableContextForAI(ctx.user.id);

    return {
      context,
    };
  }),
});
