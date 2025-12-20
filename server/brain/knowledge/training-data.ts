/**
 * Comprehensive Medical Training Data for BRAIN
 * Clinical guidelines, symptom-disease mappings, and treatment protocols
 */

export interface ClinicalGuideline {
  id: string;
  condition: string;
  category: string;
  diagnosticCriteria: string[];
  redFlags: string[];
  firstLineInvestigations: string[];
  treatment: {
    firstLine: string[];
    secondLine: string[];
    emergencyManagement?: string[];
  };
  referralCriteria: string[];
  source: string;
}

export interface SymptomDiseaseMapping {
  symptom: string;
  possibleDiseases: Array<{
    disease: string;
    probability: 'very_common' | 'common' | 'uncommon' | 'rare';
    associatedSymptoms: string[];
    distinguishingFeatures: string[];
  }>;
}

/**
 * Clinical Guidelines Database
 * Evidence-based protocols for common and emergency conditions
 */
export const clinicalGuidelines: ClinicalGuideline[] = [
  {
    id: 'cg-001',
    condition: 'Acute Myocardial Infarction (Heart Attack)',
    category: 'Cardiovascular Emergency',
    diagnosticCriteria: [
      'Chest pain lasting >20 minutes',
      'Pain radiating to jaw, neck, or left arm',
      'Associated with sweating, nausea, or shortness of breath',
      'ECG changes: ST elevation or new LBBB',
      'Elevated cardiac biomarkers (Troponin)'
    ],
    redFlags: [
      'Crushing chest pain',
      'Severe dyspnea',
      'Hemodynamic instability',
      'Arrhythmias',
      'Cardiogenic shock'
    ],
    firstLineInvestigations: [
      'ECG (within 10 minutes)',
      'Cardiac biomarkers (Troponin I/T)',
      'Chest X-ray',
      'Complete blood count',
      'Electrolytes, BUN, creatinine'
    ],
    treatment: {
      firstLine: [
        'Aspirin 300mg chewed immediately',
        'Clopidogrel 300-600mg loading dose',
        'Morphine 2-4mg IV for pain',
        'Oxygen if SpO2 <90%',
        'Nitroglycerin sublingual'
      ],
      secondLine: [
        'Primary PCI within 90 minutes if available',
        'Thrombolysis if PCI not available within 120 minutes',
        'Beta-blocker (metoprolol)',
        'ACE inhibitor',
        'Statin (high-intensity)'
      ],
      emergencyManagement: [
        'Call emergency services immediately',
        'Transfer to cardiac catheterization lab',
        'Continuous cardiac monitoring',
        'IV access x2'
      ]
    },
    referralCriteria: [
      'All suspected MI cases require immediate cardiology referral',
      'Transfer to PCI-capable center',
      'Cardiogenic shock - ICU admission'
    ],
    source: 'ACC/AHA STEMI Guidelines 2023'
  },
  {
    id: 'cg-002',
    condition: 'Acute Stroke',
    category: 'Neurological Emergency',
    diagnosticCriteria: [
      'Sudden onset focal neurological deficit',
      'FAST positive (Face drooping, Arm weakness, Speech difficulty)',
      'Time of symptom onset known',
      'CT/MRI brain showing ischemic or hemorrhagic stroke'
    ],
    redFlags: [
      'Decreased level of consciousness',
      'Severe headache (worst ever)',
      'Seizures',
      'Rapidly progressing symptoms',
      'Bilateral symptoms'
    ],
    firstLineInvestigations: [
      'Non-contrast CT head (immediate)',
      'Blood glucose',
      'Complete blood count',
      'Coagulation profile (PT/INR, aPTT)',
      'ECG',
      'CT angiography if thrombectomy candidate'
    ],
    treatment: {
      firstLine: [
        'Protect airway if GCS <8',
        'Maintain BP <185/110 for thrombolysis candidates',
        'IV access',
        'Nothing by mouth until swallow assessment',
        'Blood glucose 140-180 mg/dL'
      ],
      secondLine: [
        'IV tPA 0.9mg/kg if within 4.5 hours and eligible',
        'Mechanical thrombectomy if large vessel occlusion within 24 hours',
        'Aspirin 300mg after hemorrhage excluded',
        'DVT prophylaxis',
        'Statin therapy'
      ],
      emergencyManagement: [
        'Activate stroke code',
        'Door-to-needle time <60 minutes',
        'Neurology consultation',
        'Stroke unit admission'
      ]
    },
    referralCriteria: [
      'All acute stroke patients to stroke center',
      'Neurosurgery if hemorrhagic stroke',
      'Rehabilitation assessment within 24-48 hours'
    ],
    source: 'AHA/ASA Stroke Guidelines 2023'
  },
  {
    id: 'cg-003',
    condition: 'Diabetic Ketoacidosis (DKA)',
    category: 'Endocrine Emergency',
    diagnosticCriteria: [
      'Blood glucose >250 mg/dL',
      'pH <7.3 or bicarbonate <18 mEq/L',
      'Positive serum or urine ketones',
      'Anion gap >10',
      'Symptoms: polyuria, polydipsia, nausea, vomiting, abdominal pain'
    ],
    redFlags: [
      'Altered mental status',
      'Severe dehydration',
      'Kussmaul respirations',
      'Hypotension',
      'Severe electrolyte abnormalities'
    ],
    firstLineInvestigations: [
      'Blood glucose (point-of-care and lab)',
      'Arterial blood gas',
      'Serum electrolytes',
      'Serum ketones or beta-hydroxybutyrate',
      'Complete blood count',
      'Urinalysis and urine ketones',
      'ECG'
    ],
    treatment: {
      firstLine: [
        'IV fluid resuscitation (0.9% saline 1L/hour initially)',
        'Regular insulin IV infusion 0.1 units/kg/hour',
        'Potassium replacement (if K+ <5.2)',
        'Monitor glucose hourly',
        'Monitor electrolytes every 2-4 hours'
      ],
      secondLine: [
        'Switch to 0.45% saline when glucose <250 mg/dL',
        'Add dextrose to IV fluids when glucose <250 mg/dL',
        'Continue insulin until anion gap closes',
        'Transition to subcutaneous insulin',
        'Identify and treat precipitating cause'
      ],
      emergencyManagement: [
        'ICU admission if severe',
        'Continuous cardiac monitoring',
        'Foley catheter for strict I/O',
        'Search for infection/precipitant'
      ]
    },
    referralCriteria: [
      'Endocrinology consultation',
      'ICU if pH <7.0 or altered mental status',
      'Diabetes education before discharge'
    ],
    source: 'ADA DKA Management Guidelines 2023'
  },
  {
    id: 'cg-004',
    condition: 'Acute Appendicitis',
    category: 'Surgical Emergency',
    diagnosticCriteria: [
      'Right lower quadrant pain',
      'Anorexia, nausea, vomiting',
      'Fever (low-grade initially)',
      'McBurney point tenderness',
      'Positive Rovsing sign',
      'Elevated WBC with left shift',
      'CT showing appendiceal inflammation'
    ],
    redFlags: [
      'Peritonitis (rigid abdomen)',
      'High fever >39°C',
      'Hypotension',
      'Severe tachycardia',
      'Signs of perforation'
    ],
    firstLineInvestigations: [
      'Complete blood count',
      'C-reactive protein',
      'Urinalysis (to exclude UTI)',
      'Pregnancy test (females of childbearing age)',
      'CT abdomen/pelvis with contrast (gold standard)',
      'Ultrasound (if pregnant or pediatric)'
    ],
    treatment: {
      firstLine: [
        'NPO (nothing by mouth)',
        'IV fluids',
        'Pain management (avoid masking peritonitis)',
        'Antiemetics if needed',
        'Surgical consultation'
      ],
      secondLine: [
        'Preoperative antibiotics (cefoxitin or cefotetan)',
        'Laparoscopic appendectomy (preferred)',
        'Open appendectomy if complicated',
        'Postoperative antibiotics if perforated'
      ],
      emergencyManagement: [
        'Urgent surgery within 24 hours',
        'Immediate surgery if peritonitis',
        'Broad-spectrum antibiotics if perforation suspected'
      ]
    },
    referralCriteria: [
      'All suspected appendicitis to general surgery',
      'Immediate surgical consultation',
      'ICU if septic'
    ],
    source: 'WSES Acute Appendicitis Guidelines 2023'
  },
  {
    id: 'cg-005',
    condition: 'Community-Acquired Pneumonia',
    category: 'Respiratory Infection',
    diagnosticCriteria: [
      'Cough with sputum production',
      'Fever, chills, rigors',
      'Pleuritic chest pain',
      'Dyspnea',
      'Crackles on auscultation',
      'Chest X-ray showing infiltrate',
      'Elevated WBC or CRP'
    ],
    redFlags: [
      'Respiratory rate >30/min',
      'SpO2 <90% on room air',
      'Confusion (new onset)',
      'Hypotension (SBP <90 mmHg)',
      'Multilobar involvement',
      'CURB-65 score ≥3'
    ],
    firstLineInvestigations: [
      'Chest X-ray (PA and lateral)',
      'Oxygen saturation',
      'Complete blood count',
      'C-reactive protein',
      'Blood cultures (if severe)',
      'Sputum culture and Gram stain',
      'Urine pneumococcal and Legionella antigens'
    ],
    treatment: {
      firstLine: [
        'Outpatient (CURB-65 0-1): Amoxicillin 1g TID or doxycycline 100mg BID',
        'Inpatient (CURB-65 2): Amoxicillin-clavulanate + macrolide',
        'Severe (CURB-65 ≥3): IV ceftriaxone + azithromycin',
        'Oxygen therapy to maintain SpO2 >90%',
        'Hydration and antipyretics'
      ],
      secondLine: [
        'Fluoroquinolone (levofloxacin) if beta-lactam allergy',
        'Add vancomycin if MRSA suspected',
        'Antiviral if influenza season',
        'Duration: 5-7 days (uncomplicated)'
      ],
      emergencyManagement: [
        'ICU admission if septic shock or respiratory failure',
        'Mechanical ventilation if needed',
        'Vasopressors for shock'
      ]
    },
    referralCriteria: [
      'Admission if CURB-65 ≥2',
      'ICU if CURB-65 ≥3 or septic shock',
      'Pulmonology if complicated or not improving'
    ],
    source: 'IDSA/ATS CAP Guidelines 2023'
  },
  {
    id: 'cg-006',
    condition: 'Acute Asthma Exacerbation',
    category: 'Respiratory Emergency',
    diagnosticCriteria: [
      'Progressive dyspnea, cough, wheeze',
      'Chest tightness',
      'Peak flow <80% predicted or personal best',
      'Accessory muscle use',
      'Prolonged expiration',
      'Decreased air entry on auscultation'
    ],
    redFlags: [
      'Silent chest (no wheeze)',
      'Cyanosis',
      'Altered mental status',
      'Inability to speak in sentences',
      'Peak flow <50% predicted',
      'SpO2 <90%',
      'Bradycardia (ominous sign)'
    ],
    firstLineInvestigations: [
      'Peak expiratory flow rate',
      'Oxygen saturation',
      'Arterial blood gas (if severe)',
      'Chest X-ray (if first episode or complications suspected)',
      'Complete blood count (if infection suspected)'
    ],
    treatment: {
      firstLine: [
        'Oxygen to maintain SpO2 94-98%',
        'Salbutamol (albuterol) nebulizer 2.5-5mg every 20min x3',
        'Ipratropium bromide nebulizer 500mcg every 20min x3',
        'Oral prednisolone 40-50mg or IV hydrocortisone 100mg',
        'Monitor peak flow and vitals'
      ],
      secondLine: [
        'IV magnesium sulfate 2g over 20min if severe',
        'Continuous salbutamol nebulization',
        'IV aminophylline loading dose (if not on theophylline)',
        'Consider IV salbutamol',
        'Heliox if available'
      ],
      emergencyManagement: [
        'ICU admission if life-threatening',
        'Prepare for intubation if deteriorating',
        'Non-invasive ventilation (CPAP/BiPAP)',
        'Mechanical ventilation as last resort'
      ]
    },
    referralCriteria: [
      'Admission if poor response to initial treatment',
      'ICU if life-threatening features',
      'Respiratory medicine follow-up within 48 hours of discharge'
    ],
    source: 'GINA Asthma Guidelines 2023'
  },
  {
    id: 'cg-007',
    condition: 'Acute Gastroenteritis',
    category: 'Gastrointestinal Infection',
    diagnosticCriteria: [
      'Diarrhea (≥3 loose stools in 24 hours)',
      'Nausea and vomiting',
      'Abdominal cramps',
      'Low-grade fever',
      'Recent food exposure or sick contacts',
      'Duration <14 days'
    ],
    redFlags: [
      'Severe dehydration',
      'Bloody diarrhea',
      'High fever >39°C',
      'Severe abdominal pain',
      'Altered mental status',
      'Age >65 or <5 years with severe symptoms',
      'Immunocompromised'
    ],
    firstLineInvestigations: [
      'Clinical assessment of dehydration',
      'Electrolytes if severe dehydration',
      'Stool culture if bloody diarrhea or fever',
      'Stool ova and parasites if travel history',
      'C. difficile toxin if recent antibiotics'
    ],
    treatment: {
      firstLine: [
        'Oral rehydration solution (ORS)',
        'Continue regular diet as tolerated',
        'Avoid antidiarrheals if bloody diarrhea or fever',
        'Zinc supplementation in children',
        'Probiotics may help'
      ],
      secondLine: [
        'IV fluids if unable to tolerate oral',
        'Loperamide if non-bloody diarrhea and no fever',
        'Antibiotics only if specific pathogen identified',
        'Ondansetron for severe vomiting',
        'Electrolyte replacement'
      ],
      emergencyManagement: [
        'Hospital admission if severe dehydration',
        'IV rehydration',
        'Monitor electrolytes'
      ]
    },
    referralCriteria: [
      'Admission if severe dehydration',
      'Gastroenterology if persistent symptoms >7 days',
      'Infectious disease if suspected outbreak'
    ],
    source: 'WHO Diarrhea Treatment Guidelines 2023'
  },
  {
    id: 'cg-008',
    condition: 'Urinary Tract Infection (UTI)',
    category: 'Genitourinary Infection',
    diagnosticCriteria: [
      'Dysuria (painful urination)',
      'Urinary frequency and urgency',
      'Suprapubic pain',
      'Hematuria',
      'Cloudy or foul-smelling urine',
      'Positive urinalysis (WBC, nitrites, leukocyte esterase)',
      'Positive urine culture (>10^5 CFU/mL)'
    ],
    redFlags: [
      'Fever >38°C (suggests pyelonephritis)',
      'Flank pain',
      'Nausea and vomiting',
      'Sepsis',
      'Pregnancy',
      'Male patient (complicated UTI)',
      'Recurrent UTIs'
    ],
    firstLineInvestigations: [
      'Urinalysis with microscopy',
      'Urine culture and sensitivity',
      'Pregnancy test (females of childbearing age)',
      'Blood cultures if febrile',
      'Renal ultrasound if pyelonephritis or recurrent'
    ],
    treatment: {
      firstLine: [
        'Uncomplicated cystitis: Nitrofurantoin 100mg BID x5 days',
        'Alternative: Trimethoprim-sulfamethoxazole DS BID x3 days',
        'Alternative: Fosfomycin 3g single dose',
        'Increase fluid intake',
        'Phenazopyridine for dysuria (max 2 days)'
      ],
      secondLine: [
        'Pyelonephritis: Ciprofloxacin 500mg BID x7 days',
        'Severe pyelonephritis: IV ceftriaxone then oral switch',
        'Complicated UTI: 7-14 days treatment',
        'Adjust antibiotics based on culture results'
      ],
      emergencyManagement: [
        'Hospital admission if urosepsis',
        'IV antibiotics and fluids',
        'Urology consultation if obstruction'
      ]
    },
    referralCriteria: [
      'Urology if recurrent UTIs (>2 in 6 months)',
      'Admission if pyelonephritis with sepsis',
      'Nephrology if renal impairment'
    ],
    source: 'IDSA UTI Guidelines 2023'
  },
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
 * Symptom-Disease Mapping Database
 * Probabilistic relationships between symptoms and diseases
 */
export const symptomDiseaseMappings: SymptomDiseaseMapping[] = [
  {
    symptom: 'Chest Pain',
    possibleDiseases: [
      {
        disease: 'Acute Myocardial Infarction',
        probability: 'common',
        associatedSymptoms: ['dyspnea', 'diaphoresis', 'nausea', 'radiation to arm/jaw'],
        distinguishingFeatures: ['Crushing quality', 'Duration >20 minutes', 'Not relieved by rest', 'ECG changes']
      },
      {
        disease: 'Pulmonary Embolism',
        probability: 'uncommon',
        associatedSymptoms: ['dyspnea', 'tachycardia', 'hemoptysis', 'leg swelling'],
        distinguishingFeatures: ['Pleuritic pain', 'Sudden onset', 'Risk factors (DVT, surgery, immobility)']
      },
      {
        disease: 'Aortic Dissection',
        probability: 'rare',
        associatedSymptoms: ['tearing back pain', 'pulse differential', 'syncope'],
        distinguishingFeatures: ['Tearing/ripping quality', 'Maximal at onset', 'Radiation to back']
      },
      {
        disease: 'Pneumonia',
        probability: 'common',
        associatedSymptoms: ['cough', 'fever', 'sputum production', 'dyspnea'],
        distinguishingFeatures: ['Pleuritic pain', 'Productive cough', 'Crackles on exam']
      },
      {
        disease: 'GERD/Esophagitis',
        probability: 'very_common',
        associatedSymptoms: ['heartburn', 'regurgitation', 'dysphagia'],
        distinguishingFeatures: ['Burning quality', 'Worse after meals', 'Relieved by antacids']
      },
      {
        disease: 'Costochondritis',
        probability: 'common',
        associatedSymptoms: ['chest wall tenderness'],
        distinguishingFeatures: ['Reproducible with palpation', 'Sharp pain', 'Worse with movement']
      },
      {
        disease: 'Panic Attack',
        probability: 'common',
        associatedSymptoms: ['palpitations', 'trembling', 'fear of dying', 'hyperventilation'],
        distinguishingFeatures: ['Sudden onset', 'Peak within 10 minutes', 'Associated anxiety']
      },
      {
        disease: 'Pericarditis',
        probability: 'uncommon',
        associatedSymptoms: ['pleuritic chest pain', 'fever', 'pericardial friction rub'],
        distinguishingFeatures: ['Sharp pain', 'Better sitting forward', 'Worse lying flat', 'ECG: diffuse ST elevation']
      },
      {
        disease: 'Pneumothorax',
        probability: 'uncommon',
        associatedSymptoms: ['sudden dyspnea', 'tachycardia'],
        distinguishingFeatures: ['Sudden onset', 'Decreased breath sounds', 'Hyperresonance', 'Tall thin males']
      },
      {
        disease: 'Esophageal Spasm',
        probability: 'uncommon',
        associatedSymptoms: ['dysphagia', 'regurgitation'],
        distinguishingFeatures: ['Squeezing pain', 'Can mimic MI', 'Relieved by nitroglycerin', 'Manometry diagnostic']
      },
      {
        disease: 'Herpes Zoster (Shingles)',
        probability: 'uncommon',
        associatedSymptoms: ['dermatomal rash', 'vesicles', 'burning pain'],
        distinguishingFeatures: ['Unilateral', 'Dermatomal distribution', 'Precedes rash by 1-5 days']
      },
      {
        disease: 'Myocarditis',
        probability: 'rare',
        associatedSymptoms: ['dyspnea', 'fatigue', 'palpitations', 'recent viral illness'],
        distinguishingFeatures: ['Recent infection', 'Elevated troponin', 'ECG changes', 'Young patients']
      }
    ]
  },
  {
    symptom: 'Fever',
    possibleDiseases: [
      {
        disease: 'Viral Upper Respiratory Infection',
        probability: 'very_common',
        associatedSymptoms: ['cough', 'rhinorrhea', 'sore throat', 'myalgia'],
        distinguishingFeatures: ['Low-grade fever', 'Self-limited', 'Sick contacts']
      },
      {
        disease: 'Pneumonia',
        probability: 'common',
        associatedSymptoms: ['cough', 'dyspnea', 'chest pain', 'sputum'],
        distinguishingFeatures: ['High fever', 'Productive cough', 'Crackles', 'Infiltrate on CXR']
      },
      {
        disease: 'Urinary Tract Infection',
        probability: 'common',
        associatedSymptoms: ['dysuria', 'frequency', 'urgency', 'suprapubic pain'],
        distinguishingFeatures: ['Fever suggests pyelonephritis', 'Flank pain', 'Positive urinalysis']
      },
      {
        disease: 'Malaria',
        probability: 'uncommon',
        associatedSymptoms: ['chills', 'sweating', 'headache', 'myalgia'],
        distinguishingFeatures: ['Cyclical fever', 'Travel to endemic area', 'Positive blood smear']
      },
      {
        disease: 'Appendicitis',
        probability: 'uncommon',
        associatedSymptoms: ['abdominal pain', 'nausea', 'vomiting', 'anorexia'],
        distinguishingFeatures: ['RLQ pain', 'McBurney point tenderness', 'Elevated WBC']
      },
      {
        disease: 'Sepsis',
        probability: 'uncommon',
        associatedSymptoms: ['hypotension', 'tachycardia', 'altered mental status'],
        distinguishingFeatures: ['High or low temperature', 'Organ dysfunction', 'Source of infection']
      }
    ]
  },
  {
    symptom: 'Headache',
    possibleDiseases: [
      {
        disease: 'Tension Headache',
        probability: 'very_common',
        associatedSymptoms: ['neck stiffness', 'stress'],
        distinguishingFeatures: ['Bilateral', 'Band-like pressure', 'Gradual onset', 'No aura']
      },
      {
        disease: 'Migraine',
        probability: 'common',
        associatedSymptoms: ['nausea', 'photophobia', 'phonophobia', 'aura'],
        distinguishingFeatures: ['Unilateral', 'Throbbing', '4-72 hours', 'Aura in 30%']
      },
      {
        disease: 'Subarachnoid Hemorrhage',
        probability: 'rare',
        associatedSymptoms: ['thunderclap onset', 'neck stiffness', 'vomiting', 'altered consciousness'],
        distinguishingFeatures: ['Worst headache of life', 'Sudden onset', 'Nuchal rigidity']
      },
      {
        disease: 'Meningitis',
        probability: 'uncommon',
        associatedSymptoms: ['fever', 'neck stiffness', 'photophobia', 'altered mental status'],
        distinguishingFeatures: ['Fever + headache + stiff neck', 'Positive Kernig/Brudzinski', 'CSF pleocytosis']
      },
      {
        disease: 'Temporal Arteritis',
        probability: 'uncommon',
        associatedSymptoms: ['jaw claudication', 'vision changes', 'scalp tenderness'],
        distinguishingFeatures: ['Age >50', 'Temporal artery tenderness', 'Elevated ESR']
      },
      {
        disease: 'Sinusitis',
        probability: 'common',
        associatedSymptoms: ['facial pain', 'nasal congestion', 'purulent discharge'],
        distinguishingFeatures: ['Facial pressure', 'Worse bending forward', 'Sinus tenderness']
      }
    ]
  },
  {
    symptom: 'Abdominal Pain',
    possibleDiseases: [
      {
        disease: 'Gastroenteritis',
        probability: 'very_common',
        associatedSymptoms: ['diarrhea', 'vomiting', 'nausea', 'cramping'],
        distinguishingFeatures: ['Diffuse cramping', 'Diarrhea', 'Self-limited', 'Food exposure']
      },
      {
        disease: 'Appendicitis',
        probability: 'common',
        associatedSymptoms: ['anorexia', 'nausea', 'vomiting', 'fever'],
        distinguishingFeatures: ['RLQ pain', 'Migration from periumbilical', 'Rebound tenderness']
      },
      {
        disease: 'Cholecystitis',
        probability: 'common',
        associatedSymptoms: ['nausea', 'vomiting', 'fever', 'RUQ pain'],
        distinguishingFeatures: ['RUQ pain', 'Murphy sign', 'Post-prandial', 'Ultrasound findings']
      },
      {
        disease: 'Pancreatitis',
        probability: 'uncommon',
        associatedSymptoms: ['nausea', 'vomiting', 'back pain'],
        distinguishingFeatures: ['Epigastric pain radiating to back', 'Elevated lipase', 'Alcohol/gallstones']
      },
      {
        disease: 'Bowel Obstruction',
        probability: 'uncommon',
        associatedSymptoms: ['vomiting', 'constipation', 'distension'],
        distinguishingFeatures: ['Crampy pain', 'Vomiting', 'No flatus', 'Distension', 'Tinkling bowel sounds']
      },
      {
        disease: 'Ectopic Pregnancy',
        probability: 'uncommon',
        associatedSymptoms: ['vaginal bleeding', 'amenorrhea', 'dizziness'],
        distinguishingFeatures: ['Females of childbearing age', 'Positive pregnancy test', 'Adnexal mass']
      }
    ]
  },
  {
    symptom: 'Dyspnea (Shortness of Breath)',
    possibleDiseases: [
      {
        disease: 'Asthma Exacerbation',
        probability: 'common',
        associatedSymptoms: ['wheezing', 'cough', 'chest tightness'],
        distinguishingFeatures: ['Expiratory wheeze', 'Triggers', 'Reversible', 'Peak flow decreased']
      },
      {
        disease: 'COPD Exacerbation',
        probability: 'common',
        associatedSymptoms: ['cough', 'sputum', 'wheezing'],
        distinguishingFeatures: ['Smoking history', 'Barrel chest', 'Prolonged expiration', 'Hyperinflation on CXR']
      },
      {
        disease: 'Congestive Heart Failure',
        probability: 'common',
        associatedSymptoms: ['orthopnea', 'PND', 'edema', 'fatigue'],
        distinguishingFeatures: ['Orthopnea', 'Crackles', 'Elevated JVP', 'Edema', 'BNP elevated']
      },
      {
        disease: 'Pneumonia',
        probability: 'common',
        associatedSymptoms: ['fever', 'cough', 'sputum', 'chest pain'],
        distinguishingFeatures: ['Fever', 'Productive cough', 'Crackles', 'Infiltrate on CXR']
      },
      {
        disease: 'Pulmonary Embolism',
        probability: 'uncommon',
        associatedSymptoms: ['chest pain', 'tachycardia', 'hemoptysis'],
        distinguishingFeatures: ['Sudden onset', 'Pleuritic pain', 'Risk factors', 'D-dimer elevated']
      },
      {
        disease: 'Pneumothorax',
        probability: 'uncommon',
        associatedSymptoms: ['chest pain', 'tachycardia'],
        distinguishingFeatures: ['Sudden onset', 'Decreased breath sounds', 'Hyperresonance', 'CXR findings']
      },
      {
        disease: 'Anemia',
        probability: 'common',
        associatedSymptoms: ['fatigue', 'pallor', 'tachycardia'],
        distinguishingFeatures: ['Exertional dyspnea', 'Pallor', 'Low hemoglobin']
      }
    ]
  },
  {
    symptom: 'Fatigue',
    possibleDiseases: [
      {
        disease: 'Anemia',
        probability: 'very_common',
        associatedSymptoms: ['pallor', 'dyspnea on exertion', 'tachycardia', 'dizziness'],
        distinguishingFeatures: ['Low hemoglobin', 'Pale conjunctiva', 'Koilonychia if iron deficiency']
      },
      {
        disease: 'Hypothyroidism',
        probability: 'common',
        associatedSymptoms: ['weight gain', 'cold intolerance', 'constipation', 'dry skin'],
        distinguishingFeatures: ['Elevated TSH', 'Low T4', 'Delayed reflexes', 'Bradycardia']
      },
      {
        disease: 'Depression',
        probability: 'common',
        associatedSymptoms: ['anhedonia', 'sleep disturbance', 'appetite change', 'poor concentration'],
        distinguishingFeatures: ['PHQ-9 score', 'Duration >2 weeks', 'Functional impairment']
      },
      {
        disease: 'Chronic Kidney Disease',
        probability: 'common',
        associatedSymptoms: ['nausea', 'edema', 'uremia', 'pruritus'],
        distinguishingFeatures: ['Elevated creatinine', 'Low eGFR', 'Proteinuria']
      },
      {
        disease: 'Diabetes Mellitus',
        probability: 'common',
        associatedSymptoms: ['polyuria', 'polydipsia', 'weight loss', 'blurred vision'],
        distinguishingFeatures: ['Elevated glucose', 'HbA1c ≥6.5%', 'Glycosuria']
      },
      {
        disease: 'Chronic Fatigue Syndrome',
        probability: 'uncommon',
        associatedSymptoms: ['post-exertional malaise', 'unrefreshing sleep', 'cognitive dysfunction'],
        distinguishingFeatures: ['Duration >6 months', 'Diagnosis of exclusion']
      },
      {
        disease: 'Obstructive Sleep Apnea',
        probability: 'common',
        associatedSymptoms: ['snoring', 'daytime sleepiness', 'morning headache', 'obesity'],
        distinguishingFeatures: ['Epworth score >10', 'Witnessed apneas', 'Polysomnography']
      },
      {
        disease: 'Vitamin D Deficiency',
        probability: 'very_common',
        associatedSymptoms: ['muscle weakness', 'bone pain', 'mood changes'],
        distinguishingFeatures: ['25-OH vitamin D <20 ng/mL', 'Common in Middle East despite sun']
      },
      {
        disease: 'Liver Cirrhosis',
        probability: 'uncommon',
        associatedSymptoms: ['jaundice', 'ascites', 'spider nevi', 'easy bruising'],
        distinguishingFeatures: ['Elevated liver enzymes', 'Low albumin', 'Prolonged PT/INR']
      },
      {
        disease: 'Tuberculosis',
        probability: 'uncommon',
        associatedSymptoms: ['chronic cough', 'night sweats', 'weight loss', 'fever'],
        distinguishingFeatures: ['Positive sputum AFB', 'Cavitary lesions on CXR']
      },
      {
        disease: 'Malignancy',
        probability: 'uncommon',
        associatedSymptoms: ['weight loss', 'night sweats', 'lymphadenopathy'],
        distinguishingFeatures: ['Constitutional symptoms', 'Age >50', 'Red flag features']
      },
      {
        disease: 'Heart Failure',
        probability: 'common',
        associatedSymptoms: ['dyspnea', 'orthopnea', 'edema', 'PND'],
        distinguishingFeatures: ['Elevated BNP', 'Reduced ejection fraction', 'Crackles']
      }
    ]
  },
  {
    symptom: 'Dizziness/Vertigo',
    possibleDiseases: [
      {
        disease: 'Benign Paroxysmal Positional Vertigo (BPPV)',
        probability: 'very_common',
        associatedSymptoms: ['nystagmus', 'nausea'],
        distinguishingFeatures: ['Triggered by head movement', 'Dix-Hallpike positive', 'Episodes <1 minute']
      },
      {
        disease: 'Vestibular Neuritis',
        probability: 'common',
        associatedSymptoms: ['nausea', 'vomiting', 'imbalance'],
        distinguishingFeatures: ['Sudden onset', 'Continuous vertigo', 'No hearing loss', 'Viral prodrome']
      },
      {
        disease: 'Meniere\'s Disease',
        probability: 'uncommon',
        associatedSymptoms: ['tinnitus', 'hearing loss', 'aural fullness'],
        distinguishingFeatures: ['Episodic vertigo >20 min', 'Fluctuating hearing loss', 'Low-frequency']
      },
      {
        disease: 'Orthostatic Hypotension',
        probability: 'common',
        associatedSymptoms: ['lightheadedness on standing', 'syncope', 'blurred vision'],
        distinguishingFeatures: ['BP drop >20/10 mmHg on standing', 'Elderly', 'Medications']
      },
      {
        disease: 'Anemia',
        probability: 'common',
        associatedSymptoms: ['fatigue', 'pallor', 'dyspnea'],
        distinguishingFeatures: ['Low hemoglobin', 'Pale conjunctiva']
      },
      {
        disease: 'Hypoglycemia',
        probability: 'common',
        associatedSymptoms: ['sweating', 'tremor', 'palpitations', 'confusion'],
        distinguishingFeatures: ['Blood glucose <70 mg/dL', 'Diabetic on insulin/sulfonylurea']
      },
      {
        disease: 'Stroke/TIA',
        probability: 'uncommon',
        associatedSymptoms: ['focal neurological deficit', 'headache', 'ataxia'],
        distinguishingFeatures: ['FAST positive', 'Sudden onset', 'Risk factors (HTN, AF, DM)']
      },
      {
        disease: 'Cardiac Arrhythmia',
        probability: 'uncommon',
        associatedSymptoms: ['palpitations', 'chest discomfort', 'syncope'],
        distinguishingFeatures: ['Irregular pulse', 'ECG abnormalities', 'Structural heart disease']
      },
      {
        disease: 'Anxiety/Panic Disorder',
        probability: 'common',
        associatedSymptoms: ['palpitations', 'trembling', 'fear', 'hyperventilation'],
        distinguishingFeatures: ['Episodic', 'Triggers', 'Normal physical exam']
      },
      {
        disease: 'Medication Side Effect',
        probability: 'common',
        associatedSymptoms: ['varies by drug'],
        distinguishingFeatures: ['Recent medication change', 'Antihypertensives, sedatives common']
      },
      {
        disease: 'Acoustic Neuroma',
        probability: 'rare',
        associatedSymptoms: ['unilateral hearing loss', 'tinnitus', 'facial numbness'],
        distinguishingFeatures: ['Gradual onset', 'MRI showing cerebellopontine angle mass']
      },
      {
        disease: 'Multiple Sclerosis',
        probability: 'rare',
        associatedSymptoms: ['visual disturbances', 'weakness', 'sensory changes'],
        distinguishingFeatures: ['Young adults', 'Relapsing-remitting', 'MRI lesions']
      }
    ]
  },
  {
    symptom: 'Back Pain',
    possibleDiseases: [
      {
        disease: 'Mechanical Low Back Pain',
        probability: 'very_common',
        associatedSymptoms: ['muscle spasm', 'stiffness'],
        distinguishingFeatures: ['Worse with activity', 'Better with rest', 'No red flags']
      },
      {
        disease: 'Lumbar Disc Herniation',
        probability: 'common',
        associatedSymptoms: ['radicular pain (sciatica)', 'numbness', 'weakness'],
        distinguishingFeatures: ['Positive straight leg raise', 'Dermatomal distribution', 'MRI confirmation']
      },
      {
        disease: 'Spinal Stenosis',
        probability: 'common',
        associatedSymptoms: ['neurogenic claudication', 'bilateral leg pain'],
        distinguishingFeatures: ['Age >60', 'Better with forward flexion', 'MRI showing canal narrowing']
      },
      {
        disease: 'Compression Fracture',
        probability: 'uncommon',
        associatedSymptoms: ['acute onset', 'point tenderness'],
        distinguishingFeatures: ['Osteoporosis', 'Trauma', 'X-ray showing wedge deformity']
      },
      {
        disease: 'Ankylosing Spondylitis',
        probability: 'uncommon',
        associatedSymptoms: ['morning stiffness >30 min', 'improves with exercise'],
        distinguishingFeatures: ['Young male', 'Inflammatory back pain', 'HLA-B27 positive', 'Sacroiliitis']
      },
      {
        disease: 'Kidney Stone',
        probability: 'common',
        associatedSymptoms: ['flank pain', 'hematuria', 'nausea'],
        distinguishingFeatures: ['Colicky pain', 'Radiates to groin', 'CT showing stone']
      },
      {
        disease: 'Pyelonephritis',
        probability: 'uncommon',
        associatedSymptoms: ['fever', 'dysuria', 'CVA tenderness'],
        distinguishingFeatures: ['Fever', 'Positive urine culture', 'Flank pain']
      },
      {
        disease: 'Abdominal Aortic Aneurysm',
        probability: 'rare',
        associatedSymptoms: ['pulsatile abdominal mass', 'syncope if ruptured'],
        distinguishingFeatures: ['Age >60', 'Smoking', 'Hypotension if ruptured', 'Ultrasound >3cm']
      },
      {
        disease: 'Spinal Infection (Osteomyelitis/Epidural Abscess)',
        probability: 'rare',
        associatedSymptoms: ['fever', 'neurological deficit', 'night pain'],
        distinguishingFeatures: ['Fever', 'Elevated CRP/ESR', 'MRI showing infection']
      },
      {
        disease: 'Malignancy (Metastases, Myeloma)',
        probability: 'rare',
        associatedSymptoms: ['weight loss', 'night pain', 'neurological symptoms'],
        distinguishingFeatures: ['Age >50', 'History of cancer', 'Night pain', 'MRI/CT showing lesion']
      },
      {
        disease: 'Cauda Equina Syndrome',
        probability: 'rare',
        associatedSymptoms: ['saddle anesthesia', 'bowel/bladder dysfunction', 'bilateral leg weakness'],
        distinguishingFeatures: ['Surgical emergency', 'MRI showing massive disc herniation']
      },
      {
        disease: 'Fibromyalgia',
        probability: 'common',
        associatedSymptoms: ['widespread pain', 'fatigue', 'sleep disturbance'],
        distinguishingFeatures: ['Tender points', 'Chronic >3 months', 'Diagnosis of exclusion']
      }
    ]
  },
  {
    symptom: 'Joint Pain (Arthralgia)',
    possibleDiseases: [
      {
        disease: 'Osteoarthritis',
        probability: 'very_common',
        associatedSymptoms: ['stiffness <30 min', 'crepitus', 'bony enlargement'],
        distinguishingFeatures: ['Age >50', 'Weight-bearing joints', 'Worse with activity', 'X-ray showing joint space narrowing']
      },
      {
        disease: 'Rheumatoid Arthritis',
        probability: 'common',
        associatedSymptoms: ['morning stiffness >1 hour', 'symmetrical', 'swelling'],
        distinguishingFeatures: ['Small joints (MCP, PIP)', 'Positive RF/anti-CCP', 'Erosions on X-ray']
      },
      {
        disease: 'Gout',
        probability: 'common',
        associatedSymptoms: ['acute monoarthritis', 'erythema', 'severe pain'],
        distinguishingFeatures: ['First MTP joint', 'Elevated uric acid', 'Crystals on joint aspiration']
      },
      {
        disease: 'Septic Arthritis',
        probability: 'uncommon',
        associatedSymptoms: ['fever', 'monoarthritis', 'inability to bear weight'],
        distinguishingFeatures: ['Fever', 'WBC >50,000 in synovial fluid', 'Positive culture']
      },
      {
        disease: 'Reactive Arthritis',
        probability: 'uncommon',
        associatedSymptoms: ['urethritis', 'conjunctivitis', 'diarrhea'],
        distinguishingFeatures: ['Post-infectious', 'Asymmetric oligoarthritis', 'HLA-B27']
      },
      {
        disease: 'Psoriatic Arthritis',
        probability: 'uncommon',
        associatedSymptoms: ['psoriasis', 'nail changes', 'dactylitis'],
        distinguishingFeatures: ['Psoriatic plaques', 'DIP involvement', 'Negative RF']
      },
      {
        disease: 'Systemic Lupus Erythematosus (SLE)',
        probability: 'uncommon',
        associatedSymptoms: ['malar rash', 'photosensitivity', 'serositis'],
        distinguishingFeatures: ['Young female', 'Positive ANA', 'Multi-system involvement']
      },
      {
        disease: 'Viral Arthritis',
        probability: 'common',
        associatedSymptoms: ['fever', 'rash', 'myalgia'],
        distinguishingFeatures: ['Self-limited', 'Recent viral illness', 'Polyarticular']
      },
      {
        disease: 'Lyme Disease',
        probability: 'rare',
        associatedSymptoms: ['erythema migrans', 'fever', 'fatigue'],
        distinguishingFeatures: ['Tick exposure', 'Migratory arthritis', 'Positive Lyme serology']
      },
      {
        disease: 'Polymyalgia Rheumatica',
        probability: 'uncommon',
        associatedSymptoms: ['shoulder/hip girdle pain', 'morning stiffness', 'fatigue'],
        distinguishingFeatures: ['Age >50', 'Elevated ESR/CRP', 'Rapid response to steroids']
      },
      {
        disease: 'Fibromyalgia',
        probability: 'common',
        associatedSymptoms: ['widespread pain', 'fatigue', 'sleep disturbance'],
        distinguishingFeatures: ['Tender points', 'Normal labs', 'Chronic >3 months']
      },
      {
        disease: 'Tendinitis/Bursitis',
        probability: 'common',
        associatedSymptoms: ['localized pain', 'swelling'],
        distinguishingFeatures: ['Overuse', 'Point tenderness', 'Worse with specific movements']
      }
    ]
  },
  {
    symptom: 'Skin Rash',
    possibleDiseases: [
      {
        disease: 'Eczema (Atopic Dermatitis)',
        probability: 'very_common',
        associatedSymptoms: ['pruritus', 'dry skin', 'lichenification'],
        distinguishingFeatures: ['Flexural distribution', 'Personal/family atopy', 'Chronic relapsing']
      },
      {
        disease: 'Psoriasis',
        probability: 'common',
        associatedSymptoms: ['silvery scales', 'nail changes', 'joint pain'],
        distinguishingFeatures: ['Well-demarcated plaques', 'Extensor surfaces', 'Auspitz sign']
      },
      {
        disease: 'Urticaria (Hives)',
        probability: 'common',
        associatedSymptoms: ['pruritus', 'wheals', 'angioedema'],
        distinguishingFeatures: ['Transient (<24h per lesion)', 'Blanching', 'Triggers (food, drugs)']
      },
      {
        disease: 'Contact Dermatitis',
        probability: 'common',
        associatedSymptoms: ['pruritus', 'vesicles', 'oozing'],
        distinguishingFeatures: ['Exposure history', 'Distribution matches contact', 'Patch test positive']
      },
      {
        disease: 'Fungal Infection (Tinea)',
        probability: 'very_common',
        associatedSymptoms: ['pruritus', 'scaling', 'central clearing'],
        distinguishingFeatures: ['Annular lesions', 'KOH positive', 'Warm/moist areas']
      },
      {
        disease: 'Scabies',
        probability: 'common',
        associatedSymptoms: ['intense pruritus (worse at night)', 'burrows'],
        distinguishingFeatures: ['Web spaces', 'Family members affected', 'Microscopy showing mites']
      },
      {
        disease: 'Drug Eruption',
        probability: 'common',
        associatedSymptoms: ['varies (maculopapular, urticarial)'],
        distinguishingFeatures: ['Recent medication', 'Timing (7-14 days)', 'Resolves with cessation']
      },
      {
        disease: 'Viral Exanthem',
        probability: 'common',
        associatedSymptoms: ['fever', 'malaise', 'lymphadenopathy'],
        distinguishingFeatures: ['Self-limited', 'Viral prodrome', 'Maculopapular']
      },
      {
        disease: 'Cellulitis',
        probability: 'common',
        associatedSymptoms: ['erythema', 'warmth', 'swelling', 'pain'],
        distinguishingFeatures: ['Unilateral', 'Fever', 'Elevated WBC', 'Responds to antibiotics']
      },
      {
        disease: 'Herpes Zoster (Shingles)',
        probability: 'common',
        associatedSymptoms: ['pain', 'vesicles', 'dermatomal distribution'],
        distinguishingFeatures: ['Unilateral', 'Dermatomal', 'Painful vesicles', 'Age >50']
      },
      {
        disease: 'Stevens-Johnson Syndrome/TEN',
        probability: 'rare',
        associatedSymptoms: ['fever', 'mucosal involvement', 'skin detachment'],
        distinguishingFeatures: ['Drug-induced', 'Nikolsky sign', 'ICU admission required']
      },
      {
        disease: 'Cutaneous Lupus',
        probability: 'uncommon',
        associatedSymptoms: ['photosensitivity', 'malar rash', 'discoid lesions'],
        distinguishingFeatures: ['Butterfly rash', 'Positive ANA', 'Biopsy showing interface dermatitis']
      },
      {
        disease: 'Cutaneous Leishmaniasis',
        probability: 'common',
        associatedSymptoms: ['painless ulcer', 'raised borders'],
        distinguishingFeatures: ['Endemic to Iraq', 'Sandfly bite history', 'Slit-skin smear positive']
      }
    ]
  }
];

/**
 * Emergency Recognition Patterns
 * Critical conditions requiring immediate intervention
 */
export const emergencyPatterns = [
  {
    pattern: 'Cardiac Arrest',
    criteria: ['unresponsive', 'no pulse', 'not breathing'],
    action: 'Immediate CPR and defibrillation',
    timeframe: 'Seconds'
  },
  {
    pattern: 'STEMI (Heart Attack)',
    criteria: ['chest pain >20min', 'ST elevation on ECG', 'elevated troponin'],
    action: 'Door-to-balloon <90 minutes',
    timeframe: 'Minutes'
  },
  {
    pattern: 'Stroke',
    criteria: ['FAST positive', 'sudden neurological deficit', 'within 4.5 hours'],
    action: 'Door-to-needle <60 minutes for tPA',
    timeframe: 'Minutes'
  },
  {
    pattern: 'Septic Shock',
    criteria: ['hypotension', 'lactate >2', 'suspected infection', 'organ dysfunction'],
    action: 'Antibiotics within 1 hour, fluid resuscitation',
    timeframe: 'Hour'
  },
  {
    pattern: 'Anaphylaxis',
    criteria: ['acute onset', 'skin/mucosal changes', 'respiratory compromise OR hypotension'],
    action: 'IM epinephrine immediately',
    timeframe: 'Minutes'
  },
  {
    pattern: 'Acute Abdomen',
    criteria: ['peritonitis', 'rigid abdomen', 'rebound tenderness'],
    action: 'Surgical consultation, NPO, IV fluids',
    timeframe: 'Hours'
  }
];

/**
 * Pediatric-Specific Guidelines
 */
export const pediatricGuidelines = [
  {
    condition: 'Febrile Seizure',
    ageRange: '6 months - 5 years',
    criteria: ['Fever >38°C', 'Seizure <15 minutes', 'No CNS infection'],
    management: ['Reassurance', 'Antipyretics', 'Safety education'],
    redFlags: ['Age <6 months or >5 years', 'Prolonged seizure', 'Focal seizure', 'Multiple seizures']
  },
  {
    condition: 'Bronchiolitis',
    ageRange: '<2 years',
    criteria: ['Viral URTI prodrome', 'Wheezing', 'Crackles', 'Increased work of breathing'],
    management: ['Supportive care', 'Hydration', 'Oxygen if needed', 'No bronchodilators'],
    redFlags: ['Apnea', 'Severe respiratory distress', 'Dehydration', 'Age <3 months']
  }
];

/**
 * Geriatric-Specific Considerations
 */
export const geriatricConsiderations = [
  {
    consideration: 'Atypical Presentations',
    examples: ['MI without chest pain', 'Pneumonia without fever', 'Appendicitis without RLQ pain'],
    approach: 'Lower threshold for investigation, consider broader differentials'
  },
  {
    consideration: 'Polypharmacy',
    risks: ['Drug interactions', 'Adverse effects', 'Falls', 'Delirium'],
    approach: 'Medication reconciliation, Beers Criteria, deprescribing'
  },
  {
    consideration: 'Frailty',
    impact: ['Increased mortality', 'Longer recovery', 'Higher complication rates'],
    approach: 'Comprehensive geriatric assessment, goals of care discussion'
  }
];

/**
 * Iraqi Pediatric Vaccination Schedule
 * Based on WHO recommendations and Iraq Ministry of Health guidelines
 */
export const iraqiVaccinationSchedule = [
  {
    age: 'Birth',
    vaccines: ['BCG (Tuberculosis)', 'Hepatitis B (1st dose)', 'OPV-0 (Polio birth dose)'],
    notes: 'Given at birth or within first 2 weeks'
  },
  {
    age: '6 weeks (1.5 months)',
    vaccines: ['DTP-1 (Diphtheria, Tetanus, Pertussis)', 'OPV-1 (Polio)', 'Hepatitis B (2nd dose)', 'Hib-1 (Haemophilus influenzae)', 'PCV-1 (Pneumococcal)'],
    notes: 'First dose of pentavalent vaccine (DTP-HepB-Hib)'
  },
  {
    age: '10 weeks (2.5 months)',
    vaccines: ['DTP-2', 'OPV-2', 'Hib-2', 'PCV-2'],
    notes: 'Second dose of routine vaccines'
  },
  {
    age: '14 weeks (3.5 months)',
    vaccines: ['DTP-3', 'OPV-3', 'Hepatitis B (3rd dose)', 'Hib-3', 'PCV-3', 'IPV (Inactivated Polio)'],
    notes: 'Completes primary series for most vaccines'
  },
  {
    age: '9 months',
    vaccines: ['Measles-Rubella (MR-1)', 'Vitamin A supplementation'],
    notes: 'First measles vaccine, critical for outbreak prevention'
  },
  {
    age: '12 months',
    vaccines: ['MMR (Measles, Mumps, Rubella)'],
    notes: 'Can be given as early as 9 months in outbreak settings'
  },
  {
    age: '18 months',
    vaccines: ['DTP booster', 'OPV booster', 'MR-2 (Measles-Rubella booster)'],
    notes: 'Booster doses for sustained immunity'
  },
  {
    age: '4-6 years (school entry)',
    vaccines: ['DTP booster', 'OPV booster', 'MMR booster'],
    notes: 'School entry requirement'
  },
  {
    age: '12 years',
    vaccines: ['Td (Tetanus-Diphtheria booster)'],
    notes: 'Adolescent booster'
  },
  {
    age: 'Special populations',
    vaccines: ['Hepatitis A (endemic areas)', 'Typhoid (high-risk areas)', 'Meningococcal (Hajj pilgrims)', 'Influenza (annual, high-risk)'],
    notes: 'Additional vaccines based on risk factors and travel'
  }
];

/**
 * Common Obstetric Complications in Iraq
 */
export const iraqiObstetricComplications = [
  {
    condition: 'Gestational Diabetes Mellitus (GDM)',
    prevalence: 'Very High (15-20% of pregnancies)',
    riskFactors: ['High baseline diabetes prevalence', 'Obesity', 'Family history', 'Advanced maternal age'],
    screening: 'OGTT at 24-28 weeks (earlier if high risk)',
    management: [
      'Dietary modification and exercise',
      'Blood glucose monitoring',
      'Insulin if fasting glucose >95 mg/dL or 2h post-prandial >120 mg/dL',
      'Fetal monitoring (growth scans, NST)',
      'Delivery planning (consider induction at 39-40 weeks)'
    ],
    complications: ['Macrosomia', 'Shoulder dystocia', 'Neonatal hypoglycemia', 'Increased cesarean rate']
  },
  {
    condition: 'Anemia in Pregnancy',
    prevalence: 'Very High (>40% of pregnant women)',
    riskFactors: ['Iron deficiency', 'Poor nutrition', 'Multiparity', 'Short inter-pregnancy interval'],
    screening: 'Hemoglobin at first visit and 28 weeks',
    management: [
      'Iron supplementation: Ferrous sulfate 200mg daily',
      'Folic acid 400-800 mcg daily',
      'Dietary counseling (iron-rich foods)',
      'Treat underlying causes (hookworm, malaria if applicable)',
      'Blood transfusion if Hb <7 g/dL or symptomatic'
    ],
    complications: ['Preterm delivery', 'Low birth weight', 'Maternal fatigue', 'Postpartum hemorrhage risk']
  },
  {
    condition: 'Preeclampsia/Eclampsia',
    prevalence: 'Moderate to High (5-8% of pregnancies)',
    riskFactors: ['Primigravida', 'Chronic hypertension', 'Diabetes', 'Obesity', 'Multiple gestation', 'Previous preeclampsia'],
    screening: 'BP and urine protein at each antenatal visit',
    management: [
      'Mild preeclampsia: Outpatient monitoring, low-dose aspirin',
      'Severe preeclampsia: Hospitalization, BP control (labetalol, nifedipine)',
      'Magnesium sulfate for seizure prophylaxis',
      'Delivery is definitive treatment (timing based on severity and gestational age)',
      'Eclampsia: IV magnesium sulfate, stabilize, deliver'
    ],
    complications: ['Maternal: Stroke, HELLP syndrome, renal failure, placental abruption', 'Fetal: IUGR, preterm delivery, stillbirth']
  },
  {
    condition: 'Postpartum Hemorrhage (PPH)',
    prevalence: 'High (leading cause of maternal mortality in Iraq)',
    riskFactors: ['Uterine atony', 'Retained placenta', 'Genital tract trauma', 'Coagulopathy', 'Multiparity', 'Prolonged labor'],
    prevention: 'Active management of third stage (oxytocin 10 IU IM)',
    management: [
      'Uterine massage',
      'Oxytocin 20-40 IU in 1L saline IV',
      'Misoprostol 800 mcg sublingual if oxytocin unavailable',
      'Tranexamic acid 1g IV within 3 hours',
      'Bimanual uterine compression',
      'Surgical intervention if refractory (B-Lynch suture, hysterectomy)'
    ],
    complications: ['Hypovolemic shock', 'DIC', 'Maternal death', 'Need for hysterectomy']
  },
  {
    condition: 'Preterm Labor',
    prevalence: 'Moderate (8-12% of deliveries)',
    riskFactors: ['Infection', 'Multiple gestation', 'Previous preterm birth', 'Cervical insufficiency', 'Maternal stress/conflict'],
    screening: 'Cervical length ultrasound in high-risk women',
    management: [
      'Tocolysis (nifedipine or atosiban) if <34 weeks',
      'Corticosteroids (betamethasone 12mg IM x2 doses) for fetal lung maturity',
      'Magnesium sulfate for neuroprotection if <32 weeks',
      'Antibiotics if PPROM (prolonged rupture of membranes)',
      'Transfer to tertiary center with NICU if needed'
    ],
    complications: ['Neonatal: RDS, IVH, NEC, long-term neurodevelopmental issues', 'Maternal: Cesarean delivery, infection']
  }
];


/**
 * Iraqi-Specific Disease Prevalence
 * Top conditions commonly seen in Iraq
 */
export const iraqiDiseasePrevalence = [
  {
    disease: 'Type 2 Diabetes Mellitus',
    prevalence: 'Very High',
    notes: 'Iraq has one of the highest diabetes rates in the Middle East (>15% of adults)',
    localFactors: ['High carbohydrate diet', 'Sedentary lifestyle', 'Genetic predisposition', 'Limited screening']
  },
  {
    disease: 'Hypertension',
    prevalence: 'Very High',
    notes: 'Affects ~40% of adults, often undiagnosed',
    localFactors: ['High salt intake', 'Stress', 'Obesity', 'Limited access to care']
  },
  {
    disease: 'Ischemic Heart Disease',
    prevalence: 'High',
    notes: 'Leading cause of mortality in Iraq',
    localFactors: ['High diabetes/HTN rates', 'Smoking', 'Limited cardiac care access']
  },
  {
    disease: 'Chronic Kidney Disease',
    prevalence: 'High',
    notes: 'Often secondary to diabetes and hypertension',
    localFactors: ['Uncontrolled diabetes', 'Nephrotoxic medications', 'Limited dialysis access']
  },
  {
    disease: 'Tuberculosis',
    prevalence: 'Moderate',
    notes: 'Endemic with ~5,000 cases annually',
    localFactors: ['Overcrowding', 'Malnutrition', 'Limited TB program coverage']
  },
  {
    disease: 'Cutaneous Leishmaniasis',
    prevalence: 'High',
    notes: 'Iraq is endemic for both cutaneous and visceral leishmaniasis',
    localFactors: ['Sandfly vectors', 'Poor sanitation', 'Conflict zones']
  },
  {
    disease: 'Brucellosis',
    prevalence: 'Moderate',
    notes: 'Common zoonotic disease from unpasteurized dairy',
    localFactors: ['Livestock contact', 'Unpasteurized milk/cheese consumption']
  },
  {
    disease: 'Typhoid Fever',
    prevalence: 'Moderate',
    notes: 'Water-borne disease, endemic in some regions',
    localFactors: ['Contaminated water', 'Poor sanitation', 'Limited vaccination']
  },
  {
    disease: 'Hepatitis B and C',
    prevalence: 'Moderate to High',
    notes: 'HCV prevalence ~1-2%, HBV ~2-3%',
    localFactors: ['Healthcare-associated transmission', 'Limited screening', 'Unsafe practices']
  },
  {
    disease: 'Iron Deficiency Anemia',
    prevalence: 'Very High',
    notes: 'Especially in women and children (>30%)',
    localFactors: ['Poor nutrition', 'Parasitic infections', 'Limited iron supplementation']
  },
  {
    disease: 'Vitamin D Deficiency',
    prevalence: 'Very High',
    notes: 'Paradoxically high despite sunny climate (>60% of population)',
    localFactors: ['Indoor lifestyle', 'Covered clothing', 'Limited fortified foods']
  },
  {
    disease: 'Asthma and COPD',
    prevalence: 'High',
    notes: 'Increasing due to pollution and smoking',
    localFactors: ['Air pollution', 'High smoking rates (>20% of men)', 'Dust storms']
  },
  {
    disease: 'Peptic Ulcer Disease',
    prevalence: 'High',
    notes: 'H. pylori infection very common (>70%)',
    localFactors: ['High H. pylori prevalence', 'NSAID overuse', 'Stress']
  },
  {
    disease: 'Thalassemia',
    prevalence: 'Moderate',
    notes: 'Genetic disorder common in Middle East',
    localFactors: ['Consanguineous marriage', 'Limited genetic screening']
  },
  {
    disease: 'Mental Health Disorders',
    prevalence: 'High',
    notes: 'PTSD, depression, anxiety from conflict',
    localFactors: ['War trauma', 'Displacement', 'Limited mental health services', 'Stigma']
  }
];

/**
 * Iraqi Pharmaceutical Database
 * Common medications available in Iraq with local names
 */
export const iraqiMedications = [
  {
    genericName: 'Metformin',
    localBrands: ['Glucophage', 'Cidophage', 'Diabex'],
    availability: 'Widely available',
    cost: 'Low',
    notes: 'First-line for diabetes, usually available in government hospitals'
  },
  {
    genericName: 'Glibenclamide (Glyburide)',
    localBrands: ['Daonil', 'Euglucon'],
    availability: 'Widely available',
    cost: 'Low',
    notes: 'Common sulfonylurea, risk of hypoglycemia'
  },
  {
    genericName: 'Insulin (Human NPH)',
    localBrands: ['Insulatard', 'Humulin N'],
    availability: 'Available but limited',
    cost: 'Moderate',
    notes: 'Often subsidized, supply can be inconsistent'
  },
  {
    genericName: 'Amlodipine',
    localBrands: ['Norvasc', 'Amlor'],
    availability: 'Widely available',
    cost: 'Low',
    notes: 'Common antihypertensive, well-tolerated'
  },
  {
    genericName: 'Enalapril',
    localBrands: ['Renitec', 'Vasotec'],
    availability: 'Widely available',
    cost: 'Low',
    notes: 'ACE inhibitor, first-line for HTN with diabetes'
  },
  {
    genericName: 'Atorvastatin',
    localBrands: ['Lipitor', 'Atoris'],
    availability: 'Available',
    cost: 'Moderate',
    notes: 'Statin for cholesterol, increasingly prescribed'
  },
  {
    genericName: 'Aspirin',
    localBrands: ['Aspirin', 'Juspirin'],
    availability: 'Widely available',
    cost: 'Very low',
    notes: 'Over-the-counter, used for cardiovascular protection'
  },
  {
    genericName: 'Amoxicillin',
    localBrands: ['Amoxil', 'Hiconcil'],
    availability: 'Widely available',
    cost: 'Low',
    notes: 'First-line antibiotic for many infections'
  },
  {
    genericName: 'Amoxicillin-Clavulanate',
    localBrands: ['Augmentin', 'Clavumox'],
    availability: 'Widely available',
    cost: 'Moderate',
    notes: 'Broad-spectrum antibiotic'
  },
  {
    genericName: 'Ciprofloxacin',
    localBrands: ['Cipro', 'Ciprofloxacin'],
    availability: 'Widely available',
    cost: 'Low',
    notes: 'Fluoroquinolone, often overused'
  },
  {
    genericName: 'Azithromycin',
    localBrands: ['Zithromax', 'Azithrocin'],
    availability: 'Available',
    cost: 'Moderate',
    notes: 'Macrolide antibiotic, 3-5 day course'
  },
  {
    genericName: 'Omeprazole',
    localBrands: ['Losec', 'Omepral'],
    availability: 'Widely available',
    cost: 'Low',
    notes: 'PPI for GERD and ulcers, very commonly prescribed'
  },
  {
    genericName: 'Salbutamol (Albuterol)',
    localBrands: ['Ventolin', 'Salbutamol inhaler'],
    availability: 'Widely available',
    cost: 'Moderate',
    notes: 'Rescue inhaler for asthma'
  },
  {
    genericName: 'Prednisolone',
    localBrands: ['Prednisolone', 'Deltacortril'],
    availability: 'Widely available',
    cost: 'Low',
    notes: 'Oral steroid, often overused'
  },
  {
    genericName: 'Paracetamol (Acetaminophen)',
    localBrands: ['Panadol', 'Fevadol', 'Adol'],
    availability: 'Widely available',
    cost: 'Very low',
    notes: 'Over-the-counter, most common analgesic/antipyretic'
  },
  {
    genericName: 'Ibuprofen',
    localBrands: ['Brufen', 'Ibuprofen'],
    availability: 'Widely available',
    cost: 'Low',
    notes: 'NSAID, over-the-counter'
  },
  {
    genericName: 'Diclofenac',
    localBrands: ['Voltaren', 'Diclofenac'],
    availability: 'Widely available',
    cost: 'Low',
    notes: 'NSAID, oral and topical forms'
  },
  {
    genericName: 'Levothyroxine',
    localBrands: ['Eltroxin', 'Euthyrox'],
    availability: 'Available but limited',
    cost: 'Moderate',
    notes: 'For hypothyroidism, supply can be inconsistent'
  },
  {
    genericName: 'Ferrous Sulfate',
    localBrands: ['Ferograd', 'Iron tablets'],
    availability: 'Widely available',
    cost: 'Very low',
    notes: 'Iron supplementation for anemia'
  },
  {
    genericName: 'Ceftriaxone',
    localBrands: ['Rocephin', 'Ceftriaxone'],
    availability: 'Available (hospital)',
    cost: 'Moderate',
    notes: 'Third-generation cephalosporin, IV/IM'
  }
];

/**
 * Tropical and Endemic Disease Guidelines for Iraq
 */
export const iraqiTropicalDiseases = [
  {
    disease: 'Cutaneous Leishmaniasis',
    localName: 'Baghdad Boil / حبة بغداد',
    prevalence: 'Endemic',
    diagnosticCriteria: [
      'Painless skin ulcer with raised borders',
      'History of sandfly bite',
      'Endemic area exposure',
      'Slit-skin smear showing amastigotes',
      'PCR confirmation'
    ],
    treatment: [
      'Small lesions (<5cm): Intralesional sodium stibogluconate',
      'Large/multiple lesions: Systemic sodium stibogluconate 20mg/kg/day IM x 20 days',
      'Alternative: Liposomal amphotericin B',
      'Wound care and dressing',
      'Usually self-healing in 3-18 months'
    ],
    prevention: 'Insect repellent, bed nets, avoid endemic areas at dusk/dawn'
  },
  {
    disease: 'Visceral Leishmaniasis (Kala-azar)',
    localName: 'كالا آزار',
    prevalence: 'Less common than cutaneous',
    diagnosticCriteria: [
      'Prolonged fever (>2 weeks)',
      'Splenomegaly (massive)',
      'Hepatomegaly',
      'Pancytopenia',
      'Weight loss',
      'Bone marrow or splenic aspirate showing amastigotes',
      'rK39 rapid test positive'
    ],
    treatment: [
      'Liposomal amphotericin B 3-5 mg/kg/day (drug of choice)',
      'Alternative: Sodium stibogluconate 20mg/kg/day IM x 28 days',
      'Miltefosine (oral) in some cases',
      'Fatal if untreated'
    ],
    prevention: 'Vector control, treat infected dogs'
  },
  {
    disease: 'Brucellosis',
    localName: 'حمى مالطا (Malta Fever)',
    prevalence: 'Common in rural areas',
    diagnosticCriteria: [
      'Undulating fever',
      'Arthralgia (especially sacroiliitis)',
      'Hepatosplenomegaly',
      'Sweating (especially night sweats)',
      'Exposure to livestock or unpasteurized dairy',
      'Positive blood culture (slow-growing)',
      'Serology: Rose Bengal test, ELISA'
    ],
    treatment: [
      'Doxycycline 100mg BID + Rifampicin 600-900mg daily x 6 weeks',
      'Alternative: Doxycycline + Streptomycin (IM) x 2-3 weeks',
      'Children <8 years: Trimethoprim-sulfamethoxazole + Rifampicin',
      'Relapse common if inadequate treatment'
    ],
    prevention: 'Avoid unpasteurized dairy, livestock vaccination'
  },
  {
    disease: 'Typhoid Fever',
    localName: 'حمى التيفوئيد',
    prevalence: 'Endemic in areas with poor sanitation',
    diagnosticCriteria: [
      'Stepladder fever (gradually increasing)',
      'Relative bradycardia',
      'Rose spots on trunk',
      'Hepatosplenomegaly',
      'Constipation or diarrhea',
      'Blood culture positive (first week)',
      'Widal test (limited value)'
    ],
    treatment: [
      'Uncomplicated: Azithromycin 1g daily x 5-7 days (preferred)',
      'Alternative: Ciprofloxacin 500mg BID x 7-10 days',
      'Severe: Ceftriaxone 2g IV daily x 10-14 days',
      'Increasing fluoroquinolone resistance in Iraq'
    ],
    prevention: 'Safe water, food hygiene, typhoid vaccination'
  },
  {
    disease: 'Hydatid Disease (Echinococcosis)',
    localName: 'الكيسة المائية',
    prevalence: 'Endemic, especially in sheep-raising areas',
    diagnosticCriteria: [
      'Asymptomatic cyst (liver, lung, other organs)',
      'Abdominal mass or pain',
      'Cough, hemoptysis if lung cyst',
      'Ultrasound or CT showing cystic lesion',
      'Serology (ELISA for Echinococcus)',
      'Eosinophilia'
    ],
    treatment: [
      'Surgery (cystectomy) for large/symptomatic cysts',
      'PAIR (Puncture, Aspiration, Injection, Re-aspiration) for selected cases',
      'Albendazole 400mg BID x 1-6 months (pre/post-op or sole therapy)',
      'Avoid cyst rupture (anaphylaxis risk)'
    ],
    prevention: 'Deworm dogs, avoid contact with dog feces, food hygiene'
  }
];


/**
 * Rare Disease Knowledge Base
 * Uncommon but important conditions to consider in differential diagnosis
 */
export const rareDiseaseKnowledge = [
  {
    disease: 'Guillain-Barré Syndrome (GBS)',
    category: 'Neurological',
    prevalence: 'Rare (1-2 per 100,000)',
    clinicalPresentation: [
      'Ascending symmetrical weakness',
      'Areflexia or hyporeflexia',
      'Paresthesias in hands and feet',
      'Facial weakness (50%)',
      'Respiratory muscle weakness (30%)',
      'Autonomic dysfunction'
    ],
    triggers: ['Recent infection (Campylobacter, CMV, EBV)', 'Post-vaccination (rare)', 'Surgery'],
    diagnosis: ['CSF: Elevated protein with normal cell count (albuminocytologic dissociation)', 'Nerve conduction studies: Demyelination', 'Anti-ganglioside antibodies'],
    treatment: ['IVIG 0.4 g/kg/day x 5 days OR Plasmapheresis', 'Supportive care', 'Monitor respiratory function (FVC)', 'ICU if respiratory compromise', 'VTE prophylaxis'],
    prognosis: '85% recover fully, 15% have residual weakness'
  },
  {
    disease: 'Addison\'s Disease (Primary Adrenal Insufficiency)',
    category: 'Endocrine',
    prevalence: 'Rare (1 per 10,000)',
    clinicalPresentation: [
      'Chronic fatigue and weakness',
      'Weight loss',
      'Hyperpigmentation (especially palmar creases, buccal mucosa)',
      'Hypotension',
      'Salt craving',
      'Nausea, vomiting, diarrhea'
    ],
    triggers: ['Autoimmune (most common)', 'TB (common in Iraq)', 'Hemorrhage', 'Medications'],
    diagnosis: ['Low cortisol (<3 mcg/dL)', 'Elevated ACTH', 'ACTH stimulation test: No cortisol rise', 'Hyponatremia, hyperkalemia', 'Hypoglycemia'],
    treatment: ['Hydrocortisone 15-25 mg/day (divided doses)', 'Fludrocortisone 0.1 mg/day', 'Stress dosing during illness/surgery', 'Medical alert bracelet', 'Patient education on crisis management'],
    emergencyManagement: ['Adrenal crisis: IV hydrocortisone 100mg bolus, then 50mg q6h', 'IV saline resuscitation', 'Treat precipitant']
  },
  {
    disease: 'Kawasaki Disease',
    category: 'Pediatric Vasculitis',
    prevalence: 'Rare (peak age 1-5 years)',
    clinicalPresentation: [
      'Fever >5 days',
      'Bilateral conjunctival injection (non-purulent)',
      'Polymorphous rash',
      'Oral changes (strawberry tongue, cracked lips)',
      'Cervical lymphadenopathy',
      'Extremity changes (erythema, edema, desquamation)'
    ],
    diagnosis: ['Clinical (fever + 4/5 criteria)', 'Elevated CRP/ESR', 'Thrombocytosis (after week 1)', 'Echocardiography: Coronary artery aneurysms'],
    treatment: ['IVIG 2 g/kg single infusion', 'High-dose aspirin 80-100 mg/kg/day (until fever resolves)', 'Low-dose aspirin 3-5 mg/kg/day (6-8 weeks)', 'Echocardiography at diagnosis, 2 weeks, 6-8 weeks'],
    complications: ['Coronary artery aneurysms (25% if untreated, <5% if treated)', 'Myocardial infarction', 'Sudden death']
  },
  {
    disease: 'Pheochromocytoma',
    category: 'Endocrine Tumor',
    prevalence: 'Rare (2-8 per million)',
    clinicalPresentation: [
      'Episodic hypertension (paroxysmal)',
      'Headaches',
      'Palpitations',
      'Diaphoresis',
      'Pallor',
      'Anxiety/sense of doom',
      'Hyperglycemia'
    ],
    triggers: ['Spontaneous', 'Stress', 'Medications (metoclopramide, TCAs)', 'Abdominal pressure'],
    diagnosis: ['24-hour urine metanephrines and catecholamines', 'Plasma free metanephrines', 'CT/MRI adrenal glands', 'MIBG scan if extra-adrenal'],
    treatment: ['Alpha-blockade (phenoxybenzamine) BEFORE beta-blockade', 'Surgical resection (curative)', 'Preoperative preparation critical', 'Genetic testing (40% hereditary)'],
    emergencyManagement: ['Hypertensive crisis: IV phentolamine 5-15 mg', 'Avoid beta-blockers alone (unopposed alpha stimulation)']
  },
  {
    disease: 'Myasthenia Gravis',
    category: 'Neuromuscular',
    prevalence: 'Rare (15-20 per 100,000)',
    clinicalPresentation: [
      'Fluctuating muscle weakness (worse with activity)',
      'Ptosis and diplopia (ocular symptoms first)',
      'Bulbar weakness (dysphagia, dysarthria)',
      'Proximal limb weakness',
      'Respiratory muscle weakness (myasthenic crisis)',
      'Fatigable weakness'
    ],
    diagnosis: ['Anti-AChR antibodies (85%)', 'Anti-MuSK antibodies (if AChR negative)', 'Edrophonium (Tensilon) test', 'Repetitive nerve stimulation: Decremental response', 'Chest CT: Thymoma (15%)'],
    treatment: ['Pyridostigmine 60mg TID-QID', 'Prednisone (immunosuppression)', 'Azathioprine or mycophenolate', 'Thymectomy if thymoma or age <60', 'IVIG or plasmapheresis for crisis'],
    emergencyManagement: ['Myasthenic crisis: ICU, intubation if needed', 'IVIG or plasmapheresis', 'Avoid neuromuscular blocking agents']
  }
];

/**
 * Additional Emergency Protocols
 * Time-critical interventions for life-threatening conditions
 */
export const additionalEmergencyProtocols = [
  {
    condition: 'Acute Ischemic Stroke',
    timeWindow: 'Door-to-needle <60 minutes',
    protocol: [
      '0-10 min: Triage, activate stroke code',
      '10-25 min: Non-contrast CT head, labs (glucose, CBC, PT/INR, aPTT)',
      '25-45 min: Neurology assessment, NIHSS score',
      '45-60 min: IV tPA 0.9 mg/kg (10% bolus, 90% over 1 hour)',
      'Inclusion: Onset <4.5 hours, no hemorrhage, BP <185/110',
      'Exclusion: Recent surgery, bleeding disorder, platelets <100k'
    ],
    postTreatment: ['ICU monitoring 24 hours', 'No anticoagulation/antiplatelet x24h', 'BP control <180/105', 'Repeat CT at 24h']
  },
  {
    condition: 'Massive Pulmonary Embolism',
    timeWindow: 'Immediate intervention',
    protocol: [
      'Hemodynamic instability: SBP <90 mmHg or drop >40 mmHg',
      'Oxygen support, IV access x2',
      'Thrombolysis: Alteplase 100mg IV over 2 hours',
      'Alternative: Catheter-directed thrombolysis',
      'Surgical embolectomy if thrombolysis contraindicated',
      'ECMO as bridge in refractory shock'
    ],
    postTreatment: ['ICU monitoring', 'Anticoagulation after thrombolysis', 'Echo to assess RV function', 'IVC filter if recurrent despite anticoagulation']
  },
  {
    condition: 'Acute Mesenteric Ischemia',
    timeWindow: '<6 hours for bowel viability',
    protocol: [
      'High suspicion: Severe abdominal pain out of proportion to exam',
      'Risk factors: Atrial fibrillation, recent MI, atherosclerosis',
      'CT angiography (diagnostic)',
      'Labs: Elevated lactate, leukocytosis, metabolic acidosis',
      'NPO, IV fluids, broad-spectrum antibiotics',
      'Immediate vascular surgery consultation',
      'Revascularization: Embolectomy, bypass, or endovascular',
      'Bowel resection if necrotic'
    ],
    mortality: 'High (60-80% if delayed diagnosis)'
  },
  {
    condition: 'Acute Angle-Closure Glaucoma',
    timeWindow: '<24 hours to prevent permanent vision loss',
    protocol: [
      'Symptoms: Severe eye pain, blurred vision, halos, nausea/vomiting',
      'Signs: Red eye, mid-dilated fixed pupil, corneal edema, IOP >40 mmHg',
      'Immediate treatment:',
      '  - Acetazolamide 500mg IV/PO',
      '  - Topical beta-blocker (timolol)',
      '  - Topical alpha-agonist (apraclonidine)',
      '  - Topical pilocarpine 2% (after IOP starts to drop)',
      '  - IV mannitol 1-2 g/kg if refractory',
      'Definitive: Laser peripheral iridotomy within 24-48 hours',
      'Treat fellow eye prophylactically'
    ]
  },
  {
    condition: 'Necrotizing Fasciitis',
    timeWindow: 'Surgical debridement within 6 hours',
    protocol: [
      'Clinical: Rapidly spreading cellulitis, severe pain, systemic toxicity',
      'LRINEC score >6 (lab risk indicator)',
      'Imaging: CT/MRI showing fascial involvement, gas',
      'Immediate broad-spectrum antibiotics:',
      '  - Vancomycin + Piperacillin-tazobactam + Clindamycin',
      'Urgent surgical debridement (may require multiple operations)',
      'ICU admission',
      'Hyperbaric oxygen (adjunct)',
      'Mortality: 20-40% even with treatment'
    ]
  }
];

/**
 * Drug Interaction Warnings
 * Critical medication interactions to avoid
 */
export const criticalDrugInteractions = [
  {
    drugPair: ['Warfarin', 'NSAIDs'],
    risk: 'Severe bleeding',
    mechanism: 'Additive antiplatelet effect + GI irritation',
    management: 'Avoid combination. Use acetaminophen for pain. If unavoidable, add PPI and monitor INR closely.'
  },
  {
    drugPair: ['ACE Inhibitors/ARBs', 'Potassium-sparing diuretics'],
    risk: 'Hyperkalemia',
    mechanism: 'Both increase potassium retention',
    management: 'Monitor potassium levels. Avoid in CKD. Consider alternative diuretic (thiazide, loop).'
  },
  {
    drugPair: ['Metformin', 'IV Contrast'],
    risk: 'Lactic acidosis',
    mechanism: 'Contrast-induced nephropathy + metformin accumulation',
    management: 'Hold metformin 48h before and after contrast. Check renal function before restarting.'
  },
  {
    drugPair: ['Statins', 'Macrolides (Clarithromycin)'],
    risk: 'Rhabdomyolysis',
    mechanism: 'CYP3A4 inhibition increases statin levels',
    management: 'Temporarily stop statin during macrolide course. Use azithromycin instead (no interaction).'
  },
  {
    drugPair: ['SSRIs', 'Tramadol'],
    risk: 'Serotonin syndrome',
    mechanism: 'Additive serotonergic effect',
    management: 'Avoid combination. Use alternative analgesic (acetaminophen, NSAIDs). Monitor for agitation, tremor, hyperthermia.'
  },
  {
    drugPair: ['Digoxin', 'Amiodarone'],
    risk: 'Digoxin toxicity',
    mechanism: 'Amiodarone increases digoxin levels',
    management: 'Reduce digoxin dose by 50%. Monitor digoxin levels and ECG.'
  },
  {
    drugPair: ['Levothyroxine', 'Iron/Calcium'],
    risk: 'Reduced thyroid hormone absorption',
    mechanism: 'Chelation in GI tract',
    management: 'Separate administration by 4 hours. Take levothyroxine on empty stomach.'
  },
  {
    drugPair: ['Beta-blockers', 'Verapamil/Diltiazem'],
    risk: 'Bradycardia, heart block, hypotension',
    mechanism: 'Additive negative chronotropic and inotropic effects',
    management: 'Avoid combination. If necessary, use with extreme caution and cardiac monitoring.'
  }
];


/**
 * Medical Imaging Interpretation Guidelines
 * Key radiological findings for common conditions
 */
export const imagingGuidelines = [
  {
    condition: 'Pneumonia',
    modality: 'Chest X-ray',
    keyFindings: [
      'Lobar consolidation (air-space opacification)',
      'Air bronchograms (air-filled bronchi visible against consolidated lung)',
      'Patchy infiltrates (bronchopneumonia pattern)',
      'Pleural effusion (blunted costophrenic angle)',
      'Cavitation (suggests necrotizing pneumonia or abscess)'
    ],
    differentialImaging: {
      'Pulmonary edema': 'Bilateral perihilar infiltrates, Kerley B lines, cardiomegaly',
      'Pulmonary embolism': 'Wedge-shaped opacity (Hampton hump), oligemia (Westermark sign)',
      'Lung cancer': 'Mass with irregular borders, hilar lymphadenopathy'
    },
    advancedImaging: 'CT chest: Better delineation of consolidation, empyema, lung abscess'
  },
  {
    condition: 'Acute Appendicitis',
    modality: 'CT Abdomen/Pelvis with IV contrast',
    keyFindings: [
      'Dilated appendix >6mm diameter',
      'Appendiceal wall thickening and enhancement',
      'Periappendiceal fat stranding',
      'Appendicolith (calcified fecalith)',
      'Fluid collection (suggests perforation/abscess)',
      'Free air (indicates perforation)'
    ],
    differentialImaging: {
      'Ovarian torsion': 'Enlarged ovary, twisted pedicle on Doppler ultrasound',
      'Ectopic pregnancy': 'Adnexal mass, free fluid, no intrauterine pregnancy on ultrasound',
      'Diverticulitis': 'Colonic wall thickening, pericolic fat stranding'
    },
    advancedImaging: 'Ultrasound (first-line in children/pregnancy): Non-compressible appendix >6mm'
  },
  {
    condition: 'Acute Stroke (Ischemic)',
    modality: 'Non-contrast CT Brain + CT Angiography',
    keyFindings: [
      'Hyperdense MCA sign (acute thrombus in middle cerebral artery)',
      'Loss of gray-white matter differentiation',
      'Insular ribbon sign (loss of insular cortex definition)',
      'Sulcal effacement (mass effect from edema)',
      'Hypodensity in vascular territory (appears 6-24 hours post-stroke)',
      'CTA: Vessel cut-off or filling defect'
    ],
    differentialImaging: {
      'Hemorrhagic stroke': 'Hyperdense (bright) area on non-contrast CT',
      'Brain tumor': 'Mass effect, ring enhancement, vasogenic edema',
      'Seizure (Todd paralysis)': 'Normal CT, transient symptoms'
    },
    advancedImaging: 'MRI with DWI: Detects ischemia within minutes (gold standard for early stroke)'
  },
  {
    condition: 'Pulmonary Embolism',
    modality: 'CT Pulmonary Angiography (CTPA)',
    keyFindings: [
      'Filling defect in pulmonary artery (central or peripheral)',
      'Railway track sign (thrombus outlined by contrast)',
      'Wedge-shaped peripheral opacity (pulmonary infarction)',
      'Pleural effusion',
      'Right heart strain (RV/LV ratio >1)',
      'Mosaic attenuation (patchy lung perfusion)'
    ],
    differentialImaging: {
      'Pneumonia': 'Consolidation without vascular filling defect',
      'Aortic dissection': 'Intimal flap in aorta',
      'Pneumothorax': 'Visceral pleural line, absent lung markings peripherally'
    },
    advancedImaging: 'V/Q scan (if contrast contraindicated): Mismatch between ventilation and perfusion'
  },
  {
    condition: 'Acute Myocardial Infarction',
    modality: 'ECG + Echocardiography',
    keyFindings: [
      'ECG: ST-segment elevation (STEMI) or depression (NSTEMI)',
      'ECG: T-wave inversion, pathological Q waves',
      'Echo: Regional wall motion abnormality',
      'Echo: Reduced ejection fraction',
      'Echo: Complications (mitral regurgitation, VSD, free wall rupture)'
    ],
    differentialImaging: {
      'Pericarditis': 'Diffuse ST elevation, PR depression, pericardial effusion on echo',
      'Takotsubo cardiomyopathy': 'Apical ballooning on echo, normal coronaries on angiography',
      'Aortic dissection': 'Widened mediastinum on CXR, intimal flap on CT/echo'
    },
    advancedImaging: 'Coronary angiography: Gold standard for identifying culprit lesion and guiding PCI'
  },
  {
    condition: 'Acute Cholecystitis',
    modality: 'Ultrasound Abdomen',
    keyFindings: [
      'Gallbladder wall thickening >3mm',
      'Pericholecystic fluid',
      'Gallstones or sludge',
      'Sonographic Murphy sign (tenderness over gallbladder with probe)',
      'Distended gallbladder >10cm length or >4cm width',
      'Hyperemia on Doppler (increased blood flow to gallbladder wall)'
    ],
    differentialImaging: {
      'Choledocholithiasis': 'Dilated common bile duct >6mm, stone in CBD',
      'Acute pancreatitis': 'Enlarged pancreas, peripancreatic fluid',
      'Hepatitis': 'Hepatomegaly, periportal edema'
    },
    advancedImaging: 'HIDA scan: Non-visualization of gallbladder indicates cystic duct obstruction'
  },
  {
    condition: 'Bowel Obstruction',
    modality: 'CT Abdomen/Pelvis with IV contrast',
    keyFindings: [
      'Dilated bowel loops (small bowel >3cm, large bowel >6cm)',
      'Transition point (abrupt caliber change)',
      'Collapsed distal bowel',
      'Air-fluid levels on upright X-ray',
      'Closed-loop obstruction (C-shaped or U-shaped dilated loop)',
      'Pneumatosis intestinalis (air in bowel wall - ischemia)',
      'Free air (perforation)'
    ],
    differentialImaging: {
      'Ileus': 'Diffuse bowel dilatation without transition point',
      'Volvulus': 'Whirl sign (twisted mesentery), coffee bean sign (sigmoid volvulus)',
      'Intussusception': 'Target sign, crescent sign'
    },
    advancedImaging: 'MR enterography (Crohn disease): Bowel wall thickening, fistulas, abscesses'
  },
  {
    condition: 'Fractures (Long Bone)',
    modality: 'X-ray (2 views minimum)',
    keyFindings: [
      'Cortical disruption (break in bone cortex)',
      'Fracture line (lucent line through bone)',
      'Displacement (angulation, rotation, shortening)',
      'Comminution (multiple fragments)',
      'Soft tissue swelling',
      'Joint effusion (fat-fluid level in lipohemarthrosis)'
    ],
    differentialImaging: {
      'Stress fracture': 'Subtle cortical irregularity, periosteal reaction (may be X-ray negative initially)',
      'Bone tumor': 'Lytic or sclerotic lesion, pathological fracture through tumor',
      'Osteomyelitis': 'Bone destruction, periosteal reaction, soft tissue abscess'
    },
    advancedImaging: 'CT: Better for complex fractures (pelvis, spine, intra-articular). MRI: Occult fractures, bone marrow edema'
  },
  {
    condition: 'Urinary Tract Infection (Pyelonephritis)',
    modality: 'CT Abdomen/Pelvis with IV contrast',
    keyFindings: [
      'Renal enlargement',
      'Striated nephrogram (alternating areas of enhancement)',
      'Perinephric fat stranding',
      'Renal abscess (low-density fluid collection)',
      'Emphysematous pyelonephritis (gas in renal parenchyma - diabetics)',
      'Hydronephrosis (if obstructive component)'
    ],
    differentialImaging: {
      'Renal calculi': 'Hyperdense stone, hydronephrosis, perinephric stranding',
      'Renal infarction': 'Wedge-shaped perfusion defect',
      'Renal cell carcinoma': 'Heterogeneous enhancing mass'
    },
    advancedImaging: 'Ultrasound (first-line): Hydronephrosis, abscess, renal size. Non-contrast CT: Best for stones'
  },
  {
    condition: 'Congestive Heart Failure',
    modality: 'Chest X-ray + Echocardiography',
    keyFindings: [
      'CXR: Cardiomegaly (cardiothoracic ratio >0.5)',
      'CXR: Pulmonary venous congestion (cephalization)',
      'CXR: Interstitial edema (Kerley B lines)',
      'CXR: Alveolar edema (bat-wing or perihilar infiltrates)',
      'CXR: Pleural effusions (bilateral)',
      'Echo: Reduced ejection fraction (<40% systolic dysfunction)',
      'Echo: Diastolic dysfunction (impaired relaxation)',
      'Echo: Valvular abnormalities (regurgitation, stenosis)'
    ],
    differentialImaging: {
      'Pneumonia': 'Focal consolidation, air bronchograms',
      'ARDS': 'Bilateral infiltrates, normal heart size',
      'Pulmonary fibrosis': 'Reticular opacities, honeycombing, reduced lung volumes'
    },
    advancedImaging: 'Cardiac MRI: Tissue characterization (scar, fibrosis), viability assessment'
  }
];
