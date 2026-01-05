# Iraqi Document Formats for Verification System

## Iraqi National ID Card (البطاقة الوطنية الموحدة)

### Front Side Fields (Arabic/Kurdish labels):
- **جمهورية العراق / وزارة الداخلية** - Republic of Iraq / Ministry of Interior
- **مديرية الأحوال المدنية والجوازات والإقامة** - Civil Status, Passports and Residence Directorate
- **البطاقة الوطنية** - National Card
- **الاسم / ناو** - First Name
- **الأب / باوك** - Father's Name
- **الجد / بابير** - Grandfather's Name
- **اللقب / نازناو** - Family Name/Surname
- **الأم / دايك** - Mother's Name
- **الجد / بابير** - Maternal Grandfather
- **الجنس / رەگەز** - Gender (ذكر = Male, أنثى = Female)
- **فصيلة الدم / گرووپی خوین** - Blood Type (A+, B+, O+, etc.)
- Birth year shown as 19XX format
- Photo on left side
- Card number (A followed by numbers)

### Back Side Fields:
- **رقم الناخب** - Voter Number
- **الاسم الثلاثي** - Full Name (Three-part)
- **سنة الولادة** - Birth Year
- **رقم العائلة** - Family Number
- **رقم السجل** - Registry Number
- **رقم مركز التسجيل** - Registration Center Number
- **رقم مركز الاقتراع** - Polling Center Number
- **اسم مركز الاقتراع** - Polling Center Name
- Chip embedded in card

---

## Iraqi Medical Graduation Certificate (شهادة التخرج الطبية)

### University of Baghdad Format:
- **Header**: بسم الله الرحمن الرحيم (In the name of God)
- **University Logo**: University of Baghdad emblem with Iraqi coat of arms
- **Title**: UNIVERSITY OF BAGHDAD
- **Text**: "Upon the proposal of the Council of the College of Medicine and approval of the Council of the University of Baghdad"
- **Student Name**: Full name in English (e.g., HASHIM TALIB HASHIM MANEA)
- **Degree**: "has been granted the Bachelor degree in Medicine and Surgery (M.B.Ch.B)"
- **Grade**: Grade classification (Good, Very Good, Excellent)
- **Date**: Baghdad On [Day] / [Month] / [Year] A.H. Corresponding to [Day] / [Month] / [Year] A.D.
- **Signatures**: 
  - Dean of College (Prof.Dr. Name)
  - President of the University (Prof.Dr. Name)
- **Seals**: University seal and College seal

### University of Basrah Format:
- **Header**: Republic of Iraq, Ministry of Higher Education & Scientific Research, University of Basrah
- **Title**: Graduation Certificate
- **Text**: "Since [Name] Has fulfilled the requirements of Graduation at the College of Medicine, it is resolved awarding him M.B.Ch.B. Degree in Medicine and General Surgery With grade [Grade] On [Date]"
- **Photo**: Graduate's photo on right side
- **Signatures**: 
  - The Dean (Prof. Dr. Name)
  - The Chancellor (Prof. Dr. Name)
- **Seal**: Basrah University Chancellery Records Office

### Key Fields to Extract:
1. **Full Name** (English and Arabic)
2. **Degree Type** (M.B.Ch.B - Bachelor of Medicine and Surgery)
3. **University Name**
4. **Graduation Date**
5. **Grade/Classification**
6. **Dean Name**
7. **Chancellor/President Name**

---

## Iraqi Medical Association (نقابة أطباء العراق)

### Letterhead Format:
- **Header (English)**: IRAQ MEDICAL ASSOCIATION, Head Office, Baghdad
- **Header (Arabic)**: نقابة أطباء العراق, المركز العام, بغداد
- **Logo**: IMA logo with "Established 1952"
- **Reference Number**: العدد (Ref.)
- **Date**: التاريخ (Date)
- **Contact Info**: 
  - Address: Al-Mansour - Baghdad - Ma'arry St. - P.O.Box 6282
  - Tel: 5385450 - 5374209
  - Fax: 00964 15372193
  - Email: info@ima.org.iq
  - Web: www.ima.org.iq

### Medical License Fields:
- Doctor's full name
- License number
- Specialty
- Issue date
- Expiry date (if applicable)
- Syndicate seal

---

## Name Matching Considerations

### Arabic Name Structure:
1. **الاسم** (First Name)
2. **اسم الأب** (Father's Name)
3. **اسم الجد** (Grandfather's Name)
4. **اللقب/العائلة** (Family Name/Surname)

### Matching Rules:
- Names may appear in different orders on different documents
- Arabic names may have transliteration variations in English
- Common variations: Mohammed/Muhammad/Mohamed, Ahmed/Ahmad
- Titles (Dr., الدكتور) should be stripped before comparison
- Family names may be written differently (Al-/El- prefixes)

### Similarity Threshold:
- 85%+ match = Automatic verification
- 70-84% match = Manual review recommended
- Below 70% = Likely mismatch, requires admin verification
