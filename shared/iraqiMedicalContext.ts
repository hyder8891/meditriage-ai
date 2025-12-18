/**
 * Iraqi Medical Context
 * Common diseases, medications, and cultural considerations for Iraqi patients
 */

export const IRAQI_COMMON_DISEASES = {
  chronic: [
    {
      nameEn: 'Diabetes Mellitus',
      nameAr: 'السكري',
      prevalence: 'Very High',
      notes: 'Type 2 diabetes is highly prevalent in Iraq, often associated with dietary habits and genetic factors',
    },
    {
      nameEn: 'Hypertension',
      nameAr: 'ارتفاع ضغط الدم',
      prevalence: 'Very High',
      notes: 'High blood pressure is common, often undiagnosed until complications arise',
    },
    {
      nameEn: 'Cardiovascular Disease',
      nameAr: 'أمراض القلب والأوعية الدموية',
      prevalence: 'High',
      notes: 'Leading cause of mortality, linked to diabetes, hypertension, and smoking',
    },
    {
      nameEn: 'Chronic Kidney Disease',
      nameAr: 'أمراض الكلى المزمنة',
      prevalence: 'High',
      notes: 'Often secondary to diabetes and hypertension',
    },
  ],
  infectious: [
    {
      nameEn: 'Cholera',
      nameAr: 'الكوليرا',
      prevalence: 'Seasonal outbreaks',
      notes: 'Water-borne disease, outbreaks occur especially in summer months',
    },
    {
      nameEn: 'Typhoid Fever',
      nameAr: 'حمى التيفوئيد',
      prevalence: 'Endemic',
      notes: 'Common in areas with poor sanitation',
    },
    {
      nameEn: 'Hepatitis A & E',
      nameAr: 'التهاب الكبد أ و هـ',
      prevalence: 'Endemic',
      notes: 'Transmitted through contaminated food and water',
    },
    {
      nameEn: 'Tuberculosis',
      nameAr: 'السل',
      prevalence: 'Moderate',
      notes: 'Both pulmonary and extrapulmonary forms present',
    },
    {
      nameEn: 'Leishmaniasis',
      nameAr: 'داء الليشمانيات',
      prevalence: 'Endemic in certain regions',
      notes: 'Cutaneous form is most common',
    },
  ],
  respiratory: [
    {
      nameEn: 'Asthma',
      nameAr: 'الربو',
      prevalence: 'High',
      notes: 'Exacerbated by dust storms and air pollution',
    },
    {
      nameEn: 'COPD',
      nameAr: 'مرض الانسداد الرئوي المزمن',
      prevalence: 'High',
      notes: 'High smoking rates contribute to prevalence',
    },
    {
      nameEn: 'Respiratory Infections',
      nameAr: 'التهابات الجهاز التنفسي',
      prevalence: 'Very High',
      notes: 'Common especially in children and elderly',
    },
  ],
};

export const IRAQI_MEDICATIONS = {
  diabetes: [
    { generic: 'Metformin', brand: 'Glucophage', availability: 'Widely available' },
    { generic: 'Glibenclamide', brand: 'Daonil', availability: 'Widely available' },
    { generic: 'Insulin', brand: 'Mixtard, Actrapid', availability: 'Available in major hospitals' },
  ],
  hypertension: [
    { generic: 'Amlodipine', brand: 'Norvasc', availability: 'Widely available' },
    { generic: 'Enalapril', brand: 'Renitec', availability: 'Widely available' },
    { generic: 'Atenolol', brand: 'Tenormin', availability: 'Widely available' },
    { generic: 'Hydrochlorothiazide', brand: 'Various', availability: 'Widely available' },
  ],
  antibiotics: [
    { generic: 'Amoxicillin', brand: 'Amoxil', availability: 'Widely available' },
    { generic: 'Azithromycin', brand: 'Zithromax', availability: 'Widely available' },
    { generic: 'Ciprofloxacin', brand: 'Cipro', availability: 'Widely available' },
    { generic: 'Ceftriaxone', brand: 'Rocephin', availability: 'Hospital use' },
  ],
  pain: [
    { generic: 'Paracetamol', brand: 'Panadol', availability: 'Widely available OTC' },
    { generic: 'Ibuprofen', brand: 'Brufen', availability: 'Widely available OTC' },
    { generic: 'Diclofenac', brand: 'Voltaren', availability: 'Available' },
  ],
};

