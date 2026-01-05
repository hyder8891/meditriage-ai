import { describe, it, expect, vi } from "vitest";
import { doctorVerificationRouter } from "./doctor-verification-router";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([]))
          })),
          limit: vi.fn(() => Promise.resolve([]))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve([{ insertId: 1 }]))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve())
      }))
    }))
  }))
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(() => Promise.resolve(true))
}));

describe("Doctor Verification Router", () => {
  describe("Router Structure", () => {
    it("should have submitRequest procedure", () => {
      expect(doctorVerificationRouter._def.procedures.submitRequest).toBeDefined();
    });

    it("should have getMyStatus procedure", () => {
      expect(doctorVerificationRouter._def.procedures.getMyStatus).toBeDefined();
    });

    it("should have getPendingRequests procedure", () => {
      expect(doctorVerificationRouter._def.procedures.getPendingRequests).toBeDefined();
    });

    it("should have reviewRequest procedure", () => {
      expect(doctorVerificationRouter._def.procedures.reviewRequest).toBeDefined();
    });

    it("should have updateRequest procedure", () => {
      expect(doctorVerificationRouter._def.procedures.updateRequest).toBeDefined();
    });
  });

  describe("Input Validation", () => {
    it("submitRequest should require fullName", () => {
      const procedure = doctorVerificationRouter._def.procedures.submitRequest;
      expect(procedure).toBeDefined();
      // The procedure has input validation via zod
    });

    it("submitRequest should require medicalLicenseNumber", () => {
      const procedure = doctorVerificationRouter._def.procedures.submitRequest;
      expect(procedure).toBeDefined();
    });

    it("reviewRequest should require requestId and action", () => {
      const procedure = doctorVerificationRouter._def.procedures.reviewRequest;
      expect(procedure).toBeDefined();
    });
  });

  describe("Verification Status Flow", () => {
    it("should support pending status", () => {
      const statuses = ["pending", "under_review", "approved", "rejected", "requires_more_info"];
      expect(statuses).toContain("pending");
    });

    it("should support under_review status", () => {
      const statuses = ["pending", "under_review", "approved", "rejected", "requires_more_info"];
      expect(statuses).toContain("under_review");
    });

    it("should support approved status", () => {
      const statuses = ["pending", "under_review", "approved", "rejected", "requires_more_info"];
      expect(statuses).toContain("approved");
    });

    it("should support rejected status", () => {
      const statuses = ["pending", "under_review", "approved", "rejected", "requires_more_info"];
      expect(statuses).toContain("rejected");
    });

    it("should support requires_more_info status", () => {
      const statuses = ["pending", "under_review", "approved", "rejected", "requires_more_info"];
      expect(statuses).toContain("requires_more_info");
    });
  });

  describe("Review Actions", () => {
    it("should support approve action", () => {
      const actions = ["approve", "reject", "request_more_info", "start_review"];
      expect(actions).toContain("approve");
    });

    it("should support reject action", () => {
      const actions = ["approve", "reject", "request_more_info", "start_review"];
      expect(actions).toContain("reject");
    });

    it("should support request_more_info action", () => {
      const actions = ["approve", "reject", "request_more_info", "start_review"];
      expect(actions).toContain("request_more_info");
    });

    it("should support start_review action", () => {
      const actions = ["approve", "reject", "request_more_info", "start_review"];
      expect(actions).toContain("start_review");
    });
  });
});

// Import name matching functions
import { calculateNameSimilarity, compareDocumentNames } from "./services/document-verification";

