# MediTriage AI - Load Testing Suite

This directory contains comprehensive load testing scripts for the MediTriage AI application using k6.

## Overview

The load testing suite simulates realistic user scenarios to evaluate system performance under high concurrent load. The tests are designed to identify bottlenecks, measure response times, and ensure the application can handle production-scale traffic.

## Test Scenarios

### 1. Patient Flow Test (`patient-flow.js`)
Simulates patient users performing triage operations:
- Authentication checks
- Symptom submission and triage analysis
- Triage history retrieval
- Conversational AI interactions

**Load Profile:**
- Ramp up to 1000 concurrent patients
- Duration: ~17 minutes
- Focus: Triage system performance

### 2. Doctor Flow Test (`doctor-flow.js`)
Simulates healthcare provider workflows:
- Authentication and authorization
- Consultation queue management
- Patient record access
- Brain AI assistant queries
- Lab result retrieval

**Load Profile:**
- Ramp up to 500 concurrent doctors
- Duration: ~17 minutes
- Focus: Clinical decision support systems

### 3. Mixed Flow Test (`mixed-flow.js`)
Simulates realistic production environment with both user types:
- 70% patients (700 concurrent users)
- 30% doctors (300 concurrent users)
- Total: 1000 concurrent users

**Load Profile:**
- Gradual ramp up over 10 minutes
- 5 minute sustained peak load
- Gradual ramp down

## Prerequisites

- k6 load testing tool installed
- MediTriage AI application running
- Network access to the application

## Running Tests

### Basic Test Execution

```bash
# Run patient flow test
k6 run load-tests/patient-flow.js

# Run doctor flow test
k6 run load-tests/doctor-flow.js

# Run mixed flow test (recommended)
k6 run load-tests/mixed-flow.js
```

### Custom Configuration

```bash
# Override base URL
k6 run -e BASE_URL=https://your-domain.com load-tests/mixed-flow.js

# Run with different VU count
k6 run --vus 500 --duration 10m load-tests/patient-flow.js

# Generate detailed output
k6 run --out json=results.json load-tests/mixed-flow.js
```

## Performance Thresholds

The tests include predefined thresholds:

- **Response Time (p95):** < 10 seconds for most endpoints
- **Error Rate:** < 15% (accounting for auth-protected endpoints)
- **Triage Response Time (p95):** < 12 seconds
- **Consultation Response Time (p95):** < 15 seconds

## Interpreting Results

### Key Metrics to Monitor

1. **http_req_duration:** Overall response time distribution
2. **http_req_failed:** Failed request rate
3. **errors:** Custom error rate from check failures
4. **triage_response_time:** Specific to triage operations
5. **consultation_response_time:** Specific to consultation workflows

### Success Criteria

- ✅ 95th percentile response times within thresholds
- ✅ Error rate below 15%
- ✅ No server crashes or timeouts
- ✅ Consistent performance throughout test duration

### Warning Signs

- ⚠️ Response times increasing over test duration (memory leak)
- ⚠️ High error rates (> 20%)
- ⚠️ Timeout errors (> 30 seconds)
- ⚠️ Database connection errors

## Expected Bottlenecks

Based on the application architecture, potential bottlenecks include:

1. **LLM API Calls:** Triage and Brain queries involve external AI services
2. **Database Queries:** High concurrent read/write operations
3. **Session Management:** Cookie parsing and JWT validation
4. **Network Latency:** External API dependencies

## Optimization Recommendations

After running tests, consider:

1. **Caching:** Implement Redis for frequently accessed data
2. **Database Indexing:** Add indexes on frequently queried columns
3. **Connection Pooling:** Optimize database connection pool size
4. **Rate Limiting:** Implement rate limiting for API endpoints
5. **CDN:** Use CDN for static assets
6. **Load Balancing:** Distribute traffic across multiple instances

## Test Results Location

Results are saved to:
- `load-tests/patient-flow-summary.json`
- `load-tests/doctor-flow-summary.json`
- `load-tests/mixed-flow-summary.json`

## Notes

- Tests include random delays (sleep) to simulate realistic user behavior
- Authentication-protected endpoints may return 401 errors (expected)
- LLM-based endpoints have higher response times (10-20 seconds)
- The mixed flow test provides the most realistic production simulation

## Troubleshooting

### High Error Rates
- Check if application is running
- Verify BASE_URL is correct
- Check server logs for errors

### Slow Response Times
- Monitor server CPU and memory usage
- Check database query performance
- Review LLM API rate limits

### Connection Errors
- Verify network connectivity
- Check firewall rules
- Ensure sufficient file descriptors (ulimit)
