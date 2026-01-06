/**
 * Seed script for Iraqi Healthcare Facilities
 * Run with: node scripts/seed-facilities.mjs
 */

import mysql from 'mysql2/promise';

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Iraqi Governorates with major cities
const governorates = [
  { name: "Baghdad", cities: ["Baghdad", "Kadhimiya", "Adhamiyah", "Karkh", "Rusafa", "Sadr City", "Mansour", "Karrada"] },
  { name: "Basra", cities: ["Basra", "Zubayr", "Abu Al-Khaseeb", "Fao", "Qurna"] },
  { name: "Nineveh", cities: ["Mosul", "Tal Afar", "Sinjar", "Hamdaniya", "Telkaif"] },
  { name: "Erbil", cities: ["Erbil", "Shaqlawa", "Soran", "Koya", "Rawanduz"] },
  { name: "Sulaymaniyah", cities: ["Sulaymaniyah", "Halabja", "Ranya", "Chamchamal", "Penjwin"] },
  { name: "Duhok", cities: ["Duhok", "Zakho", "Amedi", "Akre", "Semel"] },
  { name: "Kirkuk", cities: ["Kirkuk", "Hawija", "Dibis", "Daquq"] },
  { name: "Diyala", cities: ["Baqubah", "Muqdadiyah", "Khanaqin", "Balad Ruz"] },
  { name: "Anbar", cities: ["Ramadi", "Fallujah", "Hit", "Haditha", "Qaim"] },
  { name: "Najaf", cities: ["Najaf", "Kufa", "Manathira"] },
  { name: "Karbala", cities: ["Karbala", "Hindiya", "Ain Tamr"] },
  { name: "Babil", cities: ["Hillah", "Musayyib", "Mahawil", "Hashimiyah"] },
  { name: "Wasit", cities: ["Kut", "Numaniyah", "Suwaira", "Badra"] },
  { name: "Maysan", cities: ["Amarah", "Majar al-Kabir", "Ali al-Gharbi", "Qalat Saleh"] },
  { name: "Dhi Qar", cities: ["Nasiriyah", "Shatra", "Rifai", "Suq al-Shuyukh"] },
  { name: "Muthanna", cities: ["Samawah", "Rumaitha", "Khidhir"] },
  { name: "Qadisiyyah", cities: ["Diwaniyah", "Afak", "Shamiyah", "Hamza"] },
  { name: "Saladin", cities: ["Tikrit", "Samarra", "Baiji", "Balad", "Tuz Khurmatu"] },
];

const hospitalNames = [
  "Teaching Hospital", "General Hospital", "Central Hospital", "Medical City",
  "Specialized Hospital", "Children's Hospital", "Women's Hospital", "Heart Center",
  "Cancer Center", "Kidney Center", "Eye Hospital", "Orthopedic Hospital",
  "Psychiatric Hospital", "Rehabilitation Center", "Primary Health Center",
  "Community Health Center", "Family Health Center", "Maternal Health Center",
  "Emergency Hospital", "Surgical Hospital", "Private Hospital", "University Hospital"
];

const clinicNames = [
  "Family Clinic", "Medical Clinic", "Specialist Clinic", "Health Clinic",
  "Dental Clinic", "Eye Clinic", "Skin Clinic", "Children's Clinic",
  "Women's Clinic", "Cardiology Clinic", "Orthopedic Clinic", "ENT Clinic",
  "Neurology Clinic", "Urology Clinic", "Internal Medicine Clinic",
  "Psychiatric Clinic", "Physical Therapy Clinic", "Nutrition Clinic",
  "Laboratory", "Radiology Center", "Diagnostic Center", "Polyclinic"
];

const specialties = [
  "General Medicine", "Cardiology", "Orthopedics", "Pediatrics", "Obstetrics & Gynecology",
  "Neurology", "Ophthalmology", "ENT", "Dermatology", "Urology", "Oncology",
  "Gastroenterology", "Pulmonology", "Nephrology", "Endocrinology", "Rheumatology",
  "Psychiatry", "Emergency Medicine", "Surgery", "Internal Medicine", "Family Medicine",
  "Dental", "Radiology", "Laboratory", "Physical Therapy", "Nutrition"
];

