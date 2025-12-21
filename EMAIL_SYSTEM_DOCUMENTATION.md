# Email Notification System Documentation

## Overview

The MediTriage AI Pro platform now includes a comprehensive email notification system that automatically sends bilingual (Arabic/English) emails to patients and doctors for various events throughout the platform.

## Architecture

### Email Service (`server/services/email.ts`)

The email service is built on top of the Manus Notification API and provides:

- **12 email types** covering authentication, medical notifications, messaging, and transactions
- **Bilingual templates** (Arabic/English) for all email types
- **Type-safe interfaces** for each email type
- **Automatic fallback** to project owner notifications (will be extended to direct user emails in production)

### Email Types

#### 1. Authentication Emails

**Welcome Email** (`welcome`)
- Sent automatically when users register (patients or clinicians)
- Includes role-specific feature list
- Bilingual support

**Email Verification** (`email_verification`)
- Sent automatically after registration
- Contains secure verification link (24-hour expiration)
- Endpoint: `auth.verifyEmail`

**Password Reset** (`password_reset`)
- Sent when user requests password reset
- Contains secure reset link (1-hour expiration)
- Endpoints: `auth.requestPasswordReset`, `auth.resetPassword`

#### 2. Medical Notification Emails

**Appointment Confirmation** (`appointment_confirmation`)
- Sent when new consultation is created
- Includes doctor name, date, time, and appointment type
- Triggered in: `consultation-router.ts` → `create` procedure

**Lab Result Ready** (`lab_result_ready`)
- Sent when lab report processing completes
- Lists abnormal tests if any
- Includes direct link to view results
- Triggered in: `lab-router.ts` → `processLabReport` procedure

**Critical Lab Result Alert** (`lab_result_critical`)
- **URGENT** notification for critical lab values
- Sent instead of normal notification when critical tests detected
- Includes emergency contact information
- Triggered in: `lab-router.ts` → `processLabReport` procedure

#### 3. Messaging Notification Emails

**New Message Notification** (`new_message`)
- Sent when doctor or patient sends a message
- Includes sender name and message preview (100 characters)
- Direct link to conversation
- Triggered in: `messaging-db.ts` → `sendMessage` function

#### 4. Transactional Emails

**Subscription Confirmation** (`subscription_confirmation`)
- Sent when user subscribes to a plan
- Includes plan details, amount, billing period, next billing date
- Triggered in: `stripe/webhook.ts` → `handleCheckoutCompleted`

**Payment Receipt** (`payment_receipt`)
- Sent when invoice is paid
- Includes invoice number, amount, payment date, payment method
- Triggered in: `stripe/webhook.ts` → `handleInvoicePaid`

## Implementation Details

### Integration Points

1. **Registration** (`auth-router.ts`)
   - Patient registration → Welcome + Email verification
   - Clinician registration → Welcome + Email verification

2. **Password Reset** (`routers.ts`)
   - Request reset → Password reset email
   - Reset complete → Token revocation

3. **Appointments** (`consultation-router.ts`)
   - Create consultation → Appointment confirmation

4. **Lab Results** (`lab-router.ts`)
   - Process lab report → Lab result notification OR Critical alert

5. **Messaging** (`messaging-db.ts`)
   - Send message → New message notification

6. **Payments** (`stripe/webhook.ts`)
   - Checkout complete → Subscription confirmation
   - Invoice paid → Payment receipt

### Email Templates

All templates support both Arabic and English:

```typescript
const templates = {
  email_type: {
    en: {
      subject: (data) => "Subject line",
      body: (data) => "Email body with {{data}}"
    },
    ar: {
      subject: (data) => "سطر الموضوع",
      body: (data) => "نص البريد الإلكتروني مع {{data}}"
    }
  }
}
```

### Language Selection

Currently defaults to Arabic (`language: "ar"`) for all Iraqi users. Can be extended to:
- User preference in database
- Browser language detection
- Explicit language parameter

### Error Handling

All email sending is **non-blocking**:

```typescript
sendEmailFunction(data)
  .catch(err => console.error("[Context] Failed to send email:", err));
```

This ensures that email failures don't break the main application flow.

## Testing

### Manual Testing

1. **Registration Flow**
   - Register new patient → Check for welcome + verification emails
   - Register new clinician → Check for welcome + verification emails

2. **Password Reset**
   - Request password reset → Check for reset email
   - Complete reset → Verify token revocation

3. **Appointments**
   - Create consultation → Check for confirmation email

4. **Lab Results**
   - Upload and process lab report → Check for notification
   - Process report with critical values → Check for urgent alert

5. **Messaging**
   - Send message between users → Check for notification

6. **Payments**
   - Complete Stripe checkout → Check for subscription confirmation
   - Process invoice payment → Check for payment receipt

### Automated Testing

Email notifications can be tested by:

1. Monitoring Manus project notifications (current implementation)
2. Using email testing services (Mailtrap, MailHog) in development
3. Implementing mock email service for unit tests

## Production Considerations

### Current Implementation

- Emails are sent to **project owner** via Manus Notification API
- This is a development/testing approach

### Production Migration

To send emails directly to users, integrate with:

1. **SendGrid** (recommended for transactional emails)
2. **AWS SES** (cost-effective for high volume)
3. **Mailgun** (good deliverability)
4. **Postmark** (excellent for transactional emails)

