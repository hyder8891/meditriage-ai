/**
 * Database Connection Pool Load Test
 * Simulates 50+ concurrent users to verify pool handles production traffic
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

// Metrics tracking
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  connectionErrors: 0,
  queryErrors: 0,
  timeoutErrors: 0,
  responseTimes: [],
};

/**
 * Simulate a single user making a database query
 */
async function simulateUser(pool, userId, queryType = 'simple') {
  const startTime = Date.now();
  let conn;
  
  try {
    metrics.totalRequests++;
    
    // Acquire connection from pool
    conn = await pool.getConnection();
    
    // Simulate different query types
    let query;
    switch (queryType) {
      case 'simple':
        query = 'SELECT 1 as test';
        break;
      case 'user_lookup':
        query = 'SELECT * FROM users LIMIT 1';
        break;
      case 'triage_query':
        query = 'SELECT * FROM triage_records ORDER BY created_at DESC LIMIT 10';
        break;
      case 'complex':
        query = `
          SELECT u.id, u.name, COUNT(t.id) as triage_count 
          FROM users u 
          LEFT JOIN triage_records t ON u.id = t.user_id 
          GROUP BY u.id 
          LIMIT 5
        `;
        break;
      default:
        query = 'SELECT 1 as test';
    }
    
    // Execute query
    const [rows] = await conn.query(query);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    metrics.totalResponseTime += responseTime;
    metrics.responseTimes.push(responseTime);
    metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
    metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
    metrics.successfulRequests++;
    
    return { userId, success: true, responseTime, rowCount: rows.length };
    
  } catch (error) {
    metrics.failedRequests++;
    
    if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      metrics.connectionErrors++;
    } else if (error.code === 'ETIMEDOUT') {
      metrics.timeoutErrors++;
    } else {
      metrics.queryErrors++;
    }
    
    const responseTime = Date.now() - startTime;
    return { userId, success: false, error: error.message, responseTime };
    
  } finally {
    // Always release connection back to pool
    if (conn) {
      conn.release();
    }
  }
}

/**
 * Run load test with specified number of concurrent users
 */
