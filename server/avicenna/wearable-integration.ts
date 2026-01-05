/**
 * Wearable Integration Service
 * Connects Apple Watch (HealthKit) and Fitbit devices to sync health metrics
 * Part of Avicenna-x Context Vector enhancement
 */

import { getDb } from "../db";
import { wearableConnections, wearableDataPoints, wearableMetricsSummary } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { encryptSensitiveData, decryptSensitiveData, isEncrypted } from "../_core/auth-utils";

// ============================================================================
// Types
// ============================================================================

export type DeviceType = "apple_watch" | "fitbit";

export type MetricType =
  | "heart_rate"
  | "steps"
  | "distance"
  | "calories"
  | "active_minutes"
  | "sleep_duration"
  | "sleep_quality"
  | "blood_oxygen"
  | "hrv"
  | "resting_heart_rate"
  | "blood_pressure_systolic"
  | "blood_pressure_diastolic"
  | "respiratory_rate"
  | "body_temperature"
  | "weight"
  | "bmi";

export interface WearableMetric {
  metricType: MetricType;
  value: number;
  unit: string;
  measuredAt: Date;
  confidence?: number;
  context?: Record<string, any>;
}

export interface WearableConnectionConfig {
  userId: number;
  deviceType: DeviceType;
  deviceId: string;
  deviceName?: string;
  deviceModel?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  enabledMetrics: MetricType[];
}

export interface SyncResult {
  success: boolean;
  connectionId: number;
  syncedCount: number;
  errors: string[];
  lastSyncAt: Date;
}

// ============================================================================
// Connection Management
// ============================================================================

/**
 * Connect a new wearable device
 */
export async function connectWearableDevice(config: WearableConnectionConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [connection] = await db.insert(wearableConnections).values({
    userId: config.userId,
    deviceType: config.deviceType,
    deviceId: config.deviceId,
    deviceName: config.deviceName,
    deviceModel: config.deviceModel,
    status: "active",
    accessToken: encryptSensitiveData(config.accessToken), // Encrypted for security
    refreshToken: config.refreshToken ? encryptSensitiveData(config.refreshToken) : undefined,
    tokenExpiresAt: config.tokenExpiresAt,
    syncEnabled: true,
    syncFrequency: 3600, // 1 hour default
    enabledMetrics: JSON.stringify(config.enabledMetrics),
    lastSyncAt: new Date(),
  });

  return connection;
}

/**
 * Disconnect a wearable device
 */
export async function disconnectWearableDevice(connectionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(wearableConnections)
    .set({ status: "disconnected", syncEnabled: false })
    .where(and(eq(wearableConnections.id, connectionId), eq(wearableConnections.userId, userId)));
}

/**
 * Get all connected devices for a user
 */
export async function getUserWearableConnections(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(wearableConnections)
    .where(and(eq(wearableConnections.userId, userId), eq(wearableConnections.status, "active")));
}

/**
 * Update connection status
 */
export async function updateConnectionStatus(
  connectionId: number,
  status: "active" | "disconnected" | "error"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(wearableConnections).set({ status }).where(eq(wearableConnections.id, connectionId));
}

// ============================================================================
// Data Sync - Apple Watch (HealthKit)
// ============================================================================

/**
 * Sync data from Apple Watch via HealthKit
 * In production, this would call Apple HealthKit API
 * For now, this is a mock implementation showing the structure
 */
