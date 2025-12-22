# MediTriage AI Pro - TODO

## URGENT: UX Restructuring - Separate Patient and Doctor Features
- [x] Remove X-Ray Analysis from patient portal (move to doctor-only)
- [x] Remove Lab Result Interpretation from patient portal (move to doctor-only)
- [x] Remove Bio-Scanner from patient portal (move to doctor-only)
- [x] Move Care Locator from doctor dashboard to patient portal
- [x] Add view-only "My Medical Records" section for patients
- [x] Update patient portal navigation to focus on: symptoms → find doctor → communicate → track care
- [x] Update doctor dashboard to focus on: diagnose → treat → monitor → communicate

## URGENT: User-Reported Issues (tabibi.clinic)
- [x] Fix 404 error: /admin/users page missing
- [x] Fix 404 error: /settings page missing
- [ ] Fix lab results function not working (NEEDS ROBUST IMPLEMENTATION)
- [x] Fix sidebar consistency - items disappear when navigating away from dashboard
- [x] Fix profile dropdown - only shows logout, missing other options
- [x] Fix doctor availability status toggle - user reports cannot change status

## NEW: Current Session Issues
- [ ] Fix 404 error - identify which route is causing the error
- [ ] Fix WebSocket connection failures
- [ ] Investigate routing configuration

## NEW: Current Session Requirements
- [x] Update all remaining "MediTriage AI" references to "My Doctor طبيبي"
- [x] Fix lab results functionality - make it robust and fully working
  - [x] Test current upload functionality
  - [x] Fix OCR extraction if broken
  - [x] Fix AI interpretation
  - [x] Add proper error handling
  - [x] Test end-to-end workflow
- [x] Enhance Admin Dashboard
  - [x] Add comprehensive user management (edit, delete, verify)
  - [x] Add system analytics and statistics
  - [x] Add activity monitoring
  - [x] Add role management interface
- [x] Improve Navigation System
  - [x] Add clickable logo to all clinician pages (returns to dashboard)
  - [x] Add clickable logo to all patient pages (returns to portal)
  - [x] Ensure consistent navigation across all pages
  - [x] Test navigation flow

## URGENT: Authentication Fixes
- [ ] Verify firebase.ts file has actual code (not empty)
- [ ] Verify test accounts exist in database
- [ ] Fix Google OAuth login functionality
- [ ] Test email/password login with all three test accounts
- [ ] Document working login credentials

## Optic-Vitals Camera-Based Heart Rate Monitor (rPPG)
- [x] Add patient_vitals database table to schema
- [x] Create vitals-router.ts with logVital and getRecent endpoints
- [x] Mount vitals router in main routers.ts
- [x] Create rppg-engine.ts with BioScannerEngine class
- [x] Create BioScanner.tsx component with camera integration
- [x] Integrate BioScanner into PatientPortal
- [x] Test camera permissions and video stream
- [x] Test heart rate calculation accuracy
- [x] Test vital signs storage and retrieval

## Completed Features
- [x] Avicenna-X orchestration system (7 layers)
- [x] OpenWeather API integration with Baghdad fallbacks
- [x] Epidemiology tracking database
- [x] Deep link generation (Careem, Uber, Google Maps)
- [x] BRAIN diagnostic system with 20,000+ medical concepts
- [x] Security audit fixes (rate limiting, JWT revocation, log sanitization)
- [x] Refresh token system (15min access + 30day refresh)
- [x] Email notification system (12 types)
- [x] User profile and preferences management
- [x] Lab result interpretation system
- [x] Medical imaging analysis (11 modalities)

## Bug Fixes (Current Session)
- [x] Debug Optic-Vitals camera not working
  - [x] Check camera permissions and MediaRecorder API
  - [x] Verify rPPG signal processing
  - [x] Test UI/UX flow
  - [x] Add better error messages
  - [x] Lower confidence threshold from 30% to 20%
  - [x] Improve signal detection sensitivity
  - [x] Add real-time visual feedback

## Optic-Vitals Enhancements (Current Session)
- [x] Add HRV (Heart Rate Variability) analysis to rPPG engine
  - [x] Extend patient_vitals table with HRV metrics (RMSSD, SDNN, pNN50, LF/HF ratio)
  - [x] Implement HRV calculation in BioScannerEngine
  - [x] Add stress score and ANS balance assessment
  - [x] Update vitals-router to store HRV data
- [x] Add doctor dashboard integration for patient vitals
  - [x] Create PatientVitalsViewer component for doctor dashboard
  - [x] Add vitals filtering by patient, date range, and abnormal values
  - [x] Add vitals alert system for critical readings
  - [x] Add route at /clinician/patient-vitals
- [x] Implement interactive trends charts
  - [x] Add Recharts library for data visualization
  - [x] Create VitalsTrendsChart component with line/area charts
  - [x] Add time range selector (24h, 7d, 30d, all time)
  - [x] Add metric selector (HR, HRV, stress level)
  - [x] Integrate charts into both patient and doctor views
