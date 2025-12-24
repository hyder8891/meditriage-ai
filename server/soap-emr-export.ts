/**
 * SOAP EMR Export Service
 * Export SOAP notes to various EMR formats (PDF with QR, HL7, FHIR)
 */

import { getDb } from "./db";
import { soapExportLogs, SoapExportLog } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "./storage";
import crypto from "crypto";

export interface SoapNoteData {
  patientId: number;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  clinicianId: number;
  clinicianName: string;
  encounterDate: Date;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vitalSigns?: {
    bp?: string;
    hr?: number;
    rr?: number;
    temp?: number;
    o2sat?: number;
    weight?: number;
    height?: number;
  };
  diagnosis?: string;
  medications?: string[];
  allergies?: string[];
}

export interface ExportOptions {
  format: "pdf_with_qr" | "pdf_simple" | "hl7_v2" | "hl7_v3" | "fhir_json" | "fhir_xml";
  destinationSystem?: string;
  destinationFacilityId?: string;
  exportPurpose?: string;
  expiresInHours?: number;
}

/**
 * Generate a unique export ID
 */
function generateExportId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a verification code for QR code
 */
function generateVerificationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculate MD5 checksum
 */
function calculateChecksum(data: string): string {
  return crypto.createHash("md5").update(data).digest("hex");
}

/**
 * Generate PDF content for SOAP note
 */
