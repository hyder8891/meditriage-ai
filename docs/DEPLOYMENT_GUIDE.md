# MediTriage AI Pro - Deployment Guide

**Version 1.0** | **Last Updated:** December 2025 | **Author:** Manus AI

---

## Overview

This guide provides comprehensive instructions for deploying MediTriage AI Pro to production environments. The platform is built on Manus hosting infrastructure, which provides integrated database, file storage, authentication, and deployment services. This document covers configuration, environment setup, deployment procedures, and operational best practices.

MediTriage AI Pro is designed to be deployed with minimal configuration through the Manus platform's built-in hosting capabilities. The system automatically handles SSL certificates, domain management, database provisioning, and scaling, allowing you to focus on application development rather than infrastructure management.

---

## Prerequisites

### Required Accounts and Services

Before deploying MediTriage AI Pro, ensure you have the following accounts and API keys configured. A Manus account is required to access the hosting platform and deployment tools. You will need API keys for DeepSeek (clinical reasoning and SOAP note generation) and Google Gemini (X-ray image analysis). These external AI services power the platform's intelligent features.

### System Requirements

The Manus platform handles all infrastructure requirements automatically, including compute resources, database capacity, and storage allocation. Your local development environment should have Node.js 22.x or higher and pnpm package manager installed for testing and development work before deployment.

---

## Environment Configuration

### Required Environment Variables

The Manus platform automatically injects system environment variables for database connectivity, authentication, file storage, and analytics. These built-in variables include DATABASE_URL for MySQL/TiDB connection, JWT_SECRET for session management, OAuth configuration variables for Manus authentication, and file storage credentials for S3-compatible object storage.

You must manually configure external API keys through the Manus dashboard under Settings → Secrets. Add DEEPSEEK_API_KEY with your DeepSeek API key for clinical reasoning and documentation features. Add GEMINI_API_KEY with your Google Gemini API key for medical imaging analysis. These keys are securely stored and injected into your application at runtime.

### Optional Configuration

Additional configuration options can be set through environment variables if needed. VITE_APP_TITLE customizes the application title displayed in the browser. VITE_APP_LOGO sets a custom logo URL for branding. These optional variables enhance the user experience but are not required for core functionality.

---

## Database Setup

### Schema Management

The platform uses Drizzle ORM for database schema management and migrations. All table definitions are located in the `drizzle/schema.ts` file. To apply schema changes to the database, run the command `pnpm db:push` from your project directory. This command generates migration files and applies them to the configured database automatically.

The database schema includes tables for user management, clinical cases, vital signs, diagnoses, medications, facilities, transcriptions, timeline events, and clinical notes. The schema is designed to support the full range of clinical workflows while maintaining data integrity through foreign key constraints and appropriate indexes.

### Initial Data Seeding

After deploying the database schema, populate the facilities table with Iraqi medical facility data. The seed script is located in `server/seed-facilities.ts` and includes major hospitals, clinics, and emergency services across Iraqi cities. Run the seed script using `node server/seed-facilities.mjs` to populate the Care Locator database with initial facility information.

---

## Deployment Process

### Using Manus Built-in Hosting

The simplest deployment method is through Manus built-in hosting, which provides automatic deployment, SSL certificates, custom domains, and integrated monitoring. To deploy your application, first ensure all changes are committed and tested locally. Create a checkpoint through the Manus interface by clicking the checkpoint button in the project management panel. Each checkpoint creates a snapshot of your application that can be deployed or rolled back.

After creating a checkpoint, click the Publish button in the Manus dashboard header. The platform automatically builds your application, provisions necessary resources, and deploys to production infrastructure. The deployment process typically completes within 2-3 minutes. Once deployed, your application is accessible at the auto-generated domain (yourapp.manus.space) or any custom domains you have configured.

### Custom Domain Configuration

To use a custom domain with your deployment, navigate to Settings → Domains in the Manus dashboard. You can purchase domains directly through Manus or bind existing domains you own. For existing domains, add the provided DNS records to your domain registrar's settings. The platform automatically provisions SSL certificates through Let's Encrypt and handles certificate renewal.

### Rollback Procedures

