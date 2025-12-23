import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

// Comprehensive Iraqi healthcare facilities data
const iraqiFacilities = [
  // Baghdad - Major Teaching Hospitals
  {
    name: "Baghdad Medical City",
    arabicName: "مدينة بغداد الطبية",
    phone: "+964-1-719-0000",
    address: "Bab Al-Moatham, Baghdad Medical City Complex",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3152",
    longitude: "44.3661",
    specialties: JSON.stringify(["General Surgery", "Cardiology", "Neurosurgery", "Oncology", "Emergency Medicine"]),
    subscriptionTier: "enterprise",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Baghdad Teaching Hospital",
    arabicName: "مستشفى بغداد التعليمي",
    phone: "+964-770-583-2828",
    address: "Bab Al-Moatham, Baghdad Medical City",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3155",
    longitude: "44.3665",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Internal Medicine", "Emergency"]),
    subscriptionTier: "enterprise",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al Yarmuk General Teaching Hospital",
    arabicName: "مستشفى اليرموك التعليمي",
    phone: "+964-770-583-2828",
    address: "Qahtan Square, Mansour District",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3025",
    longitude: "44.3358",
    specialties: JSON.stringify(["General Surgery", "Orthopedics", "Neurology", "Emergency Medicine"]),
    subscriptionTier: "enterprise",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al Kindi General Teaching Hospital",
    arabicName: "مستشفى الكندي التعليمي",
    phone: "+964-771-581-5147",
    address: "Al-Nahda Cross Road, Rusafa",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3280",
    longitude: "44.4125",
    specialties: JSON.stringify(["General Surgery", "Internal Medicine", "Pediatrics"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al-Imamian Al-Kadhimiyain Medical City",
    arabicName: "مدينة الإمامين الكاظمين الطبية",
    phone: "+964-1-523-0000",
    address: "Kadhimiya District",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3789",
    longitude: "44.3403",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Cardiology", "Pediatrics"]),
    subscriptionTier: "enterprise",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al Karama Teaching Hospital",
    arabicName: "مستشفى الكرامة التعليمي",
    phone: "+964-1-541-0000",
    address: "Sheik Maaruf, Karkh",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3125",
    longitude: "44.3215",
    specialties: JSON.stringify(["General Surgery", "Emergency Medicine", "Internal Medicine"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Baghdad - Specialized Hospitals
  {
    name: "Ibn Al Haitham Teaching Eye Hospital",
    arabicName: "مستشفى ابن الهيثم التعليمي للعيون",
    phone: "+964-1-718-5000",
    address: "Karrada, Andulus Square",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3089",
    longitude: "44.4125",
    specialties: JSON.stringify(["Ophthalmology", "Eye Surgery", "Optometry"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Ibn Al Nafis Vascular and Cardiac Hospital",
    arabicName: "مستشفى ابن النفيس للقلب والأوعية الدموية",
    phone: "+964-1-542-8000",
    address: "Rusafa, Yermouk",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3045",
    longitude: "44.3385",
    specialties: JSON.stringify(["Cardiology", "Cardiac Surgery", "Vascular Surgery"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Central Pediatric Teaching Hospital",
    arabicName: "مستشفى الأطفال المركزي التعليمي",
    phone: "+964-1-541-2000",
    address: "Al-Iskan, Karkh",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3158",
    longitude: "44.3125",
    specialties: JSON.stringify(["Pediatrics", "Neonatology", "Pediatric Surgery"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Neurosurgery Teaching Hospital",
    arabicName: "مستشفى جراحة الأعصاب التعليمي",
    phone: "+964-1-719-2000",
    address: "Baghdad, AlRissafa",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3265",
    longitude: "44.4058",
    specialties: JSON.stringify(["Neurosurgery", "Neurology", "Spine Surgery"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al-Rashad Psychiatric Hospital",
    arabicName: "مستشفى الرشاد للأمراض النفسية",
    phone: "+964-772-572-9276",
    address: "Al-Rashad, Rusafa",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3425",
    longitude: "44.4258",
    specialties: JSON.stringify(["Psychiatry", "Mental Health", "Addiction Treatment"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Baghdad - Maternity & Children's Hospitals
  {
    name: "Al Alwaiya Maternity Teaching Hospital",
    arabicName: "مستشفى العلوية التعليمي للولادة",
    phone: "+964-1-718-3000",
    address: "Alwaiya, Karadah",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3095",
    longitude: "44.4135",
    specialties: JSON.stringify(["Obstetrics", "Gynecology", "Maternity Care"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al Alwaiya Children Teaching Hospital",
    arabicName: "مستشفى العلوية التعليمي للأطفال",
    phone: "+964-1-718-3100",
    address: "Alwaiya, Karadah",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3098",
    longitude: "44.4138",
    specialties: JSON.stringify(["Pediatrics", "Pediatric Surgery", "Neonatology"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Baghdad - Private Hospitals
  {
    name: "AL-Jadiriyah Hospital",
    arabicName: "مستشفى الجادرية الخاص",
    phone: "+964-770-073-1717",
    address: "AL-Nahda Cross Road",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.2925",
    longitude: "44.3958",
    specialties: JSON.stringify(["General Surgery", "Internal Medicine", "Emergency"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "AL-Khadhimiya Private Hospital",
    arabicName: "مستشفى الكاظمية الخاص",
    phone: "+964-782-223-9997",
    address: "60 St. AL Khadhimiya",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3785",
    longitude: "44.3398",
    specialties: JSON.stringify(["General Surgery", "Orthopedics", "Internal Medicine"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Ibn Sina Hospital",
    arabicName: "مستشفى ابن سينا",
    phone: "+964-780-380-9000",
    address: "Al Tashrea, District 211 IZ",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3125",
    longitude: "44.3785",
    specialties: JSON.stringify(["General Surgery", "Internal Medicine", "Emergency"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Saint Raphael Hospital",
    arabicName: "مستشفى القديس رافائيل",
    phone: "+964-780-633-3313",
    address: "Karada Dakhil Near Kahramana Square",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3058",
    longitude: "44.4185",
    specialties: JSON.stringify(["General Surgery", "Cardiology", "Orthopedics"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Kamal Al-Samarri Hospital",
    arabicName: "مستشفى كمال السامرائي",
    phone: "+964-770-724-4056",
    address: "Andalus Square",
    city: "Baghdad",
    country: "Iraq",
    latitude: "33.3015",
    longitude: "44.3425",
    specialties: JSON.stringify(["Obstetrics", "Gynecology", "Maternity Care"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Basra - Teaching Hospitals
  {
    name: "Al Basrah General Teaching Hospital",
    arabicName: "مستشفى البصرة التعليمي العام",
    phone: "+964-780-015-2588",
    address: "Near Saad Square",
    city: "Basra",
    country: "Iraq",
    latitude: "30.5085",
    longitude: "47.7835",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Emergency", "Internal Medicine"]),
    subscriptionTier: "enterprise",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al Sadir Teaching Hospital",
    arabicName: "مستشفى الصدر التعليمي",
    phone: "+964-40-123-4567",
    address: "Central Basra",
    city: "Basra",
    country: "Iraq",
    latitude: "30.5125",
    longitude: "47.7895",
    specialties: JSON.stringify(["General Surgery", "Cardiology", "Neurology"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al Fayhaa General Teaching Hospital",
    arabicName: "مستشفى الفيحاء التعليمي العام",
    phone: "+964-40-234-5678",
    address: "Al Fayhaa District",
    city: "Basra",
    country: "Iraq",
    latitude: "30.5165",
    longitude: "47.7925",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Pediatrics"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al Basrah Maternity & Children's Teaching Hospital",
    arabicName: "مستشفى البصرة التعليمي للولادة والأطفال",
    phone: "+964-40-345-6789",
    address: "Central Basra",
    city: "Basra",
    country: "Iraq",
    latitude: "30.5145",
    longitude: "47.7865",
    specialties: JSON.stringify(["Obstetrics", "Gynecology", "Pediatrics", "Neonatology"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Basra - General Hospitals
  {
    name: "Al Zubair General Hospital",
    arabicName: "مستشفى الزبير العام",
    phone: "+964-40-456-7890",
    address: "Al Zubair District",
    city: "Basra",
    country: "Iraq",
    latitude: "30.3895",
    longitude: "47.7015",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Emergency"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Abu Al-Khaseeb General Hospital",
    arabicName: "مستشفى أبو الخصيب العام",
    phone: "+964-40-567-8901",
    address: "Abu Al-Khaseeb",
    city: "Basra",
    country: "Iraq",
    latitude: "30.4625",
    longitude: "48.0125",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Emergency"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Erbil - Major Hospitals
  {
    name: "PAR Hospital",
    arabicName: "مستشفى بار",
    phone: "+964-66-210-7001",
    email: "info@parhospital.org",
    address: "60 meter Road @ Mamostayan Quarter",
    city: "Erbil",
    country: "Iraq",
    latitude: "36.1912",
    longitude: "44.0095",
    specialties: JSON.stringify(["General Surgery", "Cardiology", "Orthopedics", "Emergency"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Zheen Hospital",
    arabicName: "مستشفى ژين",
    phone: "+964-66-255-2518",
    email: "Info@zheenhospital.com",
    address: "100 meter Road @ Koya intersection",
    city: "Erbil",
    country: "Iraq",
    latitude: "36.2058",
    longitude: "44.0325",
    specialties: JSON.stringify(["General Surgery", "Internal Medicine", "Emergency"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Rapareen Teaching Hospital for Pediatrics",
    arabicName: "مستشفى رابرين التعليمي للأطفال",
    phone: "+964-66-222-3000",
    address: "Central Erbil",
    city: "Erbil",
    country: "Iraq",
    latitude: "36.1875",
    longitude: "44.0085",
    specialties: JSON.stringify(["Pediatrics", "Pediatric Surgery", "Neonatology"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Rizgary Teaching Hospital",
    arabicName: "مستشفى رزكاري التعليمي",
    phone: "+964-66-223-4000",
    address: "Central Erbil",
    city: "Erbil",
    country: "Iraq",
    latitude: "36.1895",
    longitude: "44.0125",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Emergency"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Hawler Teaching Hospital",
    arabicName: "مستشفى هەولێر التعليمي",
    phone: "+964-66-224-5000",
    address: "Central Erbil",
    city: "Erbil",
    country: "Iraq",
    latitude: "36.1915",
    longitude: "44.0145",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Internal Medicine"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Erbil - Specialized Centers
  {
    name: "Emergency Management Center (EMC) Hospital",
    arabicName: "مستشفى مركز إدارة الطوارئ",
    phone: "+964-66-222-4911",
    email: "info@emc-hospitals.org",
    address: "60 meter road, next to Ministry of Justice",
    city: "Erbil",
    country: "Iraq",
    latitude: "36.1935",
    longitude: "44.0115",
    specialties: JSON.stringify(["Emergency Medicine", "Trauma", "Critical Care"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "West Eye Hospital",
    arabicName: "مستشفى العيون الغربي",
    phone: "+964-750-483-6007",
    email: "info@westeyehospitalerbil.com",
    address: "Eskan Street, Ronaki Quarter",
    city: "Erbil",
    country: "Iraq",
    latitude: "36.1825",
    longitude: "44.0025",
    specialties: JSON.stringify(["Ophthalmology", "Eye Surgery", "Optometry"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Swedish Specialty Clinic",
    arabicName: "العيادة السويدية المتخصصة",
    phone: "+964-750-869-1414",
    email: "info@swedishhospital.com",
    address: "100 meter Road (behind Hoger Oil station)",
    city: "Erbil",
    country: "Iraq",
    latitude: "36.2015",
    longitude: "44.0285",
    specialties: JSON.stringify(["Ophthalmology", "Eye Care"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Erbil - Clinics
  {
    name: "The Rose Clinic",
    arabicName: "عيادة الوردة",
    phone: "+964-750-872-5533",
    email: "dylaan@rosehealthclinic.com",
    address: "40 meter road between Massif Rd & Hay Shorta Sq.",
    city: "Erbil",
    country: "Iraq",
    latitude: "36.1885",
    longitude: "44.0055",
    specialties: JSON.stringify(["Primary Care", "Urgent Care", "Internal Medicine"]),
    subscriptionTier: "individual",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Santa Maria Medical Complex",
    arabicName: "مجمع سانتا ماريا الطبي",
    phone: "+964-750-130-0013",
    email: "st.maria.med@gmail.com",
    address: "Ashtar St. (adjacent to US Consulate entrance), Ankawa",
    city: "Erbil",
    country: "Iraq",
    latitude: "36.2125",
    longitude: "44.0425",
    specialties: JSON.stringify(["General Medicine", "Dentistry", "Pharmacy"]),
    subscriptionTier: "individual",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Mosul/Ninawa - Major Hospitals
  {
    name: "Al-Salam Teaching Hospital",
    arabicName: "مستشفى السلام التعليمي",
    phone: "+964-60-123-4567",
    address: "Central Mosul",
    city: "Mosul",
    country: "Iraq",
    latitude: "36.3350",
    longitude: "43.1189",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Emergency"]),
    subscriptionTier: "enterprise",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Ibn Seena Teaching Hospital",
    arabicName: "مستشفى ابن سينا التعليمي",
    phone: "+964-60-234-5678",
    address: "Central Mosul",
    city: "Mosul",
    country: "Iraq",
    latitude: "36.3385",
    longitude: "43.1225",
    specialties: JSON.stringify(["General Surgery", "Internal Medicine", "Cardiology"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Ibn Alatheer Children's Hospital",
    arabicName: "مستشفى ابن الأثير للأطفال",
    phone: "+964-60-345-6789",
    address: "Central Mosul",
    city: "Mosul",
    country: "Iraq",
    latitude: "36.3365",
    longitude: "43.1205",
    specialties: JSON.stringify(["Pediatrics", "Pediatric Surgery", "Neonatology"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al Batool Hospital for Gynaecology & Obstetrics",
    arabicName: "مستشفى البتول للنسائية والتوليد",
    phone: "+964-60-456-7890",
    address: "Central Mosul",
    city: "Mosul",
    country: "Iraq",
    latitude: "36.3375",
    longitude: "43.1215",
    specialties: JSON.stringify(["Obstetrics", "Gynecology", "Maternity Care"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Sulaymaniyah - Governmental Hospitals
  {
    name: "Sulaimanyah Teaching Hospital",
    arabicName: "مستشفى سليمانية التعليمي",
    phone: "+964-53-123-4567",
    address: "Central Sulaymaniyah",
    city: "Sulaymaniyah",
    country: "Iraq",
    latitude: "35.5558",
    longitude: "45.4375",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Internal Medicine"]),
    subscriptionTier: "enterprise",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Shorsh General Teaching Hospital",
    arabicName: "مستشفى شورش التعليمي العام",
    phone: "+964-53-234-5678",
    address: "Central Sulaymaniyah",
    city: "Sulaymaniyah",
    country: "Iraq",
    latitude: "35.5585",
    longitude: "45.4425",
    specialties: JSON.stringify(["General Surgery", "Emergency", "Trauma"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Sulaimanyah Pediatric Hospital",
    arabicName: "مستشفى سليمانية للأطفال",
    phone: "+964-53-345-6789",
    address: "Central Sulaymaniyah",
    city: "Sulaymaniyah",
    country: "Iraq",
    latitude: "35.5565",
    longitude: "45.4395",
    specialties: JSON.stringify(["Pediatrics", "Pediatric Surgery", "Neonatology"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Hewa Oncological Hospital",
    arabicName: "مستشفى هيوا للأورام",
    phone: "+964-53-456-7890",
    address: "Central Sulaymaniyah",
    city: "Sulaymaniyah",
    country: "Iraq",
    latitude: "35.5595",
    longitude: "45.4445",
    specialties: JSON.stringify(["Oncology", "Cancer Treatment", "Radiation Therapy"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Sulaymaniyah - Private Hospitals
  {
    name: "Faruk Medical City",
    arabicName: "مدينة فاروق الطبية",
    phone: "+964-53-567-8901",
    address: "Central Sulaymaniyah",
    city: "Sulaymaniyah",
    country: "Iraq",
    latitude: "35.5615",
    longitude: "45.4465",
    specialties: JSON.stringify(["General Surgery", "Cardiology", "Orthopedics", "Emergency"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Kurdistan Private Hospital",
    arabicName: "مستشفى كردستان الخاص",
    phone: "+964-53-678-9012",
    address: "Central Sulaymaniyah",
    city: "Sulaymaniyah",
    country: "Iraq",
    latitude: "35.5625",
    longitude: "45.4485",
    specialties: JSON.stringify(["General Surgery", "Internal Medicine", "Emergency"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Duhok - Hospitals
  {
    name: "Azadi Teaching Hospital",
    arabicName: "مستشفى ئازادی التعليمي",
    phone: "+964-62-123-4567",
    address: "Central Duhok",
    city: "Duhok",
    country: "Iraq",
    latitude: "36.8625",
    longitude: "42.9985",
    specialties: JSON.stringify(["Internal Medicine", "General Surgery", "Cardiology"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Baroshki Emergency Teaching Hospital",
    arabicName: "مستشفى باروشكي التعليمي للطوارئ",
    phone: "+964-62-234-5678",
    address: "Central Duhok",
    city: "Duhok",
    country: "Iraq",
    latitude: "36.8645",
    longitude: "43.0015",
    specialties: JSON.stringify(["Emergency Medicine", "Trauma", "Surgery"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Hevi Pediatrics Teaching Hospital",
    arabicName: "مستشفى هيفي التعليمي للأطفال",
    phone: "+964-62-345-6789",
    address: "Central Duhok",
    city: "Duhok",
    country: "Iraq",
    latitude: "36.8635",
    longitude: "43.0005",
    specialties: JSON.stringify(["Pediatrics", "Pediatric Surgery", "Neonatology"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Kirkuk - Hospitals
  {
    name: "Kirkuk General Hospital",
    arabicName: "مستشفى كركوك العام",
    phone: "+964-50-123-4567",
    address: "Central Kirkuk",
    city: "Kirkuk",
    country: "Iraq",
    latitude: "35.4681",
    longitude: "44.3922",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Emergency"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Azadi General Hospital",
    arabicName: "مستشفى ئازادی العام",
    phone: "+964-50-234-5678",
    address: "Central Kirkuk",
    city: "Kirkuk",
    country: "Iraq",
    latitude: "35.4695",
    longitude: "44.3945",
    specialties: JSON.stringify(["General Surgery", "Internal Medicine", "Emergency"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Karbala - Hospitals
  {
    name: "Al Hussain General Hospital",
    arabicName: "مستشفى الحسين العام",
    phone: "+964-773-502-5444",
    address: "Central Karbala",
    city: "Karbala",
    country: "Iraq",
    latitude: "32.6149",
    longitude: "44.0245",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Emergency"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Alkafeel Super Specialized Hospital",
    arabicName: "مستشفى الكفيل التخصصي",
    phone: "+964-773-123-4567",
    address: "Central Karbala",
    city: "Karbala",
    country: "Iraq",
    latitude: "32.6165",
    longitude: "44.0265",
    specialties: JSON.stringify(["Cardiology", "Neurosurgery", "Oncology", "Orthopedics"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Imam Zain AlAbiden Hospital",
    arabicName: "مستشفى الإمام زين العابدين",
    phone: "+964-773-502-5444",
    address: "Ahmed Al-Wa'ily Street 56001",
    city: "Karbala",
    country: "Iraq",
    latitude: "32.6155",
    longitude: "44.0255",
    specialties: JSON.stringify(["General Surgery", "Internal Medicine", "Emergency"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Najaf - Hospitals
  {
    name: "Al Sader General Teaching Hospital",
    arabicName: "مستشفى الصدر التعليمي العام",
    phone: "+964-33-123-4567",
    address: "Central Najaf",
    city: "Najaf",
    country: "Iraq",
    latitude: "31.9996",
    longitude: "44.3148",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Emergency"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al-Furat Al-Awsat Teaching Hospital",
    arabicName: "مستشفى الفرات الأوسط التعليمي",
    phone: "+964-33-234-5678",
    address: "Central Najaf",
    city: "Najaf",
    country: "Iraq",
    latitude: "32.0015",
    longitude: "44.3175",
    specialties: JSON.stringify(["General Surgery", "Cardiology", "Internal Medicine"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al Najaf Teaching Hospital",
    arabicName: "مستشفى النجف التعليمي",
    phone: "+964-33-345-6789",
    address: "Central Najaf",
    city: "Najaf",
    country: "Iraq",
    latitude: "32.0005",
    longitude: "44.3165",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Emergency"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Babil/Babel - Hospitals
  {
    name: "Al Hilla Teaching Hospital",
    arabicName: "مستشفى الحلة التعليمي",
    phone: "+964-30-123-4567",
    address: "Central Hillah",
    city: "Hillah",
    country: "Iraq",
    latitude: "32.4722",
    longitude: "44.4219",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Emergency"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Merjan Medical City",
    arabicName: "مدينة ميرجان الطبية",
    phone: "+964-750-176-4676",
    address: "Central Hillah",
    city: "Hillah",
    country: "Iraq",
    latitude: "32.4745",
    longitude: "44.4245",
    specialties: JSON.stringify(["Internal Medicine", "Cardiology", "General Surgery"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al Hayat Private Hospital",
    arabicName: "مستشفى الحياة الخاص",
    phone: "+964-780-143-6736",
    address: "Hillah – Al-Jazaer Quarter",
    city: "Hillah",
    country: "Iraq",
    latitude: "32.4735",
    longitude: "44.4235",
    specialties: JSON.stringify(["General Surgery", "Internal Medicine", "Emergency"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Diyala - Hospitals
  {
    name: "Ba'quba General Hospital",
    arabicName: "مستشفى بعقوبة العام",
    phone: "+964-23-123-4567",
    address: "Central Ba'quba",
    city: "Ba'quba",
    country: "Iraq",
    latitude: "33.7486",
    longitude: "44.6447",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Emergency"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al Batool Maternity & Children Specialized Hospital",
    arabicName: "مستشفى البتول التخصصي للولادة والأطفال",
    phone: "+964-23-234-5678",
    address: "Central Ba'quba",
    city: "Ba'quba",
    country: "Iraq",
    latitude: "33.7505",
    longitude: "44.6475",
    specialties: JSON.stringify(["Obstetrics", "Gynecology", "Pediatrics"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  },
  
  // Dhi Qar - Hospitals
  {
    name: "Al-Hussein Teaching Hospital",
    arabicName: "مستشفى الحسين التعليمي",
    phone: "+964-42-123-4567",
    address: "Central Nasiriyah",
    city: "Nasiriyah",
    country: "Iraq",
    latitude: "31.0569",
    longitude: "46.2572",
    specialties: JSON.stringify(["General Medicine", "Surgery", "Emergency"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Al-Nasiriyah Teaching Hospital",
    arabicName: "مستشفى الناصرية التعليمي",
    phone: "+964-42-234-5678",
    address: "Central Nasiriyah",
    city: "Nasiriyah",
    country: "Iraq",
    latitude: "31.0585",
    longitude: "46.2595",
    specialties: JSON.stringify(["General Surgery", "Internal Medicine", "Emergency"]),
    subscriptionTier: "medium",
    subscriptionStatus: "active",
    ownerId: 1
  },
  {
    name: "Nasiriyah Heart Center",
    arabicName: "مركز الناصرية للقلب",
    phone: "+964-42-345-6789",
    address: "Central Nasiriyah",
    city: "Nasiriyah",
    country: "Iraq",
    latitude: "31.0575",
    longitude: "46.2585",
    specialties: JSON.stringify(["Cardiology", "Cardiac Surgery", "Interventional Cardiology"]),
    subscriptionTier: "small",
    subscriptionStatus: "active",
    ownerId: 1
  }
];

console.log(`Preparing to seed ${iraqiFacilities.length} Iraqi healthcare facilities...`);

try {
  // Insert all facilities
  for (const facility of iraqiFacilities) {
    await db.insert(schema.clinics).values(facility);
    console.log(`✓ Added: ${facility.name} (${facility.city})`);
  }
  
  console.log(`\n✅ Successfully seeded ${iraqiFacilities.length} healthcare facilities!`);
  console.log('\nCities covered:');
  const cities = [...new Set(iraqiFacilities.map(f => f.city))].sort();
  cities.forEach(city => {
    const count = iraqiFacilities.filter(f => f.city === city).length;
    console.log(`  - ${city}: ${count} facilities`);
  });
  
} catch (error) {
  console.error('❌ Error seeding facilities:', error);
  process.exit(1);
} finally {
  await connection.end();
}