// City coordinates
const cityCoordinates = {
  "Baghdad": { lat: 33.3152, lng: 44.3661 },
  "Basra": { lat: 30.5085, lng: 47.7804 },
  "Mosul": { lat: 36.3350, lng: 43.1189 },
  "Erbil": { lat: 36.1911, lng: 44.0094 },
  "Sulaymaniyah": { lat: 35.5613, lng: 45.4306 },
  "Duhok": { lat: 36.8669, lng: 42.9503 },
  "Kirkuk": { lat: 35.4681, lng: 44.3922 },
  "Najaf": { lat: 32.0000, lng: 44.3369 },
  "Karbala": { lat: 32.6160, lng: 44.0249 },
  "Hillah": { lat: 32.4637, lng: 44.4212 },
  "Nasiriyah": { lat: 31.0439, lng: 46.2575 },
  "Amarah": { lat: 31.8356, lng: 47.1449 },
  "Kut": { lat: 32.4907, lng: 45.8305 },
  "Ramadi": { lat: 33.4271, lng: 43.3010 },
  "Fallujah": { lat: 33.3500, lng: 43.7833 },
  "Tikrit": { lat: 34.6115, lng: 43.6769 },
  "Samarra": { lat: 34.1979, lng: 43.8750 },
  "Baqubah": { lat: 33.7500, lng: 44.6333 },
  "Diwaniyah": { lat: 31.9889, lng: 44.9267 },
  "Samawah": { lat: 31.3167, lng: 45.2833 },
  "Zakho": { lat: 37.1500, lng: 42.6833 },
  "Halabja": { lat: 35.1778, lng: 45.9833 },
};

function randomOffset(base, range = 0.05) {
  return base + (Math.random() - 0.5) * range * 2;
}

function generatePhone(governorate) {
  const areaCodes = {
    "Baghdad": "1", "Basra": "40", "Nineveh": "60", "Erbil": "66",
    "Sulaymaniyah": "53", "Duhok": "62", "Kirkuk": "50", "Diyala": "25",
    "Anbar": "24", "Najaf": "33", "Karbala": "32", "Babil": "30",
    "Wasit": "23", "Maysan": "42", "Dhi Qar": "42", "Muthanna": "36",
    "Qadisiyyah": "36", "Saladin": "21",
  };
  const code = areaCodes[governorate] || "1";
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `+964-${code}-${number}`;
}

function generateHours(type) {
  if (type === "emergency") return "24/7";
  const openHour = 7 + Math.floor(Math.random() * 3);
  const closeHour = 17 + Math.floor(Math.random() * 6);
  return `${openHour}:00 AM - ${closeHour > 12 ? closeHour - 12 : closeHour}:00 ${closeHour >= 12 ? 'PM' : 'AM'}`;
}

function generateServices(type, specialty) {
  const baseServices = ["Consultation", "Diagnosis", "Treatment", "Follow-up"];
  const hospitalServices = ["Emergency Care", "Surgery", "ICU", "Laboratory", "Radiology", "Pharmacy", "Inpatient Care"];
  const clinicServices = ["Outpatient Care", "Vaccination", "Health Screening", "Minor Procedures"];
  
  let services = [...baseServices];
  if (type === "hospital" || type === "emergency") {
    services = [...services, ...hospitalServices];
  } else {
    services = [...services, ...clinicServices];
  }
  if (specialty) services.push(`${specialty} Services`);
  return JSON.stringify(services.slice(0, 6 + Math.floor(Math.random() * 4)));
}

function generateRating() {
  return (3.5 + Math.random() * 1.5).toFixed(1);
}

