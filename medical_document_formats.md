# Medical Document Formats Reference

## Document Types and Key Fields

### 1. Laboratory Reports (Blood Tests, CBC, Chemistry Panels)
**Common Fields:**
- Patient Information: Name, DOB, Age, Gender, Medical Record Number
- Specimen Information: Collection Date/Time, Specimen Type
- Test Results Table:
  - Test Name
  - Result Value
  - Units (mg/dL, mmol/L, g/dL, etc.)
  - Reference Range (Normal Range)
  - Flag (High/Low/Normal/Critical)
- Ordering Physician
- Laboratory Information (Name, Address, CLIA#)
- Report Date/Time

**Example Tests:**
- Complete Blood Count (CBC): WBC, RBC, Hemoglobin, Hematocrit, Platelets, MCV, MCH, MCHC
- Basic Metabolic Panel: Glucose, BUN, Creatinine, Sodium, Potassium, Chloride, CO2
- Lipid Panel: Total Cholesterol, LDL, HDL, Triglycerides
- Liver Function: ALT, AST, ALP, Bilirubin, Albumin
- Thyroid Panel: TSH, T3, T4, Free T4

### 2. Radiology/Imaging Reports
**Common Fields:**
- Patient Demographics
- Exam Type: X-Ray, CT Scan, MRI, Ultrasound
- Clinical History/Indication
- Technique: Description of imaging protocol
- Comparison: Prior studies if available
- Findings: Detailed observations organized by anatomical region
- Impression: Summary of key findings and diagnosis
- Recommendations: Follow-up suggestions
- Radiologist Signature and Credentials

**Report Sections:**
1. Header with patient/exam info
2. Clinical History
3. Technique
4. Findings (detailed)
5. Impression (summary)
6. Recommendations

### 3. Prescriptions
**Common Fields:**
- Prescriber Information: Name, Credentials (M.D., D.O., etc.), DEA#, NPI, Address, Phone
- Patient Information: Name, Age, Address
- Date
- Rx Symbol
- Medication Details:
  - Drug Name (Brand/Generic)
  - Strength/Dosage
  - Form (tablet, capsule, liquid)
  - Quantity
  - Directions (Sig)
  - Refills
- Signature
- Category of Licensure

### 4. Discharge Summaries
**Common Fields:**
- Patient Demographics
- Admission/Discharge Dates
- Admitting/Attending Physician
- Primary Diagnosis (ICD codes)
- Secondary Diagnoses
- Chief Complaint
- History of Present Illness
- Hospital Course
- Procedures Performed
- Discharge Medications
- Discharge Instructions
- Follow-up Appointments
- Condition at Discharge

### 5. ECG/EKG Reports
**Common Fields:**
- Patient Information
- Date/Time of Recording
- Heart Rate (bpm)
- PR Interval
- QRS Duration
- QT/QTc Interval
- Rhythm Analysis
- Axis
- Interpretation/Findings
- 12-Lead Waveform Display
- Cardiologist Signature

### 6. Vital Signs Charts
**Common Fields:**
- Patient Information
- Date/Time
- Temperature (°F/°C)
- Blood Pressure (Systolic/Diastolic mmHg)
- Heart Rate/Pulse (bpm)
- Respiratory Rate (breaths/min)
- Oxygen Saturation (SpO2 %)
- Pain Scale (0-10)
- Weight
- Height

## Reference Ranges (Adult Normal Values)

### Complete Blood Count
| Test | Normal Range | Units |
|------|--------------|-------|
| WBC | 4,500-11,000 | cells/mcL |
| RBC (M) | 4.5-5.5 | million/mcL |
| RBC (F) | 4.0-5.0 | million/mcL |
| Hemoglobin (M) | 13.5-17.5 | g/dL |
| Hemoglobin (F) | 12.0-16.0 | g/dL |
| Hematocrit (M) | 38.8-50.0 | % |
| Hematocrit (F) | 34.9-44.5 | % |
| Platelets | 150,000-400,000 | cells/mcL |

### Basic Metabolic Panel
| Test | Normal Range | Units |
|------|--------------|-------|
| Glucose (fasting) | 70-100 | mg/dL |
| BUN | 7-20 | mg/dL |
| Creatinine | 0.6-1.2 | mg/dL |
| Sodium | 136-145 | mEq/L |
| Potassium | 3.5-5.0 | mEq/L |
| Chloride | 98-106 | mEq/L |
| CO2 | 23-29 | mEq/L |

### Lipid Panel
| Test | Desirable | Units |
|------|-----------|-------|
| Total Cholesterol | <200 | mg/dL |
| LDL | <100 | mg/dL |
| HDL | >40 (M), >50 (F) | mg/dL |
| Triglycerides | <150 | mg/dL |

### Vital Signs (Adult)
| Measurement | Normal Range |
|-------------|--------------|
| Temperature | 97.8-99.1°F (36.5-37.3°C) |
| Heart Rate | 60-100 bpm |
| Respiratory Rate | 12-20 breaths/min |
| Blood Pressure | <120/80 mmHg |
| SpO2 | 95-100% |

## Document Analysis Considerations

### For AI Document Analysis:
1. **OCR Challenges:**
   - Handwritten prescriptions
   - Faded or low-quality scans
   - Tables with merged cells
   - Medical abbreviations

2. **Key Extraction Points:**
   - Abnormal values (flagged High/Low)
   - Critical values requiring immediate attention
   - Medication names and dosages
   - Diagnosis codes (ICD-10)
   - Follow-up recommendations

3. **Urgency Indicators:**
   - Critical lab values
   - Stat orders
   - Emergency findings in radiology
   - Abnormal ECG rhythms

4. **Common Medical Abbreviations:**
   - BID = twice daily
   - TID = three times daily
   - QID = four times daily
   - PRN = as needed
   - PO = by mouth
   - IV = intravenous
   - IM = intramuscular
   - SC/SQ = subcutaneous
   - NPO = nothing by mouth
   - Hx = history
   - Dx = diagnosis
   - Rx = prescription/treatment
   - Tx = treatment
   - Sx = symptoms
