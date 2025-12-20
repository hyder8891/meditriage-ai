# AEC Alert System Documentation

## Overview

The **AEC (Autonomous Error Correction) Alert System** provides comprehensive email notifications for critical errors, code patches, deployments, and system health. It includes real-time alerts for immediate issues and twice-daily automated reports summarizing all AEC activity.

## Features

### 1. Real-Time Email Alerts

The system sends immediate email notifications for:

- **Critical Error Detection** - When high or critical severity errors are detected
- **Manual Review Required** - When patches affect medical pathways or have high impact
- **Patch Generated** - When AEC successfully generates a code fix
- **Deployment Success** - When a patch is deployed to production
- **Deployment Failed** - When a deployment fails and requires attention
- **Rollback Triggered** - When a deployment is automatically rolled back
- **Health Check Failed** - When post-deployment health checks fail

### 2. Twice-Daily Automated Reports

Comprehensive email reports sent at:

- **8:00 AM** - Morning report covering overnight activity (8 PM - 8 AM)
- **8:00 PM** - Evening report covering daytime activity (8 AM - 8 PM)

Each report includes:

- **Executive Summary** - Total errors, critical count, patches, deployments, rollbacks
- **System Health Status** - API, database, and critical endpoints health
- **Error Details** - List of detected errors with severity, occurrences, and status
- **Code Changes** - Patches generated with files modified and impact level
- **Deployment Activity** - Successful and failed deployments

## Architecture

### Components

```
server/aec/alerts/
├── index.ts                    # Main entry point, initializes alert system
├── notification-service.ts     # Email notification functions
├── report-generator.ts         # Daily report generation and scheduling
└── alerts-simple.test.ts       # Test suite
```

### Database Tables

#### `aec_detected_errors`
Tracks all errors detected by the system:
- Error type, severity, message, stack trace
- Source file, endpoint, user context
- Occurrence tracking (first/last occurrence, count)
- Status (detected, analyzing, patched, resolved)

#### `aec_diagnostics`
Stores diagnostic analysis results:
- Root cause analysis
- Impact assessment
- Affected features
- Proposed solutions with confidence scores

#### `aec_patches`
Records generated code patches:
- Patch version and branch name
- Files modified and diff content
- Test results and validation status
- Deployment status and timestamps

#### `aec_health_checks`
Post-deployment health monitoring:
- API, database, and endpoint health status
- Response times
- Failed check details

#### `aec_config`
System configuration and thresholds:
- Alert settings
- Feature toggles
- Threshold values

## Alert Flow

### Critical Error Alert Flow

```
1. Error detected → Stored in aec_detected_errors
2. Severity check (critical or high)
3. Email alert sent immediately
4. Diagnostic layer triggered
5. Patch generation initiated
```

### Manual Review Alert Flow

```
1. Patch generated → Stored in aec_patches
2. Impact assessment (high impact or medical pathway)
3. Manual review alert sent
4. Awaits manual approval before deployment
```

### Deployment Alert Flow

```
1. Patch deployed → Status updated
2. Deployment success alert sent
3. Health checks run
4. If health check fails:
   - Health check failed alert sent
   - Automatic rollback triggered
   - Rollback alert sent
```

## Email Notification Format

All emails follow this structure:

```
🚨 AEC Alert - [ALERT_TYPE]
Priority: [EMOJI] [PRIORITY_LEVEL]
Time: [TIMESTAMP]

[MESSAGE]

📋 Details:
  • Key: Value
  • Key: Value

---
This is an automated notification from the AEC Self-Healing System.
```

## Daily Report Format

```
📊 AEC Daily Report - [Morning/Evening] ([DATE])
Period: [START_TIME] to [END_TIME]

═══════════════════════════════════════
📈 EXECUTIVE SUMMARY
═══════════════════════════════════════
Total Errors Detected: X
  └─ Critical: X 🔴
  └─ Resolved: X ✅
Patches Generated: X
Patches Deployed: X
Rollbacks: X
Health Check Failures: X

═══════════════════════════════════════
🏥 SYSTEM HEALTH
═══════════════════════════════════════
API Health: ✅ Healthy / ❌ Unhealthy
Database: ✅ Connected / ❌ Issues Detected
Critical Endpoints: ✅ All Responding / ❌ Some Failing
Last Check: [TIMESTAMP]

═══════════════════════════════════════
🐛 ERRORS DETECTED
═══════════════════════════════════════
[List of errors with details]

═══════════════════════════════════════
💻 CODE CHANGES & PATCHES
═══════════════════════════════════════
[List of patches with deployment status]
```

