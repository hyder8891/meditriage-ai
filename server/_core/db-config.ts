/**
 * Database Configuration Parser
 * Parses DATABASE_URL into mysql2-compatible connection parameters
 */

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

/**
 * Parse DATABASE_URL into explicit connection parameters
 * Format: mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}
 */
export function parseDatabaseUrl(url: string): DatabaseConfig {
  try {
    // Remove protocol prefix
    const withoutProtocol = url.replace(/^mysql:\/\//, '');
    
    // Extract user:password@host:port/database?params
    const match = withoutProtocol.match(/^([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?$/);
    
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }
    
    const [, user, password, host, portStr, database, queryString] = match;
    const port = parseInt(portStr, 10);
    
    // Parse SSL configuration from query string
    let ssl: { rejectUnauthorized: boolean } | undefined;
    if (queryString) {
      const sslMatch = queryString.match(/ssl=({[^}]+})/);
      if (sslMatch) {
        try {
          ssl = JSON.parse(sslMatch[1]);
        } catch {
          // If SSL parsing fails, use default secure SSL
          ssl = { rejectUnauthorized: true };
        }
      }
    }
    
    return {
      host,
      user,
      password,
      database,
      port,
      ssl,
    };
  } catch (error) {
    console.error('[DB Config] Failed to parse DATABASE_URL:', error);
    throw new Error('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
  }
}

/**
 * Get database configuration from environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  return parseDatabaseUrl(databaseUrl);
}