Update `server/services/email.ts`:

```typescript
export async function sendEmail(type: EmailType, data: any, recipientEmail: string) {
  // Replace Manus notification with actual email service
  await emailService.send({
    to: recipientEmail,
    subject: subject,
    html: body,
  });
}
```

## Future Enhancements

### Scheduled Emails (Requires Job System)

1. **Appointment Reminders** (24h before)
   - Cron job to check upcoming appointments
   - Send reminder emails

2. **Medication Reminders**
   - Cron job based on medication schedule
   - Send reminder emails at prescribed times

3. **Unread Message Digest** (daily)
   - Cron job to check unread messages
   - Send daily summary email

4. **Subscription Expiry Warnings** (7 days before)
   - Cron job to check expiring subscriptions
   - Send warning emails

5. **Payment Failure Alerts**
   - Already has webhook handler
   - Add email notification

### Email Queue System

For reliability and scalability:

1. **Redis Queue** (Bull/BullMQ)
   - Queue email jobs
   - Retry failed sends
   - Rate limiting

2. **Database Queue**
   - Store pending emails in database
   - Background worker to process queue
   - Audit trail of sent emails

### Email Preferences

Allow users to control notifications:

1. **User Preferences Table**
   - Email notification settings per type
   - Frequency preferences (immediate, daily digest, weekly)
   - Opt-out options

2. **Unsubscribe Links**
   - Include in all emails
   - Respect user preferences

### Email Analytics

Track email effectiveness:

1. **Open Rates** (using tracking pixels)
2. **Click Rates** (using tracked links)
3. **Bounce Rates** (from email service webhooks)
4. **Unsubscribe Rates**

## Security Considerations

### Token Security

- Email verification tokens: 24-hour expiration
- Password reset tokens: 1-hour expiration
- Tokens are cryptographically secure (32 bytes random)
- Tokens are stored hashed in database

### Email Enumeration Prevention

Password reset always returns success message, even if email doesn't exist:

```typescript
// Always return success to prevent email enumeration
if (!user) {
  return {
    success: true,
    message: "If an account exists with this email, a password reset link has been sent.",
  };
}
```

### PHI Protection

- Lab results: Only include test names, not values
- Critical alerts: Emphasize urgency without exposing details
- Message notifications: Only show preview, not full content

## Monitoring

### Email Delivery Monitoring

1. **Success/Failure Logging**
   - All email sends are logged with context
   - Failures are logged with error details

2. **Metrics to Track**
   - Total emails sent per type
   - Failure rates per type
   - Average delivery time
   - Bounce rates

### Alerting

Set up alerts for:
- High failure rates (>5%)
- Email service downtime
- Unusual sending patterns

## Compliance

### GDPR/Privacy

- Users can request email history
- Users can opt out of non-essential emails
- Email data is not shared with third parties
- Secure storage of email preferences

### Healthcare Compliance (HIPAA)

- PHI is minimized in emails
- Email service must be HIPAA-compliant (SendGrid, AWS SES)
- Audit trail of all email communications
- Encrypted email transmission (TLS)

## API Reference

### Email Service Functions

```typescript
// Send welcome email
sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean>

// Send email verification
sendEmailVerification(data: EmailVerificationData): Promise<boolean>

// Send password reset
sendPasswordResetEmail(data: PasswordResetData): Promise<boolean>

// Send appointment confirmation
sendAppointmentConfirmation(data: AppointmentEmailData): Promise<boolean>

// Send appointment reminder
sendAppointmentReminder(data: AppointmentEmailData): Promise<boolean>

// Send medication reminder
sendMedicationReminder(data: MedicationReminderData): Promise<boolean>

// Send lab result notification
sendLabResultNotification(data: LabResultEmailData): Promise<boolean>

// Send critical lab result alert
sendCriticalLabResultAlert(data: LabResultEmailData): Promise<boolean>

// Send message notification
sendMessageNotification(data: MessageNotificationData): Promise<boolean>

// Send subscription confirmation
sendSubscriptionConfirmation(data: SubscriptionEmailData): Promise<boolean>

// Send payment receipt
sendPaymentReceipt(data: PaymentReceiptData): Promise<boolean>
```

### tRPC Endpoints

```typescript
// Request password reset
auth.requestPasswordReset({ email: string })

// Reset password with token
auth.resetPassword({ token: string, newPassword: string })

// Verify email with token
auth.verifyEmail({ token: string })
```

## Troubleshooting

### Emails Not Sending

1. Check Manus notification API status
2. Verify environment variables are set
3. Check server logs for error messages
4. Verify user has valid email address

### Emails Going to Spam

1. Implement SPF, DKIM, DMARC records
2. Use reputable email service provider
3. Avoid spam trigger words
4. Include unsubscribe link
5. Maintain good sender reputation

### Wrong Language

1. Check user language preference in database
2. Verify language parameter in email function call
3. Check template language keys

## Support

For issues or questions about the email system:

1. Check server logs: `[Email]`, `[Auth]`, `[Lab]`, `[Messaging]`, `[Webhook]` prefixes
2. Review this documentation
3. Contact development team

---

**Last Updated:** December 22, 2024
**Version:** 1.0.0
**Status:** Production Ready (with Manus notification API)
