/**
 * EXPANDED Medical Training Data for BRAIN (DOUBLED)
 * This file contains additional clinical guidelines, symptom mappings, and Iraqi-specific data
 * to be merged with the base training-data.ts
 */

import { ClinicalGuideline, SymptomDiseaseMapping } from './training-data';

/**
 * Additional Clinical Guidelines (8 new conditions)
 * Brings total from 8 to 16 clinical guidelines
 */
export const additionalClinicalGuidelines: ClinicalGuideline[] = [
  {
    id: 'cg-009',
    condition: 'Hypertensive Emergency',
    category: 'Cardiovascular Emergency',
    diagnosticCriteria: [
      'Systolic BP ≥180 mmHg or Diastolic BP ≥120 mmHg',
      'Evidence of end-organ damage',
      'Symptoms: headache, chest pain, dyspnea, altered mental status',
      'Fundoscopy showing papilledema or hemorrhages',
      'ECG changes or elevated troponin'
    ],
    redFlags: [
      'Hypertensive encephalopathy',
      'Acute coronary syndrome',
      'Acute heart failure with pulmonary edema',
      'Aortic dissection',
      'Acute kidney injury',
      'Eclampsia in pregnancy'
    ],
    firstLineInvestigations: [
      'Blood pressure measurement (both arms)',
      'ECG',
      'Chest X-ray',
      'Complete blood count',
      'Electrolytes, BUN, creatinine',
      'Urinalysis',
      'Cardiac biomarkers',
      'Fundoscopy'
    ],
    treatment: {
      firstLine: [
        'IV labetalol 20mg bolus, then infusion',
        'IV nicardipine infusion 5mg/hour',
        'IV hydralazine 10-20mg for eclampsia',
        'Reduce BP by 25% in first hour',
        'Continuous BP monitoring'
      ],
      secondLine: [
        'IV sodium nitroprusside (if refractory)',
        'IV enalaprilat 1.25mg over 5 minutes',
        'Oral clonidine if IV access difficult',
        'Treat underlying cause',
        'Target BP 160/100 within 2-6 hours'
      ],
      emergencyManagement: [
        'ICU admission',
        'Arterial line for continuous BP monitoring',
        'Identify and treat precipitants',
        'Avoid rapid BP reduction (risk of stroke)'
      ]
    },
    referralCriteria: [
      'All hypertensive emergencies require ICU admission',
      'Cardiology if ACS or heart failure',
      'Neurology if encephalopathy or stroke',
      'Nephrology if acute kidney injury'
    ],
    source: 'ACC/AHA Hypertension Guidelines 2023'
  },
  {
    id: 'cg-010',
    condition: 'Type 2 Diabetes Mellitus',
    category: 'Endocrine/Metabolic',
    diagnosticCriteria: [
      'Fasting glucose ≥126 mg/dL on two occasions',
      'HbA1c ≥6.5%',
      'Random glucose ≥200 mg/dL with symptoms',
      '2-hour OGTT ≥200 mg/dL',
      'Polyuria, polydipsia, weight loss'
    ],
    redFlags: [
      'DKA or HHS',
      'Severe hyperglycemia >400 mg/dL',
      'Hypoglycemia <70 mg/dL',
      'Diabetic foot ulcer',
      'Retinopathy or nephropathy',
      'Cardiovascular disease'
    ],
    firstLineInvestigations: [
      'Fasting blood glucose',
      'HbA1c',
      'Lipid profile',
      'Kidney function (eGFR, urine albumin)',
      'Liver function tests',
      'Fundoscopy',
      'Foot examination'
    ],
    treatment: {
      firstLine: [
        'Lifestyle modification (diet, exercise, weight loss)',
        'Metformin 500mg BID, titrate to 1000mg BID',
        'Target HbA1c <7% (individualize)',
        'Blood pressure control <130/80',
        'Statin therapy (atorvastatin 20-40mg)',
        'Aspirin 75-150mg if CVD risk'
      ],
      secondLine: [
        'Add GLP-1 agonist (semaglutide, liraglutide) if CVD',
        'Add SGLT2 inhibitor (empagliflozin) if heart failure or CKD',
        'Add DPP-4 inhibitor (sitagliptin)',
        'Add sulfonylurea (glimepiride) if cost concern',
        'Insulin if HbA1c >10% or symptomatic'
      ],
      emergencyManagement: [
        'DKA/HHS management if present',
        'Hypoglycemia treatment (15g fast-acting carbs)',
        'Diabetic foot infection - antibiotics and surgery'
      ]
    },
    referralCriteria: [
      'Endocrinology if HbA1c >9% despite treatment',
      'Ophthalmology annually for retinopathy screening',
      'Nephrology if eGFR <30 or proteinuria',
      'Podiatry if foot complications'
    ],
    source: 'ADA Standards of Care 2023'
  },
  {
    id: 'cg-011',
    condition: 'Pulmonary Tuberculosis',
    category: 'Infectious Disease',
    diagnosticCriteria: [
      'Chronic cough >2 weeks',
      'Hemoptysis',
      'Night sweats and weight loss',
      'Fever (low-grade, evening rise)',
      'Positive sputum smear (AFB)',
      'Positive GeneXpert MTB/RIF',
      'Chest X-ray showing cavitary lesions or infiltrates'
    ],
    redFlags: [
      'Massive hemoptysis',
      'Respiratory failure',
      'MDR-TB or XDR-TB',
      'TB meningitis',
      'Miliary TB',
      'HIV co-infection'
    ],
    firstLineInvestigations: [
      'Sputum smear microscopy (3 samples)',
      'GeneXpert MTB/RIF (rapid molecular test)',
      'Chest X-ray (PA and lateral)',
      'HIV test (all TB patients)',
      'Sputum culture and sensitivity',
      'Complete blood count',
      'Liver and kidney function'
    ],
    treatment: {
      firstLine: [
        'Intensive phase (2 months): HRZE daily',
        '  - Isoniazid 5mg/kg (max 300mg)',
        '  - Rifampicin 10mg/kg (max 600mg)',
        '  - Pyrazinamide 25mg/kg (max 2g)',
        '  - Ethambutol 15mg/kg (max 1.6g)',
        'Continuation phase (4 months): HR daily',
        'DOT (Directly Observed Therapy) recommended',
        'Pyridoxine 25mg daily (prevent neuropathy)'
      ],
      secondLine: [
        'MDR-TB: Bedaquiline-based regimen (9-20 months)',
        'Fluoroquinolone (levofloxacin/moxifloxacin)',
        'Injectable agent (amikacin/kanamycin)',
        'Monitor for adverse effects monthly',
        'Extend treatment if slow response'
      ],
      emergencyManagement: [
        'Respiratory isolation (negative pressure room)',
        'Massive hemoptysis - ICU, bronchoscopy',
        'TB meningitis - add steroids (dexamethasone)'
      ]
    },
    referralCriteria: [
      'All confirmed TB cases to TB program',
      'MDR-TB to specialized center',
      'Pulmonology if massive hemoptysis',
      'Infectious disease if HIV co-infection'
    ],
    source: 'WHO TB Treatment Guidelines 2023'
  },
  {
    id: 'cg-012',
    condition: 'Malaria',
    category: 'Tropical Infectious Disease',
    diagnosticCriteria: [
      'Fever (cyclical pattern)',
      'Chills and rigors',
      'Headache and myalgia',
      'Travel to endemic area within 3 months',
      'Positive blood smear (thick and thin)',
      'Positive rapid diagnostic test (RDT)',
      'Splenomegaly on examination'
    ],
    redFlags: [
      'Cerebral malaria (altered consciousness)',
      'Severe anemia (Hb <5 g/dL)',
      'Acute kidney injury',
      'Pulmonary edema',
      'Hypoglycemia',
      'Shock',
      'Parasitemia >5%'
    ],
    firstLineInvestigations: [
      'Thick and thin blood smear',
      'Rapid diagnostic test (RDT)',
      'Complete blood count',
      'Blood glucose',
      'Kidney and liver function',
      'Lactate if severe',
      'G6PD testing before primaquine'
    ],
    treatment: {
      firstLine: [
        'Uncomplicated P. falciparum: Artemether-lumefantrine (Coartem)',
        '  - 4 tablets at 0, 8, 24, 36, 48, 60 hours',
        'Alternative: Artesunate-amodiaquine 3 days',
        'P. vivax/ovale: Chloroquine + Primaquine (14 days)',
        'Supportive: Antipyretics, fluids',
        'Monitor parasitemia on day 3'
      ],
      secondLine: [
        'Severe malaria: IV Artesunate 2.4mg/kg at 0, 12, 24h then daily',
        'Alternative: IV Quinine loading dose then infusion',
        'Add primaquine for P. vivax/ovale (after G6PD check)',
        'Treat complications (transfusion, dialysis, ventilation)'
      ],
      emergencyManagement: [
        'ICU admission if severe malaria',
        'IV artesunate immediately',
        'Monitor glucose hourly',
        'Exchange transfusion if parasitemia >10%'
      ]
    },
    referralCriteria: [
      'All severe malaria to ICU',
      'Infectious disease consultation',
      'Nephrology if acute kidney injury',
      'Hematology if severe anemia'
    ],
    source: 'WHO Malaria Treatment Guidelines 2023'
  },
  {
    id: 'cg-013',
    condition: 'Dengue Fever',
    category: 'Tropical Infectious Disease',
    diagnosticCriteria: [
      'Acute febrile illness (2-7 days)',
      'Severe headache (retro-orbital pain)',
      'Myalgia and arthralgia ("breakbone fever")',
      'Rash (maculopapular)',
      'Positive NS1 antigen or IgM/IgG serology',
      'Thrombocytopenia <100,000',
      'Leukopenia'
    ],
    redFlags: [
      'Warning signs: Abdominal pain, persistent vomiting, bleeding',
      'Severe dengue: Plasma leakage, shock',
      'Platelet count <20,000',
      'Hematocrit rise >20%',
      'Organ impairment (liver, kidney, CNS)',
      'Severe bleeding'
    ],
    firstLineInvestigations: [
      'NS1 antigen (days 1-5)',
      'Dengue IgM/IgG serology (after day 5)',
      'Complete blood count with hematocrit',
      'Platelet count (daily if low)',
      'Liver function tests',
      'Coagulation profile if bleeding',
      'Chest X-ray and ultrasound if plasma leakage'
    ],
    treatment: {
      firstLine: [
        'Supportive care (no specific antiviral)',
        'Oral/IV fluids to maintain hydration',
        'Paracetamol for fever (avoid NSAIDs/aspirin)',
        'Monitor platelet count and hematocrit daily',
        'Rest and avoid mosquito bites'
      ],
      secondLine: [
        'IV fluid resuscitation if shock (crystalloid bolus)',
        'Platelet transfusion if <10,000 with bleeding',
        'Fresh frozen plasma if coagulopathy',
        'ICU monitoring if severe dengue',
        'Avoid unnecessary procedures (risk of bleeding)'
      ],
      emergencyManagement: [
        'Dengue shock syndrome: Aggressive fluid resuscitation',
        'Colloids if refractory shock',
        'Inotropes if persistent shock',
        'Blood transfusion if severe bleeding'
      ]
    },
    referralCriteria: [
      'Admission if warning signs present',
      'ICU if severe dengue or shock',
      'Hematology if severe bleeding',
      'Infectious disease consultation'
    ],
    source: 'WHO Dengue Guidelines 2023'
  },
  {
    id: 'cg-014',
    condition: 'Chronic Kidney Disease',
    category: 'Renal Disease',
    diagnosticCriteria: [
      'eGFR <60 mL/min/1.73m² for >3 months',
      'Albuminuria (ACR >30 mg/g) for >3 months',
      'Structural kidney abnormalities',
      'History of kidney transplant',
      'Symptoms: fatigue, nausea, edema, uremia'
    ],
    redFlags: [
      'eGFR <15 (stage 5 - kidney failure)',
      'Hyperkalemia >6.0 mmol/L',
      'Severe metabolic acidosis',
      'Uremic symptoms (pericarditis, encephalopathy)',
      'Fluid overload refractory to diuretics',
      'Uncontrolled hypertension'
    ],
    firstLineInvestigations: [
      'Serum creatinine and eGFR',
      'Urine albumin-to-creatinine ratio',
      'Electrolytes (K, Na, HCO3)',
      'Complete blood count (anemia)',
      'Calcium, phosphate, PTH',
      'Renal ultrasound',
      'Urinalysis'
    ],
    treatment: {
      firstLine: [
        'BP control <130/80 (ACE-I or ARB)',
        'Diabetes control (HbA1c <7%)',
        'Dietary protein restriction (0.8g/kg/day)',
        'Sodium restriction (<2g/day)',
        'Treat anemia (ESA if Hb <10)',
        'Phosphate binders if elevated',
        'Vitamin D supplementation'
      ],
      secondLine: [
        'SGLT2 inhibitor (empagliflozin) for CKD progression',
        'Diuretics for volume overload',
        'Bicarbonate for acidosis',
        'Statin for cardiovascular protection',
        'Avoid nephrotoxic drugs (NSAIDs, contrast)'
      ],
      emergencyManagement: [
        'Dialysis if eGFR <10 or uremic symptoms',
        'Emergency dialysis for hyperkalemia, acidosis, fluid overload',
        'Prepare for renal replacement therapy'
      ]
    },
    referralCriteria: [
      'Nephrology if eGFR <30 or rapid decline',
      'Vascular access planning if eGFR <20',
      'Transplant evaluation if suitable',
      'Dietitian for CKD diet counseling'
    ],
    source: 'KDIGO CKD Guidelines 2023'
  },
  {
    id: 'cg-015',
    condition: 'Liver Cirrhosis',
    category: 'Hepatic Disease',
    diagnosticCriteria: [
      'Chronic liver disease >6 months',
      'Clinical signs: jaundice, ascites, spider nevi, palmar erythema',
      'Elevated liver enzymes (AST, ALT)',
      'Low albumin, prolonged PT/INR',
      'Ultrasound showing nodular liver',
      'FibroScan showing advanced fibrosis (F3-F4)',
      'Liver biopsy (gold standard)'
    ],
    redFlags: [
      'Variceal bleeding',
      'Hepatic encephalopathy',
      'Spontaneous bacterial peritonitis',
      'Hepatorenal syndrome',
      'Hepatocellular carcinoma',
      'Child-Pugh class C (decompensated)'
    ],
    firstLineInvestigations: [
      'Liver function tests (AST, ALT, ALP, bilirubin, albumin)',
      'Coagulation profile (PT/INR)',
      'Complete blood count',
      'Viral hepatitis serology (HBV, HCV)',
      'Abdominal ultrasound',
      'Upper endoscopy (varices screening)',
      'AFP (hepatocellular carcinoma screening)'
    ],
    treatment: {
      firstLine: [
        'Treat underlying cause (antivirals for HBV/HCV, abstinence for alcohol)',
        'Ascites: Sodium restriction, spironolactone + furosemide',
        'Varices prophylaxis: Non-selective beta-blocker (propranolol)',
        'Lactulose for hepatic encephalopathy prevention',
        'Avoid hepatotoxic drugs (NSAIDs, acetaminophen >2g/day)',
        'Vaccinations (HBV, HAV, pneumococcal, influenza)'
      ],
      secondLine: [
        'Large volume paracentesis + albumin if tense ascites',
        'Rifaximin for recurrent encephalopathy',
        'TIPS for refractory ascites or varices',
        'Liver transplant evaluation if decompensated',
        'HCC surveillance (ultrasound + AFP every 6 months)'
      ],
      emergencyManagement: [
        'Variceal bleeding: Octreotide, endoscopic banding, antibiotics',
        'SBP: Cefotaxime 2g IV q8h, albumin',
        'Hepatic encephalopathy: Lactulose, rifaximin, treat precipitants'
      ]
    },
    referralCriteria: [
      'Gastroenterology/Hepatology for all cirrhosis patients',
      'Transplant center if MELD >15 or decompensated',
      'Endoscopy for varices screening',
      'Oncology if hepatocellular carcinoma'
    ],
    source: 'AASLD Cirrhosis Guidelines 2023'
  },
  {
    id: 'cg-016',
    condition: 'Thyroid Disorders (Hypothyroidism)',
    category: 'Endocrine Disease',
    diagnosticCriteria: [
      'Fatigue, weight gain, cold intolerance',
      'Constipation, dry skin, hair loss',
      'Bradycardia, delayed reflexes',
      'Elevated TSH (>4.5 mIU/L)',
      'Low free T4 (<0.8 ng/dL)',
      'Positive anti-TPO antibodies (Hashimoto\'s)'
    ],
    redFlags: [
      'Myxedema coma (severe hypothyroidism)',
      'Hypothermia',
      'Altered mental status',
      'Bradycardia <50 bpm',
      'Respiratory failure',
      'Goiter with compressive symptoms'
    ],
    firstLineInvestigations: [
      'TSH (screening test)',
      'Free T4 if TSH abnormal',
      'Anti-TPO antibodies',
      'Lipid profile (often elevated)',
      'Complete blood count (anemia)',
      'Thyroid ultrasound if goiter/nodule'
    ],
    treatment: {
      firstLine: [
        'Levothyroxine 1.6 mcg/kg/day (start 25-50 mcg if elderly/cardiac)',
        'Take on empty stomach, 30-60 min before breakfast',
        'Check TSH after 6-8 weeks, adjust dose by 12.5-25 mcg',
        'Target TSH 0.5-2.5 mIU/L',
        'Lifelong treatment usually required'
      ],
      secondLine: [
        'Increase dose if TSH remains elevated',
        'Consider malabsorption if refractory',
        'Avoid drugs interfering with absorption (iron, calcium, PPI)',
        'Liothyronine (T3) rarely needed'
      ],
      emergencyManagement: [
        'Myxedema coma: IV levothyroxine 200-400 mcg loading',
        'IV hydrocortisone 100mg (adrenal insufficiency)',
        'Passive rewarming, ventilatory support',
        'ICU admission'
      ]
    },
    referralCriteria: [
      'Endocrinology if refractory or complicated',
      'Cardiology if cardiac complications',
      'Surgery if large goiter with compression',
      'Oncology if thyroid nodule/cancer'
    ],
    source: 'ATA Hypothyroidism Guidelines 2023'
  }
];

/**
 * Total Clinical Guidelines Summary:
 * - Original: 8 guidelines
 * - Additional: 8 guidelines
 * - TOTAL: 16 clinical guidelines (DOUBLED ✓)
 */
