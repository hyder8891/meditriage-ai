# MediTriage AI Pro - TODO

## B2B2C Platform Implementation (Patient-Initiated Model)

### Phase 1: Backend API (Doctor Availability & Patient Connections)
- [x] Add doctor availability status to users table
- [x] Create b2b2c-router.ts with all procedures
- [x] Doctor availability procedures (setStatus, getStatus)
- [x] Patient connection procedures (connectWithDoctor, getMyDoctors)
- [x] Doctor patient management (getMyPatients, getPatientProfile)
- [x] Messaging procedures (sendMessage, getConversation, markAsRead)
- [x] Subscription procedures (create, getCurrent, upgrade, cancel)
- [x] Usage tracking procedures (trackUsage, checkLimit, resetUsage)
- [ ] Shared records procedures (shareRecord, getSharedRecords)

### Phase 2: Doctor Practice Management
- [x] Doctor Dashboard - Availability toggle and patient queue
- [x] My Patients page - List of all connected patients
- [ ] Patient Profile page - Complete patient information and history
- [ ] Messages page - Inbox with conversations
- [ ] Appointments page - Calendar and scheduling
- [ ] Prescriptions page - Manage prescriptions

### Phase 3: Patient Doctor Discovery
- [x] Find Doctor page - Search with real-time availability
- [ ] Doctor Profile page - View doctor details and status
- [x] Instant connection - Connect with available doctors
- [x] My Doctor page - View connected doctors
- [ ] My Medical Records page - View shared records from doctors

### Phase 4: Real-Time Messaging
- [x] Message thread component with real-time updates
- [x] Unread count badges
- [ ] Notification system for new messages
- [ ] Message attachments support
- [ ] Typing indicators

### Phase 5: Subscription & Monetization (COMPLETED)
- [x] Patient subscription page (/patient/subscription)
  - [x] Display current plan (Free/Lite/Pro)
  - [x] Show usage stats (consultations used/remaining)
  - [x] Plan comparison cards with features
  - [x] Upgrade/downgrade buttons
  - [x] Billing history table
- [x] Doctor subscription page (/clinician/subscription)
  - [x] Display current plan (Basic/Premium)
  - [x] Show patient count (current/max)
  - [x] Plan comparison cards
  - [x] Upgrade button
  - [x] Billing history
- [ ] Payment integration (Stripe)
  - [ ] Add Stripe feature using webdev_add_feature
  - [ ] Create checkout sessions
  - [ ] Handle webhook events
  - [ ] Update subscription status in database
- [x] Usage limit enforcement in frontend
  - [x] Check consultation limits before symptom checker
  - [ ] Check patient limits before doctor accepts connections
  - [x] Show upgrade prompts when limits reached
  - [x] Display usage stats in dashboards

### Phase 6: Testing & Deployment
- [ ] Test doctor availability status changes
- [ ] Test patient connection flow
- [ ] Test messaging system
- [ ] Test subscription and payment
- [ ] Test usage limits
- [ ] Create checkpoint for B2B2C platform


### Phase 7: Complete Website Redesign for B2B2C (IN PROGRESS)
- [x] Homepage redesign
  - [x] Clear patient/doctor portal selection
  - [x] Subscription pricing preview
  - [x] Feature comparison table
  - [x] Trust signals and testimonials
  - [x] Clear CTAs for both user types
- [ ] Patient dashboard redesign
  - [ ] Prominent subscription status card
  - [ ] Usage stats with progress bars
  - [ ] Quick access to upgrade
  - [ ] Doctor connection status
  - [ ] Recent consultation history
- [ ] Doctor dashboard redesign
  - [ ] Patient count and capacity display
  - [ ] Revenue metrics and ROI calculator
  - [ ] Subscription tier badge
  - [ ] Quick stats for active patients
  - [ ] Upgrade to Premium CTA
- [ ] Onboarding flow
  - [ ] Welcome screen for new users
  - [ ] User type selection (patient/doctor)
  - [ ] Plan selection wizard
  - [ ] Feature tour
- [ ] Monetization touchpoints
  - [ ] Upgrade prompts when limits reached
  - [ ] Feature comparison modals
  - [ ] Success stories from premium users
  - [ ] Limited-time offers