## Integration Points

### Diagnostic Layer Integration

File: `server/aec/diagnostic/trigger-updated.ts`

- Sends critical error alerts when errors are detected
- Sends patch generated alerts after surgical procedure
- Checks for manual review requirements based on:
  - Impact level (high)
  - Affected features (medical, triage, diagnosis keywords)

### Recovery Layer Integration

File: `server/aec/recovery/engine.ts`

- Sends deployment success alerts
- Sends deployment failed alerts with error details
- Sends rollback alerts with reason
- Sends health check failed alerts

### Server Initialization

File: `server/_core/index.ts`

- Initializes alert system on server startup
- Schedules daily reports (8 AM and 8 PM)
- Runs in background without blocking server

## Configuration

### Alert Priorities

- **Critical** 🔴 - Immediate attention required
- **High** 🟠 - Important, review soon
- **Medium** 🟡 - Normal priority
- **Low** 🟢 - Informational

### Manual Review Triggers

Patches require manual review when:

1. **Impact Level** = High
2. **Affected Features** contain keywords:
   - "medical"
   - "triage"
   - "diagnosis"

### Report Schedule

- **Morning Report**: 8:00 AM (cron: `0 8 * * *`)
- **Evening Report**: 8:00 PM (cron: `0 20 * * *`)

## Testing

Run the test suite:

```bash
pnpm test server/aec/alerts/alerts-simple.test.ts
```

Tests cover:
- Email formatting for all alert types
- Report generation (morning and evening)
- Report formatting with various scenarios
- Alert priority levels
- System health status display

## Usage Examples

### Send Test Report

```typescript
import { sendTestReport } from "./server/aec/alerts/index";

// Send morning report immediately
await sendTestReport("morning");

// Send evening report immediately
await sendTestReport("evening");
```

### Manual Alert Sending

```typescript
import {
  sendCriticalErrorAlert,
  sendManualReviewAlert,
  sendPatchGeneratedAlert,
} from "./server/aec/alerts/notification-service";

// Send critical error alert
await sendCriticalErrorAlert(errorId);

// Send manual review alert
await sendManualReviewAlert(patchId);

// Send patch generated alert
await sendPatchGeneratedAlert(patchId);
```

## Monitoring

### Check Alert System Status

The alert system logs all activities with `[AEC Alerts]` prefix:

```
[AEC Alerts] Initializing alert system...
[AEC Alerts] ✅ Alert system initialized successfully
[AEC Alerts] Daily reports scheduled:
  - Morning report: 8:00 AM (overnight summary)
  - Evening report: 8:00 PM (daytime summary)
[AEC Alerts] Sending critical error alert for error 123
[AEC Alerts] Email sent successfully: Critical Error Detected
```

### Check Server Logs

```bash
# View recent alert activity
grep "\[AEC Alerts\]" logs/server.log | tail -50

# Monitor real-time alerts
tail -f logs/server.log | grep "\[AEC Alerts\]"
```

## Troubleshooting

### Alerts Not Sending

1. Check server logs for `[AEC Alerts]` entries
2. Verify Manus notification API is available
3. Check email notification result in logs
4. Verify database connection for alert data

### Reports Not Generating

1. Verify cron scheduler is running (check server startup logs)
2. Check for `[AEC Reports]` log entries at 8 AM and 8 PM
3. Verify database tables exist and are accessible
4. Test report generation manually: `sendTestReport("morning")`

### Missing Alert Data

1. Verify AEC database tables exist:
   - `aec_detected_errors`
   - `aec_diagnostics`
   - `aec_patches`
   - `aec_health_checks`
2. Check table schemas match definitions in `drizzle/schema.ts`
3. Verify data is being written to tables during AEC operations

## Future Enhancements

Potential improvements for the alert system:

- [ ] Slack webhook integration (optional)
- [ ] SMS alerts for critical issues
- [ ] Alert history dashboard
- [ ] Configurable alert thresholds per user
- [ ] Alert suppression rules
- [ ] Digest mode (batch multiple alerts)
- [ ] Alert acknowledgment tracking
- [ ] Custom alert templates
- [ ] Multi-recipient support
- [ ] Alert analytics and reporting

## Support

For issues or questions about the AEC Alert System:

1. Check this documentation
2. Review server logs for `[AEC Alerts]` entries
3. Run test suite to verify functionality
4. Check database tables for alert data
5. Contact system administrator if issues persist
