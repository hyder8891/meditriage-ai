/**
 * SOAP Note Templates Service
 * Pre-built templates for common Iraqi medical scenarios
 */

import { getDb } from "./db";
import { soapNoteTemplates, SoapNoteTemplate } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface SoapTemplate {
  id: number;
  name: string;
  nameAr: string;
  category: string;
  description: string;
  descriptionAr: string;
  subjectiveTemplate: any;
  objectiveTemplate: any;
  assessmentTemplate: any;
  planTemplate: any;
  commonSymptoms?: string[];
  redFlags?: string[];
  typicalDiagnoses?: string[];
}

/**
 * Pre-built template data for common Iraqi medical scenarios
 */
export const SYSTEM_TEMPLATES = [
  {
    name: "Chest Pain Assessment",
    nameAr: "تقييم ألم الصدر",
    category: "chest_pain" as const,
    description: "Comprehensive template for cardiac and non-cardiac chest pain evaluation, optimized for Iraqi emergency departments",
    descriptionAr: "قالب شامل لتقييم ألم الصدر القلبي وغير القلبي، محسّن لأقسام الطوارئ العراقية",
    keywords: JSON.stringify(["chest pain", "cardiac", "angina", "MI", "myocardial infarction", "heart attack"]),
    keywordsAr: JSON.stringify(["ألم الصدر", "قلبي", "ذبحة صدرية", "احتشاء عضلة القلب", "نوبة قلبية"]),
    subjectiveTemplate: JSON.stringify({
      chiefComplaint: "Chest pain",
      hpi: {
        onset: "When did the pain start? (sudden/gradual)",
        location: "Where exactly is the pain? (central/left/right)",
        character: "What does it feel like? (crushing/sharp/burning/pressure)",
        radiation: "Does it spread anywhere? (arm/jaw/back/shoulder)",
        severity: "Rate 1-10",
        duration: "How long does it last?",
        aggravatingFactors: "What makes it worse? (exertion/breathing/position)",
        relievingFactors: "What makes it better? (rest/nitroglycerin/antacids)",
        associatedSymptoms: "Any: shortness of breath, sweating, nausea, vomiting, palpitations, dizziness?"
      },
      riskFactors: [
        "Smoking history",
        "Diabetes",
        "Hypertension",
        "High cholesterol",
        "Family history of heart disease",
        "Previous cardiac events"
      ]
    }),
    objectiveTemplate: JSON.stringify({
      vitalSigns: {
        bp: "Blood pressure (mmHg)",
        hr: "Heart rate (bpm)",
        rr: "Respiratory rate",
        temp: "Temperature (°C)",
        o2sat: "O2 saturation (%)"
      },
      generalAppearance: "Alert/distressed/diaphoretic/pale",
      cardiovascular: {
        heartSounds: "S1, S2 regular/irregular, murmurs/gallops",
        peripheralPulses: "Equal bilaterally, strong/weak",
        jvp: "Jugular venous pressure",
        edema: "Peripheral edema present/absent"
      },
      respiratory: {
        chestMovement: "Symmetrical/asymmetrical",
        breathSounds: "Clear/crackles/wheezes",
        percussion: "Resonant/dull"
      },
      investigations: {
        ecg: "ECG findings: ST changes, Q waves, T wave inversions",
        troponin: "Cardiac troponin levels",
        cxr: "Chest X-ray findings",
        echo: "Echocardiogram if performed"
      }
    }),
    assessmentTemplate: JSON.stringify({
      differentialDiagnosis: [
        {
          condition: "Acute Coronary Syndrome (ACS)",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Stable Angina",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Pericarditis",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Pulmonary Embolism",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Gastroesophageal Reflux Disease (GERD)",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Musculoskeletal Pain",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        }
      ],
      riskStratification: "HEART score / TIMI score",
      primaryDiagnosis: ""
    }),
    planTemplate: JSON.stringify({
      immediate: [
        "Oxygen if O2 sat < 94%",
        "Aspirin 300mg chewed (if not contraindicated)",
        "Nitroglycerin sublingual",
        "IV access",
        "Continuous cardiac monitoring",
        "Serial ECGs and troponins"
      ],
      medications: [
        "Antiplatelet therapy",
        "Anticoagulation if indicated",
        "Beta-blockers",
        "ACE inhibitors",
        "Statins",
        "Pain management"
      ],
      investigations: [
        "Complete blood count",
        "Renal function tests",
        "Lipid profile",
        "Coronary angiography if indicated"
      ],
      disposition: [
        "Admit to CCU/cardiology",
        "Observation unit",
        "Discharge with cardiology follow-up"
      ],
      patientEducation: [
        "Chest pain warning signs",
        "When to return to ED",
        "Medication compliance",
        "Risk factor modification"
      ]
    }),
    commonSymptoms: JSON.stringify([
      "chest pain",
      "shortness of breath",
      "sweating",
      "nausea",
      "arm pain",
      "jaw pain"
    ]),
    redFlags: JSON.stringify([
      "ST elevation on ECG",
      "Elevated troponin",
      "Hemodynamic instability",
      "Severe dyspnea",
      "Altered mental status",
      "Syncope"
    ]),
    typicalDiagnoses: JSON.stringify([
      "Acute Coronary Syndrome",
      "Stable Angina",
      "GERD",
      "Musculoskeletal pain"
    ])
  },
  {
    name: "Fever Evaluation",
    nameAr: "تقييم الحمى",
    category: "fever" as const,
    description: "Systematic approach to fever assessment, including infectious and non-infectious causes common in Iraq",
    descriptionAr: "نهج منظم لتقييم الحمى، بما في ذلك الأسباب المعدية وغير المعدية الشائعة في العراق",
    keywords: JSON.stringify(["fever", "infection", "sepsis", "malaria", "typhoid", "viral", "bacterial"]),
    keywordsAr: JSON.stringify(["حمى", "عدوى", "تسمم الدم", "ملاريا", "حمى التيفوئيد", "فيروسي", "بكتيري"]),
    subjectiveTemplate: JSON.stringify({
      chiefComplaint: "Fever",
      hpi: {
        onset: "When did fever start?",
        maxTemp: "Highest recorded temperature",
        pattern: "Continuous/intermittent/relapsing",
        associatedSymptoms: {
          respiratory: "Cough, sore throat, runny nose, shortness of breath",
          gi: "Nausea, vomiting, diarrhea, abdominal pain",
          urinary: "Dysuria, frequency, urgency, flank pain",
          neuro: "Headache, neck stiffness, confusion, seizures",
          skin: "Rash, wounds, insect bites",
          musculoskeletal: "Joint pain, muscle aches"
        },
        travelHistory: "Recent travel (especially to endemic areas)",
        exposures: "Sick contacts, animals, contaminated water/food",
        immunizations: "Up to date? Recent vaccinations?"
      },
      medicalHistory: {
        chronicConditions: "Diabetes, immunosuppression, chronic infections",
        recentProcedures: "Surgery, dental work, catheterization",
        medications: "Antibiotics, immunosuppressants, recent changes"
      }
    }),
    objectiveTemplate: JSON.stringify({
      vitalSigns: {
        temp: "Temperature (°C)",
        bp: "Blood pressure",
        hr: "Heart rate",
        rr: "Respiratory rate",
        o2sat: "O2 saturation"
      },
      generalAppearance: "Toxic/non-toxic, alert/lethargic",
      heent: {
        pharynx: "Erythema, exudates, tonsillar enlargement",
        ears: "TM erythema, bulging, perforation",
        sinuses: "Tenderness",
        neck: "Lymphadenopathy, meningismus"
      },
      respiratory: "Breath sounds, crackles, wheezes, bronchial breathing",
      cardiovascular: "Heart sounds, murmurs",
      abdomen: {
        inspection: "Distension",
        palpation: "Tenderness, guarding, rebound, hepatosplenomegaly",
        percussion: "Tympany/dullness",
        auscultation: "Bowel sounds"
      },
      skin: "Rash (petechial/macular/vesicular), wounds, cellulitis",
      neurological: "Mental status, focal deficits, meningeal signs",
      investigations: {
        cbc: "WBC count with differential",
        crp: "C-reactive protein",
        bloodCultures: "Before antibiotics",
        urinalysis: "If urinary symptoms",
        cxr: "If respiratory symptoms",
        malariaSmear: "If endemic area/travel history",
        typhoidSerology: "If prolonged fever + GI symptoms"
      }
    }),
    assessmentTemplate: JSON.stringify({
      differentialDiagnosis: [
        {
          condition: "Upper Respiratory Tract Infection (viral)",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Pneumonia (bacterial/viral)",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Urinary Tract Infection / Pyelonephritis",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Gastroenteritis",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Malaria",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Typhoid Fever",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Dengue Fever",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Sepsis / Bacteremia",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        },
        {
          condition: "Tuberculosis",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        }
      ],
      sepsisScreening: "qSOFA score / SIRS criteria",
      primaryDiagnosis: ""
    }),
    planTemplate: JSON.stringify({
      immediate: [
        "IV fluids if dehydrated",
        "Antipyretics (paracetamol/ibuprofen)",
        "Oxygen if hypoxic",
        "Blood cultures before antibiotics"
      ],
      antibiotics: [
        "Empiric therapy based on likely source",
        "Adjust based on culture results",
        "Consider local resistance patterns"
      ],
      investigations: [
        "Complete blood count with differential",
        "Blood cultures (x2 sets)",
        "Urinalysis and culture",
        "Chest X-ray",
        "Malaria smear/RDT if indicated",
        "Typhoid serology if indicated",
        "Lumbar puncture if meningitis suspected"
      ],
      monitoring: [
        "Vital signs q4h",
        "Fluid balance",
        "Response to antibiotics",
        "Repeat labs in 48-72h"
      ],
      disposition: [
        "Admit if septic/toxic appearance",
        "Observation if borderline",
        "Discharge with close follow-up if stable"
      ],
      patientEducation: [
        "Complete antibiotic course",
        "Hydration",
        "Warning signs (worsening fever, altered mental status)",
        "When to return to ED"
      ]
    }),
    commonSymptoms: JSON.stringify([
      "fever",
      "chills",
      "sweating",
      "body aches",
      "fatigue",
      "headache"
    ]),
    redFlags: JSON.stringify([
      "Altered mental status",
      "Hypotension",
      "Tachycardia",
      "Hypoxia",
      "Petechial rash",
      "Neck stiffness",
      "Severe headache"
    ]),
    typicalDiagnoses: JSON.stringify([
      "Viral URTI",
      "Pneumonia",
      "UTI",
      "Gastroenteritis",
      "Malaria",
      "Typhoid"
    ])
  },
  {
    name: "Trauma Assessment",
    nameAr: "تقييم الإصابات",
    category: "trauma" as const,
    description: "Systematic trauma evaluation following ATLS principles, adapted for Iraqi emergency settings",
    descriptionAr: "تقييم منظم للإصابات وفقاً لمبادئ ATLS، مكيّف لإعدادات الطوارئ العراقية",
    keywords: JSON.stringify(["trauma", "injury", "accident", "fracture", "head injury", "bleeding", "shock"]),
    keywordsAr: JSON.stringify(["إصابة", "حادث", "كسر", "إصابة الرأس", "نزيف", "صدمة"]),
    subjectiveTemplate: JSON.stringify({
      chiefComplaint: "Trauma / Injury",
      mechanismOfInjury: {
        type: "MVA/fall/assault/blast/penetrating/blunt",
        timeOfInjury: "When did it occur?",
        details: "Speed, height, weapon type, protective equipment",
        energyTransfer: "High/low energy mechanism"
      },
      symptoms: {
        pain: "Location, severity (1-10)",
        lossOfConsciousness: "Duration if any",
        amnesia: "Retrograde/anterograde",
        bleeding: "External bleeding sites",
        weakness: "Numbness, inability to move limbs",
        breathingDifficulty: "Shortness of breath, chest pain"
      },
      preHospitalCare: {
        interventions: "Immobilization, oxygen, IV fluids, medications",
        transportTime: "Time from injury to ED",
        vitalsAtScene: "Initial vital signs if available"
      }
    }),
    objectiveTemplate: JSON.stringify({
      primarySurvey: {
        airway: {
          status: "Patent/obstructed/at risk",
          cspineProtection: "Collar in place, manual stabilization",
          interventions: "Jaw thrust, OPA, NPA, intubation"
        },
        breathing: {
          rr: "Respiratory rate",
          o2sat: "Oxygen saturation",
          chestMovement: "Symmetrical/asymmetrical",
          breathSounds: "Present bilaterally/absent/decreased",
          trachea: "Midline/deviated",
          jvd: "Present/absent",
          subcutaneousEmphysema: "Present/absent",
          interventions: "Oxygen, chest tube, needle decompression"
        },
        circulation: {
          bp: "Blood pressure",
          hr: "Heart rate",
          pulses: "Central/peripheral, quality",
          capillaryRefill: "< 2 sec / delayed",
          skinColor: "Pink/pale/cyanotic",
          externalBleeding: "Controlled/uncontrolled",
          interventions: "IV access (2 large bore), fluids, blood products"
        },
        disability: {
          gcs: "Glasgow Coma Scale (E_V_M_)",
          pupils: "Size, reactivity, symmetry",
          motorFunction: "Movement in all extremities",
          sensoryFunction: "Sensation intact/impaired"
        },
        exposure: {
          completeExamination: "Full body inspection",
          temperature: "Core temperature",
          wounds: "Location, size, depth",
          deformities: "Obvious fractures, dislocations"
        }
      },
      secondarySurvey: {
        head: "Scalp lacerations, skull deformity, CSF leak",
        face: "Facial fractures, dental injuries, eye injuries",
        neck: "Tenderness, deformity, crepitus (maintain c-spine protection)",
        chest: "Rib tenderness, flail chest, penetrating wounds",
        abdomen: "Distension, tenderness, guarding, rebound, seat belt sign",
        pelvis: "Stability, tenderness",
        extremities: "Deformities, wounds, neurovascular status",
        back: "Tenderness, step-off, wounds (log roll with c-spine protection)",
        neurological: "Detailed neuro exam, focal deficits"
      },
      investigations: {
        xrays: "C-spine, chest, pelvis",
        fastExam: "Focused assessment with sonography for trauma",
        ctScans: "Head, c-spine, chest, abdomen/pelvis as indicated",
        labs: "CBC, type & cross, coagulation, lactate, ABG"
      }
    }),
    assessmentTemplate: JSON.stringify({
      injuries: [
        {
          location: "Anatomical location",
          type: "Fracture/laceration/contusion/internal injury",
          severity: "Minor/moderate/severe/life-threatening",
          management: "Treatment plan"
        }
      ],
      traumaScore: "ISS (Injury Severity Score) / RTS (Revised Trauma Score)",
      shockClass: "Class I / II / III / IV",
      primaryDiagnosis: "",
      secondaryDiagnoses: []
    }),
    planTemplate: JSON.stringify({
      resuscitation: [
        "Airway management",
        "Breathing support",
        "Hemorrhage control",
        "Fluid resuscitation (crystalloid/blood products)",
        "Tranexamic acid if indicated (within 3 hours)"
      ],
      surgicalConsults: [
        "Trauma surgery",
        "Neurosurgery",
        "Orthopedics",
        "Other specialties as needed"
      ],
      definitiveCare: [
        "Operative intervention if indicated",
        "Wound management",
        "Fracture stabilization",
        "ICU admission criteria"
      ],
      medications: [
        "Tetanus prophylaxis",
        "Antibiotics if indicated",
        "Pain management",
        "DVT prophylaxis"
      ],
      monitoring: [
        "Continuous vital signs",
        "Serial neurological exams",
        "Repeat imaging as needed",
        "Hemoglobin monitoring"
      ],
      disposition: [
        "Operating room",
        "ICU/trauma unit",
        "Ward admission",
        "Transfer to higher level of care"
      ]
    }),
    commonSymptoms: JSON.stringify([
      "pain",
      "bleeding",
      "swelling",
      "deformity",
      "loss of function",
      "altered consciousness"
    ]),
    redFlags: JSON.stringify([
      "GCS < 13",
      "Hypotension",
      "Tachycardia despite fluids",
      "Respiratory distress",
      "Penetrating torso injury",
      "Pelvic instability",
      "Neurological deficit"
    ]),
    typicalDiagnoses: JSON.stringify([
      "Head injury",
      "Rib fractures",
      "Long bone fractures",
      "Lacerations",
      "Internal bleeding",
      "Pneumothorax"
    ])
  },
  {
    name: "Pediatric Visit",
    nameAr: "زيارة طب الأطفال",
    category: "pediatric" as const,
    description: "Comprehensive pediatric assessment template with age-appropriate considerations for Iraqi children",
    descriptionAr: "قالب تقييم شامل لطب الأطفال مع اعتبارات مناسبة للعمر للأطفال العراقيين",
    keywords: JSON.stringify(["pediatric", "child", "infant", "growth", "development", "vaccination", "well child"]),
    keywordsAr: JSON.stringify(["أطفال", "طفل", "رضيع", "نمو", "تطور", "تطعيم", "فحص الطفل السليم"]),
    subjectiveTemplate: JSON.stringify({
      chiefComplaint: "",
      informant: "Mother/father/guardian - reliability",
      hpi: {
        symptoms: "Detailed description",
        onset: "When did symptoms start?",
        progression: "Getting better/worse/same",
        fever: "If present: max temp, pattern, response to antipyretics",
        feedingTolerance: "Breastfeeding/formula - amount, frequency, vomiting",
        urineOutput: "Wet diapers per day / frequency",
        stoolPattern: "Frequency, consistency, color, blood/mucus",
        behavioralChanges: "Irritability, lethargy, inconsolable crying",
        sleepPattern: "Normal/disturbed"
      },
      birthHistory: {
        gestationalAge: "Term/preterm (weeks)",
        birthWeight: "kg",
        deliveryMode: "Vaginal/C-section",
        complications: "Birth asphyxia, NICU admission, congenital anomalies"
      },
      developmentalHistory: {
        milestones: "Age-appropriate milestones achieved",
        concerns: "Any developmental delays"
      },
      immunizationHistory: {
        upToDate: "Yes/No",
        lastVaccines: "Which vaccines, when",
        missedVaccines: "Any missed or delayed"
      },
      nutritionHistory: {
        breastfeeding: "Exclusive/partial/none",
        formulaType: "If applicable",
        solidFoods: "Started when, variety",
        supplements: "Vitamin D, iron"
      },
      familyHistory: {
        geneticConditions: "Any inherited diseases",
        consanguinity: "Parental relationship"
      },
      socialHistory: {
        livingConditions: "Housing, sanitation, water source",
        daycare: "Attendance, sick contacts",
        smokeExposure: "Household smoking"
      }
    }),
    objectiveTemplate: JSON.stringify({
      vitalSigns: {
        temp: "Temperature (°C)",
        hr: "Heart rate (age-appropriate range)",
        rr: "Respiratory rate (age-appropriate range)",
        bp: "Blood pressure (if > 3 years)",
        o2sat: "Oxygen saturation",
        weight: "kg (percentile)",
        height: "cm (percentile)",
        headCircumference: "cm (percentile, if < 2 years)",
        bmi: "kg/m² (percentile, if > 2 years)"
      },
      generalAppearance: {
        alertness: "Alert/lethargic/irritable",
        hydrationStatus: "Well hydrated/mild/moderate/severe dehydration",
        nutritionalStatus: "Well nourished/underweight/overweight",
        distress: "None/mild/moderate/severe",
        interaction: "Appropriate for age/withdrawn"
      },
      heent: {
        fontanelle: "Flat/sunken/bulging (if < 18 months)",
        eyes: "Red reflex, conjunctivitis, discharge",
        ears: "TM appearance, mobility",
        nose: "Discharge, flaring",
        throat: "Pharyngeal erythema, tonsils, exudates",
        oralCavity: "Mucous membranes, dental health"
      },
      neck: "Lymphadenopathy, thyroid, stiffness",
      respiratory: {
        workOfBreathing: "Nasal flaring, retractions, grunting",
        breathSounds: "Clear/crackles/wheezes/stridor",
        percussion: "Resonant/dull"
      },
      cardiovascular: {
        heartSounds: "S1, S2, murmurs (grade, location, timing)",
        pulses: "Femoral pulses present and equal",
        capillaryRefill: "< 2 seconds / delayed"
      },
      abdomen: {
        inspection: "Distension, visible peristalsis",
        palpation: "Soft/tender, hepatosplenomegaly, masses",
        auscultation: "Bowel sounds present"
      },
      genitourinary: {
        external: "Normal external genitalia",
        tanner: "Tanner stage if adolescent"
      },
      musculoskeletal: {
        spine: "Straight, no scoliosis",
        hips: "Barlow/Ortolani if infant",
        extremities: "Full ROM, no deformities",
        gait: "Normal for age"
      },
      skin: {
        color: "Pink/pale/jaundiced/cyanotic",
        rash: "Type, distribution",
        turgor: "Normal/decreased",
        birthmarks: "Document if present"
      },
      neurological: {
        mentalStatus: "Alert, interactive",
        cranialNerves: "Grossly intact",
        motorFunction: "Tone, strength, symmetry",
        reflexes: "Age-appropriate",
        primitiveReflexes: "If infant: Moro, grasp, rooting"
      },
      development: {
        gross: "Gross motor skills observed",
        fine: "Fine motor skills observed",
        language: "Vocalization, words, sentences",
        social: "Interaction, eye contact, social smile"
      }
    }),
    assessmentTemplate: JSON.stringify({
      growthAssessment: "On track / faltering / accelerated",
      developmentAssessment: "Age-appropriate / delayed (specify domain)",
      differentialDiagnosis: [
        {
          condition: "",
          likelihood: "High/Medium/Low",
          supportingFindings: []
        }
      ],
      primaryDiagnosis: ""
    }),
    planTemplate: JSON.stringify({
      acuteCare: [
        "Treat current illness",
        "Medications with weight-based dosing",
        "Hydration (oral/IV)",
        "Fever management"
      ],
      investigations: [
        "Labs if indicated",
        "Imaging if indicated"
      ],
      immunizations: [
        "Vaccines due today",
        "Catch-up schedule if behind"
      ],
      nutritionCounseling: [
        "Continue breastfeeding",
        "Formula preparation",
        "Introduction of solids",
        "Balanced diet for older children",
        "Vitamin supplementation"
      ],
      developmentGuidance: [
        "Age-appropriate activities",
        "Stimulation recommendations",
        "Screen time limits",
        "Reading to child"
      ],
      safetyAnticipatory: [
        "Safe sleep practices",
        "Car seat use",
        "Injury prevention",
        "Poison prevention",
        "Water safety"
      ],
      followUp: [
        "Next well-child visit",
        "Specialist referral if needed",
        "When to return to clinic"
      ],
      parentEducation: [
        "Warning signs to watch for",
        "Medication administration",
        "Home care instructions",
        "Questions answered"
      ]
    }),
    commonSymptoms: JSON.stringify([
      "fever",
      "cough",
      "vomiting",
      "diarrhea",
      "rash",
      "poor feeding"
    ]),
    redFlags: JSON.stringify([
      "Lethargy",
      "Poor feeding",
      "Respiratory distress",
      "Dehydration signs",
      "Fever in infant < 3 months",
      "Bulging fontanelle",
      "Petechial rash"
    ]),
    typicalDiagnoses: JSON.stringify([
      "Viral URTI",
      "Gastroenteritis",
      "Otitis media",
      "Bronchiolitis",
      "Well child visit"
    ])
  }
];

/**
 * Seed system templates into database
 */
export async function seedSystemTemplates() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    for (const template of SYSTEM_TEMPLATES) {
      // Check if template already exists
      const existing = await db
        .select()
        .from(soapNoteTemplates)
        .where(eq(soapNoteTemplates.name, template.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(soapNoteTemplates).values({
          ...template,
          isSystemTemplate: true,
          isActive: true,
          usageCount: 0,
        });
        console.log(`✅ Seeded template: ${template.name}`);
      } else {
        console.log(`⏭️  Template already exists: ${template.name}`);
      }
    }
    return { success: true, message: "System templates seeded successfully" };
  } catch (error) {
    console.error("Error seeding templates:", error);
    return { success: false, error };
  }
}

/**
 * Get all active templates
 */
export async function getAllTemplates() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(soapNoteTemplates)
    .where(eq(soapNoteTemplates.isActive, true));
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select()
    .from(soapNoteTemplates)
    .where(eq(soapNoteTemplates.id, id))
    .limit(1);
  return results[0] || null;
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select()
    .from(soapNoteTemplates)
    .where(eq(soapNoteTemplates.isActive, true));
  
  return results.filter((t: SoapNoteTemplate) => t.category === category);
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const template = await getTemplateById(id);
  if (!template) return;
  
  await db
    .update(soapNoteTemplates)
    .set({
      usageCount: (template.usageCount || 0) + 1,
      lastUsed: new Date(),
    })
    .where(eq(soapNoteTemplates.id, id));
}