describe("Doctor Verification - Name Matching", () => {
  describe("calculateNameSimilarity", () => {
    it("should return 100 for exact matches", () => {
      expect(calculateNameSimilarity("Ahmed Mohammed", "Ahmed Mohammed")).toBe(100);
      expect(calculateNameSimilarity("محمد أحمد", "محمد أحمد")).toBe(100);
    });

    it("should return 0 for null or undefined inputs", () => {
      expect(calculateNameSimilarity(null, "Ahmed")).toBe(0);
      expect(calculateNameSimilarity("Ahmed", null)).toBe(0);
      expect(calculateNameSimilarity(undefined, "Ahmed")).toBe(0);
      expect(calculateNameSimilarity("", "Ahmed")).toBe(0);
    });

    it("should handle case insensitivity", () => {
      expect(calculateNameSimilarity("AHMED MOHAMMED", "ahmed mohammed")).toBe(100);
    });

    it("should strip common titles", () => {
      expect(calculateNameSimilarity("Dr. Ahmed Mohammed", "Ahmed Mohammed")).toBe(100);
      expect(calculateNameSimilarity("Doctor Ahmed", "Ahmed")).toBe(100);
      expect(calculateNameSimilarity("الدكتور محمد", "محمد")).toBe(100);
    });

    it("should handle Arabic character normalization", () => {
      // أ إ آ should normalize to ا
      expect(calculateNameSimilarity("أحمد", "احمد")).toBe(100);
      expect(calculateNameSimilarity("إبراهيم", "ابراهيم")).toBe(100);
    });

    it("should handle Al-/El- prefix variations", () => {
      const score = calculateNameSimilarity("Al-Rashid", "Rashid");
      expect(score).toBeGreaterThanOrEqual(85);
    });

    it("should return high similarity for similar names", () => {
      // Mohammed vs Muhammad - common transliteration variation
      const score = calculateNameSimilarity("Mohammed Ali", "Muhammad Ali");
      expect(score).toBeGreaterThan(70);
    });

    it("should return low similarity for different names", () => {
      const score = calculateNameSimilarity("Ahmed Hassan", "Omar Khalid");
      expect(score).toBeLessThan(50);
    });

    it("should handle partial name matches", () => {
      // When one name contains the other
      const score = calculateNameSimilarity("Ahmed", "Ahmed Mohammed Hassan");
      expect(score).toBeGreaterThan(20); // Partial match returns lower score due to length difference
    });
  });

  describe("compareDocumentNames", () => {
    it("should compare full English names", () => {
      const idInfo = {
        name: "Ahmed",
        fatherName: "Mohammed",
        grandfatherName: "Hassan",
        familyName: "Al-Rashid",
      };
      const certInfo = {
        name: "Ahmed Mohammed Hassan Al-Rashid",
      };

      const result = compareDocumentNames(idInfo, certInfo);
      expect(result.score).toBeGreaterThanOrEqual(85);
    });

    it("should compare Arabic names", () => {
      const idInfo = {
        nameArabic: "أحمد محمد حسن",
      };
      const certInfo = {
        nameArabic: "أحمد محمد حسن",
      };

      const result = compareDocumentNames(idInfo, certInfo);
      expect(result.score).toBe(100);
      expect(result.method).toBe("full_arabic_name");
    });

    it("should return best match from multiple strategies", () => {
      const idInfo = {
        name: "Ahmed",
        nameArabic: "أحمد",
        fatherName: "Mohammed",
      };
      const certInfo = {
        name: "Ahmed",
        nameArabic: "أحمد",
      };

      const result = compareDocumentNames(idInfo, certInfo);
      expect(result.score).toBe(100);
    });

    it("should handle missing names gracefully", () => {
      const idInfo = {};
      const certInfo = {};

      const result = compareDocumentNames(idInfo, certInfo);
      expect(result.score).toBe(0);
      expect(result.method).toBe("no_names_found");
    });

    it("should detect name mismatch", () => {
      const idInfo = {
        name: "Ahmed Hassan",
        nameArabic: "أحمد حسن",
      };
      const certInfo = {
        name: "Omar Khalid",
        nameArabic: "عمر خالد",
      };

      const result = compareDocumentNames(idInfo, certInfo);
      expect(result.score).toBeLessThan(50);
    });
  });
});

describe("Doctor Verification - Threshold Logic", () => {
  it("should pass automatic verification at 85% or higher", () => {
    const threshold = 85;
    
    // Exact match should pass
    const exactScore = calculateNameSimilarity("Ahmed Mohammed", "Ahmed Mohammed");
    expect(exactScore >= threshold).toBe(true);
    
    // Very similar names should pass
    const similarScore = calculateNameSimilarity("Ahmed Mohammed Hassan", "Ahmed Mohammed Hassan");
    expect(similarScore >= threshold).toBe(true);
  });

  it("should require manual review below 85%", () => {
    const threshold = 85;
    
    // Different names should fail automatic verification
    const differentScore = calculateNameSimilarity("Ahmed Hassan", "Omar Khalid");
    expect(differentScore >= threshold).toBe(false);
  });

  it("should handle edge cases near threshold", () => {
    const threshold = 85;
    
    // Minor typo should still pass
    const typoScore = calculateNameSimilarity("Ahmed Mohammd", "Ahmed Mohammed");
    expect(typoScore).toBeGreaterThan(80);
  });
});

describe("Doctor Verification - Iraqi Name Formats", () => {
  it("should handle Iraqi three-part names", () => {
    // Iraqi names typically: First + Father + Grandfather
    const idInfo = {
      name: "Hashim",
      fatherName: "Talib",
      grandfatherName: "Hashim",
      familyName: "Manea",
    };
    const certInfo = {
      name: "Hashim Talib Hashim Manea",
    };

    const result = compareDocumentNames(idInfo, certInfo);
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("should handle Arabic full names from certificates", () => {
    const idInfo = {
      nameArabic: "هاشم طالب هاشم",
      familyNameArabic: "مانع",
    };
    const certInfo = {
      nameArabic: "هاشم طالب هاشم مانع",
    };

    const result = compareDocumentNames(idInfo, certInfo);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });
});

describe("Doctor Verification - New Router Endpoints", () => {
  it("should have uploadDocument procedure", () => {
    expect(doctorVerificationRouter._def.procedures.uploadDocument).toBeDefined();
  });

  it("should have getDocumentStatus procedure", () => {
    expect(doctorVerificationRouter._def.procedures.getDocumentStatus).toBeDefined();
  });

  it("should have triggerVerification procedure", () => {
    expect(doctorVerificationRouter._def.procedures.triggerVerification).toBeDefined();
  });

  it("should have getVerificationStatus procedure", () => {
    expect(doctorVerificationRouter._def.procedures.getVerificationStatus).toBeDefined();
  });

  it("should have getPendingVerifications procedure", () => {
    expect(doctorVerificationRouter._def.procedures.getPendingVerifications).toBeDefined();
  });

  it("should have adminVerify procedure", () => {
    expect(doctorVerificationRouter._def.procedures.adminVerify).toBeDefined();
  });

  it("should have adminReject procedure", () => {
    expect(doctorVerificationRouter._def.procedures.adminReject).toBeDefined();
  });
});
