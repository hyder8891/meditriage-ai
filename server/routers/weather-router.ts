/**
 * Weather Router
 * tRPC endpoints for barometric pressure tracking and environmental health correlations
 * Part of Avicenna-x Feature #6
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  fetchCurrentWeather,
  calculatePressureChange,
  detectPressureAlerts,
  getPressureConditionRecommendations,
  getCachedWeather,
  cacheWeather,
} from "../services/weather-service";
import {
  insertWeatherCondition,
  getWeatherHistory,
  getLatestWeather,
  getAllPressureSensitiveConditions,
  getPatientPressureSensitivities,
  upsertPatientPressureSensitivity,
  insertPressureSymptomEvent,
  getPatientPressureSymptomHistory,
  updateSymptomFrequency,
} from "../db-weather";

export const weatherRouter = router({
  /**
   * Get current weather and pressure data for a location
   */
  getCurrentWeather: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
    )
    .mutation(async ({ input }) => {
      const { latitude, longitude } = input;

      // Check cache first
      const cached = getCachedWeather(latitude, longitude);
      if (cached) {
        return {
          weather: cached,
          source: "cache" as const,
        };
      }

      // Fetch from API
      const weather = await fetchCurrentWeather(latitude, longitude);

      // Cache the result
      cacheWeather(weather);

      // Store in database
      await insertWeatherCondition({
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

      return {
        weather,
        source: "api" as const,
      };
    }),

  /**
   * Get pressure history and detect changes
   */
  getPressureHistory: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        hoursBack: z.number().min(1).max(168).default(24), // Max 1 week
      })
    )
    .query(async ({ input }) => {
      const { latitude, longitude, hoursBack } = input;

      // Get historical data
      const history = await getWeatherHistory(latitude, longitude, hoursBack);

      if (history.length === 0) {
        return {
          history: [],
          currentPressure: null,
          pressureChange: null,
          alerts: [],
        };
      }

      // Get current pressure (most recent)
      const currentPressure = history[0]?.pressure || 0;

      // Calculate pressure changes
      const pressureChange = calculatePressureChange(currentPressure, history);

      // Detect alerts
      const alerts = detectPressureAlerts(pressureChange);

      return {
        history,
        currentPressure,
        pressureChange,
        alerts,
      };
    }),

  /**
   * Check pressure sensitivity and get recommendations
   */
  checkPressureSensitivity: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { latitude, longitude } = input;

      // Get current weather
      let weather = getCachedWeather(latitude, longitude);
      if (!weather) {
        weather = await fetchCurrentWeather(latitude, longitude);
        cacheWeather(weather);
      }

      // Get pressure history
      const history = await getWeatherHistory(latitude, longitude, 24);

      if (history.length === 0) {
        return {
          currentPressure: weather.pressure,
          pressureChange: null,
          alerts: [],
          recommendations: [],
        };
      }

      // Calculate changes
      const pressureChange = calculatePressureChange(weather.pressure, history);

      // Detect alerts
      const alerts = detectPressureAlerts(pressureChange);

      // Get recommendations
      const recommendations = getPressureConditionRecommendations(
        pressureChange,
        alerts
      );

      return {
        currentPressure: weather.pressure,
        pressureChange,
        alerts,
        recommendations,
      };
    }),

  /**
   * Get all pressure-sensitive conditions
   */
  getPressureSensitiveConditions: publicProcedure.query(async () => {
    return getAllPressureSensitiveConditions();
  }),

  /**
   * Get patient's pressure sensitivities
   */
  getMyPressureSensitivities: protectedProcedure.query(async ({ ctx }) => {
    return getPatientPressureSensitivities(ctx.user.id);
  }),

  /**
   * Add or update patient pressure sensitivity
   */
  updatePressureSensitivity: protectedProcedure
    .input(
      z.object({
        conditionId: z.number(),
        confirmed: z.boolean().optional(),
        sensitivity: z.enum(["low", "moderate", "high", "severe"]).optional(),
        typicalDropTrigger: z.number().optional(),
        typicalRiseTrigger: z.number().optional(),
        typicalOnsetDelay: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return upsertPatientPressureSensitivity({
        userId: ctx.user.id,
        ...input,
      });
    }),

  /**
   * Record a pressure symptom event
   */
  recordPressureSymptom: protectedProcedure
    .input(
      z.object({
        sensitivityId: z.number(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        symptomOnset: z.date(),
        symptomResolution: z.date().optional(),
        severity: z.number().min(1).max(10),
        symptoms: z.array(z.string()).optional(),
        interventionTaken: z.string().optional(),
        interventionEffectiveness: z.number().min(1).max(10).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { latitude, longitude, ...eventData } = input;

      // Get weather context if location provided
      let weatherId: number | undefined;
      let pressureAtOnset: number | undefined;
      let pressureChange1h: number | undefined;
      let pressureChange3h: number | undefined;
      let temperatureAtOnset: number | undefined;
      let humidityAtOnset: number | undefined;

      if (latitude !== undefined && longitude !== undefined) {
        const latestWeather = await getLatestWeather(latitude, longitude);
        if (latestWeather) {
          weatherId = latestWeather.id;
          pressureAtOnset = parseFloat(latestWeather.pressure as string);
          pressureChange1h = latestWeather.pressureChange1h
            ? parseFloat(latestWeather.pressureChange1h as string)
            : undefined;
          pressureChange3h = latestWeather.pressureChange3h
            ? parseFloat(latestWeather.pressureChange3h as string)
            : undefined;
          temperatureAtOnset = latestWeather.temperature
            ? parseFloat(latestWeather.temperature as string)
            : undefined;
          humidityAtOnset = latestWeather.humidity || undefined;
        }
      }

      // Record the event
      const event = await insertPressureSymptomEvent({
        userId: ctx.user.id,
        ...eventData,
        weatherId,
        pressureAtOnset,
        pressureChange1h,
        pressureChange3h,
        temperatureAtOnset,
        humidityAtOnset,
      });

      // Update symptom frequency statistics
      await updateSymptomFrequency(eventData.sensitivityId);

      return event;
    }),

  /**
   * Get patient's pressure symptom history
   */
  getMyPressureSymptomHistory: protectedProcedure
    .input(
      z.object({
        daysBack: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      return getPatientPressureSymptomHistory(ctx.user.id, input.daysBack);
    }),

  /**
   * Get comprehensive pressure analysis for patient
   */
  getMyPressureAnalysis: protectedProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { latitude, longitude } = input;

      // Get patient's sensitivities
      const sensitivities = await getPatientPressureSensitivities(ctx.user.id);

      // Get current weather and pressure
      let weather = getCachedWeather(latitude, longitude);
      if (!weather) {
        weather = await fetchCurrentWeather(latitude, longitude);
        cacheWeather(weather);
      }

      // Get pressure history
      const history = await getWeatherHistory(latitude, longitude, 24);

      // Calculate pressure changes
      const pressureChange =
        history.length > 0
          ? calculatePressureChange(weather.pressure, history)
          : null;

      // Detect alerts
      const alerts = pressureChange ? detectPressureAlerts(pressureChange) : [];

      // Get recommendations
      const recommendations = pressureChange
        ? getPressureConditionRecommendations(pressureChange, alerts)
        : [];

      // Get recent symptom history
      const recentSymptoms = await getPatientPressureSymptomHistory(
        ctx.user.id,
        7
      );

      return {
        currentWeather: weather,
        pressureChange,
        alerts,
        recommendations,
        sensitivities,
        recentSymptoms,
      };
    }),
});
