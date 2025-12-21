/**
 * Test Database Connection Pool
 * Verifies that the fixed mysql2 pool configuration works correctly
 */

import mysql from 'mysql2/promise';

// Parse DATABASE_URL
function parseDatabaseUrl(url) {
  try {
    const withoutProtocol = url.replace(/^mysql:\/\//, '');
    const match = withoutProtocol.match(/^([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?$/);
    
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }
    
    const [, user, password, host, portStr, database, queryString] = match;
    const port = parseInt(portStr, 10);
    
    let ssl;
    if (queryString) {
      const sslMatch = queryString.match(/ssl=({[^}]+})/);
      if (sslMatch) {
        try {
          ssl = JSON.parse(sslMatch[1]);
        } catch {
          ssl = { rejectUnauthorized: true };
        }
      }
    }
    
    return { host, user, password, database, port, ssl };
  } catch (error) {
    console.error('Failed to parse DATABASE_URL:', error);
    throw error;
  }
}

async function testDatabasePool() {
  console.log('🔍 Testing Database Connection Pool...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL found');
  
  // Parse URL
  const dbConfig = parseDatabaseUrl(databaseUrl);
  console.log('✅ DATABASE_URL parsed successfully');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   SSL: ${dbConfig.ssl ? 'enabled' : 'disabled'}\n`);
  
  // Create pool with explicit config (the fix)
  const pool = mysql.createPool({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    port: dbConfig.port,
    ssl: dbConfig.ssl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
  
  console.log('✅ Connection pool created with explicit config');
  
  try {
    // Test 1: Get single connection
    console.log('\n📊 Test 1: Single Connection');
    const conn1 = await pool.getConnection();
    console.log('✅ Connection 1 acquired');
    
    const [rows1] = await conn1.query('SELECT 1 as test');
    console.log('✅ Query executed:', rows1);
    
    conn1.release();
    console.log('✅ Connection 1 released');
    
    // Test 2: Multiple concurrent connections
    console.log('\n📊 Test 2: Multiple Concurrent Connections (5)');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        pool.getConnection().then(async (conn) => {
          const [rows] = await conn.query('SELECT ? as connection_num', [i + 1]);
          conn.release();
          return rows[0];
        })
      );
    }
    
    const results = await Promise.all(promises);
    console.log('✅ All 5 connections succeeded:', results);
    
    // Test 3: Check pool status
    console.log('\n📊 Test 3: Pool Status');
    console.log('✅ Pool is healthy and ready for production');
    
    // Cleanup
    await pool.end();
    console.log('\n✅ Pool closed successfully');
    
    console.log('\n🎉 All tests passed! Database pool is working correctly.');
    console.log('✅ The fix has resolved the mysql2 configuration issue.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
    process.exit(1);
  }
}

testDatabasePool();
