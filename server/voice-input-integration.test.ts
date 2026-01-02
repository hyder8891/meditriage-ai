import { describe, it, expect } from "vitest";

/**
 * Integration test for Arabic voice input feature
 * 
 * This test verifies that the voice input component integration is properly set up
 * for both the symptom checker and booking forms.
 * 
 * Since the Web Speech API is a browser-only feature, we test the integration
 * by verifying the component files exist and are properly structured.
 */
describe("Arabic Voice Input Integration", () => {
  it("should have VoiceInput component file", async () => {
    const fs = await import("fs");
    const path = await import("path");
    
    const componentPath = path.resolve(
      process.cwd(),
      "client/src/components/VoiceInput.tsx"
    );
    
    expect(fs.existsSync(componentPath)).toBe(true);
    
    const content = fs.readFileSync(componentPath, "utf-8");
    
    // Verify component exports VoiceInput
    expect(content).toContain("export function VoiceInput");
    
    // Verify it accepts language prop for Arabic
    expect(content).toContain("ar-SA");
    
    // Verify it uses Web Speech API
    expect(content).toContain("SpeechRecognition");
    expect(content).toContain("webkitSpeechRecognition");
    
    // Verify it has proper error handling
    expect(content).toContain("onerror");
    
    // Verify it has transcript callback
    expect(content).toContain("onTranscript");
  });

  it("should integrate VoiceInput into SymptomChecker", async () => {
    const fs = await import("fs");
    const path = await import("path");
    
    const symptomCheckerPath = path.resolve(
      process.cwd(),
      "client/src/pages/SymptomChecker.tsx"
    );
    
    expect(fs.existsSync(symptomCheckerPath)).toBe(true);
    
    const content = fs.readFileSync(symptomCheckerPath, "utf-8");
    
    // Verify VoiceInput is imported
    expect(content).toContain('import { VoiceInput }');
    expect(content).toContain('from "@/components/VoiceInput"');
    
    // Verify VoiceInput component is used
    expect(content).toContain("<VoiceInput");
    
    // Verify it passes language prop
    expect(content).toContain('language={language === "ar" ? "ar-SA" : "en-US"}');
    
    // Verify it has onTranscript handler
    expect(content).toContain("onTranscript=");
  });

  it("should integrate VoiceInput into PatientBooking", async () => {
    const fs = await import("fs");
    const path = await import("path");
    
    const bookingPath = path.resolve(
      process.cwd(),
      "client/src/pages/PatientBooking.tsx"
    );
    
    expect(fs.existsSync(bookingPath)).toBe(true);
    
    const content = fs.readFileSync(bookingPath, "utf-8");
    
    // Verify VoiceInput is imported
    expect(content).toContain('import { VoiceInput }');
    expect(content).toContain('from "@/components/VoiceInput"');
    
    // Verify VoiceInput component is used (should have 2 instances for chief complaint and symptoms)
    const voiceInputMatches = content.match(/<VoiceInput/g);
    expect(voiceInputMatches).toBeTruthy();
    expect(voiceInputMatches!.length).toBeGreaterThanOrEqual(2);
    
    // Verify it passes language prop
    expect(content).toContain('language={language === "ar" ? "ar-SA" : "en-US"}');
    
    // Verify it has onTranscript handlers for both fields
    expect(content).toContain("chiefComplaint");
    expect(content).toContain("symptoms");
  });

  it("should support both Arabic and English languages", async () => {
    const fs = await import("fs");
    const path = await import("path");
    
    const componentPath = path.resolve(
      process.cwd(),
      "client/src/components/VoiceInput.tsx"
    );
    
    const content = fs.readFileSync(componentPath, "utf-8");
    
    // Verify language prop type includes both Arabic and English
    expect(content).toContain("ar-SA");
    expect(content).toContain("en-US");
    
    // Verify bilingual error messages
    expect(content).toContain('language === "ar-SA"');
    expect(content).toContain('language === "en-US"');
  });

  it("should have proper accessibility features", async () => {
    const fs = await import("fs");
    const path = await import("path");
    
    const componentPath = path.resolve(
      process.cwd(),
      "client/src/components/VoiceInput.tsx"
    );
    
    const content = fs.readFileSync(componentPath, "utf-8");
    
    // Verify button has title attribute for accessibility
    expect(content).toContain("title=");
    
    // Verify it shows listening state
    expect(content).toContain("isListening");
    
    // Verify it shows interim transcript for user feedback
    expect(content).toContain("interimTranscript");
  });
});
