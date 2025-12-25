import { describe, it, expect, beforeAll } from "vitest";
import { analyzeClinicalPresentation, type PatientInfo } from "./clinical-reasoning";

describe("Clinical Reasoning System", () => {
  describe("analyzeClinicalPresentation", () => {
    it("should analyze strep throat presentation and return differential diagnoses", async () => {
      const patientInfo: PatientInfo = {
        complaints:
          "Severe throat pain, difficulty swallowing, red and swollen tonsils with white patches",
        chiefComplaint: "Severe sore throat",
        age: 25,
        gender: "male",
        vitalSigns: {
          heartRate: 88,
          bloodPressure: { systolic: 120, diastolic: 75 },
          temperature: 38.5,
          oxygenSaturation: 98,
        },
      };

      const result = await analyzeClinicalPresentation(patientInfo, "en");

      // Verify structure
      expect(result).toHaveProperty("differentialDiagnoses");
      expect(result).toHaveProperty("recommendedTests");
      expect(result).toHaveProperty("redFlags");
      expect(result).toHaveProperty("urgencyAssessment");

      // Verify differential diagnoses
      expect(result.differentialDiagnoses).toBeInstanceOf(Array);
      expect(result.differentialDiagnoses.length).toBeGreaterThan(0);
      expect(result.differentialDiagnoses.length).toBeLessThanOrEqual(5);

      // Check first diagnosis structure
      const firstDiagnosis = result.differentialDiagnoses[0];
      expect(firstDiagnosis).toHaveProperty("diagnosisName");
      expect(firstDiagnosis).toHaveProperty("diagnosisNameAr");
      expect(firstDiagnosis).toHaveProperty("likelihoodScore");
      expect(firstDiagnosis).toHaveProperty("clinicalReasoning");
      expect(firstDiagnosis).toHaveProperty("clinicalReasoningAr");
      expect(firstDiagnosis).toHaveProperty("matchingSymptoms");
      expect(firstDiagnosis).toHaveProperty("riskFactors");

      // Verify likelihood scores are valid percentages
      expect(firstDiagnosis.likelihoodScore).toBeGreaterThanOrEqual(0);
      expect(firstDiagnosis.likelihoodScore).toBeLessThanOrEqual(100);

      // Verify diagnoses are ranked by likelihood
      for (let i = 1; i < result.differentialDiagnoses.length; i++) {
        expect(result.differentialDiagnoses[i - 1].likelihoodScore).toBeGreaterThanOrEqual(
          result.differentialDiagnoses[i].likelihoodScore
        );
      }

      // Verify recommended tests
      expect(result.recommendedTests).toBeInstanceOf(Array);
      expect(result.recommendedTests.length).toBeGreaterThan(0);

      const firstTest = result.recommendedTests[0];
      expect(firstTest).toHaveProperty("testName");
      expect(firstTest).toHaveProperty("testNameAr");
      expect(firstTest).toHaveProperty("reasoning");
      expect(firstTest).toHaveProperty("reasoningAr");
      expect(firstTest).toHaveProperty("priority");
      expect(["immediate", "urgent", "routine"]).toContain(firstTest.priority);

      // Verify urgency assessment
      expect(result.urgencyAssessment).toHaveProperty("level");
      expect(result.urgencyAssessment).toHaveProperty("reasoning");
      expect(result.urgencyAssessment).toHaveProperty("reasoningAr");
      expect(result.urgencyAssessment).toHaveProperty("recommendedAction");
      expect(result.urgencyAssessment).toHaveProperty("recommendedActionAr");
      expect(result.urgencyAssessment).toHaveProperty("timeframe");
      expect(result.urgencyAssessment).toHaveProperty("timeframeAr");

      expect(["emergency", "urgent", "semi-urgent", "non-urgent", "routine"]).toContain(
        result.urgencyAssessment.level
      );
    }, 60000);

    it("should handle pediatric case with different vital signs", async () => {
      const patientInfo: PatientInfo = {
        complaints: "High fever, persistent cough, difficulty breathing, rapid breathing",
        chiefComplaint: "Fever and respiratory distress",
        age: 5,
        gender: "female",
        vitalSigns: {
          heartRate: 130,
          temperature: 39.5,
          oxygenSaturation: 92,
          respiratoryRate: 40,
        },
      };

      const result = await analyzeClinicalPresentation(patientInfo, "en");

      expect(result.differentialDiagnoses).toBeInstanceOf(Array);
      expect(result.differentialDiagnoses.length).toBeGreaterThan(0);
      expect(result.recommendedTests).toBeInstanceOf(Array);
      expect(result.redFlags).toBeInstanceOf(Array);

      // Should have red flags for respiratory distress
      expect(result.redFlags.length).toBeGreaterThan(0);

      // Should be urgent or emergency
      expect(["emergency", "urgent"]).toContain(result.urgencyAssessment.level);
    }, 60000);

    it("should generate bilingual content in Arabic", async () => {
      const patientInfo: PatientInfo = {
        complaints: "ألم شديد في البطن، غثيان، قيء",
        chiefComplaint: "ألم في البطن",
        age: 35,
        gender: "male",
        vitalSigns: {
          heartRate: 95,
          bloodPressure: { systolic: 130, diastolic: 85 },
          temperature: 37.8,
        },
      };

      const result = await analyzeClinicalPresentation(patientInfo, "ar");

      // Verify Arabic content exists
      const firstDiagnosis = result.differentialDiagnoses[0];
      expect(firstDiagnosis.diagnosisNameAr).toBeTruthy();
      expect(firstDiagnosis.diagnosisNameAr.length).toBeGreaterThan(0);
      expect(firstDiagnosis.clinicalReasoningAr).toBeTruthy();
      expect(firstDiagnosis.clinicalReasoningAr.length).toBeGreaterThan(0);

      // Verify Arabic content in tests
      const firstTest = result.recommendedTests[0];
      expect(firstTest.testNameAr).toBeTruthy();
      expect(firstTest.reasoningAr).toBeTruthy();

      // Verify Arabic content in urgency assessment
      expect(result.urgencyAssessment.reasoningAr).toBeTruthy();
      expect(result.urgencyAssessment.recommendedActionAr).toBeTruthy();
      expect(result.urgencyAssessment.timeframeAr).toBeTruthy();
    }, 60000);

    it("should handle elderly patient with multiple comorbidities", async () => {
      const patientInfo: PatientInfo = {
        complaints: "Chest pain, shortness of breath, fatigue",
        chiefComplaint: "Chest pain",
        age: 72,
        gender: "male",
        vitalSigns: {
          heartRate: 110,
          bloodPressure: { systolic: 160, diastolic: 95 },
          temperature: 37.2,
          oxygenSaturation: 94,
        },
        medicalHistory: ["Hypertension", "Type 2 Diabetes", "Hyperlipidemia"],
        currentMedications: ["Metformin", "Lisinopril", "Atorvastatin"],
      };

      const result = await analyzeClinicalPresentation(patientInfo, "en");

      expect(result.differentialDiagnoses).toBeInstanceOf(Array);
      expect(result.differentialDiagnoses.length).toBeGreaterThan(0);

      // Should have high urgency for chest pain in elderly
      expect(["emergency", "urgent"]).toContain(result.urgencyAssessment.level);

      // Should have red flags
      expect(result.redFlags.length).toBeGreaterThan(0);

      // Should recommend immediate tests
      const hasImmediateTest = result.recommendedTests.some(
        (test) => test.priority === "immediate"
      );
      expect(hasImmediateTest).toBe(true);
    }, 60000);

    it("should handle minor complaint with low urgency", async () => {
      const patientInfo: PatientInfo = {
        complaints: "Mild headache for 2 days, no fever, no other symptoms",
        chiefComplaint: "Headache",
        age: 28,
        gender: "female",
        vitalSigns: {
          heartRate: 72,
          bloodPressure: { systolic: 115, diastolic: 70 },
          temperature: 36.8,
          oxygenSaturation: 99,
        },
      };

      const result = await analyzeClinicalPresentation(patientInfo, "en");

      expect(result.differentialDiagnoses).toBeInstanceOf(Array);
      expect(result.differentialDiagnoses.length).toBeGreaterThan(0);

      // Should have low urgency
      expect(["non-urgent", "routine", "semi-urgent"]).toContain(
        result.urgencyAssessment.level
      );

      // May have fewer or no red flags
      expect(result.redFlags).toBeInstanceOf(Array);
    }, 60000);

    it("should include matching symptoms in diagnosis reasoning", async () => {
      const patientInfo: PatientInfo = {
        complaints: "Severe headache, stiff neck, photophobia, fever",
        chiefComplaint: "Severe headache with neck stiffness",
        age: 30,
        gender: "male",
        vitalSigns: {
          heartRate: 105,
          temperature: 39.2,
        },
      };

      const result = await analyzeClinicalPresentation(patientInfo, "en");

      const firstDiagnosis = result.differentialDiagnoses[0];
      expect(firstDiagnosis.matchingSymptoms).toBeInstanceOf(Array);
      expect(firstDiagnosis.matchingSymptoms.length).toBeGreaterThan(0);

      // Verify symptoms are strings
      firstDiagnosis.matchingSymptoms.forEach((symptom) => {
        expect(typeof symptom).toBe("string");
        expect(symptom.length).toBeGreaterThan(0);
      });
    }, 60000);

    it("should include risk factors in diagnosis", async () => {
      const patientInfo: PatientInfo = {
        complaints: "Persistent cough with blood, weight loss, night sweats",
        chiefComplaint: "Cough with hemoptysis",
        age: 55,
        gender: "male",
        vitalSigns: {
          heartRate: 88,
          temperature: 37.9,
        },
        medicalHistory: ["Smoking history - 30 pack years"],
      };

      const result = await analyzeClinicalPresentation(patientInfo, "en");

      const firstDiagnosis = result.differentialDiagnoses[0];
      expect(firstDiagnosis.riskFactors).toBeInstanceOf(Array);

      // May or may not have risk factors depending on diagnosis
      if (firstDiagnosis.riskFactors.length > 0) {
        firstDiagnosis.riskFactors.forEach((factor) => {
          expect(typeof factor).toBe("string");
          expect(factor.length).toBeGreaterThan(0);
        });
      }
    }, 60000);

    it("should handle case with allergies", async () => {
      const patientInfo: PatientInfo = {
        complaints: "Skin rash, itching, mild swelling",
        chiefComplaint: "Allergic reaction",
        age: 22,
        gender: "female",
        vitalSigns: {
          heartRate: 85,
          temperature: 37.0,
        },
        allergies: ["Penicillin", "Shellfish"],
      };

      const result = await analyzeClinicalPresentation(patientInfo, "en");

      expect(result.differentialDiagnoses).toBeInstanceOf(Array);
      expect(result.differentialDiagnoses.length).toBeGreaterThan(0);
      expect(result.recommendedTests).toBeInstanceOf(Array);

      // Should consider allergies in recommendations
      expect(result.urgencyAssessment).toHaveProperty("level");
    }, 60000);

    it("should validate all required fields are present in response", async () => {
      const patientInfo: PatientInfo = {
        complaints: "Test symptoms",
        chiefComplaint: "Test complaint",
        age: 30,
        gender: "male",
        vitalSigns: {
          heartRate: 75,
        },
      };

      const result = await analyzeClinicalPresentation(patientInfo, "en");

      // Validate all diagnoses have required fields
      result.differentialDiagnoses.forEach((diagnosis) => {
        expect(diagnosis.diagnosisName).toBeTruthy();
        expect(diagnosis.diagnosisNameAr).toBeTruthy();
        expect(typeof diagnosis.likelihoodScore).toBe("number");
        expect(diagnosis.clinicalReasoning).toBeTruthy();
        expect(diagnosis.clinicalReasoningAr).toBeTruthy();
        expect(Array.isArray(diagnosis.matchingSymptoms)).toBe(true);
        expect(Array.isArray(diagnosis.riskFactors)).toBe(true);
      });

      // Validate all tests have required fields
      result.recommendedTests.forEach((test) => {
        expect(test.testName).toBeTruthy();
        expect(test.testNameAr).toBeTruthy();
        expect(test.reasoning).toBeTruthy();
        expect(test.reasoningAr).toBeTruthy();
        expect(["immediate", "urgent", "routine"]).toContain(test.priority);
      });

      // Validate all red flags have required fields
      result.redFlags.forEach((flag) => {
        expect(flag.flag).toBeTruthy();
        expect(flag.flagAr).toBeTruthy();
        expect(["critical", "high", "moderate"]).toContain(flag.severity);
        expect(flag.action).toBeTruthy();
        expect(flag.actionAr).toBeTruthy();
      });

      // Validate urgency assessment
      expect(result.urgencyAssessment.level).toBeTruthy();
      expect(result.urgencyAssessment.reasoning).toBeTruthy();
      expect(result.urgencyAssessment.reasoningAr).toBeTruthy();
      expect(result.urgencyAssessment.recommendedAction).toBeTruthy();
      expect(result.urgencyAssessment.recommendedActionAr).toBeTruthy();
      expect(result.urgencyAssessment.timeframe).toBeTruthy();
      expect(result.urgencyAssessment.timeframeAr).toBeTruthy();
    }, 60000);
  });
});
