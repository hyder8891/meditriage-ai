# MediTriage AI Pro - TODO

## Bio-Scanner Critical Issues (User Reported - COMPLETED)
- [x] Fix false readings when no one is in front of camera
  - [x] Add signal quality validation (minimum brightness variance check)
  - [x] Add face/finger presence detection
  - [x] Reject measurements with insufficient signal strength
  - [x] Add minimum signal amplitude threshold
- [x] Fix too high BPM readings (even higher in finger mode)
  - [x] Review peak detection algorithm
  - [x] Add BPM range validation (40-180 BPM physiological limits)
  - [x] Improve signal filtering to reduce noise peaks
  - [x] Add multi-tier validation before accepting BPM
- [x] Fix HRV metrics not working (stress, RMSSD, SDNN showing as undefined/null)
  - [x] Debug HRV calculation in BioScannerEngine
  - [x] Verify peak-to-peak interval calculation
  - [x] Check if sufficient data is collected for HRV (needs 30+ seconds)
  - [x] Fix data structure passed to HRV calculation
  - [x] Add error handling and logging for HRV failures

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

## Bio-Scanner V2 Revert (User Request - COMPLETED)
- [x] User reported V4 not working as well as V2
- [x] Found V2 commit 687dab0 (working 78 BPM version)
- [x] Reverted from V4 (1054 lines) to V2 (600 lines) - removed 538 lines
- [x] Fixed TypeScript errors to match V2 interface
- [x] V2 restored with three-tier progressive detection

## Bio-Scanner V2 Still Showing High BPM (Current Issue - FIXED)
- [x] User reports V2 revert still shows 153 BPM (too high)
- [x] Investigated - 153 BPM = 2x ~76 BPM (harmonic doubling)
- [x] Root cause: Thresholds too low (15%/20%/25%) detect BOTH systolic and diastolic peaks
- [x] Solution: Increased thresholds (30%/35%/40%) and debounce times (400/450/500ms)
- [x] This ensures only ONE peak detected per cardiac cycle
- [ ] Awaiting user testing to verify accurate BPM readings (~70-80 BPM)

## Bio-Scanner BPM Reading Fix (Previous Session - COMPLETED)
- [x] User reported Bio-Scanner showing over 100 BPM after "harmonic doubling fix"
- [x] Investigated git history - compared working version (78 BPM) with current
- [x] Root cause: Overcorrected debounce times (150ms → 400ms = 3x longer)
- [x] Effect: Algorithm missing real heartbeats, causing inflated BPM readings
- [x] Solution: Reverted to working threshold values from 687dab0 commit
  - [x] Tier 1: 15% threshold, 150ms debounce (was 20%/400ms)
  - [x] Tier 2: 20% threshold, 200ms debounce (was 25%/450ms)
  - [x] Tier 3: 25% threshold, 250ms debounce (was 30%/500ms)
- [x] Tested and verified fix applied successfully

## URGENT: Patient Dashboard Navigation Issues (FIXED)
- [x] Fix "Find a Clinic" link - 404 error or not working
- [x] Fix "Appointments" link - 404 error or not working
- [x] Verify all patient dashboard navigation links work correctly

## Bio-Scanner Accuracy Improvements (User Request - COMPLETED)
- [x] Extend measurement window from 5s to 8s+ (256 samples at 30fps)
- [x] Implement multi-measurement averaging (rolling average of last 5 readings)
- [x] Add outlier rejection using Median Absolute Deviation (MAD)
- [x] Add confidence-based filtering (only readings >40% confidence)
- [x] Show stabilization indicator (🎯 STABLE vs 📊 Averaging)
- [x] Add visual feedback showing sample size (n=X)
- [x] Confidence-weighted averaging for better accuracy
- [x] Coefficient of Variation < 5% for stability detection
- [ ] Awaiting user testing to verify improvements

## URGENT: CareLocator Authentication Issue (COMPLETED)
- [x] Fix patient portal "Clinics" navigation - currently redirects to /clinician/login instead of /patient/care-locator
- [x] Verify CareLocator page works without ClinicianLayout wrapper  
- [x] Removed ClinicianLayout from CareLocator - now uses simple patient-friendly header
- [x] CareLocator now accessible to authenticated patients at /patient/care-locator
- [x] Added "Back to Portal" button for easy navigation
