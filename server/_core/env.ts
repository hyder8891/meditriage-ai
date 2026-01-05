// SECURITY FIX: Validate critical environment variables at startup
function validateEnv() {
  const required = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    VITE_APP_ID: process.env.VITE_APP_ID,
    OAUTH_SERVER_URL: process.env.OAUTH_SERVER_URL,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Critical environment variables missing: ${missing.join(', ')}. ` +
      `Application cannot start without these values.`
    );
  }
}

// Run validation immediately
validateEnv();

export const ENV = {
  appId: process.env.VITE_APP_ID!,
  cookieSecret: process.env.JWT_SECRET!,
  databaseUrl: process.env.DATABASE_URL!,
  oAuthServerUrl: process.env.OAUTH_SERVER_URL!,
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY ?? "",
  ncbiApiKey: process.env.NCBI_API_KEY ?? "",
  utsApiKey: process.env.UTS_API_KEY ?? "",
};
