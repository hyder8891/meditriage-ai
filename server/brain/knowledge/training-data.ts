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