export async function syncAppleWatchData(connectionId: number, userId: number): Promise<SyncResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const connection = await db
    .select()
    .from(wearableConnections)
    .where(
      and(
        eq(wearableConnections.id, connectionId),
        eq(wearableConnections.userId, userId),
        eq(wearableConnections.deviceType, "apple_watch")
      )
    )
    .limit(1);

  if (connection.length === 0) {
    throw new Error("Apple Watch connection not found");
  }

  const conn = connection[0];
  const enabledMetrics = JSON.parse(conn.enabledMetrics) as MetricType[];
  const errors: string[] = [];
  let syncedCount = 0;

  try {
    // Decrypt access token for API calls
    const accessToken = conn.accessToken ? 
      (isEncrypted(conn.accessToken) ? decryptSensitiveData(conn.accessToken) : conn.accessToken) 
      : null;
    
    // TODO: In production, call Apple HealthKit API here
    // const healthKitData = await fetchHealthKitData(accessToken, enabledMetrics);

    // Mock data for demonstration
    const mockMetrics: WearableMetric[] = [
      {
        metricType: "heart_rate",
        value: 72,
        unit: "bpm",
        measuredAt: new Date(),
        confidence: 0.95,
      },
      {
        metricType: "steps",
        value: 8500,
        unit: "steps",
        measuredAt: new Date(),
        confidence: 1.0,
      },
      {
        metricType: "blood_oxygen",
        value: 98,
        unit: "%",
        measuredAt: new Date(),
        confidence: 0.92,
      },
      {
        metricType: "hrv",
        value: 45,
        unit: "ms",
        measuredAt: new Date(),
        confidence: 0.88,
      },
    ];

    // Store metrics in database
    for (const metric of mockMetrics) {
      if (enabledMetrics.includes(metric.metricType)) {
        await storeWearableDataPoint(userId, connectionId, metric, conn.deviceModel || "Apple Watch");
        syncedCount++;
      }
    }

    // Update last sync time
    const lastSyncAt = new Date();
    const dbUpdate = await getDb();
    if (!dbUpdate) throw new Error("Database not available");
    await dbUpdate
      .update(wearableConnections)
      .set({ lastSyncAt, status: "active" })
      .where(eq(wearableConnections.id, connectionId));

    return {
      success: true,
      connectionId,
      syncedCount,
      errors,
      lastSyncAt,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Unknown error");
    await updateConnectionStatus(connectionId, "error");

    return {
      success: false,
      connectionId,
      syncedCount,
      errors,
      lastSyncAt: new Date(),
    };
  }
}

// ============================================================================
// Data Sync - Fitbit
// ============================================================================

/**
 * Sync data from Fitbit
 * In production, this would call Fitbit Web API
 * For now, this is a mock implementation showing the structure
 */
export async function syncFitbitData(connectionId: number, userId: number): Promise<SyncResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const connection = await db
    .select()
    .from(wearableConnections)
    .where(
      and(
        eq(wearableConnections.id, connectionId),
        eq(wearableConnections.userId, userId),
        eq(wearableConnections.deviceType, "fitbit")
      )
    )
    .limit(1);

  if (connection.length === 0) {
    throw new Error("Fitbit connection not found");
  }

  const conn = connection[0];
  const enabledMetrics = JSON.parse(conn.enabledMetrics) as MetricType[];
  const errors: string[] = [];
  let syncedCount = 0;

  try {
    // Decrypt access token for API calls
    const accessToken = conn.accessToken ? 
      (isEncrypted(conn.accessToken) ? decryptSensitiveData(conn.accessToken) : conn.accessToken) 
      : null;
    
    // TODO: In production, call Fitbit Web API here
    // const fitbitData = await fetchFitbitData(accessToken, enabledMetrics);

    // Mock data for demonstration
    const mockMetrics: WearableMetric[] = [
      {
        metricType: "heart_rate",
        value: 68,
        unit: "bpm",
        measuredAt: new Date(),
        confidence: 0.93,
      },
      {
        metricType: "steps",
        value: 9200,
        unit: "steps",
        measuredAt: new Date(),
        confidence: 1.0,
      },
      {
        metricType: "sleep_duration",
        value: 7.5,
        unit: "hours",
        measuredAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        confidence: 0.96,
      },
      {
        metricType: "calories",
        value: 2150,
        unit: "kcal",
        measuredAt: new Date(),
        confidence: 0.89,
      },
    ];

    // Store metrics in database
    for (const metric of mockMetrics) {
      if (enabledMetrics.includes(metric.metricType)) {
        await storeWearableDataPoint(userId, connectionId, metric, conn.deviceModel || "Fitbit");
        syncedCount++;
      }
    }

    // Update last sync time
    const lastSyncAt = new Date();
    const dbUpdate = await getDb();
    if (!dbUpdate) throw new Error("Database not available");
    await dbUpdate
      .update(wearableConnections)
      .set({ lastSyncAt, status: "active" })
      .where(eq(wearableConnections.id, connectionId));

    return {
      success: true,
      connectionId,
      syncedCount,
      errors,
      lastSyncAt,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Unknown error");
    await updateConnectionStatus(connectionId, "error");

    return {
      success: false,
      connectionId,
      syncedCount,
      errors,
      lastSyncAt: new Date(),
    };
  }
}

