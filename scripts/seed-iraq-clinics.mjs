/**
 * Seed script for Iraq clinics/hospitals data
 * Run with: node scripts/seed-iraq-clinics.mjs
 */

import mysql from 'mysql2/promise';

const clinicsData = [
  // BAGHDAD - Teaching Hospitals
  { name: "Baghdad Teaching Hospital", nameArabic: "مستشفى بغداد التعليمي", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Bab Al-Moatham", districtArabic: "باب المعظم", facilityType: "teaching_hospital", bedCount: 998, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine", "pediatrics"]), source: "WHO/Wikipedia" },
  { name: "Shahid Ghazi al Harery Surgical Hospital", nameArabic: "مستشفى الشهيد غازي الحريري الجراحي", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Medical City", districtArabic: "مدينة الطب", facilityType: "teaching_hospital", bedCount: 672, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["surgery", "trauma"]), source: "WHO/Wikipedia" },
  { name: "Al Yarmuk General Teaching Hospital", nameArabic: "مستشفى اليرموك التعليمي العام", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Yarmouk", districtArabic: "اليرموك", facilityType: "teaching_hospital", bedCount: 770, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "emergency"]), source: "WHO/Wikipedia" },
  { name: "Al Kindi General Teaching Hospital", nameArabic: "مستشفى الكندي التعليمي العام", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Rusafa", districtArabic: "الرصافة", facilityType: "teaching_hospital", bedCount: 333, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Al-Imamian Al-Kadhimiyain Medical City", nameArabic: "مدينة الإمامين الكاظميين الطبية", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Kadhimiya", districtArabic: "الكاظمية", facilityType: "medical_city", bedCount: 630, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["cardiology", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Ibn Al Haitham Teaching Eye Hospital", nameArabic: "مستشفى ابن الهيثم التعليمي للعيون", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Karrada", districtArabic: "الكرادة", facilityType: "specialized_hospital", bedCount: 400, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["ophthalmology"]), source: "WHO/Wikipedia" },
  { name: "Al Karama Teaching Hospital", nameArabic: "مستشفى الكرامة التعليمي", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Karkh", districtArabic: "الكرخ", facilityType: "teaching_hospital", bedCount: 445, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Ibn Sina Hospital", nameArabic: "مستشفى ابن سينا", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Green Zone", districtArabic: "المنطقة الخضراء", facilityType: "general_hospital", bedCount: 200, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "vip_care"]), source: "WHO/Wikipedia" },
  { name: "Central Pediatric Teaching Hospital", nameArabic: "مستشفى الأطفال المركزي التعليمي", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Al-Iskan", districtArabic: "الإسكان", facilityType: "children_hospital", bedCount: 333, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["pediatrics", "neonatology"]), source: "WHO/Wikipedia" },
  { name: "Ibn Al Nafis Vascular and Cardiac Hospital", nameArabic: "مستشفى ابن النفيس للقلب والأوعية الدموية", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Rusafa", districtArabic: "الرصافة", facilityType: "specialized_hospital", bedCount: 170, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["cardiology", "vascular_surgery"]), source: "WHO/Wikipedia" },
  
  // BAGHDAD - Private Hospitals
  { name: "Al Rahibat Hospital", nameArabic: "مستشفى الراهبات", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Karrada", districtArabic: "الكرادة", facilityType: "private_hospital", bedCount: 100, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "maternity"]), source: "Wikipedia" },
  { name: "Al Rafidain Hospital", nameArabic: "مستشفى الرافدين", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Mansour", districtArabic: "المنصور", facilityType: "private_hospital", bedCount: 80, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "Wikipedia" },
  { name: "Dar Al Salam Hospital", nameArabic: "مستشفى دار السلام", governorate: "Baghdad", governorateArabic: "بغداد", city: "Baghdad", cityArabic: "بغداد", district: "Karrada", districtArabic: "الكرادة", facilityType: "private_hospital", bedCount: 75, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "Wikipedia" },
  
  // BASRA
  { name: "Al Basrah General Teaching Hospital", nameArabic: "مستشفى البصرة التعليمي العام", governorate: "Basra", governorateArabic: "البصرة", city: "Basra", cityArabic: "البصرة", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 500, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Al Sadir Teaching Hospital", nameArabic: "مستشفى الصدر التعليمي", governorate: "Basra", governorateArabic: "البصرة", city: "Basra", cityArabic: "البصرة", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 400, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Al Fayhaa General Teaching Hospital", nameArabic: "مستشفى الفيحاء التعليمي العام", governorate: "Basra", governorateArabic: "البصرة", city: "Basra", cityArabic: "البصرة", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 350, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Al Basrah Maternity & Children's Teaching Hospital", nameArabic: "مستشفى البصرة للنسائية والأطفال التعليمي", governorate: "Basra", governorateArabic: "البصرة", city: "Basra", cityArabic: "البصرة", district: "Center", districtArabic: "المركز", facilityType: "maternity_hospital", bedCount: 300, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["obstetrics", "gynecology", "pediatrics"]), source: "WHO/Wikipedia" },
  { name: "Mossawi Hospital", nameArabic: "مستشفى الموسوي", governorate: "Basra", governorateArabic: "البصرة", city: "Basra", cityArabic: "البصرة", district: "Center", districtArabic: "المركز", facilityType: "private_hospital", bedCount: 100, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "Wikipedia" },
  
  // ERBIL (Kurdistan)
  { name: "Rizgary Teaching Hospital", nameArabic: "مستشفى رزكاري التعليمي", governorate: "Erbil", governorateArabic: "أربيل", city: "Erbil", cityArabic: "أربيل", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 400, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Hawler Teaching Hospital", nameArabic: "مستشفى هولير التعليمي", governorate: "Erbil", governorateArabic: "أربيل", city: "Erbil", cityArabic: "أربيل", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 350, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Rapareen Teaching Hospital for Pediatrics", nameArabic: "مستشفى رابرين للأطفال التعليمي", governorate: "Erbil", governorateArabic: "أربيل", city: "Erbil", cityArabic: "أربيل", district: "Center", districtArabic: "المركز", facilityType: "children_hospital", bedCount: 200, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["pediatrics", "neonatology"]), source: "WHO/Wikipedia" },
  { name: "Maternity Teaching Hospital", nameArabic: "مستشفى الولادة التعليمي", governorate: "Erbil", governorateArabic: "أربيل", city: "Erbil", cityArabic: "أربيل", district: "Center", districtArabic: "المركز", facilityType: "maternity_hospital", bedCount: 250, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["obstetrics", "gynecology"]), source: "WHO/Wikipedia" },
  { name: "PAR Hospital", nameArabic: "مستشفى بار", governorate: "Erbil", governorateArabic: "أربيل", city: "Erbil", cityArabic: "أربيل", district: "60m Street", districtArabic: "شارع 60 متر", facilityType: "private_hospital", bedCount: 150, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "cardiology"]), source: "Wikipedia" },
  { name: "CMC Hospital", nameArabic: "مستشفى سي ام سي", governorate: "Erbil", governorateArabic: "أربيل", city: "Erbil", cityArabic: "أربيل", district: "Ainkawa", districtArabic: "عينكاوة", facilityType: "private_hospital", bedCount: 120, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "Wikipedia" },
  { name: "Zheen International Hospital", nameArabic: "مستشفى ژين الدولي", governorate: "Erbil", governorateArabic: "أربيل", city: "Erbil", cityArabic: "أربيل", district: "Center", districtArabic: "المركز", facilityType: "private_hospital", bedCount: 100, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "orthopedics"]), source: "Wikipedia" },
  
  // SULAYMANIYAH (Kurdistan)
  { name: "Sulaymaniyah Teaching Hospital", nameArabic: "مستشفى السليمانية التعليمي", governorate: "Sulaymaniyah", governorateArabic: "السليمانية", city: "Sulaymaniyah", cityArabic: "السليمانية", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 450, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Shorsh General Hospital", nameArabic: "مستشفى شورش العام", governorate: "Sulaymaniyah", governorateArabic: "السليمانية", city: "Sulaymaniyah", cityArabic: "السليمانية", district: "Center", districtArabic: "المركز", facilityType: "general_hospital", bedCount: 300, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Shahid Aso Heart Center", nameArabic: "مركز الشهيد آسو للقلب", governorate: "Sulaymaniyah", governorateArabic: "السليمانية", city: "Sulaymaniyah", cityArabic: "السليمانية", district: "Center", districtArabic: "المركز", facilityType: "specialized_hospital", bedCount: 100, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["cardiology", "cardiac_surgery"]), source: "WHO/Wikipedia" },
  { name: "Hiwa Cancer Hospital", nameArabic: "مستشفى هيوا للسرطان", governorate: "Sulaymaniyah", governorateArabic: "السليمانية", city: "Sulaymaniyah", cityArabic: "السليمانية", district: "Center", districtArabic: "المركز", facilityType: "specialized_hospital", bedCount: 150, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["oncology", "radiotherapy"]), source: "WHO/Wikipedia" },
  { name: "Shar Teaching Hospital", nameArabic: "مستشفى شار التعليمي", governorate: "Sulaymaniyah", governorateArabic: "السليمانية", city: "Sulaymaniyah", cityArabic: "السليمانية", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 250, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  
  // DUHOK (Kurdistan)
  { name: "Azadi Teaching Hospital", nameArabic: "مستشفى آزادي التعليمي", governorate: "Duhok", governorateArabic: "دهوك", city: "Duhok", cityArabic: "دهوك", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 350, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Baroshki Emergency Teaching Hospital", nameArabic: "مستشفى باروشكي للطوارئ التعليمي", governorate: "Duhok", governorateArabic: "دهوك", city: "Duhok", cityArabic: "دهوك", district: "Center", districtArabic: "المركز", facilityType: "emergency_center", bedCount: 200, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["emergency", "trauma", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Hevi Pediatrics Teaching Hospital", nameArabic: "مستشفى هيفي للأطفال التعليمي", governorate: "Duhok", governorateArabic: "دهوك", city: "Duhok", cityArabic: "دهوك", district: "Center", districtArabic: "المركز", facilityType: "children_hospital", bedCount: 150, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["pediatrics", "neonatology"]), source: "WHO/Wikipedia" },
  { name: "Wan Global International Hospital", nameArabic: "مستشفى وان العالمي الدولي", governorate: "Duhok", governorateArabic: "دهوك", city: "Duhok", cityArabic: "دهوك", district: "Center", districtArabic: "المركز", facilityType: "private_hospital", bedCount: 100, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "Wikipedia" },
  
  // NINEVEH (Mosul)
  { name: "Al-Jumhouri Teaching Hospital", nameArabic: "مستشفى الجمهوري التعليمي", governorate: "Nineveh", governorateArabic: "نينوى", city: "Mosul", cityArabic: "الموصل", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 500, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Ibn Sina Teaching Hospital", nameArabic: "مستشفى ابن سينا التعليمي", governorate: "Nineveh", governorateArabic: "نينوى", city: "Mosul", cityArabic: "الموصل", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 400, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Al-Khansa Maternity Hospital", nameArabic: "مستشفى الخنساء للولادة", governorate: "Nineveh", governorateArabic: "نينوى", city: "Mosul", cityArabic: "الموصل", district: "Center", districtArabic: "المركز", facilityType: "maternity_hospital", bedCount: 250, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["obstetrics", "gynecology"]), source: "WHO/Wikipedia" },
  
  // KIRKUK
  { name: "Kirkuk General Hospital", nameArabic: "مستشفى كركوك العام", governorate: "Kirkuk", governorateArabic: "كركوك", city: "Kirkuk", cityArabic: "كركوك", district: "Center", districtArabic: "المركز", facilityType: "general_hospital", bedCount: 400, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Azadi Teaching Hospital Kirkuk", nameArabic: "مستشفى آزادي التعليمي كركوك", governorate: "Kirkuk", governorateArabic: "كركوك", city: "Kirkuk", cityArabic: "كركوك", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 350, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  
  // NAJAF
  { name: "Al-Sadr Medical City", nameArabic: "مدينة الصدر الطبية", governorate: "Najaf", governorateArabic: "النجف", city: "Najaf", cityArabic: "النجف", district: "Center", districtArabic: "المركز", facilityType: "medical_city", bedCount: 600, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "cardiology", "oncology"]), source: "WHO/Wikipedia" },
  { name: "Al-Hakeem General Hospital", nameArabic: "مستشفى الحكيم العام", governorate: "Najaf", governorateArabic: "النجف", city: "Najaf", cityArabic: "النجف", district: "Center", districtArabic: "المركز", facilityType: "general_hospital", bedCount: 300, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Al-Zahra Teaching Hospital", nameArabic: "مستشفى الزهراء التعليمي", governorate: "Najaf", governorateArabic: "النجف", city: "Najaf", cityArabic: "النجف", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 350, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["obstetrics", "gynecology", "pediatrics"]), source: "WHO/Wikipedia" },
  
  // KARBALA
  { name: "Al-Hussein Teaching Hospital Karbala", nameArabic: "مستشفى الحسين التعليمي كربلاء", governorate: "Karbala", governorateArabic: "كربلاء", city: "Karbala", cityArabic: "كربلاء", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 450, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Al-Kafeel Hospital", nameArabic: "مستشفى الكفيل", governorate: "Karbala", governorateArabic: "كربلاء", city: "Karbala", cityArabic: "كربلاء", district: "Center", districtArabic: "المركز", facilityType: "private_hospital", bedCount: 200, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "cardiology"]), source: "Wikipedia" },
  
  // DHI QAR
  { name: "Al-Hussein Teaching Hospital Nasiriyah", nameArabic: "مستشفى الحسين التعليمي الناصرية", governorate: "Dhi Qar", governorateArabic: "ذي قار", city: "Nasiriyah", cityArabic: "الناصرية", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 400, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Al-Nasiriyah Teaching Hospital", nameArabic: "مستشفى الناصرية التعليمي", governorate: "Dhi Qar", governorateArabic: "ذي قار", city: "Nasiriyah", cityArabic: "الناصرية", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 350, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Nasiriyah Heart Center", nameArabic: "مركز الناصرية للقلب", governorate: "Dhi Qar", governorateArabic: "ذي قار", city: "Nasiriyah", cityArabic: "الناصرية", district: "Center", districtArabic: "المركز", facilityType: "specialized_hospital", bedCount: 100, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["cardiology", "cardiac_surgery"]), source: "WHO/Wikipedia" },
  
  // BABIL
  { name: "Al Hilla Teaching Hospital", nameArabic: "مستشفى الحلة التعليمي", governorate: "Babil", governorateArabic: "بابل", city: "Hillah", cityArabic: "الحلة", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 400, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Merjan Medical City", nameArabic: "مدينة مرجان الطبية", governorate: "Babil", governorateArabic: "بابل", city: "Hillah", cityArabic: "الحلة", district: "Center", districtArabic: "المركز", facilityType: "medical_city", bedCount: 300, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["internal_medicine", "cardiology"]), source: "WHO/Wikipedia" },
  { name: "Imam Sadiq Teaching Hospital", nameArabic: "مستشفى الإمام الصادق التعليمي", governorate: "Babil", governorateArabic: "بابل", city: "Hillah", cityArabic: "الحلة", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 250, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  
  // DIYALA
  { name: "Baquba General Hospital", nameArabic: "مستشفى بعقوبة العام", governorate: "Diyala", governorateArabic: "ديالى", city: "Baqubah", cityArabic: "بعقوبة", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 350, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Al Batool Maternity Hospital", nameArabic: "مستشفى البتول للولادة", governorate: "Diyala", governorateArabic: "ديالى", city: "Baqubah", cityArabic: "بعقوبة", district: "Center", districtArabic: "المركز", facilityType: "maternity_hospital", bedCount: 150, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["obstetrics", "gynecology"]), source: "WHO/Wikipedia" },
  
  // ANBAR
  { name: "Al-Faluja General Hospital", nameArabic: "مستشفى الفلوجة العام", governorate: "Anbar", governorateArabic: "الأنبار", city: "Fallujah", cityArabic: "الفلوجة", district: "Center", districtArabic: "المركز", facilityType: "general_hospital", bedCount: 300, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Ramadi Teaching Hospital", nameArabic: "مستشفى الرمادي التعليمي", governorate: "Anbar", governorateArabic: "الأنبار", city: "Ramadi", cityArabic: "الرمادي", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 400, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  
  // WASIT
  { name: "Al-Kut Teaching Hospital", nameArabic: "مستشفى الكوت التعليمي", governorate: "Wasit", governorateArabic: "واسط", city: "Kut", cityArabic: "الكوت", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 350, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Al-Zahra Maternity Hospital Wasit", nameArabic: "مستشفى الزهراء للولادة واسط", governorate: "Wasit", governorateArabic: "واسط", city: "Kut", cityArabic: "الكوت", district: "Center", districtArabic: "المركز", facilityType: "maternity_hospital", bedCount: 150, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["obstetrics", "gynecology"]), source: "WHO/Wikipedia" },
  
  // MAYSAN
  { name: "Al-Sadr Teaching Hospital Maysan", nameArabic: "مستشفى الصدر التعليمي ميسان", governorate: "Maysan", governorateArabic: "ميسان", city: "Amarah", cityArabic: "العمارة", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 300, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Al-Amarah General Hospital", nameArabic: "مستشفى العمارة العام", governorate: "Maysan", governorateArabic: "ميسان", city: "Amarah", cityArabic: "العمارة", district: "Center", districtArabic: "المركز", facilityType: "general_hospital", bedCount: 250, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  
  // MUTHANNA
  { name: "Al-Hussein Teaching Hospital Muthanna", nameArabic: "مستشفى الحسين التعليمي المثنى", governorate: "Muthanna", governorateArabic: "المثنى", city: "Samawah", cityArabic: "السماوة", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 250, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  { name: "Al-Samawa General Hospital", nameArabic: "مستشفى السماوة العام", governorate: "Muthanna", governorateArabic: "المثنى", city: "Samawah", cityArabic: "السماوة", district: "Center", districtArabic: "المركز", facilityType: "general_hospital", bedCount: 200, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
  
  // QADISIYYAH
  { name: "Al-Diwaniyah Teaching Hospital", nameArabic: "مستشفى الديوانية التعليمي", governorate: "Qadisiyyah", governorateArabic: "القادسية", city: "Diwaniyah", cityArabic: "الديوانية", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 350, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  
  // SALADIN
  { name: "Tikrit Teaching Hospital", nameArabic: "مستشفى تكريت التعليمي", governorate: "Saladin", governorateArabic: "صلاح الدين", city: "Tikrit", cityArabic: "تكريت", district: "Center", districtArabic: "المركز", facilityType: "teaching_hospital", bedCount: 400, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery", "internal_medicine"]), source: "WHO/Wikipedia" },
  { name: "Samarra General Hospital", nameArabic: "مستشفى سامراء العام", governorate: "Saladin", governorateArabic: "صلاح الدين", city: "Samarra", cityArabic: "سامراء", district: "Center", districtArabic: "المركز", facilityType: "general_hospital", bedCount: 250, hasEmergency: true, has24Hours: true, specialties: JSON.stringify(["general_medicine", "surgery"]), source: "WHO/Wikipedia" },
];

async function seedClinics() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const connection = await mysql.createConnection(connectionString);
  
  console.log('Connected to database. Seeding clinics...');
  
  try {
    for (const clinic of clinicsData) {
      const sql = `
        INSERT INTO iraq_clinics 
        (name, name_arabic, governorate, governorate_arabic, city, city_arabic, district, district_arabic, facility_type, bed_count, has_emergency, has_24_hours, specialties, source, is_active, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, true)
        ON DUPLICATE KEY UPDATE name = name
      `;
      
      await connection.execute(sql, [
        clinic.name,
        clinic.nameArabic,
        clinic.governorate,
        clinic.governorateArabic,
        clinic.city,
        clinic.cityArabic,
        clinic.district,
        clinic.districtArabic,
        clinic.facilityType,
        clinic.bedCount,
        clinic.hasEmergency,
        clinic.has24Hours,
        clinic.specialties,
        clinic.source
      ]);
      
      console.log(`Inserted: ${clinic.name}`);
    }
    
    console.log(`\nSuccessfully seeded ${clinicsData.length} clinics!`);
    
    // Get count by governorate
    const [rows] = await connection.execute('SELECT governorate, COUNT(*) as count FROM iraq_clinics GROUP BY governorate ORDER BY count DESC');
    console.log('\nClinics by governorate:');
    rows.forEach(row => console.log(`  ${row.governorate}: ${row.count}`));
    
  } catch (error) {
    console.error('Error seeding clinics:', error);
  } finally {
    await connection.end();
  }
}

seedClinics();
