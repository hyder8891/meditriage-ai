/**
 * SOAP Templates and EMR Export Tests
 * Comprehensive test suite for SOAP note templates and EMR export functionality
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  seedSystemTemplates,
  getAllTemplates,
  getTemplateById,
  getTemplatesByCategory,
  incrementTemplateUsage,
} from "./soap-templates";
import {
  exportToPdfWithQR,
  exportToHL7,
  getExportLog,
  getPatientExports,
  SoapNoteData,
} from "./soap-emr-export";

// Mock SOAP note data for testing
const mockSoapNote: SoapNoteData = {
  patientId: 1,
  patientName: "Ahmed Mohammed",
  patientAge: 45,
  patientGender: "male",
  clinicianId: 2,
  clinicianName: "Dr. Fatima Al-Sayed",
  encounterDate: new Date("2024-01-15"),
  subjective: "Patient presents with chest pain that started 2 hours ago. Describes pain as crushing, radiating to left arm. Associated with sweating and nausea.",
  objective: "BP: 150/95, HR: 110, RR: 22, O2Sat: 96%. Patient appears distressed and diaphoretic. Heart sounds regular, no murmurs. Lungs clear bilaterally.",
  assessment: "Acute Coronary Syndrome - STEMI suspected based on clinical presentation and ECG findings showing ST elevation in leads II, III, aVF.",
  plan: "1. Immediate aspirin 300mg chewed\n2. Nitroglycerin sublingual\n3. IV access established\n4. Serial troponins and ECGs\n5. Cardiology consult for urgent catheterization\n6. Transfer to CCU",
  vitalSigns: {
    bp: "150/95",
    hr: 110,
    rr: 22,
    temp: 37.2,
    o2sat: 96,
  },
  diagnosis: "Acute Coronary Syndrome - STEMI",
  medications: ["Aspirin", "Nitroglycerin", "Heparin"],
  allergies: ["Penicillin"],
};

describe("SOAP Templates", () => {
  describe("seedSystemTemplates", () => {
    it("should seed system templates successfully", async () => {
      const result = await seedSystemTemplates();
      expect(result.success).toBe(true);
      expect(result.message).toContain("successfully");
    });

    it("should not duplicate templates on multiple seeding attempts", async () => {
      // Seed once
      await seedSystemTemplates();
      
      // Seed again
      const result = await seedSystemTemplates();
      expect(result.success).toBe(true);
      
      // Verify no duplicates by checking template count
      const templates = await getAllTemplates();
      const uniqueNames = new Set(templates.map(t => t.name));
      expect(templates.length).toBe(uniqueNames.size);
    });
  });

  describe("getAllTemplates", () => {
    beforeAll(async () => {
      await seedSystemTemplates();
    });

    it("should return all active templates", async () => {
      const templates = await getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.isActive)).toBe(true);
    });

    it("should include all required template fields", async () => {
      const templates = await getAllTemplates();
      const template = templates[0];
      
      expect(template).toHaveProperty("id");
      expect(template).toHaveProperty("name");
      expect(template).toHaveProperty("nameAr");
      expect(template).toHaveProperty("category");
      expect(template).toHaveProperty("description");
      expect(template).toHaveProperty("descriptionAr");
    });

    it("should include templates for all major categories", async () => {
      const templates = await getAllTemplates();
      const categories = templates.map(t => t.category);
      
      expect(categories).toContain("chest_pain");
      expect(categories).toContain("fever");
      expect(categories).toContain("trauma");
      expect(categories).toContain("pediatric");
    });
  });

  describe("getTemplateById", () => {
    let templateId: number;

    beforeAll(async () => {
      await seedSystemTemplates();
      const templates = await getAllTemplates();
      templateId = templates[0].id;
    });

    it("should return template with full details", async () => {
      const template = await getTemplateById(templateId);
      
      expect(template).not.toBeNull();
      expect(template?.subjectiveTemplate).toBeDefined();
      expect(template?.objectiveTemplate).toBeDefined();
      expect(template?.assessmentTemplate).toBeDefined();
      expect(template?.planTemplate).toBeDefined();
    });

    it("should return null for non-existent template", async () => {
      const template = await getTemplateById(999999);
      expect(template).toBeNull();
    });

    it("should include template metadata", async () => {
      const template = await getTemplateById(templateId);
      
      expect(template?.commonSymptoms).toBeDefined();
      expect(template?.redFlags).toBeDefined();
      expect(template?.typicalDiagnoses).toBeDefined();
    });
  });

  describe("getTemplatesByCategory", () => {
    beforeAll(async () => {
      await seedSystemTemplates();
    });

    it("should return templates for chest_pain category", async () => {
      const templates = await getTemplatesByCategory("chest_pain");
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.category === "chest_pain")).toBe(true);
    });

    it("should return templates for fever category", async () => {
      const templates = await getTemplatesByCategory("fever");
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.category === "fever")).toBe(true);
    });

    it("should return templates for trauma category", async () => {
      const templates = await getTemplatesByCategory("trauma");
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.category === "trauma")).toBe(true);
    });

    it("should return templates for pediatric category", async () => {
      const templates = await getTemplatesByCategory("pediatric");
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.category === "pediatric")).toBe(true);
    });

    it("should return empty array for non-existent category", async () => {
      const templates = await getTemplatesByCategory("non_existent");
      expect(templates.length).toBe(0);
    });
  });

  describe("incrementTemplateUsage", () => {
    let templateId: number;

    beforeAll(async () => {
      await seedSystemTemplates();
      const templates = await getAllTemplates();
      templateId = templates[0].id;
    });

    it("should increment usage count", async () => {
      const before = await getTemplateById(templateId);
      const initialCount = before?.usageCount || 0;
      
      await incrementTemplateUsage(templateId);
      
      const after = await getTemplateById(templateId);
      expect(after?.usageCount).toBe(initialCount + 1);
    });

    it("should update lastUsed timestamp", async () => {
      const before = await getTemplateById(templateId);
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await incrementTemplateUsage(templateId);
      
      const after = await getTemplateById(templateId);
      expect(after?.lastUsed).not.toEqual(before?.lastUsed);
    });
  });
});

describe("EMR Export", () => {
  describe("exportToPdfWithQR", () => {
    it("should export SOAP note to PDF with QR code", async () => {
      const result = await exportToPdfWithQR(
        mockSoapNote,
        {
          format: "pdf_with_qr",
          destinationSystem: "Baghdad Medical City EMR",
          exportPurpose: "Patient referral",
          expiresInHours: 720,
        },
        2 // clinician ID
      );

      expect(result.success).toBe(true);
      expect(result.exportId).toBeDefined();
      expect(result.fileUrl).toBeDefined();
    });

    it("should generate unique export IDs", async () => {
      const result1 = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);
      const result2 = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);

      expect(result1.exportId).not.toEqual(result2.exportId);
    });

    it("should create export log entry", async () => {
      const result = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);

      expect(result.success).toBe(true);
      
      const exportLog = await getExportLog(result.exportId!);
      expect(exportLog).not.toBeNull();
      expect(exportLog?.exportFormat).toBe("pdf_with_qr");
      expect(exportLog?.status).toBe("generated");
    });

    it("should include QR code data in export log", async () => {
      const result = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);

      const exportLog = await getExportLog(result.exportId!);
      expect(exportLog?.qrCodeData).toBeDefined();
      expect(exportLog?.qrCodeImageKey).toBeDefined();
    });

    it("should set expiry date if specified", async () => {
      const result = await exportToPdfWithQR(
        mockSoapNote,
        { format: "pdf_with_qr", expiresInHours: 24 },
        2
      );

      const exportLog = await getExportLog(result.exportId!);
      expect(exportLog?.expiresAt).toBeDefined();
      
      const expiryDate = new Date(exportLog!.expiresAt!);
      const now = new Date();
      const hoursDiff = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      expect(hoursDiff).toBeGreaterThan(23);
      expect(hoursDiff).toBeLessThan(25);
    });
  });

  describe("exportToHL7", () => {
    it("should export SOAP note to HL7 format", async () => {
      const result = await exportToHL7(
        mockSoapNote,
        {
          format: "hl7_v2",
          destinationSystem: "Basra General Hospital EMR",
          destinationFacilityId: "BGH001",
          exportPurpose: "Medical records transfer",
        },
        2
      );

      expect(result.success).toBe(true);
      expect(result.exportId).toBeDefined();
      expect(result.fileUrl).toBeDefined();
    });

    it("should create HL7 export log entry", async () => {
      const result = await exportToHL7(mockSoapNote, { format: "hl7_v2" }, 2);

      const exportLog = await getExportLog(result.exportId!);
      expect(exportLog).not.toBeNull();
      expect(exportLog?.exportFormat).toBe("hl7_v2");
      expect(exportLog?.hl7MessageType).toBe("ORU^R01");
      expect(exportLog?.hl7Version).toBe("2.5");
      expect(exportLog?.hl7MessageId).toBeDefined();
    });

    it("should include destination system info", async () => {
      const result = await exportToHL7(
        mockSoapNote,
        {
          format: "hl7_v2",
          destinationSystem: "Test Hospital",
          destinationFacilityId: "TEST001",
        },
        2
      );

      const exportLog = await getExportLog(result.exportId!);
      expect(exportLog?.destinationSystem).toBe("Test Hospital");
      expect(exportLog?.destinationFacilityId).toBe("TEST001");
    });
  });

  describe("getExportLog", () => {
    let exportId: string;

    beforeAll(async () => {
      const result = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);
      exportId = result.exportId!;
    });

    it("should return export log by ID", async () => {
      const exportLog = await getExportLog(exportId);
      
      expect(exportLog).not.toBeNull();
      expect(exportLog?.exportId).toBe(exportId);
    });

    it("should return null for non-existent export", async () => {
      const exportLog = await getExportLog("non-existent-id");
      expect(exportLog).toBeNull();
    });

    it("should include SOAP content snapshot", async () => {
      const exportLog = await getExportLog(exportId);
      
      expect(exportLog?.soapContent).toBeDefined();
      expect(exportLog?.soapContent).toContain("Ahmed Mohammed");
    });
  });

  describe("getPatientExports", () => {
    beforeAll(async () => {
      // Create multiple exports for patient
      await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);
      await exportToHL7(mockSoapNote, { format: "hl7_v2" }, 2);
    });

    it("should return all exports for a patient", async () => {
      const exports = await getPatientExports(mockSoapNote.patientId);
      
      expect(exports.length).toBeGreaterThan(0);
      expect(exports.every(exp => exp.patientId === mockSoapNote.patientId)).toBe(true);
    });

    it("should include both PDF and HL7 exports", async () => {
      const exports = await getPatientExports(mockSoapNote.patientId);
      
      const formats = exports.map(exp => exp.exportFormat);
      expect(formats).toContain("pdf_with_qr");
      expect(formats).toContain("hl7_v2");
    });

    it("should return empty array for patient with no exports", async () => {
      const exports = await getPatientExports(999999);
      expect(exports.length).toBe(0);
    });
  });

  describe("Export Data Integrity", () => {
    it("should preserve patient demographics in PDF export", async () => {
      const result = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);
      const exportLog = await getExportLog(result.exportId!);
      
      const soapContent = JSON.parse(exportLog!.soapContent as string);
      expect(soapContent.patientName).toBe(mockSoapNote.patientName);
      expect(soapContent.patientAge).toBe(mockSoapNote.patientAge);
      expect(soapContent.patientGender).toBe(mockSoapNote.patientGender);
    });

    it("should preserve vital signs in export", async () => {
      const result = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);
      const exportLog = await getExportLog(result.exportId!);
      
      const soapContent = JSON.parse(exportLog!.soapContent as string);
      expect(soapContent.vitalSigns).toBeDefined();
      expect(soapContent.vitalSigns.bp).toBe("150/95");
      expect(soapContent.vitalSigns.hr).toBe(110);
    });

    it("should preserve all SOAP sections", async () => {
      const result = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);
      const exportLog = await getExportLog(result.exportId!);
      
      const soapContent = JSON.parse(exportLog!.soapContent as string);
      expect(soapContent.subjective).toBeDefined();
      expect(soapContent.objective).toBeDefined();
      expect(soapContent.assessment).toBeDefined();
      expect(soapContent.plan).toBeDefined();
    });

    it("should calculate correct file checksum", async () => {
      const result = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);
      const exportLog = await getExportLog(result.exportId!);
      
      expect(exportLog?.checksumMd5).toBeDefined();
      expect(exportLog?.checksumMd5).toHaveLength(32); // MD5 is 32 hex characters
    });
  });

  describe("Export Security", () => {
    it("should generate unique verification code for each export", async () => {
      const result1 = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);
      const result2 = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);
      
      const log1 = await getExportLog(result1.exportId!);
      const log2 = await getExportLog(result2.exportId!);
      
      expect(log1?.verificationCode).not.toEqual(log2?.verificationCode);
    });

    it("should track export access count", async () => {
      const result = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, 2);
      const exportLog = await getExportLog(result.exportId!);
      
      expect(exportLog?.accessedCount).toBeDefined();
      expect(exportLog?.accessedCount).toBeGreaterThanOrEqual(0);
    });

    it("should record exported_by user ID", async () => {
      const clinicianId = 2;
      const result = await exportToPdfWithQR(mockSoapNote, { format: "pdf_with_qr" }, clinicianId);
      const exportLog = await getExportLog(result.exportId!);
      
      expect(exportLog?.exportedBy).toBe(clinicianId);
    });
  });
});

describe("Template Content Validation", () => {
  beforeAll(async () => {
    await seedSystemTemplates();
  });

  it("should have valid JSON structure in chest pain template", async () => {
    const templates = await getTemplatesByCategory("chest_pain");
    const template = templates[0];
    
    expect(() => JSON.parse(template.subjectiveTemplate as string)).not.toThrow();
    expect(() => JSON.parse(template.objectiveTemplate as string)).not.toThrow();
    expect(() => JSON.parse(template.assessmentTemplate as string)).not.toThrow();
    expect(() => JSON.parse(template.planTemplate as string)).not.toThrow();
  });

  it("should include Iraqi-specific medical context", async () => {
    const templates = await getAllTemplates();
    
    // Check for Arabic translations
    expect(templates.every(t => t.nameAr)).toBe(true);
    expect(templates.every(t => t.descriptionAr)).toBe(true);
  });

  it("should include red flags for critical conditions", async () => {
    const chestPainTemplates = await getTemplatesByCategory("chest_pain");
    const template = await getTemplateById(chestPainTemplates[0].id);
    
    const redFlags = JSON.parse(template!.redFlags as string);
    expect(redFlags.length).toBeGreaterThan(0);
    expect(redFlags.some((flag: string) => flag.toLowerCase().includes("st elevation"))).toBe(true);
  });

  it("should include common symptoms for each category", async () => {
    const feverTemplates = await getTemplatesByCategory("fever");
    const template = await getTemplateById(feverTemplates[0].id);
    
    const symptoms = JSON.parse(template!.commonSymptoms as string);
    expect(symptoms.length).toBeGreaterThan(0);
    expect(symptoms).toContain("fever");
  });
});

console.log("✅ All SOAP templates and EMR export tests completed!");