async function seedFacilities() {
  console.log("🏥 Starting to seed Iraqi healthcare facilities...");
  
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log("✅ Connected to database");
  
  const facilities = [];
  
  // Generate facilities for each governorate
  for (const gov of governorates) {
    console.log(`📍 Generating facilities for ${gov.name}...`);
    
    for (const city of gov.cities) {
      const baseCoords = cityCoordinates[city] || cityCoordinates[gov.cities[0]] || { lat: 33.3, lng: 44.4 };
      
      // Generate hospitals (3-8 per city)
      const numHospitals = city === gov.cities[0] ? 5 + Math.floor(Math.random() * 4) : 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numHospitals; i++) {
        const hospitalName = hospitalNames[Math.floor(Math.random() * hospitalNames.length)];
        const specialty = specialties[Math.floor(Math.random() * specialties.length)];
        const isEmergency = Math.random() > 0.7;
        
        facilities.push([
          `${city} ${hospitalName}`,
          isEmergency ? "emergency" : "hospital",
          `${Math.floor(Math.random() * 100) + 1} Main Street, ${city}, ${gov.name}, Iraq`,
          city,
          randomOffset(baseCoords.lat, 0.03).toFixed(6),
          randomOffset(baseCoords.lng, 0.03).toFixed(6),
          generatePhone(gov.name),
          generateHours(isEmergency ? "emergency" : "hospital"),
          generateRating(),
          generateServices(isEmergency ? "emergency" : "hospital", specialty),
          specialty,
          isEmergency ? 1 : (Math.random() > 0.5 ? 1 : 0),
          `https://${city.toLowerCase().replace(/\s/g, '')}-hospital.iq`,
        ]);
      }
      
      // Generate clinics (10-30 per city)
      const numClinics = city === gov.cities[0] ? 20 + Math.floor(Math.random() * 15) : 8 + Math.floor(Math.random() * 10);
      for (let i = 0; i < numClinics; i++) {
        const clinicName = clinicNames[Math.floor(Math.random() * clinicNames.length)];
        const specialty = specialties[Math.floor(Math.random() * specialties.length)];
        const streets = ["Al-Rashid", "Al-Mansour", "Al-Karrada", "Al-Jadriya", "Al-Adhamiya"];
        
        facilities.push([
          `${clinicName} - ${city}`,
          Math.random() > 0.7 ? "specialist" : "clinic",
          `${Math.floor(Math.random() * 200) + 1} ${streets[Math.floor(Math.random() * streets.length)]} Street, ${city}, ${gov.name}, Iraq`,
          city,
          randomOffset(baseCoords.lat, 0.05).toFixed(6),
          randomOffset(baseCoords.lng, 0.05).toFixed(6),
          generatePhone(gov.name),
          generateHours("clinic"),
          generateRating(),
          generateServices("clinic", specialty),
          specialty,
          0,
          null,
        ]);
      }
      
      // Generate primary health centers (5-15 per city)
      const numPHCs = city === gov.cities[0] ? 10 + Math.floor(Math.random() * 8) : 4 + Math.floor(Math.random() * 6);
      for (let i = 0; i < numPHCs; i++) {
        facilities.push([
          `Primary Health Center - ${city} ${i + 1}`,
          "clinic",
          `District ${i + 1}, ${city}, ${gov.name}, Iraq`,
          city,
          randomOffset(baseCoords.lat, 0.06).toFixed(6),
          randomOffset(baseCoords.lng, 0.06).toFixed(6),
          generatePhone(gov.name),
          generateHours("clinic"),
          generateRating(),
          generateServices("clinic"),
          "Family Medicine",
          0,
          null,
        ]);
      }
    }
  }
  
  console.log(`📊 Generated ${facilities.length} facilities`);
  
  // Insert in batches
  const batchSize = 100;
  const insertQuery = `
    INSERT INTO facilities (name, type, address, city, latitude, longitude, phone, hours, rating, services, specialties, emergency_services, website)
    VALUES ?
  `;
  
  for (let i = 0; i < facilities.length; i += batchSize) {
    const batch = facilities.slice(i, i + batchSize);
    await connection.query(insertQuery, [batch]);
    console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(facilities.length / batchSize)}`);
  }
  
  await connection.end();
  console.log(`🎉 Successfully seeded ${facilities.length} Iraqi healthcare facilities!`);
  return facilities.length;
}

seedFacilities()
  .then((count) => {
    console.log(`Done! Seeded ${count} facilities.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding facilities:", error);
    process.exit(1);
  });
