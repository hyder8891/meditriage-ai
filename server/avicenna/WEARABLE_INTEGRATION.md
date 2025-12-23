# Wearable Integration System

**Part of Avicenna-x Feature #5: Real-time Health Metrics Enhancement**

## Overview

The Wearable Integration system connects Apple Watch (HealthKit) and Fitbit devices to MediTriage AI Pro, enriching the Context Vector with real-time health metrics for more accurate clinical reasoning.

## Architecture

### Components

1. **Database Schema** (`drizzle/schema.ts`)
   - `wearable_connections`: Device connection metadata and OAuth tokens
   - `wearable_data_points`: Time-series health metrics (heart rate, steps, sleep, etc.)
   - `wearable_metrics_summary`: Pre-computed daily/weekly/monthly aggregates

2. **Integration Service** (`server/avicenna/wearable-integration.ts`)
   - Device connection management
   - Data synchronization (Apple Watch & Fitbit)
   - Metric aggregation and anomaly detection
   - Context Vector integration

3. **tRPC API** (`server/avicenna/wearable-router.ts`)
   - RESTful endpoints for device management
   - Real-time data sync triggers
   - Query endpoints for metrics and summaries

4. **Context Vector Enhancement** (`server/brain/context-vector.ts`)
   - Automatic wearable data fetching
   - Symptom severity adjustment based on health metrics
   - Anomaly-aware clinical reasoning

## Supported Devices

### Apple Watch (HealthKit)
- **Metrics**: Heart rate, HRV, steps, distance, blood oxygen, respiratory rate, sleep
- **Authentication**: OAuth 2.0 with HealthKit API
- **Sync Frequency**: Configurable (default: 1 hour)

### Fitbit
- **Metrics**: Heart rate, steps, calories, sleep duration/quality, active minutes
- **Authentication**: OAuth 2.0 with Fitbit Web API
- **Sync Frequency**: Configurable (default: 1 hour)

## Database Schema

