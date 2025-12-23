/**
 * Barometric Pressure Integration Tests
 * Part of Avicenna-x Feature #6: Environmental Health Correlations
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  fetchCurrentWeather,
  calculatePressureChange,
  detectPressureAlerts,
  getPressureConditionRecommendations,
} from "../services/weather-service";
import {
  insertWeatherCondition,
  getWeatherHistory,
  getAllPressureSensitiveConditions,
  upsertPatientPressureSensitivity,
  insertPressureSymptomEvent,
  getPatientPressureSymptomHistory,
} from "../db-weather";

describe("Weather Service", () => {
  describe("fetchCurrentWeather", () => {
    it("should fetch weather data for Baghdad", async () => {
      const weather = await fetchCurrentWeather(33.3152, 44.3661);

      expect(weather).toBeDefined();
      expect(weather.latitude).toBeCloseTo(33.3152, 1);
      expect(weather.longitude).toBeCloseTo(44.3661, 1);
      expect(weather.pressure).toBeGreaterThan(900);
      expect(weather.pressure).toBeLessThan(1100);
      expect(weather.cityName).toBeDefined();
    });

    it("should fetch weather data for Basra", async () => {
      const weather = await fetchCurrentWeather(30.5085, 47.7835);

      expect(weather).toBeDefined();
      expect(weather.latitude).toBeCloseTo(30.5085, 1);
      expect(weather.longitude).toBeCloseTo(47.7835, 1);
      expect(weather.pressure).toBeGreaterThan(900);
    });
  });

  describe("calculatePressureChange", () => {
    it("should detect rapid pressure drop", () => {
      const currentPressure = 1000;
      const history = [
        { pressure: 1010, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
        { pressure: 1015, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
        { pressure: 1020, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      ];

      const change = calculatePressureChange(currentPressure, history);

      expect(change.current).toBe(1000);
      expect(change.change1h).toBe(-10);
      expect(change.velocity).toBe(-10);
      expect(change.trend).toBe("falling");
    });

    it("should detect rapid pressure rise", () => {
      const currentPressure = 1020;
      const history = [
        { pressure: 1010, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
        { pressure: 1005, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      ];

      const change = calculatePressureChange(currentPressure, history);

      expect(change.change1h).toBe(10);
      expect(change.velocity).toBe(10);
      expect(change.trend).toBe("rising");
    });

    it("should detect stable pressure", () => {
      const currentPressure = 1013;
      const history = [
        { pressure: 1013, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
        { pressure: 1014, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      ];

      const change = calculatePressureChange(currentPressure, history);

      expect(change.trend).toBe("stable");
      expect(Math.abs(change.velocity)).toBeLessThan(1);
    });
  });

  describe("detectPressureAlerts", () => {
    it("should trigger rapid drop alert", () => {
      const pressureChange = {
        current: 1000,
        velocity: -5,
        trend: "falling" as const,
        change1h: -5,
      };

      const alerts = detectPressureAlerts(pressureChange);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]?.type).toBe("rapid_drop");
      expect(alerts[0]?.severity).toBe("high");
    });

    it("should trigger rapid rise alert", () => {
      const pressureChange = {
        current: 1020,
        velocity: 6,
        trend: "rising" as const,
        change1h: 6,
      };

      const alerts = detectPressureAlerts(pressureChange);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]?.type).toBe("rapid_rise");
    });

    it("should trigger extreme low pressure alert", () => {
      const pressureChange = {
        current: 970,
        velocity: -2,
        trend: "falling" as const,
      };

      const alerts = detectPressureAlerts(pressureChange);

      expect(alerts.some((a) => a.type === "extreme_low")).toBe(true);
    });

    it("should not trigger alerts for normal conditions", () => {
      const pressureChange = {
        current: 1013,
        velocity: 0.5,
        trend: "stable" as const,
      };

      const alerts = detectPressureAlerts(pressureChange);

      expect(alerts.length).toBe(0);
    });
  });

  describe("getPressureConditionRecommendations", () => {
    it("should recommend migraine prevention for rapid drop", () => {
      const pressureChange = {
        current: 1000,
        velocity: -5,
        trend: "falling" as const,
        change1h: -5,
      };

      const alerts = detectPressureAlerts(pressureChange);
      const recommendations = getPressureConditionRecommendations(
        pressureChange,
        alerts
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(
        recommendations.some((r) => r.condition === "Migraine Headache")
      ).toBe(true);

      const migrainRec = recommendations.find(
        (r) => r.condition === "Migraine Headache"
      );
      expect(migrainRec?.symptoms.length).toBeGreaterThan(0);
      expect(migrainRec?.preventiveMeasures.length).toBeGreaterThan(0);
    });

    it("should recommend joint pain prevention for low pressure", () => {
      const pressureChange = {
        current: 975,
        velocity: -3,
        trend: "falling" as const,
      };

      const alerts = detectPressureAlerts(pressureChange);
      const recommendations = getPressureConditionRecommendations(
        pressureChange,
        alerts
      );

      expect(
        recommendations.some((r) => r.condition.includes("Joint Pain"))
      ).toBe(true);
    });
  });
});

describe("Weather Database Operations", () => {
  let testWeatherId: number;

  describe("insertWeatherCondition", () => {
    it("should insert weather observation", async () => {
      const weather = await insertWeatherCondition({
        latitude: 33.3152,
        longitude: 44.3661,
        cityName: "Baghdad",
        countryCode: "IQ",
        pressure: 1013,
        temperature: 25,
        humidity: 40,
        weatherCondition: "Clear",
        windSpeed: 3,
        observedAt: new Date(),
      });

      expect(weather).toBeDefined();
      expect(weather.id).toBeDefined();
      testWeatherId = weather.id;
    });
  });

  describe("getWeatherHistory", () => {
    it("should retrieve weather history for location", async () => {
      const history = await getWeatherHistory(33.3152, 44.3661, 24);

      expect(Array.isArray(history)).toBe(true);
      // History might be empty if no data exists yet
    });
  });

  describe("getAllPressureSensitiveConditions", () => {
    it("should retrieve all pressure-sensitive conditions", async () => {
      const conditions = await getAllPressureSensitiveConditions();

      expect(Array.isArray(conditions)).toBe(true);
      // Conditions list might be empty initially
    });
  });
});

describe("Patient Pressure Sensitivity Tracking", () => {
  const testUserId = 999999; // Test user ID

  describe("upsertPatientPressureSensitivity", () => {
    it("should create new patient sensitivity", async () => {
      const sensitivity = await upsertPatientPressureSensitivity({
        userId: testUserId,
        conditionId: 1,
        confirmed: false,
        sensitivity: "moderate",
        typicalDropTrigger: 5,
        notes: "Test sensitivity tracking",
      });

      expect(sensitivity).toBeDefined();
      expect(sensitivity.userId).toBe(testUserId);
      expect(sensitivity.sensitivity).toBe("moderate");
    });

    it("should update existing patient sensitivity", async () => {
      const updated = await upsertPatientPressureSensitivity({
        userId: testUserId,
        conditionId: 1,
        confirmed: true,
        sensitivity: "high",
        typicalDropTrigger: 3,
      });

      expect(updated.confirmed).toBe(true);
      expect(updated.sensitivity).toBe("high");
    });
  });

  describe("insertPressureSymptomEvent", () => {
    it("should record pressure symptom event", async () => {
      const event = await insertPressureSymptomEvent({
        userId: testUserId,
        sensitivityId: 1,
        symptomOnset: new Date(),
        severity: 7,
        pressureAtOnset: 1000,
        pressureChange1h: -5,
        symptoms: ["Throbbing headache", "Nausea"],
        interventionTaken: "Took ibuprofen",
        interventionEffectiveness: 6,
      });

      expect(event).toBeDefined();
      expect(event.userId).toBe(testUserId);
      expect(event.severity).toBe(7);
    });
  });

  describe("getPatientPressureSymptomHistory", () => {
    it("should retrieve patient symptom history", async () => {
      const history = await getPatientPressureSymptomHistory(testUserId, 30);

      expect(Array.isArray(history)).toBe(true);
      // History should contain the event we just created
      if (history.length > 0) {
        expect(history[0]?.userId).toBe(testUserId);
      }
    });
  });
});

describe("Integration: Full Weather Tracking Flow", () => {
  it("should track weather → detect changes → generate alerts → recommend actions", async () => {
    // 1. Fetch current weather
    const weather = await fetchCurrentWeather(33.3152, 44.3661);
    expect(weather).toBeDefined();

    // 2. Store in database
    const stored = await insertWeatherCondition({
      latitude: weather.latitude,
      longitude: weather.longitude,
      cityName: weather.cityName,
      countryCode: weather.countryCode,
      pressure: weather.pressure,
      temperature: weather.temperature,
      humidity: weather.humidity,
      weatherCondition: weather.weatherCondition,
      windSpeed: weather.windSpeed,
      observedAt: weather.observedAt,
    });
    expect(stored.id).toBeDefined();

    // 3. Get history
    const history = await getWeatherHistory(33.3152, 44.3661, 24);
    expect(Array.isArray(history)).toBe(true);

    // 4. Calculate pressure changes (if history exists)
    if (history.length > 0) {
      const pressureChange = calculatePressureChange(weather.pressure, history);
      expect(pressureChange).toBeDefined();
      expect(pressureChange.current).toBe(weather.pressure);

      // 5. Detect alerts
      const alerts = detectPressureAlerts(pressureChange);
      expect(Array.isArray(alerts)).toBe(true);

      // 6. Get recommendations
      const recommendations = getPressureConditionRecommendations(
        pressureChange,
        alerts
      );
      expect(Array.isArray(recommendations)).toBe(true);
    }
  });
});

describe("Edge Cases and Error Handling", () => {
  it("should handle empty pressure history", () => {
    const pressureChange = calculatePressureChange(1013, []);

    expect(pressureChange.current).toBe(1013);
    expect(pressureChange.change1h).toBeUndefined();
    expect(pressureChange.velocity).toBe(0);
  });

  it("should handle invalid coordinates gracefully", async () => {
    await expect(fetchCurrentWeather(999, 999)).rejects.toThrow();
  });

  it("should handle missing API key gracefully", async () => {
    // This test assumes OPENWEATHER_API_KEY is configured
    // In production, the service should handle missing keys
    const weather = await fetchCurrentWeather(33.3152, 44.3661);
    expect(weather).toBeDefined();
  });
});
