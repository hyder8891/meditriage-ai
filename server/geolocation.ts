/**
 * IP-based Geolocation Service for Iraq
 * Detects user's location based on IP address and maps to nearest governorate
 */

import { getDb } from "./db";
import { iraqGovernorates, userLocationCache } from "../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";

interface GeoLocation {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  governorate?: string;
  governorateId?: number;
}

interface IpApiResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  lat: number;
  lon: number;
  query: string;
}

/**
 * Get location from IP address using free ip-api.com service
 */
async function fetchLocationFromIp(ipAddress: string): Promise<GeoLocation | null> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,region,regionName,city,lat,lon,query`);
    
    if (!response.ok) {
      console.error('[Geolocation] IP API request failed:', response.status);
      return null;
    }
    
    const data: IpApiResponse = await response.json();
    
    if (data.status !== 'success') {
      console.error('[Geolocation] IP lookup failed for:', ipAddress);
      return null;
    }
    
    return {
      country: data.country,
      countryCode: data.countryCode,
      city: data.city,
      region: data.regionName,
      latitude: data.lat,
      longitude: data.lon,
    };
  } catch (error) {
    console.error('[Geolocation] Error fetching location:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest Iraq governorate based on coordinates
 */
async function findNearestGovernorate(latitude: number, longitude: number): Promise<{ id: number; name: string; nameArabic: string } | null> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) return null;
    
    const governorates = await dbInstance.select().from(iraqGovernorates);
    
    if (governorates.length === 0) {
      return null;
    }
    
    let nearest = governorates[0];
    let minDistance = calculateDistance(
      latitude, 
      longitude, 
      Number(nearest.latitude), 
      Number(nearest.longitude)
    );
    
    for (const gov of governorates) {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        Number(gov.latitude), 
        Number(gov.longitude)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = gov;
      }
    }
    
    return {
      id: nearest.id,
      name: nearest.name,
      nameArabic: nearest.nameArabic,
    };
  } catch (error) {
    console.error('[Geolocation] Error finding nearest governorate:', error);
    return null;
  }
}

/**
 * Map region/city name to Iraq governorate
 */
async function mapToGovernorate(location: GeoLocation): Promise<{ id: number; name: string; nameArabic: string } | null> {
  const dbInstance = await getDb();
  if (!dbInstance) return null;
  
  if (location.countryCode !== 'IQ') {
    const baghdad = await dbInstance.select().from(iraqGovernorates).where(eq(iraqGovernorates.name, 'Baghdad')).limit(1);
    if (baghdad.length > 0) {
      return {
        id: baghdad[0].id,
        name: baghdad[0].name,
        nameArabic: baghdad[0].nameArabic,
      };
    }
    return null;
  }
  
  const cityLower = location.city.toLowerCase();
  const regionLower = location.region.toLowerCase();
  
  const cityMappings: Record<string, string> = {
    'baghdad': 'Baghdad',
    'basra': 'Basra',
    'basrah': 'Basra',
    'mosul': 'Nineveh',
    'erbil': 'Erbil',
    'arbil': 'Erbil',
    'hewler': 'Erbil',
    'sulaymaniyah': 'Sulaymaniyah',
    'sulaimaniya': 'Sulaymaniyah',
    'duhok': 'Duhok',
    'dahuk': 'Duhok',
    'kirkuk': 'Kirkuk',
    'baqubah': 'Diyala',
    'ramadi': 'Anbar',
    'fallujah': 'Anbar',
    'hillah': 'Babil',
    'hilla': 'Babil',
    'karbala': 'Karbala',
    'kerbala': 'Karbala',
    'najaf': 'Najaf',
    'kut': 'Wasit',
    'amarah': 'Maysan',
    'nasiriyah': 'Dhi Qar',
    'samawah': 'Muthanna',
    'diwaniyah': 'Qadisiyyah',
    'tikrit': 'Saladin',
    'samarra': 'Saladin',
  };
  
  for (const [city, governorate] of Object.entries(cityMappings)) {
    if (cityLower.includes(city) || regionLower.includes(city)) {
      const gov = await dbInstance.select().from(iraqGovernorates).where(eq(iraqGovernorates.name, governorate)).limit(1);
      if (gov.length > 0) {
        return {
          id: gov[0].id,
          name: gov[0].name,
          nameArabic: gov[0].nameArabic,
        };
      }
    }
  }
  
  return findNearestGovernorate(location.latitude, location.longitude);
}

/**
 * Check cache for existing location lookup
 */
async function getCachedLocation(ipAddress: string): Promise<GeoLocation | null> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) return null;
    
    const cached = await dbInstance.select()
      .from(userLocationCache)
      .where(
        and(
          eq(userLocationCache.ipAddress, ipAddress),
          gt(userLocationCache.expiresAt, new Date())
        )
      )
      .limit(1);
    
    if (cached.length > 0) {
      const entry = cached[0];
      return {
        country: entry.country || '',
        countryCode: entry.countryCode || '',
        city: entry.city || '',
        region: entry.governorate || '',
        latitude: Number(entry.latitude) || 0,
        longitude: Number(entry.longitude) || 0,
        governorate: entry.governorate || undefined,
        governorateId: entry.governorateId || undefined,
      };
    }
    
    return null;
  } catch (error) {
    console.error('[Geolocation] Cache lookup error:', error);
    return null;
  }
}

/**
 * Cache location lookup result
 */
async function cacheLocation(ipAddress: string, location: GeoLocation, governorateId?: number): Promise<void> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) return;
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await dbInstance.insert(userLocationCache).values({
      ipAddress,
      country: location.country,
      countryCode: location.countryCode,
      governorate: location.governorate || location.region,
      city: location.city,
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      governorateId,
      expiresAt,
    });
  } catch (error) {
    console.error('[Geolocation] Cache write error:', error);
  }
}

/**
 * Main function to get user's location from IP address
 */
export async function getUserLocation(ipAddress: string): Promise<GeoLocation | null> {
  const dbInstance = await getDb();
  
  if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
    if (dbInstance) {
      const baghdad = await dbInstance.select().from(iraqGovernorates).where(eq(iraqGovernorates.name, 'Baghdad')).limit(1);
      if (baghdad.length > 0) {
        return {
          country: 'Iraq',
          countryCode: 'IQ',
          city: 'Baghdad',
          region: 'Baghdad',
          latitude: Number(baghdad[0].latitude),
          longitude: Number(baghdad[0].longitude),
          governorate: 'Baghdad',
          governorateId: baghdad[0].id,
        };
      }
    }
  }
  
  const cached = await getCachedLocation(ipAddress);
  if (cached) {
    console.log('[Geolocation] Cache hit for IP:', ipAddress);
    return cached;
  }
  
  const location = await fetchLocationFromIp(ipAddress);
  if (!location) {
    return null;
  }
  
  const governorate = await mapToGovernorate(location);
  if (governorate) {
    location.governorate = governorate.name;
    location.governorateId = governorate.id;
  }
  
  await cacheLocation(ipAddress, location, governorate?.id);
  
  return location;
}

/**
 * Get all Iraq governorates
 */
export async function getAllGovernorates() {
  const dbInstance = await getDb();
  if (!dbInstance) return [];
  return dbInstance.select().from(iraqGovernorates);
}

/**
 * Get governorate by name
 */
export async function getGovernorateByName(name: string) {
  const dbInstance = await getDb();
  if (!dbInstance) return null;
  
  const result = await dbInstance.select()
    .from(iraqGovernorates)
    .where(eq(iraqGovernorates.name, name))
    .limit(1);
  
  return result[0] || null;
}
