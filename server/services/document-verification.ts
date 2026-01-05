import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { doctorVerificationDocuments, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Document Verification Service
 * Handles extraction of information from Iraqi ID cards and medical certificates
 * and automatic verification by matching names
 */

interface ExtractedDocumentInfo {
  name?: string;
  nameArabic?: string;
  fatherName?: string;
  fatherNameArabic?: string;
  grandfatherName?: string;
  familyName?: string;
  familyNameArabic?: string;
  dateOfBirth?: string;
  idNumber?: string;
  gender?: string;
  bloodType?: string;
  licenseNumber?: string;
  specialty?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  medicalSchool?: string;
  graduationYear?: number;
  degreeType?: string;
  grade?: string;
  rawData?: Record<string, unknown>;
}

interface DocumentProcessingResult {
  success: boolean;
  extractedInfo?: ExtractedDocumentInfo;
  error?: string;
}

/**
 * Extract information from an Iraqi document image using LLM vision
 */
export async function extractDocumentInfo(
  documentUrl: string,
  documentType: "national_id" | "medical_certificate"
): Promise<DocumentProcessingResult> {
  try {
    const systemPrompt = documentType === "national_id"
      ? `You are a document analysis expert specializing in Iraqi national ID cards (البطاقة الوطنية الموحدة).

The Iraqi National ID Card has these fields:
FRONT SIDE:
- الاسم / ناو (First Name)
- الأب / باوك (Father's Name)  
- الجد / بابير (Grandfather's Name)
- اللقب / نازناو (Family Name/Surname)
- الأم / دايك (Mother's Name)
- الجنس / رەگەز (Gender: ذكر=Male, أنثى=Female)
- فصيلة الدم / گرووپی خوین (Blood Type)
- Birth year (shown as 19XX or 20XX)
- Card number (starts with A followed by numbers)

BACK SIDE:
- رقم الناخب (Voter Number)
- الاسم الثلاثي (Full Three-part Name)
- سنة الولادة (Birth Year)
- رقم العائلة (Family Number)
- رقم السجل (Registry Number)

Extract all visible information from this Iraqi ID card image.
Return the data in JSON format with these exact keys:
{
  "name": "First name in English (transliterated from Arabic if needed)",
  "nameArabic": "الاسم الأول بالعربية",
  "fatherName": "Father's name in English",
  "fatherNameArabic": "اسم الأب بالعربية",
  "grandfatherName": "Grandfather's name in English",
  "familyName": "Family/surname in English",
  "familyNameArabic": "اللقب بالعربية",
  "dateOfBirth": "YYYY-MM-DD or just YYYY if only year visible",
  "idNumber": "Card number (A followed by digits)",
  "gender": "Male or Female",
  "bloodType": "Blood type like A+, B+, O+, etc.",
  "rawData": { any other extracted fields }
}

If a field cannot be extracted, set it to null. Be precise and accurate.
For Arabic text, preserve the exact Arabic characters.
For English transliteration, use common conventions (e.g., محمد = Mohammed, أحمد = Ahmed).`

      : `You are a document analysis expert specializing in Iraqi medical graduation certificates and medical licenses.

Iraqi Medical Certificates typically come from:
1. University graduation certificates (شهادة التخرج) from universities like:
   - University of Baghdad
   - University of Basrah
   - University of Mosul
   - Al-Nahrain University
   - Other Iraqi medical colleges

2. Iraqi Medical Association (نقابة أطباء العراق) licenses

GRADUATION CERTIFICATE FIELDS:
- Student's full name (in English and/or Arabic)
- Degree type: M.B.Ch.B (Bachelor of Medicine and Surgery)
- University name
- Graduation date (may show both Hijri and Gregorian dates)
- Grade/Classification (Good, Very Good, Excellent)
- Dean's name and signature
- Chancellor/President's name and signature
- University seal

MEDICAL LICENSE FIELDS:
- Doctor's full name
- License number
- Specialty (if applicable)
- Issue date
- Iraqi Medical Association seal

Extract all visible information from this Iraqi medical certificate/license image.
Return the data in JSON format with these exact keys:
{
  "name": "Full name in English",
  "nameArabic": "الاسم الكامل بالعربية",
  "licenseNumber": "License or certificate number",
  "specialty": "Medical specialty if mentioned",
  "issuingAuthority": "University name or Iraqi Medical Association",
  "issueDate": "YYYY-MM-DD",
  "expiryDate": "YYYY-MM-DD or null if not applicable",
  "medicalSchool": "College/University of Medicine name",
  "graduationYear": 2020,
  "degreeType": "M.B.Ch.B or other degree type",
  "grade": "Good/Very Good/Excellent if shown",
  "rawData": { any other extracted fields like dean name, signatures, etc. }
}

If a field cannot be extracted, set it to null. Be precise and accurate.
For Arabic text, preserve the exact Arabic characters.
For English transliteration, use common conventions.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this Iraqi ${documentType === "national_id" ? "national ID card (البطاقة الوطنية)" : "medical graduation certificate/license"} and extract all relevant information. Look carefully at both Arabic and English text.`,
            },
            {
              type: "image_url",
              image_url: {
                url: documentUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "iraqi_document_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: ["string", "null"], description: "Full name in English" },
              nameArabic: { type: ["string", "null"], description: "Full name in Arabic" },
              fatherName: { type: ["string", "null"], description: "Father's name in English" },
              fatherNameArabic: { type: ["string", "null"], description: "Father's name in Arabic" },
              grandfatherName: { type: ["string", "null"], description: "Grandfather's name" },
              familyName: { type: ["string", "null"], description: "Family name/surname in English" },
              familyNameArabic: { type: ["string", "null"], description: "Family name in Arabic" },
              dateOfBirth: { type: ["string", "null"], description: "Date of birth in YYYY-MM-DD format" },
              idNumber: { type: ["string", "null"], description: "ID card number" },
              gender: { type: ["string", "null"], description: "Gender (Male/Female)" },
              bloodType: { type: ["string", "null"], description: "Blood type" },
              licenseNumber: { type: ["string", "null"], description: "License or certificate number" },
              specialty: { type: ["string", "null"], description: "Medical specialty" },
              issuingAuthority: { type: ["string", "null"], description: "Issuing organization" },
              issueDate: { type: ["string", "null"], description: "Issue date in YYYY-MM-DD format" },
              expiryDate: { type: ["string", "null"], description: "Expiry date in YYYY-MM-DD format" },
              medicalSchool: { type: ["string", "null"], description: "Medical school/university name" },
              graduationYear: { type: ["number", "null"], description: "Graduation year" },
              degreeType: { type: ["string", "null"], description: "Type of medical degree" },
              grade: { type: ["string", "null"], description: "Grade or classification" },
              rawData: { type: "object", description: "Any additional extracted data" },
            },
            required: ["name", "nameArabic"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No response from LLM" };
    }

    // Content should be a string when using response_format
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const extractedInfo = JSON.parse(contentStr) as ExtractedDocumentInfo;
    return { success: true, extractedInfo };
  } catch (error) {
    console.error("[DocumentVerification] Error extracting document info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during extraction",
    };
  }
}

/**
 * Build full name from components for comparison
 */
function buildFullName(info: ExtractedDocumentInfo, useArabic: boolean = false): string {
  if (useArabic) {
    const parts = [
      info.nameArabic,
      info.fatherNameArabic,
      info.familyNameArabic,
    ].filter(Boolean);
    return parts.join(' ');
  }
  
  const parts = [
    info.name,
    info.fatherName,
    info.grandfatherName,
    info.familyName,
  ].filter(Boolean);
  return parts.join(' ');
}

/**
 * Calculate similarity score between two names
 * Returns a score from 0-100
 */
export function calculateNameSimilarity(name1: string | null | undefined, name2: string | null | undefined): number {
  if (!name1 || !name2) return 0;

  // Normalize names: lowercase, remove extra spaces, remove common titles
  const normalize = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      // Remove titles
      .replace(/^(dr\.?|doctor|الدكتور|الدكتورة|د\.?)\s*/i, "")
      .replace(/\s+(jr\.?|sr\.?|ii|iii|iv)$/i, "")
      // Normalize Arabic characters
      .replace(/[أإآ]/g, 'ا')
      .replace(/[ة]/g, 'ه')
      .replace(/[ى]/g, 'ي')
      // Remove common prefixes
      .replace(/^(al-|el-|ال)/i, "");
  };

  const n1 = normalize(name1);
  const n2 = normalize(name2);

  // Exact match
  if (n1 === n2) return 100;

  // Check if one contains the other (for partial name matches)
  if (n1.includes(n2) || n2.includes(n1)) {
    const shorter = n1.length < n2.length ? n1 : n2;
    const longer = n1.length >= n2.length ? n1 : n2;
    return Math.round((shorter.length / longer.length) * 100);
  }

  // Calculate Levenshtein distance
  const levenshteinDistance = (s1: string, s2: string): number => {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  };

  const distance = levenshteinDistance(n1, n2);
  const maxLength = Math.max(n1.length, n2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity * 100) / 100;
}

