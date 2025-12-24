export class ConversationalContextVector {
  symptoms: string[] = [];
  stepCount: number = 0;
  duration?: string;
  severity?: string;
  location?: string;
  age?: number;
  gender?: string;
  pastHistory: string[] = [];
  currentMeds: string[] = [];
  
  // 🛡️ Safe Rehydration
  constructor(data: any = {}) {
    if (!data) data = {};
    
    // Arrays
    this.symptoms = Array.isArray(data.symptoms) ? data.symptoms : [];
    this.pastHistory = Array.isArray(data.pastHistory) ? data.pastHistory : [];
    this.currentMeds = Array.isArray(data.currentMeds) ? data.currentMeds : [];
    
    // Counters (Force Number)
    this.stepCount = typeof data.stepCount === 'number' ? data.stepCount : 0;
    
    // Strings (Sanitize)
    this.duration = typeof data.duration === 'string' ? data.duration : undefined;
    this.severity = typeof data.severity === 'string' ? data.severity : undefined;
    this.location = typeof data.location === 'string' ? data.location : undefined;
    this.gender = typeof data.gender === 'string' ? data.gender : undefined;
    
    // Numbers
    this.age = typeof data.age === 'number' ? data.age : undefined;
  }

  addSymptoms(newSymptoms: string[]) {
    // Deduplicate
    const unique = new Set([...this.symptoms, ...newSymptoms.map(s => s.toLowerCase().trim())]);
    this.symptoms = Array.from(unique);
  }

  toJSON() {
    return {
      symptoms: this.symptoms,
      stepCount: this.stepCount,
      duration: this.duration,
      severity: this.severity,
      location: this.location,
      age: this.age,
      gender: this.gender,
      pastHistory: this.pastHistory,
      currentMeds: this.currentMeds
    };
  }
}