If issues arise after deployment, you can quickly rollback to a previous checkpoint. Navigate to the project dashboard and view the checkpoint history. Click the Rollback button on any previous checkpoint to restore that version of the application. Rollback operations complete within seconds and do not require rebuilding the application.

---

## Post-Deployment Configuration

### Verifying Deployment

After deployment completes, verify that all features are functioning correctly. Test user authentication by logging in through the clinician portal. Create a test case and verify that database operations work properly. Test AI-powered features including clinical reasoning, drug interaction checking, and X-ray analysis to ensure API keys are configured correctly. Verify that file uploads work by testing the Live Scribe audio recording feature.

### Monitoring and Analytics

The Manus platform provides built-in analytics for monitoring application usage. Access analytics through the Dashboard panel in the project management interface. Monitor page views, unique visitors, and user engagement metrics. The platform also logs application errors and performance metrics for troubleshooting and optimization.

### SSL and Security

SSL certificates are automatically provisioned and renewed by the Manus platform. All traffic is encrypted using TLS 1.2 or higher. The platform implements security headers including Content Security Policy, X-Frame-Options, and X-Content-Type-Options to protect against common web vulnerabilities. Session cookies are marked as HTTP-only and secure to prevent client-side access and transmission over insecure connections.

---

## Database Management

### Accessing the Database

The Manus dashboard provides a built-in database management interface accessible through Settings → Database. This interface allows you to view table schemas, execute SQL queries, and perform CRUD operations on database records. For programmatic database access, connection credentials are available in the database settings panel with SSL connection support.

### Backup and Recovery

The Manus platform automatically performs daily database backups with 30-day retention. Backups are stored in geographically distributed locations for disaster recovery. To restore from a backup, contact Manus support through the help portal at https://help.manus.im with your project ID and desired restore point.

### Database Scaling

As your application grows, the database automatically scales to handle increased load. The Manus platform monitors database performance and adjusts resources as needed. For applications with high transaction volumes or large datasets, consider upgrading to a higher-tier database plan through the Settings → Database panel.

---

## File Storage Management

### S3-Compatible Storage

The platform uses S3-compatible object storage for file uploads including audio recordings, X-ray images, and clinical documents. Storage credentials are automatically configured through environment variables. Files are stored with unique keys to prevent enumeration attacks and support efficient retrieval.

### Storage Best Practices

Store only file metadata (URLs, keys, mime types, sizes) in the database rather than file contents. This approach optimizes database performance and allows efficient file management. Use the provided storage helpers in `server/storage.ts` for all file operations to ensure consistent handling and security. Implement appropriate file size limits to prevent abuse, with current limits set at 16MB for audio files and 10MB for images.

---

## Monitoring and Maintenance

### Application Logs

Access application logs through the Manus dashboard under the project management interface. Logs include server startup messages, API request logs, error traces, and custom log messages from your application code. Use logs to troubleshoot issues, monitor performance, and understand user behavior patterns.

### Performance Optimization

Monitor application performance through the built-in analytics dashboard. Key metrics include response times, API call volumes, database query performance, and error rates. Optimize slow database queries by adding appropriate indexes to frequently queried columns. Cache frequently accessed data using the tRPC query cache to reduce database load.

### Security Updates

The Manus platform automatically applies security updates to the underlying infrastructure including operating system patches, runtime updates, and dependency security fixes. You are responsible for keeping your application dependencies up to date. Regularly run `pnpm update` to install the latest package versions and security patches.

---

## Troubleshooting

### Common Deployment Issues

**Build Failures**: If the deployment build fails, check the build logs for error messages. Common causes include TypeScript compilation errors, missing dependencies, or syntax errors in code. Fix the identified issues locally, create a new checkpoint, and attempt deployment again.

**Database Connection Errors**: Verify that the DATABASE_URL environment variable is correctly configured. Ensure your database schema is up to date by running `pnpm db:push`. Check that database credentials have not expired or been revoked.

**API Key Issues**: If AI-powered features fail, verify that DEEPSEEK_API_KEY and GEMINI_API_KEY are correctly configured in Settings → Secrets. Ensure the API keys have sufficient credits and have not been rate limited. Test API connectivity by making direct requests to the AI services.

**File Upload Failures**: Check that storage environment variables are correctly configured. Verify that file sizes are within configured limits. Ensure the storage bucket has sufficient capacity and proper access permissions.