/**
 * Compare names from ID and certificate with multiple strategies
 */
export function compareDocumentNames(
  idInfo: ExtractedDocumentInfo,
  certInfo: ExtractedDocumentInfo
): { score: number; method: string } {
  const scores: { score: number; method: string }[] = [];

  // Strategy 1: Compare full English names
  const idFullEnglish = buildFullName(idInfo, false);
  const certFullEnglish = buildFullName(certInfo, false);
  if (idFullEnglish && certFullEnglish) {
    scores.push({
      score: calculateNameSimilarity(idFullEnglish, certFullEnglish),
      method: "full_english_name",
    });
  }

  // Strategy 2: Compare full Arabic names
  const idFullArabic = buildFullName(idInfo, true);
  const certFullArabic = buildFullName(certInfo, true);
  if (idFullArabic && certFullArabic) {
    scores.push({
      score: calculateNameSimilarity(idFullArabic, certFullArabic),
      method: "full_arabic_name",
    });
  }

  // Strategy 3: Compare just first names
  if (idInfo.name && certInfo.name) {
    scores.push({
      score: calculateNameSimilarity(idInfo.name, certInfo.name),
      method: "first_name_english",
    });
  }

  // Strategy 4: Compare Arabic first names
  if (idInfo.nameArabic && certInfo.nameArabic) {
    scores.push({
      score: calculateNameSimilarity(idInfo.nameArabic, certInfo.nameArabic),
      method: "first_name_arabic",
    });
  }

  // Strategy 5: Compare ID full name with certificate name
  if (idFullEnglish && certInfo.name) {
    scores.push({
      score: calculateNameSimilarity(idFullEnglish, certInfo.name),
      method: "id_full_vs_cert_name",
    });
  }

  // Return the best match
  if (scores.length === 0) {
    return { score: 0, method: "no_names_found" };
  }

  scores.sort((a, b) => b.score - a.score);
  return scores[0];
}

