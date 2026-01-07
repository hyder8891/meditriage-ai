/**
 * Conversational Context Vector
 * 
 * Stores and manages the state of a medical conversation session.
 * This class handles rehydration from JSON and serialization back to JSON,
 * ensuring all context is preserved across conversation turns.
 */
export class ConversationalContextVector {
  // Core symptom tracking
  symptoms: string[] = [];
  confirmedSymptoms: string[] = [];
  ruledOut: string[] = [];
  
  // Conversation state
  stepCount: number = 0;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  // Language preference - CRITICAL for maintaining Arabic throughout conversation
  language: 'en' | 'ar' = 'en';
  
  // Symptom details
  duration?: string;
  severity?: string;
  location?: string;
  
  // Modifying factors
  aggravatingFactors: string[] = [];
  relievingFactors: string[] = [];
  
  // Patient demographics
  age?: number;
  gender?: string;
  
  // Medical background
  medicalHistory: string[] = [];
  medications: string[] = [];
  pastHistory: string[] = [];
  currentMeds: string[] = [];
  
  // 🛡️ Safe Rehydration - handles all field types properly
  constructor(data: any = {}) {
    if (!data) data = {};
    
    // Arrays - ensure proper array handling
    this.symptoms = Array.isArray(data.symptoms) ? [...data.symptoms] : [];
    this.confirmedSymptoms = Array.isArray(data.confirmedSymptoms) ? [...data.confirmedSymptoms] : [];
    this.ruledOut = Array.isArray(data.ruledOut) ? [...data.ruledOut] : [];
    this.aggravatingFactors = Array.isArray(data.aggravatingFactors) ? [...data.aggravatingFactors] : [];
    this.relievingFactors = Array.isArray(data.relievingFactors) ? [...data.relievingFactors] : [];
    this.medicalHistory = Array.isArray(data.medicalHistory) ? [...data.medicalHistory] : [];
    this.medications = Array.isArray(data.medications) ? [...data.medications] : [];
    this.pastHistory = Array.isArray(data.pastHistory) ? [...data.pastHistory] : [];
    this.currentMeds = Array.isArray(data.currentMeds) ? [...data.currentMeds] : [];
    
    // Conversation history - validate structure
    if (Array.isArray(data.conversationHistory)) {
      this.conversationHistory = data.conversationHistory.filter(
        (item: any) => item && typeof item === 'object' && 
          (item.role === 'user' || item.role === 'assistant') && 
          typeof item.content === 'string'
      ).map((item: any) => ({
        role: item.role as 'user' | 'assistant',
        content: item.content
      }));
    } else {
      this.conversationHistory = [];
    }
    
    // Counters (Force Number)
    this.stepCount = typeof data.stepCount === 'number' ? data.stepCount : 0;
    
    // Strings (Sanitize)
    this.duration = typeof data.duration === 'string' ? data.duration : undefined;
    this.severity = typeof data.severity === 'string' ? data.severity : undefined;
    this.location = typeof data.location === 'string' ? data.location : undefined;
    this.gender = typeof data.gender === 'string' ? data.gender : undefined;
    
    // Numbers
    this.age = typeof data.age === 'number' ? data.age : undefined;
    
    // Language - CRITICAL: persist language across conversation turns
    this.language = (data.language === 'ar' || data.language === 'en') ? data.language : 'en';
  }

  /**
   * Add new symptoms, deduplicating against existing ones
   */
  addSymptoms(newSymptoms: string[]) {
    const unique = new Set([
      ...this.symptoms, 
      ...newSymptoms.map(s => s.toLowerCase().trim())
    ]);
    this.symptoms = Array.from(unique);
  }

  /**
   * Add a message to conversation history
   */
  addToHistory(role: 'user' | 'assistant', content: string) {
    this.conversationHistory.push({ role, content });
  }

  /**
   * Serialize to JSON for storage/transmission
   */
  toJSON() {
    return {
      symptoms: this.symptoms,
      confirmedSymptoms: this.confirmedSymptoms,
      ruledOut: this.ruledOut,
      stepCount: this.stepCount,
      conversationHistory: this.conversationHistory,
      duration: this.duration,
      severity: this.severity,
      location: this.location,
      aggravatingFactors: this.aggravatingFactors,
      relievingFactors: this.relievingFactors,
      age: this.age,
      gender: this.gender,
      medicalHistory: this.medicalHistory,
      medications: this.medications,
      pastHistory: this.pastHistory,
      currentMeds: this.currentMeds,
      language: this.language
    };
  }
}