function generatePdfContent(soapNote: SoapNoteData, qrCodeUrl?: string): string {
  const date = soapNote.encounterDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SOAP Note - ${soapNote.patientName}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .patient-info {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #2563eb;
    }
    .patient-info h2 {
      margin-top: 0;
      color: #2563eb;
      font-size: 18px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .info-item {
      display: flex;
    }
    .info-label {
      font-weight: bold;
      margin-right: 10px;
      color: #475569;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section h3 {
      background: #2563eb;
      color: white;
      padding: 10px 15px;
      margin: 0 0 15px 0;
      border-radius: 4px;
      font-size: 16px;
    }
    .section-content {
      padding: 0 15px;
      line-height: 1.8;
      white-space: pre-wrap;
    }
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      padding: 15px;
      background: #f1f5f9;
      border-radius: 4px;
    }
    .vital-item {
      text-align: center;
      padding: 10px;
      background: white;
      border-radius: 4px;
    }
    .vital-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
    }
    .vital-value {
      font-size: 20px;
      font-weight: bold;
      color: #2563eb;
      margin-top: 5px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    .qr-section {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .qr-section img {
      max-width: 200px;
      height: auto;
    }
    .qr-section p {
      margin-top: 10px;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body {
        margin: 20px;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Medical SOAP Note</h1>
    <p>MediTriage AI Pro - Iraqi Healthcare System</p>
    <p>Date: ${date}</p>
  </div>

  <div class="patient-info">
    <h2>Patient Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Name:</span>
        <span>${soapNote.patientName}</span>
      </div>
      ${soapNote.patientAge ? `
      <div class="info-item">
        <span class="info-label">Age:</span>
        <span>${soapNote.patientAge} years</span>
      </div>
      ` : ''}
      ${soapNote.patientGender ? `
      <div class="info-item">
        <span class="info-label">Gender:</span>
        <span>${soapNote.patientGender}</span>
      </div>
      ` : ''}
      <div class="info-item">
        <span class="info-label">Clinician:</span>
        <span>${soapNote.clinicianName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Date:</span>
        <span>${date}</span>
      </div>
    </div>
  </div>

  ${soapNote.vitalSigns ? `
  <div class="section">
    <h3>Vital Signs</h3>
    <div class="vitals-grid">
      ${soapNote.vitalSigns.bp ? `
      <div class="vital-item">
        <div class="vital-label">Blood Pressure</div>
        <div class="vital-value">${soapNote.vitalSigns.bp}</div>
      </div>
      ` : ''}
      ${soapNote.vitalSigns.hr ? `
      <div class="vital-item">
        <div class="vital-label">Heart Rate</div>
        <div class="vital-value">${soapNote.vitalSigns.hr} bpm</div>
      </div>
      ` : ''}
      ${soapNote.vitalSigns.rr ? `
      <div class="vital-item">
        <div class="vital-label">Resp. Rate</div>
        <div class="vital-value">${soapNote.vitalSigns.rr} /min</div>
      </div>
      ` : ''}
      ${soapNote.vitalSigns.temp ? `
      <div class="vital-item">
        <div class="vital-label">Temperature</div>
        <div class="vital-value">${soapNote.vitalSigns.temp}°C</div>
      </div>
      ` : ''}
      ${soapNote.vitalSigns.o2sat ? `
      <div class="vital-item">
        <div class="vital-label">O₂ Saturation</div>
        <div class="vital-value">${soapNote.vitalSigns.o2sat}%</div>
      </div>
      ` : ''}
      ${soapNote.vitalSigns.weight ? `
      <div class="vital-item">
        <div class="vital-label">Weight</div>
        <div class="vital-value">${soapNote.vitalSigns.weight} kg</div>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h3>S - Subjective</h3>
    <div class="section-content">${soapNote.subjective}</div>
  </div>

  <div class="section">
    <h3>O - Objective</h3>
    <div class="section-content">${soapNote.objective}</div>
  </div>

  <div class="section">
    <h3>A - Assessment</h3>
    <div class="section-content">${soapNote.assessment}</div>
  </div>

  <div class="section">
    <h3>P - Plan</h3>
    <div class="section-content">${soapNote.plan}</div>
  </div>

  ${qrCodeUrl ? `
  <div class="qr-section">
    <h3 style="margin-top: 0;">Verification QR Code</h3>
    <img src="${qrCodeUrl}" alt="Verification QR Code" />
    <p>Scan to verify authenticity and view digital record</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>This document was generated by MediTriage AI Pro</p>
    <p>For verification and authenticity, please scan the QR code above</p>
    <p>© ${new Date().getFullYear()} MediTriage AI Pro - Iraqi Healthcare System</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate HL7 v2.x message for SOAP note
 */
function generateHL7Message(soapNote: SoapNoteData, messageId: string, facilityId: string = "MEDITRIAGE"): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0];
  
  // HL7 uses | as field separator, ^ as component separator, ~ as repetition separator
  const segments: string[] = [];
  
  // MSH - Message Header
  segments.push(
    `MSH|^~\\&|MEDITRIAGE|${facilityId}|EMR|${facilityId}|${timestamp}||ORU^R01|${messageId}|P|2.5`
  );
  
  // PID - Patient Identification
  segments.push(
    `PID|1||${soapNote.patientId}||${soapNote.patientName}||${soapNote.patientAge ? `${now.getFullYear() - soapNote.patientAge}0101` : ""}|${soapNote.patientGender?.charAt(0).toUpperCase() || "U"}`
  );
  
  // PV1 - Patient Visit
  segments.push(
    `PV1|1|O|||||${soapNote.clinicianId}^${soapNote.clinicianName}|||||||||||||||||||||||||||||||||||${soapNote.encounterDate.toISOString().split("T")[0].replace(/-/g, "")}`
  );
  
  // OBR - Observation Request (SOAP Note)
  segments.push(
    `OBR|1|||SOAP^SOAP Note|||${timestamp}|||||||${soapNote.clinicianId}^${soapNote.clinicianName}`
  );
  
  // OBX - Observation Results
  let obxIndex = 1;
  
  // Subjective
  segments.push(
    `OBX|${obxIndex++}|TX|SUBJ^Subjective||${soapNote.subjective.replace(/\n/g, " ").substring(0, 200)}||||||F`
  );
  
  // Objective
  segments.push(
    `OBX|${obxIndex++}|TX|OBJ^Objective||${soapNote.objective.replace(/\n/g, " ").substring(0, 200)}||||||F`
  );
  
  // Assessment
  segments.push(
    `OBX|${obxIndex++}|TX|ASMT^Assessment||${soapNote.assessment.replace(/\n/g, " ").substring(0, 200)}||||||F`
  );
  
  // Plan
  segments.push(
    `OBX|${obxIndex++}|TX|PLAN^Plan||${soapNote.plan.replace(/\n/g, " ").substring(0, 200)}||||||F`
  );
  
  // Vital Signs if available
  if (soapNote.vitalSigns) {
    if (soapNote.vitalSigns.bp) {
      segments.push(`OBX|${obxIndex++}|ST|BP^Blood Pressure||${soapNote.vitalSigns.bp}|mmHg|||||F`);
    }
    if (soapNote.vitalSigns.hr) {
      segments.push(`OBX|${obxIndex++}|NM|HR^Heart Rate||${soapNote.vitalSigns.hr}|bpm|||||F`);
    }
    if (soapNote.vitalSigns.temp) {
      segments.push(`OBX|${obxIndex++}|NM|TEMP^Temperature||${soapNote.vitalSigns.temp}|C|||||F`);
    }
    if (soapNote.vitalSigns.o2sat) {
      segments.push(`OBX|${obxIndex++}|NM|SPO2^Oxygen Saturation||${soapNote.vitalSigns.o2sat}|%|||||F`);
    }
  }
  
  return segments.join("\r") + "\r";
}

/**
 * Generate QR code data URL
 */
async function generateQRCode(data: string): Promise<string> {
  // Using a simple QR code generation approach
  // In production, you might want to use a library like 'qrcode'
  const QRCode = require("qrcode");
  return await QRCode.toDataURL(data);
}

/**
 * Export SOAP note to PDF with QR code
 */
export async function exportToPdfWithQR(
  soapNote: SoapNoteData,
  options: ExportOptions,
  exportedBy: number
): Promise<{ success: boolean; exportId?: string; fileUrl?: string; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  try {
    const exportId = generateExportId();
    const verificationCode = generateVerificationCode();
    
    // Generate verification URL
    const verificationUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || "https://app.manus.space"}/verify-soap/${exportId}?code=${verificationCode}`;
    
    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(verificationUrl);
    
    // Generate PDF HTML content
    const pdfHtml = generatePdfContent(soapNote, qrCodeDataUrl);
    
    // Calculate checksum
    const checksum = calculateChecksum(pdfHtml);
    
    // Store PDF HTML to S3
    const fileKey = `soap-exports/${exportId}.html`;
    const { url: fileUrl } = await storagePut(fileKey, pdfHtml, "text/html");
    
    // Store QR code image
    const qrImageKey = `soap-exports/${exportId}-qr.png`;
    const qrImageBuffer = Buffer.from(qrCodeDataUrl.split(",")[1], "base64");
    await storagePut(qrImageKey, qrImageBuffer, "image/png");
    
    // Calculate expiry
    const expiresAt = options.expiresInHours
      ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
      : null;
    
    // Create export log
    await db.insert(soapExportLogs).values({
      exportId,
      patientId: soapNote.patientId,
      clinicianId: soapNote.clinicianId,
      encounterDate: soapNote.encounterDate,
      soapContent: JSON.stringify(soapNote),
      exportFormat: options.format,
      fileKey,
      fileUrl,
      fileSize: Buffer.from(pdfHtml).length,
      qrCodeData: JSON.stringify({ verificationUrl, verificationCode }),
      qrCodeImageKey: qrImageKey,
      destinationSystem: options.destinationSystem,
      destinationFacilityId: options.destinationFacilityId,
      status: "generated",
      exportedBy,
      exportPurpose: options.exportPurpose,
      accessedCount: 0,
      expiresAt,
      verificationCode,
      checksumMd5: checksum,
    });
    
    return {
      success: true,
      exportId,
      fileUrl,
    };
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export SOAP note to HL7 format
 */
export async function exportToHL7(
  soapNote: SoapNoteData,
  options: ExportOptions,
  exportedBy: number
): Promise<{ success: boolean; exportId?: string; fileUrl?: string; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  try {
    const exportId = generateExportId();
    const messageId = `MSG${Date.now()}`;
    
    // Generate HL7 message
    const hl7Message = generateHL7Message(
      soapNote,
      messageId,
      options.destinationFacilityId || "MEDITRIAGE"
    );
    
    // Calculate checksum
    const checksum = calculateChecksum(hl7Message);
    
    // Store HL7 message to S3
    const fileKey = `soap-exports/${exportId}.hl7`;
    const { url: fileUrl } = await storagePut(fileKey, hl7Message, "application/hl7-v2");
    
    // Calculate expiry
    const expiresAt = options.expiresInHours
      ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
      : null;
    
    // Create export log
    await db.insert(soapExportLogs).values({
      exportId,
      patientId: soapNote.patientId,
      clinicianId: soapNote.clinicianId,
      encounterDate: soapNote.encounterDate,
      soapContent: JSON.stringify(soapNote),
      exportFormat: options.format,
      fileKey,
      fileUrl,
      fileSize: Buffer.from(hl7Message).length,
      hl7MessageType: "ORU^R01",
      hl7Version: "2.5",
      hl7MessageId: messageId,
      destinationSystem: options.destinationSystem,
      destinationFacilityId: options.destinationFacilityId,
      status: "generated",
      exportedBy,
      exportPurpose: options.exportPurpose,
      accessedCount: 0,
      expiresAt,
      checksumMd5: checksum,
    });
    
    return {
      success: true,
      exportId,
      fileUrl,
    };
  } catch (error) {
    console.error("Error exporting to HL7:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get export log by ID
 */
export async function getExportLog(exportId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select()
    .from(soapExportLogs)
    .where(eq(soapExportLogs.exportId, exportId))
    .limit(1);
  
  return results[0] || null;
}

/**
 * Get all exports for a patient
 */
export async function getPatientExports(patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(soapExportLogs)
    .where(eq(soapExportLogs.patientId, patientId));
}

/**
 * Increment access count for an export
 */
export async function incrementExportAccess(exportId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const exportLog = await getExportLog(exportId);
  if (!exportLog) return;
  
  await db
    .update(soapExportLogs)
    .set({
      accessedCount: (exportLog.accessedCount || 0) + 1,
      lastAccessedAt: new Date(),
    })
    .where(eq(soapExportLogs.exportId, exportId));
}