// ============================================================================
// Data Storage
// ============================================================================

/**
 * Store a single wearable data point
 */
async function storeWearableDataPoint(
  userId: number,
  connectionId: number,
  metric: WearableMetric,
  sourceDevice: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(wearableDataPoints).values({
    userId,
    connectionId,
    metricType: metric.metricType,
    value: metric.value.toString(),
    unit: metric.unit,
    measuredAt: metric.measuredAt,
    confidence: metric.confidence?.toString() || "1.00",
    context: metric.context ? JSON.stringify(metric.context) : null,
    sourceDevice,
    sourceApp: "Manus Health Sync",
    syncedAt: new Date(),
  });
}

// ============================================================================
// Data Retrieval
// ============================================================================

/**
 * Get recent wearable data for a user (last 24 hours by default)
 */
export async function getRecentWearableData(userId: number, hoursBack: number = 24) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  return await db
    .select()
    .from(wearableDataPoints)
    .where(and(eq(wearableDataPoints.userId, userId), gte(wearableDataPoints.measuredAt, cutoffTime)))
    .orderBy(desc(wearableDataPoints.measuredAt));
}

/**
 * Get specific metric type for a user within a time range
 */
export async function getMetricData(
  userId: number,
  metricType: MetricType,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(wearableDataPoints)
    .where(
      and(
        eq(wearableDataPoints.userId, userId),
        eq(wearableDataPoints.metricType, metricType),
        gte(wearableDataPoints.measuredAt, startDate),
        lte(wearableDataPoints.measuredAt, endDate)
      )
    )
    .orderBy(desc(wearableDataPoints.measuredAt));
}

/**
 * Get aggregated daily summary for a user
 */
export async function getDailySummary(userId: number, date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await db
    .select()
    .from(wearableMetricsSummary)
    .where(
      and(
        eq(wearableMetricsSummary.userId, userId),
        eq(wearableMetricsSummary.periodType, "daily"),
        gte(wearableMetricsSummary.periodStart, startOfDay),
        lte(wearableMetricsSummary.periodEnd, endOfDay)
      )
    )
    .limit(1);
}

// ============================================================================
// Aggregation (for Context Vector)
// ============================================================================

/**
 * Compute and store daily summary from raw data points
 * This should be run as a background job (e.g., daily at midnight)
 */
export async function computeDailySummary(userId: number, date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all data points for the day
  const dataPoints = await db
    .select()
    .from(wearableDataPoints)
    .where(
      and(
        eq(wearableDataPoints.userId, userId),
        gte(wearableDataPoints.measuredAt, startOfDay),
        lte(wearableDataPoints.measuredAt, endOfDay)
      )
    );

  if (dataPoints.length === 0) {
    return null; // No data to summarize
  }

  // Aggregate metrics by type
  const heartRateData = dataPoints.filter((d) => d.metricType === "heart_rate");
  const stepsData = dataPoints.filter((d) => d.metricType === "steps");
  const sleepData = dataPoints.filter((d) => d.metricType === "sleep_duration");
  const hrvData = dataPoints.filter((d) => d.metricType === "hrv");
  const bloodOxygenData = dataPoints.filter((d) => d.metricType === "blood_oxygen");

  // Calculate averages
  const avgHeartRate =
    heartRateData.length > 0
      ? (
          heartRateData.reduce((sum, d) => sum + parseFloat(d.value), 0) / heartRateData.length
        ).toFixed(2)
      : null;

  const totalSteps =
    stepsData.length > 0 ? Math.max(...stepsData.map((d) => parseFloat(d.value))) : null;

  const avgSleepDuration =
    sleepData.length > 0
      ? (sleepData.reduce((sum, d) => sum + parseFloat(d.value), 0) / sleepData.length).toFixed(2)
      : null;

  const avgHRV =
    hrvData.length > 0
      ? (hrvData.reduce((sum, d) => sum + parseFloat(d.value), 0) / hrvData.length).toFixed(2)
      : null;

  const avgBloodOxygen =
    bloodOxygenData.length > 0
      ? (
          bloodOxygenData.reduce((sum, d) => sum + parseFloat(d.value), 0) / bloodOxygenData.length
        ).toFixed(2)
      : null;

  // Detect anomalies
  const anomalies: Array<{ type: string; severity: string; value: number }> = [];

  if (avgHeartRate && parseFloat(avgHeartRate) > 100) {
    anomalies.push({
      type: "elevated_heart_rate",
      severity: "moderate",
      value: parseFloat(avgHeartRate),
    });
  }

  if (avgBloodOxygen && parseFloat(avgBloodOxygen) < 92) {
    anomalies.push({
      type: "low_blood_oxygen",
      severity: "high",
      value: parseFloat(avgBloodOxygen),
    });
  }

  if (avgSleepDuration && parseFloat(avgSleepDuration) < 5) {
    anomalies.push({
      type: "insufficient_sleep",
      severity: "moderate",
      value: parseFloat(avgSleepDuration),
    });
  }

  // Store summary
  const dbInsert = await getDb();
  if (!dbInsert) throw new Error("Database not available");
  await dbInsert.insert(wearableMetricsSummary).values({
    userId,
    periodType: "daily",
    periodStart: startOfDay,
    periodEnd: endOfDay,
    avgHeartRate,
    minHeartRate: heartRateData.length > 0 ? Math.min(...heartRateData.map((d) => parseFloat(d.value))) : null,
    maxHeartRate: heartRateData.length > 0 ? Math.max(...heartRateData.map((d) => parseFloat(d.value))) : null,
    avgHRV,
    totalSteps,
    avgSleepDuration,
    avgBloodOxygen,
    dataCompleteness: (dataPoints.length / 100).toFixed(2), // Rough estimate
    measurementCount: dataPoints.length,
    anomalies: anomalies.length > 0 ? JSON.stringify(anomalies) : null,
  });

  return {
    avgHeartRate,
    totalSteps,
    avgSleepDuration,
    avgHRV,
    avgBloodOxygen,
    anomalies,
  };
}

