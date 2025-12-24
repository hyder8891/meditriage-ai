/**
 * Air Quality Integration Service
 * 
 * Fetches real-time air quality data from OpenWeatherMap API
 * for Baghdad and other Iraqi cities.
 * 
 * Features:
 * - Real-time AQI monitoring
 * - PM2.5/PM10 tracking for dust storms
 * - Health alert generation
 * - Historical data tracking
 */

import { getDb } from "./db";
import { aqiReadings, aqiAlerts, aqiSubscriptions, aqiImpactLogs } from "../drizzle/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { ENV } from "./\_core/env";

// Iraqi cities with coordinates
export const IRAQI_CITIES = {
  Baghdad: { lat: 33.3152, lon: 44.3661 },
  Basra: { lat: 30.5085, lon: 47.7835 },
  Erbil: { lat: 36.1911, lon: 44.0091 },
  Mosul: { lat: 36.3350, lon: 43.1189 },
  Najaf: { lat: 31.9996, lon: 44.3292 },
  Karbala: { lat: 32.6160, lon: 44.0245 },
  Sulaymaniyah: { lat: 35.5550, lon: 45.4329 },
  Kirkuk: { lat: 35.4681, lon: 44.3922 },
} as const;

export type IraqiCity = keyof typeof IRAQI_CITIES;

interface OpenWeatherAQIResponse {
  coord: { lon: number; lat: number };
  list: Array<{
    main: { aqi: number };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
    dt: number;
  }>;
}

interface OpenWeatherWeatherResponse {
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
}

/**
 * Convert OpenWeatherMap AQI (1-5) to US EPA AQI (0-500)
 */
function convertToUSAQI(owmAQI: number, pm25: number, pm10: number): number {
  // OpenWeatherMap uses 1-5 scale, we convert to US EPA 0-500 scale
  // Using PM2.5 as primary indicator for more accurate conversion
  
  if (pm25 <= 12.0) return Math.round((pm25 / 12.0) * 50); // Good: 0-50
  if (pm25 <= 35.4) return Math.round(50 + ((pm25 - 12.0) / 23.4) * 50); // Moderate: 51-100
  if (pm25 <= 55.4) return Math.round(100 + ((pm25 - 35.4) / 20.0) * 50); // Unhealthy for Sensitive: 101-150
  if (pm25 <= 150.4) return Math.round(150 + ((pm25 - 55.4) / 95.0) * 50); // Unhealthy: 151-200
  if (pm25 <= 250.4) return Math.round(200 + ((pm25 - 150.4) / 100.0) * 100); // Very Unhealthy: 201-300
  return Math.round(300 + ((pm25 - 250.4) / 100.0) * 200); // Hazardous: 301-500
}

/**
 * Categorize AQI value
 */
function categorizeAQI(aqi: number): "good" | "moderate" | "unhealthy_sensitive" | "unhealthy" | "very_unhealthy" | "hazardous" {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "unhealthy_sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very_unhealthy";
  return "hazardous";
}

/**
 * Determine dominant pollutant
 */
function getDominantPollutant(components: OpenWeatherAQIResponse["list"][0]["components"]): string {
  const pollutants = {
    pm25: components.pm2_5,
    pm10: components.pm10,
    o3: components.o3,
    no2: components.no2,
    so2: components.so2,
    co: components.co,
  };
  
  return Object.entries(pollutants).reduce((a, b) => (pollutants[a[0] as keyof typeof pollutants] > pollutants[b[0] as keyof typeof pollutants] ? a : b))[0];
}

/**
 * Fetch current air quality from OpenWeatherMap
 */
