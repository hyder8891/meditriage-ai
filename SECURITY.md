# My Doctor طبيبي - Security Documentation

**Last Updated:** December 20, 2025  
**Version:** 1.0

---

## Overview

This document outlines the comprehensive security measures implemented in My Doctor طبيبي to protect patient data, ensure HIPAA compliance readiness, and maintain system integrity.

---

## 1. Security Architecture

### Defense in Depth Strategy
Multiple layers of security controls protect the application:

1. **Network Layer** - Rate limiting, DDoS protection
2. **Application Layer** - Input validation, sanitization, authentication
3. **Data Layer** - Encryption, access control, audit logging
4. **Monitoring Layer** - Suspicious activity detection, security alerts

---

## 2. Authentication & Authorization

### Authentication Methods
- **OAuth 2.0** - Google, Facebook social login
- **Traditional** - Email/password with bcrypt hashing
- **Session Management** - Secure HTTP-only cookies

### Password Security
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- Bcrypt hashing with salt rounds
- Account lockout after 5 failed attempts (30-minute lockout)

### Role-Based Access Control (RBAC)
- **Patient** - Access own medical records, find doctors, triage
- **Doctor** - Access assigned patients, clinical tools, consultations
- **Admin** - System configuration, user management, reports

### Session Security
- HTTP-only cookies (prevents XSS cookie theft)
- Secure flag in production (HTTPS only)
- SameSite=Lax (CSRF protection)
- 24-hour session timeout
- Automatic logout on inactivity

---

## 3. Input Validation & Sanitization

### Implemented Protections

#### NoSQL Injection Prevention
- `express-mongo-sanitize` middleware
- Strips `$` and `.` from user input
- Prevents MongoDB query injection

#### XSS (Cross-Site Scripting) Prevention
- `xss-clean` middleware
- Sanitizes HTML tags from input
- Content Security Policy (CSP) headers
- Input encoding on output

#### SQL Injection Prevention
- Drizzle ORM with parameterized queries
- No raw SQL queries with user input
- Input type validation with Zod schemas

#### HTTP Parameter Pollution (HPP)
- `hpp` middleware
- Prevents duplicate parameter attacks

### Input Validation Rules
- Email: RFC 5322 compliant format
- Phone: International format validation
- Names: Alphanumeric + spaces only
- Medical data: Strict schema validation

---

## 4. Rate Limiting & DDoS Protection

### Rate Limit Policies

#### General API Endpoints
- **Limit:** 100 requests per 15 minutes per IP
- **Response:** 429 Too Many Requests
- **Message:** "Too many requests from this IP, please try again later."

#### Authentication Endpoints
- **Limit:** 5 login attempts per 15 minutes per IP
- **Lockout:** 30 minutes after 5 failed attempts
- **Skip:** Successful logins don't count toward limit

#### Triage/AI Endpoints
- **Limit:** 20 triage sessions per hour per IP
- **Purpose:** Prevent AI resource abuse

#### Doctor Availability Updates
- **Limit:** 10 status changes per 5 minutes
- **Purpose:** Prevent status spam

### Implementation
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
```

---

## 5. Security Headers

### Helmet.js Configuration

#### Content Security Policy (CSP)
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: https: blob:
connect-src 'self' https://api.manus.im
frame-src 'self' https://accounts.google.com
object-src 'none'
upgrade-insecure-requests
```

#### HTTP Strict Transport Security (HSTS)
- **Max-Age:** 31536000 (1 year)
- **Include Subdomains:** Yes
- **Preload:** Yes
- **Effect:** Forces HTTPS connections

#### X-Frame-Options
- **Value:** DENY
- **Purpose:** Prevents clickjacking attacks

#### X-Content-Type-Options
- **Value:** nosniff
- **Purpose:** Prevents MIME type sniffing

#### Referrer-Policy
- **Value:** strict-origin-when-cross-origin
- **Purpose:** Controls referrer information leakage

---

## 6. Audit Logging

### Logged Events

#### Authentication Events
- `user.login` - Successful login
- `user.logout` - User logout
- `user.signup` - New account creation
- `user.password_reset` - Password reset request
- `security.failed_login` - Failed login attempt

#### Clinical Events
- `doctor.availability_change` - Doctor status change
- `doctor.patient_access` - Doctor views patient record
- `patient.doctor_connect` - Patient connects with doctor
- `patient.triage_start` - Triage session started
- `patient.triage_complete` - Triage session completed

#### Administrative Events
- `admin.user_modify` - User account modification
- `admin.system_config` - System configuration change

#### Security Events
- `security.suspicious_activity` - Suspicious behavior detected
- `data.export` - Data export operation
- `data.delete` - Data deletion operation

### Audit Log Schema
```typescript
{
  id: number;
  userId?: number;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: JSON;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}
```

### Retention Policy
- **Duration:** 90 days minimum
- **Compliance:** HIPAA requires 6 years for some records
- **Storage:** Encrypted database table
- **Access:** Admin-only, read-only

---

## 7. Suspicious Activity Detection

### Detection Patterns

#### SQL Injection Attempts
- Keywords: `union`, `select`, `insert`, `update`, `delete`, `drop`, `exec`
- **Action:** Log and alert, continue processing (sanitized)

#### XSS Attempts
- Patterns: `<script`, `javascript:`, `onerror=`, `onload=`
- **Action:** Log and alert, sanitize input

#### Path Traversal
- Patterns: `../`, `..\\`
- **Action:** Log and alert, reject request

### Response Actions
1. Log to audit trail
2. Alert security team (console warning)
3. Continue with sanitized input
4. Block IP after repeated attempts (future enhancement)

---

## 8. Data Protection