/**
 * Process uploaded document and extract information
 */
export async function processDocument(
  documentId: number,
  documentUrl: string,
  documentType: "national_id" | "medical_certificate"
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database unavailable" };
  }

  try {
    // Update status to processing
    await db.update(doctorVerificationDocuments)
      .set({ processingStatus: "processing" })
      .where(eq(doctorVerificationDocuments.id, documentId));

    // Extract information from document
    const result = await extractDocumentInfo(documentUrl, documentType);

    if (!result.success || !result.extractedInfo) {
      await db.update(doctorVerificationDocuments)
        .set({
          processingStatus: "failed",
          processingError: result.error || "Failed to extract information",
          processedAt: new Date(),
        })
        .where(eq(doctorVerificationDocuments.id, documentId));
      return { success: false, error: result.error };
    }

    const info = result.extractedInfo;

    // Build full name for storage
    const fullNameEnglish = buildFullName(info, false);
    const fullNameArabic = buildFullName(info, true);

    // Update document with extracted information
    await db.update(doctorVerificationDocuments)
      .set({
        processingStatus: "completed",
        processedAt: new Date(),
        extractedName: fullNameEnglish || info.name || null,
        extractedNameArabic: fullNameArabic || info.nameArabic || null,
        extractedDateOfBirth: info.dateOfBirth ? new Date(info.dateOfBirth) : null,
        extractedIdNumber: info.idNumber || null,
        extractedLicenseNumber: info.licenseNumber || null,
        extractedSpecialty: info.specialty || null,
        extractedIssuingAuthority: info.issuingAuthority || info.medicalSchool || null,
        extractedIssueDate: info.issueDate ? new Date(info.issueDate) : null,
        extractedExpiryDate: info.expiryDate ? new Date(info.expiryDate) : null,
        extractedMedicalSchool: info.medicalSchool || null,
        extractedGraduationYear: info.graduationYear || null,
        extractedRawData: JSON.stringify({
          ...info.rawData,
          fatherName: info.fatherName,
          fatherNameArabic: info.fatherNameArabic,
          grandfatherName: info.grandfatherName,
          familyName: info.familyName,
          familyNameArabic: info.familyNameArabic,
          gender: info.gender,
          bloodType: info.bloodType,
          degreeType: info.degreeType,
          grade: info.grade,
        }),
      })
      .where(eq(doctorVerificationDocuments.id, documentId));

    return { success: true };
  } catch (error) {
    console.error("[DocumentVerification] Error processing document:", error);
    await db.update(doctorVerificationDocuments)
      .set({
        processingStatus: "failed",
        processingError: error instanceof Error ? error.message : "Unknown error",
        processedAt: new Date(),
      })
      .where(eq(doctorVerificationDocuments.id, documentId));
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Verify documents by matching names between ID and medical certificate
 */
export async function verifyDocuments(userId: number): Promise<{
  success: boolean;
  verified: boolean;
  nameMatchScore?: number;
  matchMethod?: string;
  error?: string;
  profileData?: {
    name?: string;
    nameArabic?: string;
    dateOfBirth?: Date;
    licenseNumber?: string;
    specialty?: string;
    medicalSchool?: string;
    graduationYear?: number;
  };
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, verified: false, error: "Database unavailable" };
  }

  try {
    // Get both documents for the user
    const documents = await db
      .select()
      .from(doctorVerificationDocuments)
      .where(eq(doctorVerificationDocuments.userId, userId));

    const idDoc = documents.find(d => d.documentType === "national_id");
    const certDoc = documents.find(d => d.documentType === "medical_certificate");

    if (!idDoc || !certDoc) {
      return { success: false, verified: false, error: "Both ID and medical certificate are required" };
    }

    if (idDoc.processingStatus !== "completed" || certDoc.processingStatus !== "completed") {
      return { success: false, verified: false, error: "Documents are still being processed" };
    }

    // Parse raw data to get full info
    const idRawData = idDoc.extractedRawData ? JSON.parse(idDoc.extractedRawData) : {};
    const certRawData = certDoc.extractedRawData ? JSON.parse(certDoc.extractedRawData) : {};

    const idInfo: ExtractedDocumentInfo = {
      name: idDoc.extractedName || undefined,
      nameArabic: idDoc.extractedNameArabic || undefined,
      fatherName: idRawData.fatherName,
      fatherNameArabic: idRawData.fatherNameArabic,
      grandfatherName: idRawData.grandfatherName,
      familyName: idRawData.familyName,
      familyNameArabic: idRawData.familyNameArabic,
    };

    const certInfo: ExtractedDocumentInfo = {
      name: certDoc.extractedName || undefined,
      nameArabic: certDoc.extractedNameArabic || undefined,
    };

    // Compare names using multiple strategies
    const { score: nameMatchScore, method: matchMethod } = compareDocumentNames(idInfo, certInfo);
    const nameMatchPassed = nameMatchScore >= 85; // 85% threshold for automatic verification

    // Update both documents with match results
    await db.update(doctorVerificationDocuments)
      .set({
        nameMatchScore: nameMatchScore.toString(),
        nameMatchPassed,
        verificationStatus: nameMatchPassed ? "verified" : "needs_review",
      })
      .where(eq(doctorVerificationDocuments.userId, userId));

    // If verification passed, update user verification status
    if (nameMatchPassed) {
      await db.update(users)
        .set({
          verified: true,
          verificationStatus: "verified",
          autoVerifiedAt: new Date(),
          // Update profile with extracted data from certificate (more formal name)
          name: certDoc.extractedName || idDoc.extractedName || undefined,
          dateOfBirth: idDoc.extractedDateOfBirth || undefined,
          licenseNumber: certDoc.extractedLicenseNumber || undefined,
          specialty: certDoc.extractedSpecialty || undefined,
        })
        .where(eq(users.id, userId));
    } else {
      // Set to pending review for admin
      await db.update(users)
        .set({
          verificationStatus: "pending_review",
        })
        .where(eq(users.id, userId));
    }

    return {
      success: true,
      verified: nameMatchPassed,
      nameMatchScore,
      matchMethod,
      profileData: {
        name: certDoc.extractedName || idDoc.extractedName || undefined,
        nameArabic: certDoc.extractedNameArabic || idDoc.extractedNameArabic || undefined,
        dateOfBirth: idDoc.extractedDateOfBirth || undefined,
        licenseNumber: certDoc.extractedLicenseNumber || undefined,
        specialty: certDoc.extractedSpecialty || undefined,
        medicalSchool: certDoc.extractedMedicalSchool || undefined,
        graduationYear: certDoc.extractedGraduationYear || undefined,
      },
    };
  } catch (error) {
    console.error("[DocumentVerification] Error verifying documents:", error);
    return {
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Admin bypass verification - manually verify a doctor
 */
export async function adminVerifyDoctor(
  doctorUserId: number,
  adminUserId: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database unavailable" };
  }

  try {
    await db.update(users)
      .set({
        verified: true,
        verificationStatus: "verified",
        adminVerified: true,
        adminVerifiedBy: adminUserId,
        adminVerifiedAt: new Date(),
      })
      .where(eq(users.id, doctorUserId));

    // Update any pending documents to verified
    await db.update(doctorVerificationDocuments)
      .set({
        verificationStatus: "verified",
        verificationNotes: notes || "Admin verified - bypassed document verification",
      })
      .where(eq(doctorVerificationDocuments.userId, doctorUserId));

    return { success: true };
  } catch (error) {
    console.error("[DocumentVerification] Error in admin verification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