async function runLoadTest(concurrentUsers, queriesPerUser, poolConfig) {
  console.log(`\n🚀 Starting Load Test`);
  console.log(`   Concurrent Users: ${concurrentUsers}`);
  console.log(`   Queries per User: ${queriesPerUser}`);
  console.log(`   Total Queries: ${concurrentUsers * queriesPerUser}`);
  console.log(`   Pool Config: connectionLimit=${poolConfig.connectionLimit}, queueLimit=${poolConfig.queueLimit}\n`);
  
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  const pool = mysql.createPool({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    port: dbConfig.port,
    ssl: dbConfig.ssl,
    ...poolConfig,
  });
  
  const startTime = Date.now();
  
  try {
    // Create array of all user simulations
    const allSimulations = [];
    
    for (let userId = 1; userId <= concurrentUsers; userId++) {
      for (let queryNum = 1; queryNum <= queriesPerUser; queryNum++) {
        // Mix different query types for realistic load
        const queryTypes = ['simple', 'user_lookup', 'triage_query', 'complex'];
        const queryType = queryTypes[Math.floor(Math.random() * queryTypes.length)];
        
        allSimulations.push(simulateUser(pool, userId, queryType));
      }
    }
    
    // Execute all simulations concurrently
    console.log(`⏳ Executing ${allSimulations.length} concurrent queries...\n`);
    const results = await Promise.all(allSimulations);
    
    const totalTime = Date.now() - startTime;
    
    // Calculate statistics
    const avgResponseTime = metrics.totalResponseTime / metrics.successfulRequests;
    const sortedTimes = metrics.responseTimes.sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
    const throughput = (metrics.totalRequests / totalTime) * 1000; // requests per second
    
    // Print results
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 LOAD TEST RESULTS`);
    console.log(`${'='.repeat(60)}\n`);
    
    console.log(`⏱️  Duration: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📈 Throughput: ${throughput.toFixed(2)} queries/sec\n`);
    
    console.log(`✅ Successful Requests: ${metrics.successfulRequests}`);
    console.log(`❌ Failed Requests: ${metrics.failedRequests}`);
    console.log(`📊 Success Rate: ${successRate.toFixed(2)}%\n`);
    
    console.log(`⚡ Response Times:`);
    console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   Min: ${metrics.minResponseTime}ms`);
    console.log(`   Max: ${metrics.maxResponseTime}ms`);
    console.log(`   P50 (Median): ${p50}ms`);
    console.log(`   P95: ${p95}ms`);
    console.log(`   P99: ${p99}ms\n`);
    
    if (metrics.failedRequests > 0) {
      console.log(`⚠️  Error Breakdown:`);
      console.log(`   Connection Errors: ${metrics.connectionErrors}`);
      console.log(`   Query Errors: ${metrics.queryErrors}`);
      console.log(`   Timeout Errors: ${metrics.timeoutErrors}\n`);
    }
    
    // Verdict
    console.log(`${'='.repeat(60)}`);
    if (successRate === 100 && avgResponseTime < 1000) {
      console.log(`✅ VERDICT: Pool configuration is EXCELLENT for ${concurrentUsers} concurrent users`);
      console.log(`   All queries succeeded with good performance.`);
    } else if (successRate >= 99 && avgResponseTime < 2000) {
      console.log(`✅ VERDICT: Pool configuration is GOOD for ${concurrentUsers} concurrent users`);
      console.log(`   Minor issues detected but acceptable for production.`);
    } else if (successRate >= 95) {
      console.log(`⚠️  VERDICT: Pool configuration needs OPTIMIZATION`);
      console.log(`   Consider increasing connectionLimit or optimizing queries.`);
    } else {
      console.log(`❌ VERDICT: Pool configuration is INSUFFICIENT`);
      console.log(`   CRITICAL: Increase connectionLimit immediately!`);
    }
    console.log(`${'='.repeat(60)}\n`);
    
    // Recommendations
    if (metrics.connectionErrors > 0 || successRate < 100) {
      console.log(`💡 RECOMMENDATIONS:`);
      if (metrics.connectionErrors > 0) {
        console.log(`   - Increase connectionLimit from ${poolConfig.connectionLimit} to ${poolConfig.connectionLimit * 2}`);
      }
      if (avgResponseTime > 1000) {
        console.log(`   - Optimize slow queries (P95: ${p95}ms, P99: ${p99}ms)`);
        console.log(`   - Add database indexes for frequently queried fields`);
      }
      if (metrics.timeoutErrors > 0) {
        console.log(`   - Increase query timeout settings`);
        console.log(`   - Check database server performance`);
      }
      console.log();
    }
    
    await pool.end();
    return { success: successRate === 100, metrics, totalTime };
    
  } catch (error) {
    console.error('\n❌ Load test failed:', error);
    await pool.end();
    throw error;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🔍 Database Connection Pool Load Test\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  // Test scenarios
  const scenarios = [
    {
      name: 'Light Load (10 users)',
      concurrentUsers: 10,
      queriesPerUser: 5,
      poolConfig: {
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      },
    },
    {
      name: 'Medium Load (25 users)',
      concurrentUsers: 25,
      queriesPerUser: 4,
      poolConfig: {
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      },
    },
    {
      name: 'Heavy Load (50 users)',
      concurrentUsers: 50,
      queriesPerUser: 3,
      poolConfig: {
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      },
    },
    {
      name: 'Extreme Load (100 users)',
      concurrentUsers: 100,
      queriesPerUser: 2,
      poolConfig: {
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      },
    },
  ];
  
  const results = [];
  
  for (const scenario of scenarios) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 SCENARIO: ${scenario.name}`);
    console.log(`${'='.repeat(60)}`);
    
    // Reset metrics
    Object.assign(metrics, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      connectionErrors: 0,
      queryErrors: 0,
      timeoutErrors: 0,
      responseTimes: [],
    });
    
    const result = await runLoadTest(
      scenario.concurrentUsers,
      scenario.queriesPerUser,
      scenario.poolConfig
    );
    
    results.push({
      scenario: scenario.name,
      ...result,
    });
    
    // Wait between scenarios to let connections settle
    if (scenario !== scenarios[scenarios.length - 1]) {
      console.log('⏳ Waiting 3 seconds before next scenario...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Final summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 FINAL SUMMARY`);
  console.log(`${'='.repeat(60)}\n`);
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const avgTime = (result.metrics.totalResponseTime / result.metrics.successfulRequests).toFixed(2);
    const successRate = ((result.metrics.successfulRequests / result.metrics.totalRequests) * 100).toFixed(2);
    
    console.log(`${status} ${result.scenario}`);
    console.log(`   Success Rate: ${successRate}% | Avg Response: ${avgTime}ms | Duration: ${(result.totalTime / 1000).toFixed(2)}s\n`);
  });
  
  const allPassed = results.every(r => r.success);
  
  if (allPassed) {
    console.log(`🎉 ALL TESTS PASSED! Connection pool is production-ready.`);
  } else {
    console.log(`⚠️  SOME TESTS FAILED. Review recommendations above.`);
  }
  
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
