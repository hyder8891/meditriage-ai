/**
 * Emergency Clinic Routing System
 * 
 * Provides Uber/Careem deep links with real-time traffic + hospital wait times
 * for emergency situations requiring immediate in-person care.
 */

import { safeGet, safeSet, isRedisAvailable } from "./redis-client";

export interface EmergencyClinic {
  id: number;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  emergencyCapabilities: string[];
  currentWaitTime: number; // minutes
  distance: number; // km
  travelTime: number; // minutes with traffic
}

export interface EmergencyRoute {
  clinic: EmergencyClinic;
  transportOptions: {
    uber?: {
      deepLink: string;
      estimatedFare: string;
      estimatedTime: number;
    };
    careem?: {
      deepLink: string;
      estimatedFare: string;
      estimatedTime: number;
    };
    googleMaps: {
      deepLink: string;
      estimatedTime: number;
    };
  };
  totalTime: number; // travel + wait
  urgencyScore: number; // 0-100, higher = better for emergency
}

/**
 * Find best emergency clinic and generate transport deep links
 */
export async function routeToEmergencyClinic(
  userLocation: { lat: number; lng: number },
  severity: "HIGH" | "EMERGENCY",
  requiredCapabilities?: string[]
): Promise<EmergencyRoute> {
  // Step 1: Find nearby emergency clinics
  const nearbyClinics = await findNearbyEmergencyClinics(userLocation, requiredCapabilities);

  if (nearbyClinics.length === 0) {
    throw new Error("No emergency clinics found nearby");
  }

  // Step 2: Score clinics based on wait time + travel time
  const scoredRoutes = await Promise.all(
    nearbyClinics.map(async (clinic) => {
      const travelTime = await estimateTravelTime(userLocation, clinic.location);
      const totalTime = travelTime + clinic.currentWaitTime;
      
      // Urgency score: prioritize shortest total time
      const urgencyScore = Math.max(0, 100 - totalTime);

      return {
        clinic,
        travelTime,
        totalTime,
        urgencyScore,
      };
    })
  );

  // Step 3: Select best clinic
  scoredRoutes.sort((a, b) => b.urgencyScore - a.urgencyScore);
  const bestRoute = scoredRoutes[0];

  // Step 4: Generate transport deep links
  const transportOptions = await generateTransportLinks(
    userLocation,
    bestRoute.clinic.location,
    bestRoute.clinic.name
  );

  return {
    clinic: bestRoute.clinic,
    transportOptions,
    totalTime: bestRoute.totalTime,
    urgencyScore: bestRoute.urgencyScore,
  };
}

/**
 * Find nearby emergency clinics with required capabilities
 */
async function findNearbyEmergencyClinics(
  userLocation: { lat: number; lng: number },
  requiredCapabilities?: string[]
): Promise<EmergencyClinic[]> {
  // TODO: Replace with actual database query
  // For now, return mock data for Baghdad
  const mockClinics: EmergencyClinic[] = [
    {
      id: 1,
      name: "Baghdad Medical City Emergency",
      location: {
        lat: 33.3152,
        lng: 44.3661,
        address: "Medical City Complex, Bab Al-Muadham, Baghdad",
      },
      emergencyCapabilities: ["trauma", "cardiac", "stroke", "pediatric"],
      currentWaitTime: 45, // minutes
      distance: 5.2,
      travelTime: 15,
    },
    {
      id: 2,
      name: "Al-Yarmouk Teaching Hospital",
      location: {
        lat: 33.2778,
        lng: 44.3611,
        address: "Al-Yarmouk, Baghdad",
      },
      emergencyCapabilities: ["trauma", "cardiac", "general"],
      currentWaitTime: 30,
      distance: 3.8,
      travelTime: 12,
    },
    {
      id: 3,
      name: "Ibn Al-Nafees Hospital",
      location: {
        lat: 33.3400,
        lng: 44.4100,
        address: "Al-Mansour, Baghdad",
      },
      emergencyCapabilities: ["cardiac", "stroke", "general"],
      currentWaitTime: 20,
      distance: 6.5,
      travelTime: 18,
    },
  ];

  // Filter by required capabilities
  let filtered = mockClinics;
  if (requiredCapabilities && requiredCapabilities.length > 0) {
    filtered = mockClinics.filter(clinic =>
      requiredCapabilities.every(cap =>
        clinic.emergencyCapabilities.includes(cap)
      )
    );
  }

  // Calculate distances
  filtered = filtered.map(clinic => ({
    ...clinic,
    distance: calculateDistance(userLocation, clinic.location),
  }));

  // Sort by distance
  filtered.sort((a, b) => a.distance - b.distance);

  return filtered.slice(0, 5); // Return top 5 closest
}

/**
 * Estimate travel time with real-time traffic
 */
async function estimateTravelTime(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<number> {
  // Check cache first
  const cacheKey = `travel:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`;
  const cached = await safeGet<number | null>(cacheKey, null);
  if (cached !== null) return cached;

  // TODO: Integrate with Google Maps Directions API for real-time traffic
  // For now, use simple distance-based estimate
  const distance = calculateDistance(origin, destination);
  const estimatedTime = Math.ceil(distance / 0.5); // Assume 30 km/h average speed in Baghdad traffic

  // Cache for 5 minutes
  await safeSet(cacheKey, estimatedTime, { ex: 300 });

  return estimatedTime;
}

/**
 * Generate deep links for Uber, Careem, and Google Maps
 */
async function generateTransportLinks(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  destinationName: string
): Promise<EmergencyRoute['transportOptions']> {
  // Uber deep link
  const uberLink = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${destination.lat}&dropoff[longitude]=${destination.lng}&dropoff[nickname]=${encodeURIComponent(destinationName)}`;

  // Careem deep link
  const careemLink = `careem://ride?drop_lat=${destination.lat}&drop_lng=${destination.lng}&drop_name=${encodeURIComponent(destinationName)}`;

  // Google Maps deep link
  const googleMapsLink = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;

  // Estimate fares (simplified)
  const distance = calculateDistance(origin, destination);
  const baseFare = 2000; // IQD
  const perKmRate = 500; // IQD
  const estimatedFare = `${Math.ceil(baseFare + distance * perKmRate)} IQD`;

  const travelTime = await estimateTravelTime(origin, destination);

  return {
    uber: {
      deepLink: uberLink,
      estimatedFare,
      estimatedTime: travelTime,
    },
    careem: {
      deepLink: careemLink,
      estimatedFare,
      estimatedTime: travelTime,
    },
    googleMaps: {
      deepLink: googleMapsLink,
      estimatedTime: travelTime,
    },
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Update clinic wait time (called by clinic staff or automated system)
 */
export async function updateClinicWaitTime(
  clinicId: number,
  waitTimeMinutes: number
): Promise<void> {
  const key = `clinic:${clinicId}:waittime`;
  await safeSet(key, waitTimeMinutes, { ex: 600 }); // Cache for 10 minutes
}

/**
 * Get current wait time for a clinic
 */
export async function getClinicWaitTime(clinicId: number): Promise<number> {
  const key = `clinic:${clinicId}:waittime`;
  const cached = await safeGet<number | null>(key, null);
  return cached ?? 30; // Default to 30 minutes if not available
}
