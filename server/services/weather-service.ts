/**
 * Weather Service
 * Integrates with OpenWeather API for barometric pressure tracking
 * Part of Avicenna-x Feature #6: Environmental Health Correlations
 */

import { ENV } from "../_core/env";

// OpenWeather API response types
interface OpenWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number; // Kelvin
    feels_like: number;
    pressure: number; // hPa (millibars)
    humidity: number; // percentage
    temp_min: number;
    temp_max: number;
    sea_level?: number;
    grnd_level?: number;
  };
  wind: {
    speed: number; // m/s
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  dt: number; // Unix timestamp
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

interface WeatherData {
  latitude: number;
  longitude: number;
  cityName: string;
  countryCode: string;
  pressure: number; // millibars
  temperature: number; // Celsius
  humidity: number; // percentage
  weatherCondition: string;
  windSpeed: number; // m/s
  observedAt: Date;
}

interface PressureChange {
  current: number;
  change1h?: number;
  change3h?: number;
  change24h?: number;
  velocity: number; // mb/hour (most recent rate)
  trend: "rising" | "falling" | "stable";
}

/**
 * Fetch current weather data from OpenWeather API
 */
export async function fetchCurrentWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const apiKey = ENV.openWeatherApiKey;
  
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY not configured");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenWeather API error: ${response.status} - ${errorText}`);
  }

  const data: OpenWeatherResponse = await response.json();

  return {
    latitude: data.coord.lat,
    longitude: data.coord.lon,
    cityName: data.name,
    countryCode: data.sys.country,
    pressure: data.main.pressure,
    temperature: data.main.temp - 273.15, // Convert Kelvin to Celsius
    humidity: data.main.humidity,
    weatherCondition: data.weather[0]?.main || "Unknown",
    windSpeed: data.wind.speed,
    observedAt: new Date(data.dt * 1000),
  };
}

/**
 * Calculate pressure change metrics from historical data
 */
export function calculatePressureChange(
  currentPressure: number,
  historicalPressures: Array<{ pressure: number; timestamp: Date }>
): PressureChange {
  const now = new Date();
  
  // Find pressure readings at specific time intervals
  const pressure1hAgo = findPressureAtTime(historicalPressures, now, 1);
  const pressure3hAgo = findPressureAtTime(historicalPressures, now, 3);
  const pressure24hAgo = findPressureAtTime(historicalPressures, now, 24);

  // Calculate changes
  const change1h = pressure1hAgo ? currentPressure - pressure1hAgo : undefined;
  const change3h = pressure3hAgo ? currentPressure - pressure3hAgo : undefined;
  const change24h = pressure24hAgo ? currentPressure - pressure24hAgo : undefined;

  // Calculate velocity (mb/hour) - use most recent available
  let velocity = 0;
  if (change1h !== undefined) {
    velocity = change1h; // Already per hour
  } else if (change3h !== undefined) {
    velocity = change3h / 3;
  } else if (change24h !== undefined) {
    velocity = change24h / 24;
  }

  // Determine trend
  let trend: "rising" | "falling" | "stable" = "stable";
  if (Math.abs(velocity) > 0.5) {
    trend = velocity > 0 ? "rising" : "falling";
  }

  return {
    current: currentPressure,
    change1h,
    change3h,
    change24h,
    velocity,
    trend,
  };
}

/**
 * Find pressure reading closest to a specific time in the past
 */
function findPressureAtTime(
  historicalPressures: Array<{ pressure: number; timestamp: Date }>,
  currentTime: Date,
  hoursAgo: number
): number | undefined {
  const targetTime = new Date(currentTime.getTime() - hoursAgo * 60 * 60 * 1000);
  const tolerance = 30 * 60 * 1000; // 30 minutes tolerance

  // Find closest reading within tolerance
  let closest: { pressure: number; timestamp: Date } | undefined;
  let minDiff = Infinity;

  for (const reading of historicalPressures) {
    const diff = Math.abs(reading.timestamp.getTime() - targetTime.getTime());
    if (diff < minDiff && diff < tolerance) {
      minDiff = diff;
      closest = reading;
    }
  }

  return closest?.pressure;
}

/**
 * Detect rapid pressure changes that may trigger symptoms
 */
export interface PressureAlert {
  type: "rapid_drop" | "rapid_rise" | "extreme_low" | "extreme_high";
  severity: "low" | "moderate" | "high";
  message: string;
  pressureChange: number;
  velocity: number;
}

