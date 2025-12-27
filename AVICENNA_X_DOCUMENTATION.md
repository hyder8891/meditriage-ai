# Avicenna-X Complete Workflow Documentation

**My Doctor - Advanced Medical Intelligence Platform**

**Author:** Manus AI  
**Version:** 1.0  
**Last Updated:** December 24, 2025

---

## Executive Summary

Avicenna-X represents a comprehensive medical intelligence platform that combines artificial intelligence, clinical reasoning, and real-time patient monitoring to deliver accurate medical assessments and treatment recommendations. The system integrates multiple specialized modules including BRAIN clinical reasoning, PharmaGuard drug interaction analysis, Bio-Scanner vital signs monitoring, and advanced medical imaging analysis.

This documentation provides a complete overview of the Avicenna-X architecture, workflows, and operational guidelines for healthcare professionals and system administrators.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Modules](#core-modules)
3. [Patient Workflows](#patient-workflows)
4. [Clinician Workflows](#clinician-workflows)
5. [AI Modules](#ai-modules)
6. [Accuracy Framework](#accuracy-framework)
7. [Budget Tracking & Monitoring](#budget-tracking--monitoring)
8. [Orchestration Logs](#orchestration-logs)
9. [Security & Privacy](#security--privacy)
10. [Deployment & Configuration](#deployment--configuration)

---

## System Architecture

Avicenna-X is built on a modern, scalable architecture designed for high availability and real-time performance. The system consists of three primary layers:

### Frontend Layer

The frontend is built using **React 19** with **Tailwind CSS 4** for responsive, mobile-first design. The application supports full bilingual operation (Arabic/English) with right-to-left (RTL) layout support for Arabic users.

**Key Technologies:**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- tRPC for type-safe API communication
- Wouter for client-side routing
- shadcn/ui component library

### Backend Layer

The backend utilizes **Express 4** with **tRPC 11** for type-safe API endpoints. All procedures are strongly typed, ensuring end-to-end type safety from database to frontend.

**Key Technologies:**
- Express 4 web server
- tRPC 11 for API layer
- Drizzle ORM for database operations
- JWT-based authentication
- Manus OAuth integration

### Database Layer

The system uses **MySQL/TiDB** for relational data storage with Drizzle ORM providing type-safe database access.

**Key Tables:**
- `users` - User accounts and profiles
- `triage_records` - Patient assessment history
- `patient_vitals` - Bio-Scanner measurements
- `medical_documents` - Uploaded medical files
- `conversation_sessions` - AI conversation history
- `budget_tracking` - API usage and cost monitoring
- `orchestration_logs` - System operation tracking

---

## Core Modules

### 1. BRAIN Clinical Reasoning Engine

The BRAIN (Biomedical Reasoning and Analysis Intelligence Network) module provides advanced differential diagnosis and clinical decision support.

**Capabilities:**
- Multi-stage diagnostic reasoning
- Differential diagnosis ranking
- Red flag detection
- Evidence-based recommendations
- Clinical guideline compliance checking

**Workflow:**
1. Patient presents symptoms through conversational interface
2. BRAIN analyzes symptoms against medical knowledge base
3. System generates differential diagnosis with confidence scores
4. Red flags are identified and prioritized
5. Evidence-based recommendations are provided
6. Results are logged for continuous learning

**Accuracy Enhancements:**
- Multi-source validation against UMLS and SNOMED CT
- PubMed literature cross-referencing
- Clinical guideline compliance (ACC/AHA, WHO)
- Confidence scoring with uncertainty quantification
- Feedback loop for continuous improvement

### 2. PharmaGuard Drug Interaction Analysis

PharmaGuard provides comprehensive medication safety analysis, detecting potential drug interactions, contraindications, and dosage concerns.

**Capabilities:**
- Drug-drug interaction detection
- Drug-disease contraindication checking
- Dosage validation
- Alternative medication suggestions
- Severity classification

**Workflow:**
1. Clinician inputs medication list
2. System analyzes each drug against database
3. Interactions are identified and classified by severity
4. Recommendations for safer alternatives provided
5. Results include detailed explanations and references

### 3. Bio-Scanner Vital Signs Monitoring

The Bio-Scanner uses photoplethysmography (PPG) technology to measure vital signs through a standard camera.

**Measurements:**
- Heart Rate (BPM)
- Heart Rate Variability (HRV)
- Stress Score
- RMSSD and SDNN metrics

**Accuracy Features:**
- Progressive three-tier detection algorithm
- Multi-measurement averaging with outlier rejection
- Median Absolute Deviation (MAD) filtering
- Signal quality validation
- Confidence-weighted averaging

**Workflow:**
1. Patient positions face or finger in front of camera
2. System captures video feed and extracts color channels
3. Progressive algorithm detects heartbeat peaks
4. Multiple measurements are averaged for accuracy
5. Results are displayed with confidence indicators
6. Data is stored for trend analysis

### 4. Medical Imaging Analysis

Advanced AI-powered analysis of medical images including X-rays, CT scans, MRI, and ultrasound.

**Capabilities:**
- Automatic modality detection
- Anatomical structure identification
- Abnormality detection
- Severity assessment
- Structured reporting

**Supported Modalities:**
- X-Ray
- CT Scan
- MRI
- Ultrasound
- Mammography
- PET Scan

**Workflow:**
1. Clinician uploads medical image
2. System automatically detects imaging modality
3. AI analyzes image for abnormalities
4. Structured report is generated
5. Findings are categorized by severity
6. Recommendations for follow-up provided

### 5. Lab Results Interpretation

Automated analysis and interpretation of laboratory test results with reference range validation.

**Capabilities:**
- OCR extraction from lab report images
- Reference range validation
- Age and gender-specific ranges
- Trend analysis
- Clinical significance assessment

**Workflow:**
1. Patient or clinician uploads lab report
2. OCR extracts test values
3. System validates against reference ranges
4. Abnormal values are flagged
5. Clinical interpretation provided
6. Recommendations generated

### 6. Medical Reports Analysis

Comprehensive analysis of various medical report types with specialized AI prompts.

**Supported Report Types:**
- Pathology Reports (biopsy, cytology)
- Blood Test Reports (CBC, metabolic panels)
- Discharge Summaries
- ECG/EKG Reports
- Pulmonary Function Tests
- Endoscopy Reports
- Genetic Test Reports
- Allergy Test Reports

**Workflow:**
1. Clinician selects report type
2. Report document is uploaded (PDF or image)
3. System extracts text and structured data
4. AI analyzes using report-type-specific prompts
5. Structured findings are presented
6. Clinical recommendations provided

---

## Patient Workflows

### Symptom Assessment Workflow

**Step 1: Access Portal**
- Patient logs in using phone number (SMS verification)
- Arabic/English language selection available
- Dashboard shows recent assessments and appointments

**Step 2: Start AI Assessment**
- Click "ابدأ التقييم الطبي" (Start Medical Assessment)
- Conversational AI guides symptom collection
- Voice input supported for Arabic speakers
- System asks clarifying questions

**Step 3: Receive Assessment**
- BRAIN analyzes symptoms
- Urgency level determined (routine, urgent, emergency)
- Differential diagnosis provided
- Red flags highlighted if present
- Recommendations given

**Step 4: Find Care**
- System suggests nearby clinics/hospitals
- Integration with Care Locator
- Real Iraqi healthcare facilities database
- Google Maps integration for directions

**Step 5: Book Appointment**
- Select preferred clinic
- Choose available time slot
- Receive confirmation
- Add to calendar

### Health Records Management

**View Medical History:**
- Access past assessments
- View uploaded documents
- Track vital signs trends
- Review medication history

**Upload Documents:**
- Lab results
- Imaging reports
- Prescription records
- Medical certificates

---

## Clinician Workflows

### Patient Consultation Workflow

**Step 1: Dashboard Access**
- Clinician logs in with credentials
- View patient queue
- Check availability status
- Review pending consultations

**Step 2: Patient Selection**
- Select patient from list
- View patient profile and history
- Review previous assessments
- Check vital signs trends

**Step 3: Clinical Tools**
- **BRAIN Analysis:** Run differential diagnosis
- **PharmaGuard:** Check drug interactions
- **Bio-Scanner:** Measure vital signs
- **Imaging Analysis:** Review X-rays/scans
- **Lab Interpretation:** Analyze test results
- **Medical Reports:** Review specialist reports

**Step 4: Documentation**
- Generate SOAP notes
- Document findings
- Record treatment plan
- Prescribe medications

**Step 5: Follow-up**
- Schedule follow-up appointment
- Send recommendations to patient
- Track treatment progress
- Review outcome data

### Diagnostic Workflow

**Medical Imaging Analysis:**
1. Upload image file
2. Select modality (or auto-detect)
3. AI analyzes image
4. Review structured findings
5. Confirm or modify diagnosis
6. Generate report

**Lab Results Interpretation:**
1. Upload lab report (PDF/image)
2. OCR extracts values
3. System validates ranges
4. Review abnormal flags
5. Add clinical context
6. Generate interpretation

**Drug Interaction Check:**
1. Enter medication list
2. System analyzes interactions
3. Review severity classifications
4. Check contraindications
5. Explore alternatives
6. Document recommendations

---

## AI Modules

### LLM Integration

Avicenna-X integrates multiple large language models for different tasks:

**Primary Models:**
- **Gemini Pro:** Medical imaging analysis, general reasoning
- **DeepSeek:** Clinical reasoning, medical literature analysis
- **GPT-4:** Complex diagnostic cases, report generation

**Model Selection Logic:**
- Imaging tasks → Gemini Pro (multimodal capabilities)
- Clinical reasoning → DeepSeek (medical training)
- Report generation → GPT-4 (structured output)
- Voice transcription → Whisper API

**Cost Optimization:**
- Token usage tracking
- Model selection based on task complexity
- Caching for repeated queries
- Budget limits per user/organization

### Voice Transcription

**Whisper API Integration:**
- Supports Arabic and English
- Medical terminology recognition
- Real-time transcription
- Automatic punctuation
- Speaker diarization

**Use Cases:**
- Voice symptom input
- Clinical note dictation
- Patient history recording
- Consultation transcription

### Image Generation

**AI Image Generation:**
- Medical illustration creation
- Patient education materials
- Anatomical diagrams
- Procedure explanations

---

## Accuracy Framework

### Multi-Layered Validation

**Layer 1: Knowledge Base Cross-Referencing**
- UMLS (Unified Medical Language System)
- SNOMED CT (Systematized Nomenclature of Medicine)
- ICD-10 disease classification
- RxNorm medication database

**Layer 2: Literature Validation**
- PubMed research database
- Clinical trial data
- Systematic reviews
- Meta-analyses

**Layer 3: Guideline Compliance**
- ACC/AHA cardiac guidelines
- WHO treatment protocols
- National clinical guidelines
- Specialty-specific standards

### Confidence Scoring

**Multi-Factor Confidence Calculation:**
- Evidence strength (A/B/C levels)
- Source reliability
- Consensus level
- Data completeness
- Model uncertainty

**Confidence Thresholds:**
- **High (>80%):** Strong evidence, clear diagnosis
- **Medium (50-80%):** Moderate evidence, differential needed
- **Low (<50%):** Insufficient data, second opinion recommended

### Continuous Learning

**Feedback Mechanisms:**
- Clinician corrections tracked
- Outcome data collection
- Error analysis and categorization
- Automated retraining pipeline
- Performance regression detection

**RLHF (Reinforcement Learning from Human Feedback):**
- Doctor feedback on diagnoses
- Treatment outcome tracking
- Accuracy improvement over time
- Model fine-tuning

---

## Budget Tracking & Monitoring

### Usage Tracking

The budget tracking system monitors all AI API calls and associated costs.

**Tracked Metrics:**
- Input/output tokens
- API provider and model
- Estimated cost (in cents)
- Request duration
- Success/failure status
- Module and operation type

**Database Schema:**
```sql
CREATE TABLE budget_tracking (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  module ENUM('brain', 'pharma_guard', 'imaging', ...),
  api_provider VARCHAR(50),
  model VARCHAR(100),
  input_tokens INT,
  output_tokens INT,
  estimated_cost_cents INT,
  created_at TIMESTAMP
);
```

### Budget Limits

**Limit Types:**
- Daily limits
- Weekly limits
- Monthly limits
- Total budget caps

**Alert System:**
- Threshold alerts (80% usage)
- Email notifications
- Dashboard warnings
- Automatic throttling option

### Cost Analysis

**Reports Available:**
- Usage by module
- Cost trends over time
- Per-user consumption
- Model efficiency comparison
- ROI analysis

**API Endpoints:**
- `budget.getMyUsageStats` - User's usage statistics
- `budget.getModuleStats` - Module-specific analytics
- `budget.checkMyBudgetLimit` - Current limit status
- `budget.estimateCost` - Cost estimation tool

---

## Orchestration Logs

### Operation Tracking

The orchestration logging system tracks all system operations for debugging and monitoring.

**Logged Information:**
- Request ID (unique identifier)
- Operation type and module
- Start/end timestamps
- Duration in milliseconds
- Input/output data
- Error messages and stack traces
- Performance metrics

**Database Schema:**
```sql
CREATE TABLE orchestration_logs (
  id INT PRIMARY KEY,
  request_id VARCHAR(255) UNIQUE,
  operation VARCHAR(255),
  module VARCHAR(100),
  status ENUM('started', 'in_progress', 'completed', 'failed'),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_ms INT,
  error_message TEXT,
  created_at TIMESTAMP
);
```

### Nested Operations

The system supports tracking of nested operations (sub-operations within main operations):

**Hierarchy:**
- Parent request ID
- Depth level
- Operation tree visualization
- Performance bottleneck identification

### Performance Monitoring

**Metrics Tracked:**
- Average operation duration
- Success/failure rates
- Error frequency by module
- Performance trends
- Resource utilization

**API Endpoints:**
- `orchestration.getMyLogs` - User's operation logs
- `orchestration.getLogsByRequestId` - Detailed operation trace
- `orchestration.getSystemStats` - System-wide statistics
- `orchestration.getRecentFailures` - Error monitoring

---

## Security & Privacy

### Authentication

**Multi-Method Support:**
- Phone number + SMS verification
- Email + password
- Manus OAuth integration
- JWT token-based sessions

**Security Features:**
- Password hashing (bcrypt)
- Token version control
- Session expiration
- Logout all devices capability

### Data Protection

**Encryption:**
- TLS/SSL for data in transit
- Database encryption at rest
- Secure file storage (S3)
- API key protection

**Privacy Compliance:**
- HIPAA-aligned practices
- GDPR considerations
- Data minimization
- User consent management

### Role-Based Access Control

**User Roles:**
- **Patient:** View own data, book appointments
- **Clinician:** Access patient data, use diagnostic tools
- **Admin:** System configuration, user management
- **Super Admin:** Full system access

**Permission Matrix:**

| Feature | Patient | Clinician | Admin |
|---------|---------|-----------|-------|
| View own health records | ✓ | ✓ | ✓ |
| View other patient records | ✗ | ✓ | ✓ |
| Use BRAIN analysis | ✓ | ✓ | ✓ |
| Use PharmaGuard | ✗ | ✓ | ✓ |
| Medical imaging analysis | ✗ | ✓ | ✓ |
| User management | ✗ | ✗ | ✓ |
| Budget monitoring | ✗ | ✗ | ✓ |
| System logs | ✗ | ✗ | ✓ |

---

## Deployment & Configuration

### Environment Variables

**Required Configuration:**
```bash
# Database
DATABASE_URL=mysql://user:pass@host:port/db

# Authentication
JWT_SECRET=your_secret_key
OAUTH_SERVER_URL=https://api.manus.im

# AI Services
GEMINI_API_KEY=your_gemini_key
DEEPSEEK_API_KEY=your_deepseek_key
OPENAI_API_KEY=your_openai_key

# Storage
S3_BUCKET=your_bucket_name
S3_REGION=your_region

# Application
VITE_APP_TITLE=My Doctor
VITE_APP_LOGO=/logo.png
```

### Database Setup

**Initial Migration:**
```bash
pnpm db:push
```

**Seeding Data:**
```bash
node scripts/seed-care-locator.mjs
```

### Development

**Start Development Server:**
```bash
pnpm dev
```

**Run Tests:**
```bash
pnpm test
```

**Type Checking:**
```bash
pnpm typecheck
```

### Production Deployment

**Build Application:**
```bash
pnpm build
```

**Start Production Server:**
```bash
pnpm start
```

**Health Check:**
- Endpoint: `/api/health`
- Expected: 200 OK

---

## Troubleshooting

### Common Issues

**Issue: Bio-Scanner shows high BPM readings**
- **Cause:** Harmonic doubling (detecting both systolic and diastolic peaks)
- **Solution:** Adjust detection thresholds in ProgressiveBioEngine
- **Prevention:** Ensure good lighting and stable positioning

**Issue: Medical imaging analysis fails**
- **Cause:** Unsupported image format or corrupted file
- **Solution:** Convert to supported format (JPEG, PNG)
- **Prevention:** Validate file format before upload

**Issue: Budget limit exceeded**
- **Cause:** High API usage or low budget limit
- **Solution:** Increase budget limit or optimize API calls
- **Prevention:** Monitor usage dashboard regularly

**Issue: Orchestration log shows failed operations**
- **Cause:** API timeout, network error, or invalid input
- **Solution:** Check error message and stack trace
- **Prevention:** Implement retry logic and input validation

### Support

For technical support or questions:
- Email: support@mydoctor.ai
- Documentation: https://docs.mydoctor.ai
- Issue Tracker: https://github.com/mydoctor/avicenna-x/issues

---

## Conclusion

Avicenna-X represents a comprehensive medical intelligence platform that combines cutting-edge AI technology with clinical expertise to deliver accurate, reliable medical assessments. The system's multi-layered accuracy framework, continuous learning capabilities, and comprehensive monitoring tools ensure high-quality healthcare delivery while maintaining cost efficiency and operational transparency.

The platform is designed for scalability, supporting both individual clinicians and large healthcare organizations. With its bilingual interface, Iraqi healthcare facility integration, and mobile-first design, Avicenna-X is specifically optimized for the Iraqi healthcare market while maintaining global standards of medical practice.

Future enhancements will include expanded language support, additional medical specialties, integration with electronic health record systems, and advanced predictive analytics for population health management.

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025  
**Author:** Manus AI  
**Copyright:** © 2025 My Doctor. All rights reserved.
