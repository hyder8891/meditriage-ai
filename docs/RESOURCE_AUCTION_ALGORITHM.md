# Resource Auction Algorithm - Avicenna-x Feature #4

## Overview

The **Resource Auction Algorithm** is an intelligent doctor/clinic matching system that creates a competitive marketplace where healthcare providers are scored based on multiple factors to find the best match for each patient. Unlike traditional marketplaces that optimize solely for price, this algorithm prioritizes **patient outcomes** while considering cost constraints.

## Core Concept

The "auction" metaphor represents resources (doctors/clinics) bidding for patients based on their strengths. The system evaluates each provider across five key dimensions and assigns a weighted score to determine the best match.

## Scoring Dimensions

### 1. Skill Match (35% weight)
Evaluates how well the doctor's specialty and experience align with the patient's condition.

**Scoring breakdown:**
- **Exact specialty match**: 50 points
- **Related specialty**: 30 points
- **Symptom-specialty alignment**: Up to 50 points

**Example:**
```typescript
// Patient with chest pain needs cardiologist
calculateSkillMatch('cardiology', 'cardiology', ['chest pain', 'palpitations'])
// Returns: ~85/100 (exact match + symptom alignment)
```

### 2. Proximity (20% weight)
Calculates distance between patient and provider, with urgency-based thresholds.

**Urgency thresholds:**
- **EMERGENCY**: Ideal <5km, Max 30km
- **HIGH**: Ideal <10km, Max 50km
- **MEDIUM**: Ideal <20km, Max 100km
- **LOW**: Ideal <50km, Max 200km

**Distance calculation:**
Uses Haversine formula for accurate geographic distance:
```typescript
calculateDistance(33.3152, 44.3661, 33.3200, 44.3700)
// Returns: ~0.6 km
```

### 3. Price (15% weight)
Optimizes cost based on budget constraints and market comparison.

**Pricing factors:**
- Specialty (cardiology > general practice)
- Urgency (emergency 2x multiplier)
- Telemedicine (20% discount)

**Budget scoring:**
- ≤50% budget: 100 points
- ≤70% budget: 80 points
- ≤85% budget: 60 points
- >85% budget: 40 points
- Over budget: 0 points (disqualified)

**Example costs (IQD):**
```
General Practice (MEDIUM, in-person): 25,000 IQD
Cardiology (MEDIUM, in-person): 50,000 IQD
Cardiology (EMERGENCY, in-person): 100,000 IQD
Cardiology (MEDIUM, telemedicine): 40,000 IQD
```

### 4. Network Quality (15% if telemedicine, 5% otherwise)
Assesses connection stability for telemedicine consultations.

**Metrics:**
- **Latency** (40 points max): <50ms = excellent
- **Bandwidth** (30 points max): ≥5 Mbps = excellent
- **Connection stability** (30 points max): <1% drop rate = excellent

**Quality levels:**
- EXCELLENT: >90 points
- GOOD: 70-90 points
- FAIR: 50-70 points
- POOR: <50 points

### 5. Performance History (15% weight)
Tracks historical success rates and patient satisfaction.

**Metrics:**
- **Success rate** (40 points): successful consultations / total
- **Patient satisfaction** (30 points): average rating (0-5 scale)
- **Response time** (15 points): <1 min = 15 points
- **Specialty success rate** (15 points): success in required specialty

**Default values** (for new doctors):
- Success rate: 85%
- Patient satisfaction: 4.2/5
- Response time: 180 seconds

## Database Schema

### doctor_performance_metrics
Stores aggregated performance data per doctor.