### Getting Support

For deployment issues that cannot be resolved through this guide, contact Manus support at https://help.manus.im. Provide your project ID, checkpoint version, error messages, and steps to reproduce the issue. The support team can access deployment logs and infrastructure metrics to diagnose and resolve problems.

---

## Scaling Considerations

### Horizontal Scaling

The Manus platform automatically scales your application horizontally to handle increased traffic. Multiple application instances are deployed behind a load balancer that distributes requests evenly. Session state is maintained through database-backed sessions, ensuring users remain authenticated across different application instances.

### Database Scaling

As your database grows, consider implementing query optimization strategies including adding indexes to frequently queried columns, using database views for complex queries, and implementing data archiving for historical records. For very large datasets, consider partitioning tables by date or other logical divisions.

### Caching Strategies

Implement caching to reduce database load and improve response times. The tRPC client automatically caches query results on the frontend. For backend caching, consider implementing Redis or similar caching solutions for frequently accessed data. Cache invalidation should be carefully managed to ensure users see up-to-date information.

---

## Compliance and Regulations

### HIPAA Compliance

If deploying MediTriage AI Pro in the United States for handling protected health information (PHI), ensure compliance with HIPAA regulations. The Manus platform provides infrastructure-level security controls, but you are responsible for implementing appropriate access controls, audit logging, and data encryption. Consult with legal counsel to ensure full compliance with healthcare regulations.

### Data Residency

The Manus platform supports data residency requirements for regions with strict data localization laws. Contact Manus support to configure your deployment in specific geographic regions if required by local regulations.

### Audit Logging

Implement comprehensive audit logging for all access to patient data. Log user authentication events, case access, data modifications, and exports. Store audit logs securely with appropriate retention periods as required by applicable regulations.

---

## Backup and Disaster Recovery

### Backup Strategy

The platform implements a multi-tier backup strategy including daily full database backups, continuous transaction log backups, and file storage replication. Backups are stored in geographically distributed locations to protect against regional outages.

### Disaster Recovery Plan

In the event of a catastrophic failure, the disaster recovery process involves restoring the database from the most recent backup, redeploying the application from the last successful checkpoint, and verifying data integrity. The recovery time objective (RTO) is typically under 4 hours, and the recovery point objective (RPO) is under 24 hours based on daily backup schedules.

### Testing Recovery Procedures

Periodically test disaster recovery procedures to ensure backups are valid and recovery processes work as expected. Schedule recovery drills at least quarterly to verify that your team can successfully restore the application and data within acceptable timeframes.

---

## Continuous Integration and Deployment

### Automated Testing

Before deploying to production, run the test suite to verify application functionality. Execute tests using `pnpm test` to run all unit and integration tests. The test suite covers authentication, database operations, API endpoints, and critical business logic. Ensure all tests pass before creating a deployment checkpoint.

### Deployment Pipeline

Establish a deployment pipeline that includes local development, staging environment testing, and production deployment. Use checkpoints to create stable releases that can be tested in staging before promoting to production. Implement feature flags to enable gradual rollout of new features and quick rollback if issues arise.

---

## Performance Benchmarks

### Expected Performance

Under normal load conditions, API response times should average under 200ms for database queries and under 2 seconds for AI-powered features. The system can handle approximately 100 concurrent users per application instance. Database query performance should maintain sub-100ms response times for indexed queries.

### Load Testing

Before launching to a large user base, conduct load testing to identify performance bottlenecks. Use tools like Apache JMeter or k6 to simulate realistic user traffic patterns. Monitor database performance, API response times, and error rates under load. Optimize identified bottlenecks before production launch.

---

## Conclusion

Deploying MediTriage AI Pro through the Manus platform provides a streamlined path to production with minimal infrastructure management overhead. By following the procedures outlined in this guide, you can confidently deploy, monitor, and maintain a robust clinical decision support system. The platform's built-in features for database management, file storage, authentication, and monitoring allow you to focus on delivering value to healthcare professionals and patients.

For ongoing support, feature requests, or technical questions, visit the Manus help portal at https://help.manus.im. The platform documentation is continuously updated with new features, best practices, and troubleshooting guidance to support your deployment success.