export async function fetchAirQuality(city: IraqiCity): Promise<{
  aqi: number;
  category: ReturnType<typeof categorizeAQI>;
  pollutants: {
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
  };
  dominantPollutant: string;
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
}> {
  const coords = IRAQI_CITIES[city];
  const apiKey = ENV.openWeatherApiKey;
  
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY not configured");
  }
  
  // Fetch air quality data
  const aqiResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}`
  );
  
  if (!aqiResponse.ok) {
    throw new Error(`OpenWeatherMap AQI API error: ${aqiResponse.statusText}`);
  }
  
  const aqiData: OpenWeatherAQIResponse = await aqiResponse.json();
  
  // Fetch weather data
  const weatherResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`
  );
  
  if (!weatherResponse.ok) {
    throw new Error(`OpenWeatherMap Weather API error: ${weatherResponse.statusText}`);
  }
  
  const weatherData: OpenWeatherWeatherResponse = await weatherResponse.json();
  
  const current = aqiData.list[0];
  const pm25 = current.components.pm2_5;
  const pm10 = current.components.pm10;
  
  const usAQI = convertToUSAQI(current.main.aqi, pm25, pm10);
  const category = categorizeAQI(usAQI);
  const dominantPollutant = getDominantPollutant(current.components);
  
  return {
    aqi: usAQI,
    category,
    pollutants: {
      pm25,
      pm10,
      o3: current.components.o3,
      no2: current.components.no2,
      so2: current.components.so2,
      co: current.components.co,
    },
    dominantPollutant,
    weather: {
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
    },
  };
}

/**
 * Store air quality reading in database
 */
export async function storeAQIReading(city: IraqiCity, data: Awaited<ReturnType<typeof fetchAirQuality>>) {
  const coords = IRAQI_CITIES[city];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [reading] = await db.insert(aqiReadings).values({
    city,
    latitude: coords.lat.toString(),
    longitude: coords.lon.toString(),
    aqi: data.aqi,
    aqiCategory: data.category,
    pm25: data.pollutants.pm25.toString(),
    pm10: data.pollutants.pm10.toString(),
    o3: data.pollutants.o3.toString(),
    no2: data.pollutants.no2.toString(),
    so2: data.pollutants.so2.toString(),
    co: data.pollutants.co.toString(),
    dominantPollutant: data.dominantPollutant,
    temperature: data.weather.temperature.toString(),
    humidity: data.weather.humidity,
    windSpeed: data.weather.windSpeed.toString(),
    dataSource: "OpenWeatherMap",
    dataQuality: "high",
    timestamp: new Date(),
  });
  
  return reading;
}

/**
 * Check if alert should be triggered
 */
