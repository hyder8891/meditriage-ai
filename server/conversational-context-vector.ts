/**
 * Conversational Context Vector Class
 * 
 * Maintains cumulative patient state across multi-turn conversations
 * with proper class method preservation through JSON serialization
 */

// ============================================================================
// Context Vector Class
// ============================================================================

export class ConversationalContextVector {
  public symptoms: string[] = [];
  public duration?: string;
  public severity?: string;
  public location?: string;
  public aggravatingFactors: string[] = [];
  public relievingFactors: string[] = [];
  public associatedSymptoms: string[] = [];
  public medicalHistory: string[] = [];
  public medications: string[] = [];
  public age?: number;
  public gender?: string;
  public questionCount: number = 0;
  public ruledOut: string[] = [];
  public confirmedSymptoms: string[] = [];

  /**
   * Constructor accepts raw data for rehydration from JSON
   * This is critical for maintaining state across tRPC calls
   */
  constructor(data?: Partial<ConversationalContextVector>) {
    if (data) {
      this.symptoms = data.symptoms || [];
      this.duration = data.duration;
      this.severity = data.severity;
      this.location = data.location;
      this.aggravatingFactors = data.aggravatingFactors || [];
      this.relievingFactors = data.relievingFactors || [];
      this.associatedSymptoms = data.associatedSymptoms || [];
      this.medicalHistory = data.medicalHistory || [];
      this.medications = data.medications || [];
      this.age = data.age;
      this.gender = data.gender;
      this.questionCount = data.questionCount || 0;
      this.ruledOut = data.ruledOut || [];
      this.confirmedSymptoms = data.confirmedSymptoms || [];
    }
  }

  /**
   * Update symptoms based on user input
   * Intelligently merges new symptoms without duplicates
   */
  updateSymptoms(newSymptoms: string[]) {
    for (const symptom of newSymptoms) {
      const normalized = symptom.toLowerCase().trim();
      if (!this.symptoms.some(s => s.toLowerCase() === normalized)) {
        this.symptoms.push(symptom);
      }
    }
  }

  /**
   * Add confirmed symptom (patient explicitly confirmed)
   */
  confirmSymptom(symptom: string) {
    const normalized = symptom.toLowerCase().trim();
    if (!this.confirmedSymptoms.some(s => s.toLowerCase() === normalized)) {
      this.confirmedSymptoms.push(symptom);
    }
  }

  /**
   * Rule out a condition/symptom (patient explicitly denied)
   */
  ruleOut(item: string) {
    const normalized = item.toLowerCase().trim();
    if (!this.ruledOut.some(r => r.toLowerCase() === normalized)) {
      this.ruledOut.push(item);
    }
  }

  /**
   * Update aggravating factors
   */
  updateAggravatingFactors(factors: string[]) {
    for (const factor of factors) {
      const normalized = factor.toLowerCase().trim();
      if (!this.aggravatingFactors.some(f => f.toLowerCase() === normalized)) {
        this.aggravatingFactors.push(factor);
      }
    }
  }

  /**
   * Update relieving factors
   */
  updateRelievingFactors(factors: string[]) {
    for (const factor of factors) {
      const normalized = factor.toLowerCase().trim();
      if (!this.relievingFactors.some(f => f.toLowerCase() === normalized)) {
        this.relievingFactors.push(factor);
      }
    }
  }

  /**
   * Update associated symptoms
   */
  updateAssociatedSymptoms(symptoms: string[]) {
    for (const symptom of symptoms) {
      const normalized = symptom.toLowerCase().trim();
      if (!this.associatedSymptoms.some(s => s.toLowerCase() === normalized)) {
        this.associatedSymptoms.push(symptom);
      }
    }
  }

  /**
   * Update medical history
   */
  updateMedicalHistory(history: string[]) {
    for (const item of history) {
      const normalized = item.toLowerCase().trim();
      if (!this.medicalHistory.some(h => h.toLowerCase() === normalized)) {
        this.medicalHistory.push(item);
      }
    }
  }

  /**
   * Update medications
   */
  updateMedications(meds: string[]) {
    for (const med of meds) {
      const normalized = med.toLowerCase().trim();
      if (!this.medications.some(m => m.toLowerCase() === normalized)) {
        this.medications.push(med);
      }
    }
  }

  /**
   * Increment question count
   */
  incrementQuestionCount() {
    this.questionCount++;
  }

  /**
   * Get completeness score (0-100)
   * Used to determine if we have enough information
   */
  getCompletenessScore(): number {
    let score = 0;
    
    // Core information (60 points)
    if (this.symptoms.length > 0) score += 20;
    if (this.duration) score += 10;
    if (this.severity) score += 10;
    if (this.location) score += 10;
    if (this.age) score += 5;
    if (this.gender) score += 5;

    // Additional context (40 points)
    if (this.aggravatingFactors.length > 0) score += 10;
    if (this.relievingFactors.length > 0) score += 10;
    if (this.associatedSymptoms.length > 0) score += 10;
    if (this.medicalHistory.length > 0) score += 5;
    if (this.medications.length > 0) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Get missing critical information
   * Returns array of missing fields that should be asked about
   */
  getMissingCriticalInfo(): string[] {
    const missing: string[] = [];
    
    if (this.symptoms.length === 0) missing.push("symptoms");
    if (!this.duration) missing.push("duration");
    if (!this.severity) missing.push("severity");
    if (!this.location && this.symptoms.some(s => 
      s.toLowerCase().includes("pain") || 
      s.toLowerCase().includes("ache") ||
      s.toLowerCase().includes("ألم")
    )) {
      missing.push("location");
    }
    if (!this.age) missing.push("age");

    return missing;
  }

  /**
   * Serialize to plain JSON for tRPC transfer
   * This ensures the data can be sent over the network
   */
  toJSON() {
    return {
      symptoms: this.symptoms,
      duration: this.duration,
      severity: this.severity,
      location: this.location,
      aggravatingFactors: this.aggravatingFactors,
      relievingFactors: this.relievingFactors,
      associatedSymptoms: this.associatedSymptoms,
      medicalHistory: this.medicalHistory,
      medications: this.medications,
      age: this.age,
      gender: this.gender,
      questionCount: this.questionCount,
      ruledOut: this.ruledOut,
      confirmedSymptoms: this.confirmedSymptoms
    };
  }

  /**
   * Get a human-readable summary of the context
   * Useful for debugging and logging
   */
  getSummary(): string {
    const parts: string[] = [];
    
    if (this.symptoms.length > 0) {
      parts.push(`Symptoms: ${this.symptoms.join(", ")}`);
    }
    if (this.duration) {
      parts.push(`Duration: ${this.duration}`);
    }
    if (this.severity) {
      parts.push(`Severity: ${this.severity}`);
    }
    if (this.location) {
      parts.push(`Location: ${this.location}`);
    }
    if (this.questionCount > 0) {
      parts.push(`Questions asked: ${this.questionCount}`);
    }
    
    return parts.join(" | ") || "No context yet";
  }
}

/**
 * Factory function to create or rehydrate a context vector
 * Use this instead of `new ConversationalContextVector()` for consistency
 */
export function createContextVector(data?: Partial<ConversationalContextVector>): ConversationalContextVector {
  return new ConversationalContextVector(data);
}