### Encryption

#### Data at Rest
- **Database:** TiDB with encryption at rest
- **File Storage:** S3 with server-side encryption (SSE-S3)
- **Passwords:** Bcrypt with salt rounds

#### Data in Transit
- **HTTPS:** TLS 1.2+ required in production
- **API Calls:** All external APIs use HTTPS
- **WebSocket:** WSS (WebSocket Secure) for real-time features

### Sensitive Data Handling
- **PHI (Protected Health Information):** Encrypted, access-controlled
- **PII (Personally Identifiable Information):** Minimized collection
- **Payment Data:** Stripe handles (PCI DSS compliant)
- **Session Tokens:** HTTP-only, secure cookies

---

## 9. Request Size Limits

### File Upload Limits
- **Maximum Size:** 10MB per request
- **Allowed Types:** Images (JPEG, PNG), PDFs, medical documents
- **Validation:** MIME type checking, file extension validation

### JSON Payload Limits
- **Maximum Size:** 50MB (configurable)
- **Purpose:** Prevents memory exhaustion attacks

---

## 10. Security Monitoring

### Real-Time Monitoring
- Suspicious activity detection
- Failed login tracking
- Rate limit violations
- Unusual access patterns

### Alerting
- Console warnings for immediate issues
- Audit log for historical analysis
- Future: Email/SMS alerts for critical events

---

## 11. Compliance Readiness

### HIPAA Compliance
- ✅ Access controls (RBAC)
- ✅ Audit logging
- ✅ Encryption (at rest and in transit)
- ✅ Session management
- ⚠️ Business Associate Agreement (BAA) required for production
- ⚠️ Regular security audits required

### GDPR Compliance
- ✅ Data minimization
- ✅ Right to access (user can view own data)
- ✅ Right to deletion (admin can delete accounts)
- ✅ Consent management
- ✅ Data portability (export features)

---

## 12. Security Best Practices

### For Developers

1. **Never log sensitive data** (passwords, tokens, PHI)
2. **Always validate input** on both client and server
3. **Use parameterized queries** (Drizzle ORM)
4. **Keep dependencies updated** (`pnpm update`)
5. **Review audit logs** regularly
6. **Test security features** before deployment

### For Administrators

1. **Monitor audit logs** for suspicious activity
2. **Review failed login attempts** regularly
3. **Keep user roles minimal** (principle of least privilege)
4. **Rotate secrets** (JWT_SECRET, API keys) periodically
5. **Backup database** regularly
6. **Test disaster recovery** procedures

### For Users

1. **Use strong passwords** (8+ characters, mixed case, numbers, symbols)
2. **Enable two-factor authentication** (future feature)
3. **Don't share login credentials**
4. **Log out on shared devices**
5. **Report suspicious activity** immediately

---

## 13. Incident Response Plan

### Detection
1. Monitor audit logs for anomalies
2. Check rate limit violations
3. Review failed authentication attempts
4. Analyze suspicious activity alerts

### Response
1. **Identify** - Determine scope and severity
2. **Contain** - Block malicious IPs, disable compromised accounts
3. **Eradicate** - Remove malware, patch vulnerabilities
4. **Recover** - Restore from backups, verify integrity
5. **Document** - Record incident details, lessons learned

### Communication
- **Internal:** Notify development team immediately
- **Users:** Inform affected users within 72 hours (GDPR requirement)
- **Authorities:** Report breaches as required by law

---

## 14. Security Testing

### Automated Testing
- Unit tests for authentication
- Integration tests for authorization
- API endpoint security tests
- Input validation tests

### Manual Testing
- Penetration testing (recommended annually)
- Code review for security issues
- Dependency vulnerability scanning
- Security configuration review

---

## 15. Known Limitations

### Current Limitations
1. **No 2FA** - Two-factor authentication not yet implemented
2. **Basic rate limiting** - IP-based only (no user-based)
3. **No WAF** - Web Application Firewall not configured
4. **Limited monitoring** - No centralized security dashboard

### Planned Enhancements
1. Implement two-factor authentication (TOTP)
2. Add user-based rate limiting
3. Integrate with security monitoring service
4. Implement automated threat response
5. Add IP reputation checking
6. Implement device fingerprinting

---

## 16. Security Contacts

### Reporting Security Issues
- **Email:** security@mydoctor.iq (to be configured)
- **Response Time:** Within 24 hours
- **Disclosure:** Responsible disclosure policy

### Security Team
- **Lead:** To be assigned
- **Developers:** All team members
- **External:** Security consultants (as needed)

---

## 17. Security Checklist

### Pre-Production
- [ ] All secrets in environment variables (not hardcoded)
- [ ] HTTPS enforced (no HTTP in production)
- [ ] Rate limiting enabled
- [ ] Audit logging active
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] Database backups automated
- [ ] Incident response plan documented

### Post-Production
- [ ] Monitor audit logs daily
- [ ] Review failed logins weekly
- [ ] Update dependencies monthly
- [ ] Security audit quarterly
- [ ] Penetration test annually
- [ ] Disaster recovery drill annually

---

## 18. References

### Security Standards
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [GDPR](https://gdpr.eu/)
- [PCI DSS](https://www.pcisecuritystandards.org/)

### Tools & Libraries
- [Helmet.js](https://helmetjs.github.io/) - Security headers
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) - Rate limiting
- [Bcrypt](https://www.npmjs.com/package/bcrypt) - Password hashing
- [Drizzle ORM](https://orm.drizzle.team/) - SQL injection prevention

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-20 | Initial security implementation |

---

**Document Classification:** Internal Use Only  
**Review Frequency:** Quarterly  
**Next Review Date:** March 20, 2026