export async function checkAndCreateAlert(city: IraqiCity, data: Awaited<ReturnType<typeof fetchAirQuality>>) {
  const { aqi, category, pollutants, dominantPollutant } = data;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if alert already active
  const [existingAlert] = await db
    .select()
    .from(aqiAlerts)
    .where(and(
      eq(aqiAlerts.city, city),
      eq(aqiAlerts.isActive, true)
    ))
    .limit(1);
  
  // Dust storm detection (high PM10 with moderate PM2.5)
  const isDustStorm = pollutants.pm10 > 150 && pollutants.pm25 > 50;
  
  // Determine alert type and severity
  let alertType: "dust_storm" | "high_pm25" | "high_pm10" | "ozone_warning" | "general_pollution" | null = null;
  let severity: "low" | "medium" | "high" | "critical" | null = null;
  
  if (isDustStorm) {
    alertType = "dust_storm";
    severity = pollutants.pm10 > 300 ? "critical" : pollutants.pm10 > 200 ? "high" : "medium";
  } else if (pollutants.pm25 > 55.4) {
    alertType = "high_pm25";
    severity = pollutants.pm25 > 150 ? "critical" : pollutants.pm25 > 100 ? "high" : "medium";
  } else if (pollutants.pm10 > 150) {
    alertType = "high_pm10";
    severity = pollutants.pm10 > 250 ? "critical" : pollutants.pm10 > 200 ? "high" : "medium";
  } else if (pollutants.o3 > 100) {
    alertType = "ozone_warning";
    severity = pollutants.o3 > 200 ? "high" : "medium";
  } else if (aqi > 150) {
    alertType = "general_pollution";
    severity = aqi > 200 ? "high" : "medium";
  }
  
  // Create alert if conditions met and no existing alert
  if (alertType && severity && !existingAlert) {
    const alertMessages = {
      dust_storm: {
        title: `⚠️ Dust Storm Alert - ${city}`,
        message: `A dust storm is affecting ${city}. PM10 levels are ${pollutants.pm10.toFixed(1)} μg/m³ (AQI: ${aqi}).`,
        recommendations: [
          "Stay indoors and close all windows",
          "Use air purifiers if available",
          "Wear N95 masks if you must go outside",
          "Avoid outdoor physical activities",
          "Keep emergency medications accessible",
        ],
        affectedGroups: ["respiratory", "cardiac", "children", "elderly", "pregnant"],
      },
      high_pm25: {
        title: `🚨 High PM2.5 Alert - ${city}`,
        message: `Fine particulate matter (PM2.5) levels are ${pollutants.pm25.toFixed(1)} μg/m³ (AQI: ${aqi}).`,
        recommendations: [
          "Limit outdoor activities",
          "Use air purifiers indoors",
          "Wear masks when outside",
          "Monitor respiratory symptoms",
          "Stay hydrated",
        ],
        affectedGroups: ["respiratory", "cardiac", "children", "elderly"],
      },
      high_pm10: {
        title: `⚠️ High PM10 Alert - ${city}`,
        message: `Coarse particulate matter (PM10) levels are ${pollutants.pm10.toFixed(1)} μg/m³ (AQI: ${aqi}).`,
        recommendations: [
          "Reduce outdoor exposure",
          "Close windows and doors",
          "Use air filtration systems",
          "Monitor air quality updates",
        ],
        affectedGroups: ["respiratory", "children", "elderly"],
      },
      ozone_warning: {
        title: `☀️ Ozone Warning - ${city}`,
        message: `Ground-level ozone is ${pollutants.o3.toFixed(1)} μg/m³ (AQI: ${aqi}).`,
        recommendations: [
          "Avoid outdoor activities during peak sun hours (10 AM - 4 PM)",
          "Stay in air-conditioned spaces",
          "Limit strenuous activities",
          "Monitor breathing difficulties",
        ],
        affectedGroups: ["respiratory", "children", "elderly"],
      },
      general_pollution: {
        title: `🌫️ Air Quality Alert - ${city}`,
        message: `Air quality is unhealthy (AQI: ${aqi}). Dominant pollutant: ${dominantPollutant.toUpperCase()}.`,
        recommendations: [
          "Limit prolonged outdoor activities",
          "Monitor air quality updates",
          "Consider indoor exercise alternatives",
          "Stay informed about pollution sources",
        ],
        affectedGroups: ["respiratory", "cardiac", "children"],
      },
    };
    
    const alertInfo = alertMessages[alertType];
    
    await db.insert(aqiAlerts).values({
      city,
      alertType,
      severity,
      triggerAQI: aqi,
      triggerPollutant: dominantPollutant,
      triggerValue: pollutants[dominantPollutant as keyof typeof pollutants]?.toString() || "0",
      title: alertInfo.title,
      message: alertInfo.message,
      healthRecommendations: JSON.stringify(alertInfo.recommendations),
      affectedGroups: JSON.stringify(alertInfo.affectedGroups),
      isActive: true,
      startTime: new Date(),
    });
    
    return { alertCreated: true, alertType, severity };
  }
  
  // Deactivate existing alert if conditions improved
  if (existingAlert && aqi < 100) {
    await db.update(aqiAlerts)
      .set({ isActive: false, endTime: new Date() })
      .where(eq(aqiAlerts.id, existingAlert.id));
    
    return { alertCreated: false, alertDeactivated: true };
  }
  
  return { alertCreated: false };
}

/**
 * Get current AQI for a city
 */
export async function getCurrentAQI(city: IraqiCity) {
  const db = await getDb();
  if (!db) return null;
  
  const [latest] = await db
    .select()
    .from(aqiReadings)
    .where(eq(aqiReadings.city, city))
    .orderBy(desc(aqiReadings.timestamp))
    .limit(1);
  
  return latest;
}

