/**
 * Iraqi Medical Context
 * 
 * Contains Iraqi-specific medical information including common diseases,
 * local medication names, healthcare facilities, and cultural considerations
 */

export const iraqiMedicalContext = {
  // Common diseases in Iraq
  commonDiseases: [
    {
      name: "Diabetes Mellitus",
      arabicName: "السكري",
      prevalence: "high",
      notes: "Very common in Iraqi population, often linked to dietary habits",
    },
    {
      name: "Hypertension",
      arabicName: "ارتفاع ضغط الدم",
      prevalence: "high",
      notes: "Prevalent especially in urban areas",
    },
    {
      name: "Cholera",
      arabicName: "الكوليرا",
      prevalence: "moderate",
      notes: "Endemic in some regions, water-borne",
    },
    {
      name: "Typhoid Fever",
      arabicName: "حمى التيفوئيد",
      prevalence: "moderate",
      notes: "Common in areas with poor sanitation",
    },
    {
      name: "Hepatitis A",
      arabicName: "التهاب الكبد أ",
      prevalence: "moderate",
      notes: "Food and water-borne",
    },
    {
      name: "Tuberculosis",
      arabicName: "السل",
      prevalence: "moderate",
      notes: "Still present in some regions",
    },
    {
      name: "Respiratory Infections",
      arabicName: "التهابات الجهاز التنفسي",
      prevalence: "high",
      notes: "Common due to dust storms and air pollution",
    },
    {
      name: "Cardiovascular Disease",
      arabicName: "أمراض القلب والأوعية الدموية",
      prevalence: "high",
      notes: "Leading cause of mortality",
    },
    {
      name: "Chronic Kidney Disease",
      arabicName: "أمراض الكلى المزمنة",
      prevalence: "moderate",
      notes: "Often related to diabetes and hypertension",
    },
  ],

  // Local medication names (Iraqi pharmaceutical market)
  localMedications: [
    {
      genericName: "Metformin",
      iraqiBrands: ["Glucophage", "Cidophage", "Metforal"],
      arabicName: "ميتفورمين",
      availability: "widely available",
    },
    {
      genericName: "Amlodipine",
      iraqiBrands: ["Norvasc", "Amlor"],
      arabicName: "أملوديبين",
      availability: "widely available",
    },
    {
      genericName: "Atorvastatin",
      iraqiBrands: ["Lipitor", "Atorva"],
      arabicName: "أتورفاستاتين",
      availability: "widely available",
    },
    {
      genericName: "Paracetamol",
      iraqiBrands: ["Panadol", "Fevadol", "Adol"],
      arabicName: "باراسيتامول",
      availability: "widely available",
    },
    {
      genericName: "Amoxicillin",
      iraqiBrands: ["Amoxil", "Augmentin"],
      arabicName: "أموكسيسيلين",
      availability: "widely available",
    },
    {
      genericName: "Omeprazole",
      iraqiBrands: ["Losec", "Omez"],
      arabicName: "أوميبرازول",
      availability: "widely available",
    },
  ],

  // Major Iraqi healthcare facilities
  healthcareFacilities: [
    {
      name: "Baghdad Medical City",
      arabicName: "مدينة الطب في بغداد",
      city: "Baghdad",
      type: "tertiary",
      specialties: ["cardiology", "oncology", "neurology", "trauma"],
    },
    {
      name: "Al-Yarmouk Teaching Hospital",
      arabicName: "مستشفى اليرموك التعليمي",
      city: "Baghdad",
      type: "tertiary",
      specialties: ["emergency", "surgery", "internal medicine"],
    },
    {
      name: "Basra General Hospital",
      arabicName: "مستشفى البصرة العام",
      city: "Basra",
      type: "secondary",
      specialties: ["general medicine", "surgery", "pediatrics"],
    },
    {
      name: "Rizgary Teaching Hospital",
      arabicName: "مستشفى رزكاري التعليمي",
      city: "Erbil",
      type: "tertiary",
      specialties: ["cardiology", "neurosurgery", "oncology"],
    },
    {
      name: "Mosul General Hospital",
      arabicName: "مستشفى الموصل العام",
      city: "Mosul",
      type: "secondary",
      specialties: ["emergency", "trauma", "general medicine"],
    },
  ],

  // Emergency services
  emergencyContacts: {
    ambulance: "122",
    civilDefense: "115",
    police: "104",
    iraqiRedCrescent: "+964 1 719 0085",
  },

  // Cultural considerations
  culturalConsiderations: [
    {
      aspect: "Gender Sensitivity",
      description: "Many patients prefer same-gender healthcare providers, especially for intimate examinations",
      recommendation: "Always offer gender-matched provider options when possible",
    },
    {
      aspect: "Family Involvement",
      description: "Family members often play a significant role in medical decision-making",
      recommendation: "Include family in consultations when appropriate, with patient consent",
    },
    {
      aspect: "Ramadan Health",
      description: "During Ramadan, medication timing and fasting considerations are important",
      recommendation: "Adjust medication schedules to accommodate fasting, provide guidance on safe fasting",
    },
    {
      aspect: "Traditional Medicine",
      description: "Many Iraqis use traditional remedies alongside modern medicine",
      recommendation: "Ask about traditional remedies to avoid interactions, integrate when safe",
    },
    {
      aspect: "Language",
      description: "Arabic is the primary language, with Kurdish in northern regions",
      recommendation: "Provide all medical information in Arabic, use interpreters when needed",
    },
    {
      aspect: "Privacy and Modesty",
      description: "Privacy and modesty are highly valued, especially for women",
      recommendation: "Ensure private examination spaces, minimize exposure during exams",
    },
  ],

  // System prompt enhancement for AI
  systemPromptAddition: `
IRAQI MEDICAL CONTEXT:

You are providing medical guidance for patients in Iraq. Consider these important factors:

1. Common Diseases in Iraq:
   - Diabetes and hypertension are very prevalent
   - Water-borne diseases (cholera, typhoid) occur in some regions
   - Respiratory infections are common due to dust storms
   - Cardiovascular disease is a leading cause of mortality

2. Local Medications:
   - Use Iraqi brand names when possible (e.g., Panadol for paracetamol)
   - Consider medication availability in Iraqi pharmacies
   - Be aware that some medications may be unavailable or expensive

3. Healthcare System:
   - Major facilities: Baghdad Medical City, Al-Yarmouk Hospital, Basra General Hospital
   - Emergency number: 122 (ambulance)
   - Iraqi Red Crescent: +964 1 719 0085

4. Cultural Considerations:
   - Respect gender preferences for healthcare providers
   - Include family in medical discussions when appropriate
   - Consider Ramadan fasting when prescribing medications
   - Ask about traditional remedies to avoid interactions
   - Prioritize privacy and modesty

5. Language:
   - Always provide information in Arabic
   - Use clear, simple Arabic medical terms
   - Avoid complex English medical jargon

When providing medical advice, take into account the Iraqi context, local disease prevalence, medication availability, and cultural sensitivities.
`,
};

// Helper function to get Iraqi context for AI prompts
export function getIraqiMedicalContextPrompt(): string {
  return iraqiMedicalContext.systemPromptAddition;
}

// Helper function to find local medication brands
export function findIraqiMedicationBrands(genericName: string): string[] {
  const med = iraqiMedicalContext.localMedications.find(
    m => m.genericName.toLowerCase() === genericName.toLowerCase()
  );
  return med?.iraqiBrands || [];
}

// Helper function to check disease prevalence in Iraq
export function getDiseasePrevalence(diseaseName: string): string | null {
  const disease = iraqiMedicalContext.commonDiseases.find(
    d => d.name.toLowerCase().includes(diseaseName.toLowerCase()) ||
         d.arabicName.includes(diseaseName)
  );
  return disease?.prevalence || null;
}