/**
 * Get wearable context for Context Vector
 * Returns recent health metrics formatted for AI consumption
 */
export async function getWearableContextForAI(userId: number): Promise<string> {
  // Get recent data (last 24 hours)
  const recentData = await getRecentWearableData(userId, 24);

  if (recentData.length === 0) {
    return "No wearable data available.";
  }

  // Get today's summary if available
  const today = new Date();
  const todaySummary = await getDailySummary(userId, today);

  // Group data by metric type
  const metricGroups: Record<string, typeof recentData> = {};
  for (const point of recentData) {
    if (!metricGroups[point.metricType]) {
      metricGroups[point.metricType] = [];
    }
    metricGroups[point.metricType].push(point);
  }

  // Build context string
  let context = "**Wearable Health Data (Last 24 Hours):**\n\n";

  // Add summary if available
  if (todaySummary.length > 0) {
    const summary = todaySummary[0];
    context += "**Today's Summary:**\n";
    if (summary.avgHeartRate) context += `- Average Heart Rate: ${summary.avgHeartRate} bpm\n`;
    if (summary.totalSteps) context += `- Total Steps: ${summary.totalSteps}\n`;
    if (summary.avgSleepDuration) context += `- Sleep Duration: ${summary.avgSleepDuration} hours\n`;
    if (summary.avgHRV) context += `- Average HRV: ${summary.avgHRV} ms\n`;
    if (summary.avgBloodOxygen) context += `- Average Blood Oxygen: ${summary.avgBloodOxygen}%\n`;

    // Add anomalies if present
    if (summary.anomalies) {
      const anomalies = JSON.parse(summary.anomalies);
      if (anomalies.length > 0) {
        context += "\n**⚠️ Detected Anomalies:**\n";
        for (const anomaly of anomalies) {
          context += `- ${anomaly.type.replace(/_/g, " ")}: ${anomaly.value} (${anomaly.severity} severity)\n`;
        }
      }
    }
    context += "\n";
  }

  // Add recent measurements
  context += "**Recent Measurements:**\n";
  for (const [metricType, points] of Object.entries(metricGroups)) {
    const latest = points[0];
    const avgValue =
      points.reduce((sum, p) => sum + parseFloat(p.value), 0) / points.length;
    context += `- ${metricType.replace(/_/g, " ")}: ${latest.value} ${latest.unit} (avg: ${avgValue.toFixed(1)} ${latest.unit}, ${points.length} readings)\n`;
  }

  return context;
}