export function detectPressureAlerts(
  pressureChange: PressureChange
): PressureAlert[] {
  const alerts: PressureAlert[] = [];

  // Rapid drop (common migraine trigger)
  if (pressureChange.velocity < -3) {
    alerts.push({
      type: "rapid_drop",
      severity: pressureChange.velocity < -5 ? "high" : "moderate",
      message: `Rapid pressure drop detected: ${pressureChange.velocity.toFixed(1)} mb/hour`,
      pressureChange: pressureChange.change1h || pressureChange.change3h || 0,
      velocity: pressureChange.velocity,
    });
  }

  // Rapid rise (can trigger joint pain)
  if (pressureChange.velocity > 3) {
    alerts.push({
      type: "rapid_rise",
      severity: pressureChange.velocity > 5 ? "high" : "moderate",
      message: `Rapid pressure rise detected: ${pressureChange.velocity.toFixed(1)} mb/hour`,
      pressureChange: pressureChange.change1h || pressureChange.change3h || 0,
      velocity: pressureChange.velocity,
    });
  }

  // Extreme low pressure (< 980 mb)
  if (pressureChange.current < 980) {
    alerts.push({
      type: "extreme_low",
      severity: pressureChange.current < 970 ? "high" : "moderate",
      message: `Extreme low pressure: ${pressureChange.current.toFixed(1)} mb`,
      pressureChange: 0,
      velocity: pressureChange.velocity,
    });
  }

  // Extreme high pressure (> 1030 mb)
  if (pressureChange.current > 1030) {
    alerts.push({
      type: "extreme_high",
      severity: pressureChange.current > 1040 ? "high" : "moderate",
      message: `Extreme high pressure: ${pressureChange.current.toFixed(1)} mb`,
      pressureChange: 0,
      velocity: pressureChange.velocity,
    });
  }

  return alerts;
}

/**
 * Get pressure-sensitive condition recommendations
 */
export interface ConditionRecommendation {
  condition: string;
  likelihood: "low" | "moderate" | "high";
  symptoms: string[];
  preventiveMeasures: string[];
}

export function getPressureConditionRecommendations(
  pressureChange: PressureChange,
  alerts: PressureAlert[]
): ConditionRecommendation[] {
  const recommendations: ConditionRecommendation[] = [];

  // Migraine risk
  if (alerts.some(a => a.type === "rapid_drop")) {
    const severity = alerts.find(a => a.type === "rapid_drop")?.severity || "moderate";
    recommendations.push({
      condition: "Migraine Headache",
      likelihood: severity === "high" ? "high" : "moderate",
      symptoms: [
        "Throbbing headache (usually one-sided)",
        "Sensitivity to light and sound",
        "Nausea or vomiting",
        "Visual disturbances (aura)",
      ],
      preventiveMeasures: [
        "Take prescribed migraine medication early",
        "Rest in a dark, quiet room",
        "Stay hydrated",
        "Apply cold compress to forehead",
        "Avoid known triggers (caffeine, alcohol, bright lights)",
      ],
    });
  }

  // Joint pain / arthritis
  if (alerts.some(a => a.type === "rapid_drop" || a.type === "extreme_low")) {
    recommendations.push({
      condition: "Joint Pain / Arthritis Flare",
      likelihood: "moderate",
      symptoms: [
        "Joint stiffness and pain",
        "Swelling in affected joints",
        "Reduced range of motion",
        "Aching in knees, hips, or hands",
      ],
      preventiveMeasures: [
        "Take anti-inflammatory medication as prescribed",
        "Apply heat to affected joints",
        "Gentle stretching exercises",
        "Avoid overexertion",
        "Consider compression garments",
      ],
    });
  }

  // Respiratory issues
  if (alerts.some(a => a.type === "rapid_drop" || a.type === "extreme_low")) {
    recommendations.push({
      condition: "Respiratory Symptoms",
      likelihood: "low",
      symptoms: [
        "Shortness of breath",
        "Chest tightness",
        "Increased coughing",
        "Wheezing (for asthma patients)",
      ],
      preventiveMeasures: [
        "Keep rescue inhaler accessible",
        "Avoid outdoor activities if symptomatic",
        "Monitor oxygen levels if available",
        "Stay indoors in climate-controlled environment",
        "Seek medical attention if symptoms worsen",
      ],
    });
  }

  // Sinus pressure
  if (alerts.some(a => a.type === "rapid_rise" || a.type === "rapid_drop")) {
    recommendations.push({
      condition: "Sinus Pressure / Headache",
      likelihood: "moderate",
      symptoms: [
        "Facial pressure or pain",
        "Headache around forehead and cheeks",
        "Nasal congestion",
        "Post-nasal drip",
      ],
      preventiveMeasures: [
        "Use saline nasal spray",
        "Apply warm compress to face",
        "Stay hydrated",
        "Take decongestants if appropriate",
        "Steam inhalation",
      ],
    });
  }

  return recommendations;
}

/**
 * Cache management for weather data
 */
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function getCachedWeather(
  latitude: number,
  longitude: number
): WeatherData | null {
  const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const cached = weatherCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  return null;
}

export function cacheWeather(data: WeatherData): void {
  const key = `${data.latitude.toFixed(2)},${data.longitude.toFixed(2)}`;
  weatherCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Clear old cache entries
 */
export function clearOldCache(): void {
  const now = Date.now();
  const entries = Array.from(weatherCache.entries());
  for (const [key, value] of entries) {
    if (now - value.timestamp > CACHE_DURATION) {
      weatherCache.delete(key);
    }
  }
}

// Auto-clear cache every hour
setInterval(clearOldCache, 60 * 60 * 1000);