/**
 * Get AQI history for a city
 */
export async function getAQIHistory(city: IraqiCity, hoursBack: number = 24) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const db = await getDb();
  if (!db) return [];
  
  const history = await db
    .select()
    .from(aqiReadings)
    .where(and(
      eq(aqiReadings.city, city),
      gte(aqiReadings.timestamp, since)
    ))
    .orderBy(desc(aqiReadings.timestamp));
  
  return history;
}

/**
 * Get active alerts for a city
 */
export async function getActiveAlerts(city?: IraqiCity) {
  const db = await getDb();
  if (!db) return [];
  
  const alerts = await db
    .select()
    .from(aqiAlerts)
    .where(city 
      ? and(eq(aqiAlerts.city, city), eq(aqiAlerts.isActive, true))
      : eq(aqiAlerts.isActive, true))
    .orderBy(desc(aqiAlerts.startTime));
  
  return alerts;
}

/**
 * Subscribe user to air quality alerts
 */
export async function subscribeToAlerts(
  userId: number,
  city: IraqiCity,
  preferences: {
    minAlertSeverity?: "low" | "medium" | "high" | "critical";
    notifyViaEmail?: boolean;
    notifyViaPush?: boolean;
    hasRespiratoryCondition?: boolean;
    hasCardiacCondition?: boolean;
    isPregnant?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [subscription] = await db.insert(aqiSubscriptions).values({
    userId,
    city,
    minAlertSeverity: preferences.minAlertSeverity || "medium",
    notifyViaEmail: preferences.notifyViaEmail || false,
    notifyViaPush: preferences.notifyViaPush || true,
    hasRespiratoryCondition: preferences.hasRespiratoryCondition || false,
    hasCardiacCondition: preferences.hasCardiacCondition || false,
    isPregnant: preferences.isPregnant || false,
    isActive: true,
  });
  
  return subscription;
}

/**
 * Log correlation between AQI and patient symptoms
 */
export async function logAQIImpact(
  userId: number,
  triageRecordId: number | null,
  symptoms: string[],
  symptomSeverity: "mild" | "moderate" | "severe",
  city: IraqiCity
) {
  // Get current AQI
  const currentAQI = await getCurrentAQI(city);
  
  if (!currentAQI) {
    return null;
  }
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Determine if symptoms are likely AQI-related
  const respiratorySymptoms = ["cough", "shortness of breath", "wheezing", "chest tightness", "throat irritation"];
  const hasRespiratorySymptoms = symptoms.some(s => 
    respiratorySymptoms.some(rs => s.toLowerCase().includes(rs))
  );
  
  const likelyAQIRelated = hasRespiratorySymptoms && currentAQI.aqi > 100;
  const correlationConfidence = likelyAQIRelated 
    ? Math.min(95, 50 + (currentAQI.aqi - 100) / 4) 
    : 0;
  
  const [result] = await db.insert(aqiImpactLogs).values({
    userId,
    triageRecordId,
    aqiAtSymptomOnset: currentAQI.aqi,
    pm25AtSymptomOnset: currentAQI.pm25,
    pm10AtSymptomOnset: currentAQI.pm10,
    symptoms: JSON.stringify(symptoms),
    symptomSeverity,
    likelyAQIRelated,
    correlationConfidence: correlationConfidence.toString(),
    symptomResolved: false,
  });
  
  return {
    insertId: result.insertId,
    likelyAQIRelated,
    correlationConfidence,
  };
}

/**
 * Refresh AQI data for all Iraqi cities
 */
export async function refreshAllCitiesAQI() {
  const results = [];
  
  for (const city of Object.keys(IRAQI_CITIES) as IraqiCity[]) {
    try {
      const data = await fetchAirQuality(city);
      await storeAQIReading(city, data);
      const alertResult = await checkAndCreateAlert(city, data);
      
      results.push({
        city,
        success: true,
        aqi: data.aqi,
        category: data.category,
        alertCreated: alertResult.alertCreated,
      });
    } catch (error) {
      results.push({
        city,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
  
  return results;
}