```sql
CREATE TABLE doctor_performance_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT UNIQUE NOT NULL,
  total_consultations INT DEFAULT 0,
  successful_consultations INT DEFAULT 0,
  avg_response_time INT DEFAULT 180, -- seconds
  avg_consultation_duration INT DEFAULT 20, -- minutes
  patient_satisfaction_avg DECIMAL(3,2) DEFAULT 4.20,
  specialty_success_rates TEXT, -- JSON: {"cardiology": 0.95}
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### network_quality_logs
Records individual network quality measurements.

```sql
CREATE TABLE network_quality_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT NOT NULL,
  latency INT NOT NULL, -- milliseconds
  bandwidth DECIMAL(6,2) NOT NULL, -- Mbps
  packet_loss DECIMAL(5,4) DEFAULT 0.0000,
  quality ENUM('EXCELLENT','GOOD','FAIR','POOR'),
  consultation_id INT,
  measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### network_quality_metrics
Pre-computed aggregated network metrics (last 30 days).

```sql
CREATE TABLE network_quality_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT UNIQUE NOT NULL,
  avg_latency INT NOT NULL,
  avg_bandwidth DECIMAL(6,2) NOT NULL,
  connection_drop_rate DECIMAL(5,4) DEFAULT 0.0000,
  last_connection_quality ENUM('EXCELLENT','GOOD','FAIR','POOR'),
  measurement_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### trpc.resourceAuction.findBestDoctor
Runs the auction algorithm to find the best doctor match.

**Input:**
```typescript
{
  patientLocation: { lat: 33.3152, lng: 44.3661 },
  requiredSpecialty: "cardiology",
  symptoms: ["chest pain", "palpitations"],
  urgency: "HIGH",
  maxBudget: 100000, // IQD (optional)
  maxDistance: 50, // km (optional)
  requiresTelemedicine: true,
  preferredLanguage: "ar" // optional
}
```

**Output:**
```typescript
{
  success: true,
  results: [
    {
      doctorId: 123,
      doctorName: "Dr. Ahmed Hassan",
      specialty: "Cardiology",
      totalScore: 87,
      breakdown: {
        skillMatch: 90,
        proximity: 85,
        price: 80,
        networkQuality: 95,
        performance: 88
      },
      metadata: {
        distance: 3.2, // km
        estimatedCost: 45000, // IQD
        avgResponseTime: 60, // seconds
        successRate: 0.92,
        patientRating: 4.7,
        connectionStability: 0.98
      },
      recommendation: "HIGHLY_RECOMMENDED"
    }
  ],
  topDoctor: { ... },
  totalCandidates: 15
}
```

### trpc.resourceAuction.updateDoctorPerformance
Updates performance metrics after a consultation.

**Input:**
```typescript
{
  doctorId: 123,
  consultationSuccess: true,
  responseTime: 45, // seconds
  consultationDuration: 25, // minutes
  patientRating: 5, // 0-5 (optional)
  specialty: "cardiology"
}
```

### trpc.resourceAuction.logNetworkQuality
Logs network quality during a consultation.

**Input:**
```typescript
{
  doctorId: 123,
  latency: 35, // ms
  bandwidth: 8.5, // Mbps
  packetLoss: 0.001, // optional
  quality: "EXCELLENT",
  consultationId: 456, // optional
  sessionDuration: 1500 // seconds (optional)
}
```

## Usage Examples

### Example 1: Emergency Cardiac Case
```typescript
// Patient with chest pain in Baghdad needs cardiologist urgently
const result = await trpc.resourceAuction.findBestDoctor.mutate({
  patientLocation: { lat: 33.3152, lng: 44.3661 },
  requiredSpecialty: "cardiology",
  symptoms: ["chest pain", "shortness of breath", "palpitations"],
  urgency: "EMERGENCY",
  maxBudget: 200000,
  maxDistance: 30,
  requiresTelemedicine: false
});

// Expected: High skill match (>70), high proximity score (>90)
// Cost: ~100,000 IQD (emergency premium)
```

### Example 2: Routine Telemedicine Consultation
```typescript
// Patient needs general checkup, prefers telemedicine
const result = await trpc.resourceAuction.findBestDoctor.mutate({
  patientLocation: { lat: 33.3152, lng: 44.3661 },
  requiredSpecialty: "family medicine",
  symptoms: ["fatigue", "mild headache"],
  urgency: "LOW",
  maxBudget: 50000,
  requiresTelemedicine: true
});

