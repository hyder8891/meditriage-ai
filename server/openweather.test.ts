import { describe, it, expect } from 'vitest';

describe('OpenWeather API Key Validation', () => {
  it('should successfully fetch weather data for Baghdad using provided API key', async () => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    // Skip test if no API key provided
    if (!apiKey) {
      console.log('⚠️ OPENWEATHER_API_KEY not set - skipping validation');
      return;
    }

    const lat = 33.3152;
    const lon = 44.3661;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`OpenWeather API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }

    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    // Validate response structure
    expect(data).toHaveProperty('main');
    expect(data.main).toHaveProperty('temp');
    expect(data.main).toHaveProperty('humidity');
    expect(data.main).toHaveProperty('pressure');
    expect(data).toHaveProperty('name');
    
    console.log('✅ OpenWeather API key is valid!');
    console.log(`📍 Location: ${data.name}`);
    console.log(`🌡️ Temperature: ${data.main.temp}°C`);
    console.log(`💧 Humidity: ${data.main.humidity}%`);
    console.log(`🔽 Pressure: ${data.main.pressure} hPa`);
    
    // Validate data types
    expect(typeof data.main.temp).toBe('number');
    expect(typeof data.main.humidity).toBe('number');
    expect(typeof data.main.pressure).toBe('number');
  }, 10000); // 10 second timeout for test

  it('should handle invalid API key gracefully', async () => {
    const lat = 33.3152;
    const lon = 44.3661;
    const invalidKey = 'invalid_key_12345';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${invalidKey}&units=metric`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(401); // Unauthorized
    
    const data = await response.json();
    expect(data).toHaveProperty('cod');
    expect(data.cod).toBe(401);
  }, 10000);
});