### `wearable_connections`
```sql
CREATE TABLE wearable_connections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  device_type ENUM('apple_watch', 'fitbit') NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_model VARCHAR(100),
  status ENUM('active', 'disconnected', 'error') DEFAULT 'active',
  last_sync_at TIMESTAMP,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency INT DEFAULT 3600,
  enabled_metrics TEXT NOT NULL, -- JSON array
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

### `wearable_data_points`
```sql
CREATE TABLE wearable_data_points (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  connection_id INT NOT NULL,
  metric_type ENUM('heart_rate', 'steps', 'distance', 'calories', 
                   'active_minutes', 'sleep_duration', 'sleep_quality',
                   'blood_oxygen', 'hrv', 'resting_heart_rate',
                   'blood_pressure_systolic', 'blood_pressure_diastolic',
                   'respiratory_rate', 'body_temperature', 'weight', 'bmi'),
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  measured_at TIMESTAMP NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.00,
  context TEXT, -- JSON
  source_device VARCHAR(100) NOT NULL,
  source_app VARCHAR(100),
  synced_at TIMESTAMP DEFAULT NOW(),
  external_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `wearable_metrics_summary`
```sql
CREATE TABLE wearable_metrics_summary (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  period_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  avg_heart_rate DECIMAL(5,2),
  min_heart_rate INT,
  max_heart_rate INT,
  resting_heart_rate INT,
  avg_hrv DECIMAL(6,2),
  total_steps INT,
  total_distance DECIMAL(8,2),
  total_calories INT,
  total_active_minutes INT,
  avg_sleep_duration DECIMAL(4,2),
  avg_sleep_quality DECIMAL(3,2),
  avg_blood_oxygen DECIMAL(5,2),
  avg_respiratory_rate DECIMAL(4,2),
  avg_systolic INT,
  avg_diastolic INT,
  avg_weight DECIMAL(5,2),
  avg_bmi DECIMAL(4,2),
  avg_body_temp DECIMAL(4,2),
  data_completeness DECIMAL(3,2) DEFAULT 1.00,
  measurement_count INT DEFAULT 0,
  anomalies TEXT, -- JSON array
  last_updated TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Connection Management

#### Connect Device
```typescript
trpc.wearable.connectDevice.mutate({
  deviceType: "apple_watch",
  deviceId: "unique-device-id",
  deviceName: "John's Apple Watch",
  deviceModel: "Apple Watch Series 8",
  accessToken: "oauth-access-token",
  refreshToken: "oauth-refresh-token",
  tokenExpiresAt: "2024-12-31T23:59:59Z",
  enabledMetrics: ["heart_rate", "steps", "blood_oxygen", "hrv"]
});
```

#### Disconnect Device
```typescript
trpc.wearable.disconnectDevice.mutate({
  connectionId: 123
});
```

#### Get Connections
```typescript
const { connections } = await trpc.wearable.getConnections.query();
```

### Data Synchronization

#### Sync Device
```typescript
const result = await trpc.wearable.syncDevice.mutate({
  connectionId: 123
});
// Returns: { success: true, syncedCount: 4, errors: [], lastSyncAt: Date }
```

#### Get Recent Data
```typescript
const { dataPoints } = await trpc.wearable.getRecentData.query({
  hoursBack: 24
});
```

#### Get Metric Data
```typescript
const { dataPoints } = await trpc.wearable.getMetricData.query({
  metricType: "heart_rate",
  startDate: "2024-01-01T00:00:00Z",
  endDate: "2024-01-31T23:59:59Z"
});
```

### Aggregated Summaries

#### Get Daily Summary
```typescript
const { summary } = await trpc.wearable.getDailySummary.query({
  date: "2024-01-15"
});
```

#### Compute Daily Summary (Background Job)
```typescript
await trpc.wearable.computeDailySummary.mutate({
  date: "2024-01-15"
});
```

### Context Vector Integration

#### Get Wearable Context for AI
```typescript
const { context } = await trpc.wearable.getContextForAI.query();
// Returns formatted string for AI consumption
```

## Context Vector Integration

### How It Works

1. **Data Fetching**: When building a Context Vector, the system automatically fetches wearable data
2. **Aggregation**: Prioritizes pre-computed daily summaries for speed (<200ms target)
3. **Fallback**: If no summary exists, computes aggregates from recent data points
4. **Severity Adjustment**: Enhances symptom severity calculation with wearable metrics

### Severity Adjustments

| Metric | Condition | Severity Increase |
|--------|-----------|-------------------|
| HRV | < 20 ms | +2 |
| HRV | < 30 ms | +1 |
| Resting HR | > 100 bpm | +2 |
| Resting HR | > 90 bpm | +1 |
| Blood O₂ | < 90% | +3 (critical) |
| Blood O₂ | < 92% | +2 |
| Blood O₂ | < 95% | +1 |
| Sleep | < 4 hours | +1 |
| Sleep | < 5 hours | +0.5 |
| Anomaly | High/Critical | +2 |
| Anomaly | Moderate | +1 |

### Example Context Output

```
**Wearable Health Data (Last 24 Hours):**

**Today's Summary:**
- Average Heart Rate: 72 bpm
- Total Steps: 8500
- Sleep Duration: 7.5 hours
- Average HRV: 45 ms
- Average Blood Oxygen: 98%

**⚠️ Detected Anomalies:**
- elevated heart rate: 105 (moderate severity)

**Recent Measurements:**
- heart rate: 72 bpm (avg: 74.3 bpm, 48 readings)
- steps: 8500 steps (avg: 8500.0 steps, 1 readings)
- blood oxygen: 98 % (avg: 97.8 %, 24 readings)
- hrv: 45 ms (avg: 43.2 ms, 12 readings)
```

## Anomaly Detection

### Automatic Detection

The system automatically detects anomalies during daily summary computation:

1. **Elevated Heart Rate**: Average > 100 bpm
2. **Low Blood Oxygen**: Average < 92%
3. **Insufficient Sleep**: < 5 hours

### Anomaly Structure

```typescript
{
  type: "elevated_heart_rate" | "low_blood_oxygen" | "insufficient_sleep",
  severity: "low" | "moderate" | "high" | "critical",
  value: number
}
```

## Background Jobs

### Daily Summary Computation

**Recommended Schedule**: Daily at midnight (00:00 UTC)

```typescript
// Cron job or scheduled task
async function computeDailySummariesForAllUsers() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const users = await getAllUsersWithWearables();
  
  for (const user of users) {
    await computeDailySummary(user.id, yesterday);
  }
}
```

### Data Sync

**Recommended Schedule**: Every hour

```typescript
// Cron job or scheduled task
async function syncAllActiveDevices() {
  const connections = await getAllActiveConnections();
  
  for (const conn of connections) {
    if (conn.deviceType === "apple_watch") {
      await syncAppleWatchData(conn.id, conn.userId);
    } else if (conn.deviceType === "fitbit") {
      await syncFitbitData(conn.id, conn.userId);
    }
  }
}
```

## Security Considerations

### OAuth Token Storage

- **Current**: Tokens stored as plain text in database (for MVP)
- **Production**: MUST encrypt tokens using AES-256 or similar
- **Recommendation**: Use environment-specific encryption keys

### Token Refresh

- Implement automatic token refresh when `token_expires_at` is approaching
- Handle OAuth refresh token flow for both Apple and Fitbit

### Data Privacy

- All wearable data is user-specific and protected by authentication
- No cross-user data access
- Comply with HIPAA/GDPR requirements for health data

## Testing

### Run Tests

```bash
cd /home/ubuntu/meditriage-ai
pnpm test server/avicenna/wearable-integration.test.ts
```

### Test Coverage

- ✅ Connection management (connect, disconnect, retrieve)
- ✅ Data synchronization (Apple Watch, Fitbit)
- ✅ Data retrieval (recent, specific metrics)
- ✅ Aggregation (daily summaries, anomaly detection)
- ✅ Context Vector integration
- ✅ Error handling
- ✅ Data quality (confidence scores, completeness)
- ✅ Multi-device support

## Production Deployment Checklist

- [ ] Implement OAuth flows for Apple HealthKit
- [ ] Implement OAuth flows for Fitbit Web API
- [ ] Encrypt OAuth tokens in database
- [ ] Set up automatic token refresh
- [ ] Configure background jobs (daily summaries, hourly sync)
- [ ] Add rate limiting for API calls
- [ ] Implement webhook listeners for real-time updates
- [ ] Add monitoring and alerting for sync failures
- [ ] Implement data retention policies
- [ ] Add user consent management UI
- [ ] Test with real devices (Apple Watch, Fitbit)
- [ ] Load testing with multiple concurrent syncs

## Future Enhancements

1. **Additional Devices**
   - Garmin
   - Samsung Galaxy Watch
   - Oura Ring
   - Whoop

2. **Advanced Analytics**
   - Trend prediction (ML-based)
   - Personalized health insights
   - Comparative analysis (vs. population averages)

3. **Real-time Alerts**
   - Push notifications for critical anomalies
   - Doctor notifications for high-risk patients
   - Emergency contact alerts

4. **Integration Depth**
   - Medication adherence tracking
   - Exercise recommendations
   - Stress management insights

## Troubleshooting

### Common Issues

**Issue**: Sync fails with "Database not available"
- **Solution**: Ensure database connection is established before calling sync functions

**Issue**: No data returned from wearable queries
- **Solution**: Check if user has connected devices and data has been synced

**Issue**: Anomalies not detected
- **Solution**: Ensure daily summary computation is running; anomalies are only detected during aggregation

**Issue**: Context Vector not including wearable data
- **Solution**: Verify wearable data exists and is recent (< 24 hours)

## Support

For issues or questions:
- Check test suite: `server/avicenna/wearable-integration.test.ts`
- Review implementation: `server/avicenna/wearable-integration.ts`
- Contact: MediTriage AI Pro Development Team