// Expected: Distance less important, network quality critical
// Cost: ~20,000 IQD (low urgency + telemedicine discount)
```

### Example 3: Budget-Constrained Patient
```typescript
// Patient has limited budget but needs specialist
const result = await trpc.resourceAuction.findBestDoctor.mutate({
  patientLocation: { lat: 33.3152, lng: 44.3661 },
  requiredSpecialty: "cardiology",
  symptoms: ["chest pain"],
  urgency: "MEDIUM",
  maxBudget: 40000, // Limited budget
  requiresTelemedicine: true // Cheaper option
});

// Expected: Telemedicine option prioritized to fit budget
// Doctors over budget automatically disqualified (score = 0)
```

## Testing

Comprehensive test suite with 30 passing tests covering:

- **Skill matching**: Exact match, related specialties, symptom alignment
- **Distance calculation**: Haversine formula accuracy
- **Proximity scoring**: Urgency-based thresholds
- **Price scoring**: Budget constraints, market comparison
- **Cost estimation**: Specialty, urgency, telemedicine factors
- **Network quality**: Latency, bandwidth, stability scoring
- **Performance scoring**: Success rate, satisfaction, response time
- **Integration scenarios**: Emergency, routine, budget-constrained cases

**Run tests:**
```bash
pnpm test server/avicenna/resource-auction.test.ts
```

**Test results:**
```
✓ server/avicenna/resource-auction.test.ts (30 tests) 18ms
  Test Files  1 passed (1)
       Tests  30 passed (30)
```

## Integration with Avicenna-x

The Resource Auction Algorithm is **Layer 3** of the Avicenna-x Predictive Health Graph:

1. **OBSERVE**: Collect patient data (symptoms, vitals, location)
2. **ANALYZE**: BRAIN generates diagnosis
3. **ACT**: **Resource Auction** finds best provider ← **YOU ARE HERE**
4. **TRACK**: Monitor outcomes and update metrics

The algorithm is called during the **ACT phase** of the orchestrator:
```typescript
// In orchestrator.ts
const bestDoctor = await runResourceAuction({
  patientLocation: context.location,
  requiredSpecialty: diagnosis.primaryDiagnosis,
  symptoms: diagnosis.symptoms,
  urgency: diagnosis.urgency,
  maxBudget: context.budgetConstraint,
  requiresTelemedicine: context.preferTelemedicine
});
```

## Future Enhancements

1. **Real-time availability**: WebSocket updates for doctor status changes
2. **Multi-language support**: Match doctors by preferred language
3. **Insurance integration**: Filter by accepted insurance providers
4. **Appointment scheduling**: Direct booking after match
5. **Patient preferences**: Remember preferred doctors, avoid certain clinics
6. **Machine learning**: Improve scoring weights based on outcome data
7. **Clinic equipment matching**: Score clinics by available equipment
8. **Wait time prediction**: Use historical data to predict actual wait times

## Performance Considerations

- **Caching**: Doctor performance metrics cached in Redis (5 min TTL)
- **Database indexing**: Index on `doctor_id`, `availabilityStatus`, `specialty`
- **Batch updates**: Performance metrics updated asynchronously after consultations
- **Aggregation**: Network quality metrics pre-computed daily (not real-time)

## Security & Privacy

- **Protected endpoints**: All endpoints require authentication
- **Data anonymization**: Patient data not stored in performance metrics
- **HIPAA compliance**: No PHI in logs or error messages
- **Rate limiting**: Prevent abuse of auction algorithm

## Monitoring & Alerts

Key metrics to monitor:
- Average auction execution time (<500ms target)
- Doctor availability rate (>70% target)
- Match success rate (>85% target)
- Network quality distribution (>60% excellent/good)
- Price adherence rate (>90% within budget)

## Conclusion

The Resource Auction Algorithm transforms healthcare provider matching from a manual, subjective process into an intelligent, data-driven system that optimizes for patient outcomes while respecting budget constraints. By scoring providers across five key dimensions, it ensures patients are matched with the most qualified, available, and affordable healthcare resources.
