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

### Phase 5: Subscription & Monetization
- [ ] Subscription plans UI for patients
- [ ] Subscription plans UI for doctors
- [ ] Payment integration (Stripe)
- [ ] Usage limit enforcement
- [ ] Upgrade prompts when limits reached
- [ ] Billing history page

### Phase 6: Testing & Deployment
- [ ] Test doctor availability status changes
- [ ] Test patient connection flow
- [ ] Test messaging system
- [ ] Test subscription and payment
- [ ] Test usage limits
- [ ] Create checkpoint for B2B2C platform