export const IRAQI_HEALTHCARE_FACILITIES = {
  baghdad: [
    { name: 'Baghdad Teaching Hospital', type: 'Public', specialty: 'General' },
    { name: 'Al-Yarmouk Teaching Hospital', type: 'Public', specialty: 'General' },
    { name: 'Medical City Complex', type: 'Public', specialty: 'Multi-specialty' },
    { name: 'Ibn Al-Nafees Hospital', type: 'Private', specialty: 'Cardiac' },
    { name: 'Al-Kadhimiya Teaching Hospital', type: 'Public', specialty: 'General' },
  ],
  basra: [
    { name: 'Basra General Hospital', type: 'Public', specialty: 'General' },
    { name: 'Basra Teaching Hospital', type: 'Public', specialty: 'General' },
    { name: 'Al-Sadr Teaching Hospital', type: 'Public', specialty: 'General' },
  ],
  erbil: [
    { name: 'Rizgary Teaching Hospital', type: 'Public', specialty: 'General' },
    { name: 'West Erbil Emergency Hospital', type: 'Public', specialty: 'Emergency' },
    { name: 'Hawler Medical University Hospital', type: 'Public', specialty: 'Teaching' },
  ],
  mosul: [
    { name: 'Ibn Al-Atheer Teaching Hospital', type: 'Public', specialty: 'Pediatric' },
    { name: 'Al-Salam Hospital', type: 'Public', specialty: 'General' },
  ],
};

export const EMERGENCY_CONTACTS = {
  ambulance: '122',
  police: '104',
  civilDefense: '115',
  baghdadEmergency: '130',
};

export const CULTURAL_CONSIDERATIONS = {
  gender: {
    title: 'Gender-Sensitive Care',
    considerations: [
      'Many female patients prefer female healthcare providers',
      'Male family members often accompany female patients',
      'Respect for modesty and privacy is paramount',
      'Consider gender-specific examination rooms',
    ],
  },
  family: {
    title: 'Family Involvement',
    considerations: [
      'Family members often participate in medical decisions',
      'Eldest male family member may be primary decision-maker',
      'Inform and involve family in treatment plans when appropriate',
      'Respect family hierarchy in communication',
    ],
  },
  ramadan: {
    title: 'Ramadan Health Considerations',
    considerations: [
      'Fasting from dawn to sunset affects medication timing',
      'Chronic disease management requires adjustment during Ramadan',
      'Dehydration risk increases, especially in summer',
      'Medication schedules should be adapted to Iftar and Suhoor times',
      'Diabetic patients need special monitoring',
    ],
  },
  traditional: {
    title: 'Traditional Medicine',
    considerations: [
      'Many patients use herbal remedies alongside modern medicine',
      'Ask about traditional treatments to avoid interactions',
      'Respect traditional practices while ensuring safety',
      'Cupping (حجامة) and herbal teas are commonly used',
    ],
  },
  communication: {
    title: 'Communication Style',
    considerations: [
      'Direct eye contact may be avoided as sign of respect',
      'Use of formal titles and respectful language is important',
      'Allow time for questions and family consultation',
      'Provide information in Arabic when possible',
      'Use simple, clear language avoiding medical jargon',
    ],
  },
};

export const IRAQI_MEDICAL_CONTEXT_PROMPT = `
IRAQI MEDICAL CONTEXT:
You are providing medical guidance for patients in Iraq. Consider the following context:

COMMON CONDITIONS IN IRAQ:
- Diabetes and hypertension are very prevalent
- Infectious diseases (cholera, typhoid, hepatitis A/E) are endemic
- Respiratory infections are common, exacerbated by dust storms
- Cardiovascular disease is a leading cause of mortality
- Water-borne diseases occur due to infrastructure challenges

MEDICATION AVAILABILITY:
- Common medications: Metformin, Amlodipine, Paracetamol are widely available
- Insulin and specialized medications available in major hospitals
- Generic medications are more accessible than branded ones
- Consider medication availability in Iraqi pharmacies

CULTURAL CONSIDERATIONS:
- Respect gender preferences in healthcare provider selection
- Family involvement in medical decisions is common
- During Ramadan, adjust medication timing for fasting schedules
- Many patients use traditional remedies - ask about herbal supplements
- Communicate clearly in Arabic when possible, use respectful language

HEALTHCARE SYSTEM:
- Major hospitals in Baghdad, Basra, Erbil, and Mosul
- Public healthcare system with limited resources
- Private hospitals available in major cities
- Emergency number: 122 (ambulance)

When providing medical advice, consider these Iraqi-specific factors while maintaining evidence-based medical standards.
`;
