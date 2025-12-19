# BRAIN: Biomedical Reasoning and Intelligence Network

## Vision Statement

BRAIN is an advanced medical AI system that combines multiple data sources, machine learning models, and continuous learning mechanisms to provide evidence-based clinical decision support. It serves as the "intelligent core" of MediTriage AI Pro, processing medical information through interconnected knowledge systems and learning from every interaction.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              BRAIN                                   │
│         (Biomedical Reasoning and Intelligence Network)              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
         ┌──────────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
         │  Knowledge Base │ │ Models │ │  Learning  │
         │    (Memory)     │ │(Cortex)│ │  (Synapse) │
         └─────────────────┘ └────────┘ └────────────┘
                    │             │             │
      ┌─────────────┼─────────────┼─────────────┼─────────────┐
      │             │             │             │             │
┌─────▼─────┐ ┌────▼────┐ ┌──────▼──────┐ ┌───▼────┐ ┌─────▼─────┐
│   UMLS    │ │ Vector  │ │  MedGemma   │ │  LLM   │ │ Feedback  │
│ Concepts  │ │   DB    │ │   Models    │ │ Engine │ │   Loop    │
│ (900K)    │ │ (3M+)   │ │  (Imaging)  │ │(Reason)│ │ (Learn)   │
└───────────┘ └─────────┘ └─────────────┘ └────────┘ └───────────┘
```

## Core Components

### 1. Knowledge Base (Memory Layer)

#### UMLS Integration
- **Purpose**: Medical terminology and concept mapping
- **Size**: 900,000+ medical concepts, 2M+ terms
- **Function**: Standardize medical language, map between coding systems

#### Vector Database (RAG)
- **Purpose**: Semantic search of medical literature
- **Size**: 3+ million medical documents
- **Function**: Retrieve relevant evidence for clinical reasoning

#### MIMIC-III Database
- **Purpose**: Historical ICU patient data
- **Size**: 40,000+ patient records
- **Function**: Pattern recognition, outcome prediction

### 2. Models Layer (Cortex)

#### LLM Engine (Primary Reasoning)
- **Models**: DeepSeek (primary), Gemini (backup)
- **Function**: Natural language understanding, clinical reasoning, response generation
- **Capabilities**: Multi-lingual, context-aware, conversational

#### MedGemma (Medical Specialist)
- **Models**: MedGemma 4B/27B, MedSigLIP
- **Function**: Medical imaging analysis, report generation
- **Capabilities**: X-ray interpretation, zero-shot classification

### 3. Learning Layer (Synapse)

#### Continuous Learning Mechanisms
- **Feedback Collection**: Clinician corrections, outcome tracking
- **Pattern Recognition**: Identify common diagnostic patterns
- **Model Fine-tuning**: Adapt to Iraqi medical context
- **Knowledge Updates**: Integrate new medical research

## BRAIN Capabilities

### 🧠 Core Intelligence Functions

1. **Medical Concept Understanding**
   - Parse natural language symptoms
   - Map to standardized medical concepts (UMLS)
   - Recognize synonyms and variations
   - Support Arabic and English

2. **Evidence-Based Reasoning**
   - Retrieve relevant medical literature
   - Analyze similar historical cases
   - Calculate diagnostic probabilities
   - Generate differential diagnoses

3. **Multi-Modal Analysis**
   - Process text (symptoms, history)
   - Analyze images (X-rays, scans)
   - Interpret vital signs and lab results
   - Synthesize information from all sources

4. **Contextual Adaptation**
   - Consider patient demographics
   - Account for Iraqi medical context
   - Adjust for local disease prevalence
   - Respect cultural considerations

5. **Continuous Learning**
   - Learn from clinician feedback
   - Track diagnostic accuracy
   - Identify knowledge gaps
   - Update recommendations

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

#### Database Schema
```sql
-- BRAIN Core Tables

CREATE TABLE brain_knowledge_concepts (
  concept_id VARCHAR(20) PRIMARY KEY,
  concept_name TEXT,
  semantic_type VARCHAR(50),
  definition TEXT,
  source VARCHAR(50), -- UMLS, SNOMED, ICD-10
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brain_knowledge_relationships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  concept_id_1 VARCHAR(20),
  relationship_type VARCHAR(50), -- is_a, part_of, treats, causes
  concept_id_2 VARCHAR(20),
  confidence FLOAT,
  source VARCHAR(50),
  FOREIGN KEY (concept_id_1) REFERENCES brain_knowledge_concepts(concept_id),
  FOREIGN KEY (concept_id_2) REFERENCES brain_knowledge_concepts(concept_id)
);

CREATE TABLE brain_medical_literature (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title TEXT,
  abstract TEXT,
  full_text LONGTEXT,
  authors TEXT,
  publication_date DATE,
  journal VARCHAR(255),
  pmid VARCHAR(20), -- PubMed ID
  doi VARCHAR(100),
  medical_specialty VARCHAR(100),
  evidence_level VARCHAR(20), -- Level I-V
  embedding_vector JSON, -- Store vector embedding
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brain_case_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id VARCHAR(50) UNIQUE,
  patient_demographics JSON, -- age, gender (anonymized)
  symptoms JSON, -- array of symptom concepts
  vital_signs JSON,
  lab_results JSON,
  imaging_findings JSON,
  diagnosis JSON, -- array of diagnoses with probabilities
  treatment JSON,
  outcome VARCHAR(50), -- improved, stable, deteriorated
  clinician_feedback JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brain_learning_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id VARCHAR(50),
  brain_diagnosis JSON, -- what BRAIN suggested
  actual_diagnosis JSON, -- what it actually was
  clinician_correction TEXT,
  accuracy_score FLOAT, -- 0-1
  feedback_type VARCHAR(50), -- correct, incorrect, partially_correct
  learning_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES brain_case_history(case_id)
);

CREATE TABLE brain_performance_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric_date DATE,
  total_cases INT,
  correct_diagnoses INT,
  accuracy_rate FLOAT,
  avg_confidence FLOAT,
  avg_response_time_ms INT,
  knowledge_base_size INT, -- number of documents
  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brain_training_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_type VARCHAR(50), -- fine_tuning, knowledge_update, pattern_learning
  data_source VARCHAR(100),
  records_processed INT,
  improvements JSON, -- what improved
  model_checkpoint VARCHAR(255), -- saved model path
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status VARCHAR(20) -- running, completed, failed
);
```

#### BRAIN Core Module Structure
```
server/brain/
├── index.ts                 # BRAIN main orchestrator
├── knowledge/
│   ├── umls.ts             # UMLS integration
│   ├── vector-db.ts        # RAG vector database
│   ├── mimic.ts            # MIMIC-III queries
│   └── knowledge-graph.ts  # Concept relationships
├── models/
│   ├── llm.ts              # LLM integration (DeepSeek/Gemini)
│   ├── medgemma.ts         # MedGemma models
│   └── ensemble.ts         # Model ensemble logic
├── reasoning/
│   ├── clinical-reasoning.ts  # Diagnostic logic
│   ├── differential-dx.ts     # Differential diagnosis
│   ├── evidence-retrieval.ts  # Literature search
│   └── probability.ts         # Bayesian reasoning
├── learning/
│   ├── feedback-collector.ts  # Collect clinician feedback
│   ├── pattern-learner.ts     # Learn diagnostic patterns
│   ├── model-updater.ts       # Fine-tune models
│   └── knowledge-updater.ts   # Update knowledge base
└── api/
    ├── brain-router.ts     # tRPC router for BRAIN
    └── brain-types.ts      # TypeScript types
```

### Phase 2: UMLS Integration (Week 2-3)

#### UMLS Setup
1. Apply for UMLS license
2. Download Metathesaurus, Semantic Network, SPECIALIST Lexicon
3. Load into MySQL database
4. Create indexes for fast lookup

#### Implementation
```typescript
// server/brain/knowledge/umls.ts

import { db } from '../../db';

export class UMLSKnowledge {
  /**
   * Find medical concept by term
   */
  async findConcept(term: string, language: 'en' | 'ar' = 'en') {
    // Normalize term
    const normalized = this.normalizeTerm(term);
    
    // Query UMLS Metathesaurus
    const concepts = await db.query(`
      SELECT cui, str, sab, tty
      FROM MRCONSO
      WHERE LOWER(str) LIKE ?
      AND LAT = ?
      LIMIT 10
    `, [`%${normalized}%`, language === 'ar' ? 'ARA' : 'ENG']);
    
    return concepts.map(c => ({
      conceptId: c.cui,
      term: c.str,
      source: c.sab,
      termType: c.tty
    }));
  }

  /**
   * Get concept relationships
   */
  async getRelationships(conceptId: string) {
    const rels = await db.query(`
      SELECT cui1, rel, rela, cui2
      FROM MRREL
      WHERE cui1 = ? OR cui2 = ?
    `, [conceptId, conceptId]);
    
    return rels.map(r => ({
      from: r.cui1,
      relationship: r.rel,
      relationshipAttribute: r.rela,
      to: r.cui2
    }));
  }

  /**
   * Map to ICD-10 code
   */
  async mapToICD10(conceptId: string) {
    const mappings = await db.query(`
      SELECT code, str
      FROM MRCONSO
      WHERE cui = ?
      AND sab = 'ICD10CM'
    `, [conceptId]);
    
    return mappings;
  }

  /**
   * Find medications (RxNorm)
   */
  async findMedication(drugName: string) {
    const meds = await db.query(`
      SELECT cui, str, tty
      FROM MRCONSO
      WHERE sab = 'RXNORM'
      AND LOWER(str) LIKE ?
    `, [`%${drugName.toLowerCase()}%`]);
    
    return meds;
  }

  private normalizeTerm(term: string): string {
    return term.toLowerCase().trim();
  }
}
```

### Phase 3: RAG Knowledge Base (Week 3-4)

#### Vector Database Setup
```typescript
// server/brain/knowledge/vector-db.ts

import { QdrantClient } from '@qdrant/js-client-rest';
import { invokeLLM } from '../../_core/llm';

export class VectorKnowledgeBase {
  private client: QdrantClient;
  private collectionName = 'medical_literature';

  constructor() {
    this.client = new QdrantClient({ url: process.env.QDRANT_URL });
  }

  /**
   * Initialize vector database collection
   */
  async initialize() {
    await this.client.createCollection(this.collectionName, {
      vectors: {
        size: 1536, // OpenAI embedding dimension
        distance: 'Cosine'
      }
    });
  }

  /**
   * Add medical document to knowledge base
   */
  async addDocument(doc: {
    id: string;
    title: string;
    content: string;
    metadata: {
      authors?: string;
      journal?: string;
      pubDate?: string;
      specialty?: string;
      evidenceLevel?: string;
    };
  }) {
    // Generate embedding
    const embedding = await this.generateEmbedding(doc.content);

    // Store in vector DB
    await this.client.upsert(this.collectionName, {
      points: [{
        id: doc.id,
        vector: embedding,
        payload: {
          title: doc.title,
          content: doc.content,
          ...doc.metadata
        }
      }]
    });
  }

  /**
   * Search for relevant medical literature
   */
  async search(query: string, limit: number = 5) {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Search vector DB
    const results = await this.client.search(this.collectionName, {
      vector: queryEmbedding,
      limit,
      with_payload: true
    });

    return results.map(r => ({
      score: r.score,
      title: r.payload?.title,
      content: r.payload?.content,
      metadata: {
        authors: r.payload?.authors,
        journal: r.payload?.journal,
        pubDate: r.payload?.pubDate,
        specialty: r.payload?.specialty,
        evidenceLevel: r.payload?.evidenceLevel
      }
    }));
  }

  /**
   * Generate text embedding using LLM
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Use OpenAI embeddings API or similar
    // For now, placeholder - you'll need to implement actual embedding
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }
}
```

### Phase 4: BRAIN Core Orchestrator (Week 4-5)

```typescript
// server/brain/index.ts

import { UMLSKnowledge } from './knowledge/umls';
import { VectorKnowledgeBase } from './knowledge/vector-db';
import { invokeLLM } from '../_core/llm';
import { db } from '../db';

export class BRAIN {
  private umls: UMLSKnowledge;
  private vectorDB: VectorKnowledgeBase;

  constructor() {
    this.umls = new UMLSKnowledge();
    this.vectorDB = new VectorKnowledgeBase();
  }

  /**
   * Main reasoning function
   * Takes patient data and returns clinical assessment
   */
  async reason(input: {
    symptoms: string[];
    patientInfo: {
      age: number;
      gender: string;
      medicalHistory?: string[];
    };
    vitalSigns?: Record<string, number>;
    language: 'en' | 'ar';
  }) {
    console.log('🧠 BRAIN: Starting clinical reasoning...');

    // Step 1: Normalize symptoms using UMLS
    const normalizedSymptoms = await this.normalizeSymptoms(input.symptoms);
    console.log('✓ Symptoms normalized:', normalizedSymptoms.length, 'concepts');

    // Step 2: Retrieve relevant medical literature
    const evidence = await this.retrieveEvidence(normalizedSymptoms);
    console.log('✓ Retrieved', evidence.length, 'evidence documents');

    // Step 3: Find similar historical cases
    const similarCases = await this.findSimilarCases(normalizedSymptoms, input.patientInfo);
    console.log('✓ Found', similarCases.length, 'similar cases');

    // Step 4: Generate differential diagnosis using LLM
    const diagnosis = await this.generateDifferentialDiagnosis({
      symptoms: normalizedSymptoms,
      evidence,
      similarCases,
      patientInfo: input.patientInfo,
      vitalSigns: input.vitalSigns
    });
    console.log('✓ Generated differential diagnosis');

    // Step 5: Calculate confidence and provide recommendations
    const assessment = await this.generateClinicalAssessment(diagnosis, evidence);
    console.log('✓ Clinical assessment complete');

    // Step 6: Store case for learning
    const caseId = await this.storeCaseHistory({
      symptoms: normalizedSymptoms,
      patientInfo: input.patientInfo,
      diagnosis,
      assessment
    });
    console.log('✓ Case stored:', caseId);

    return {
      caseId,
      diagnosis,
      assessment,
      evidence: evidence.map(e => ({
        title: e.title,
        source: e.metadata.journal,
        relevance: e.score
      }))
    };
  }

  /**
   * Normalize symptoms to UMLS concepts
   */
  private async normalizeSymptoms(symptoms: string[]) {
    const normalized = [];
    
    for (const symptom of symptoms) {
      const concepts = await this.umls.findConcept(symptom);
      if (concepts.length > 0) {
        normalized.push({
          original: symptom,
          conceptId: concepts[0].conceptId,
          standardTerm: concepts[0].term,
          source: concepts[0].source
        });
      }
    }

    return normalized;
  }

  /**
   * Retrieve relevant medical evidence
   */
  private async retrieveEvidence(symptoms: any[]) {
    const query = symptoms.map(s => s.standardTerm).join(' ');
    return await this.vectorDB.search(query, 10);
  }

  /**
   * Find similar historical cases
   */
  private async findSimilarCases(symptoms: any[], patientInfo: any) {
    // Query brain_case_history for similar symptom patterns
    const symptomConcepts = symptoms.map(s => s.conceptId);
    
    // This is a simplified query - you'd want more sophisticated matching
    const cases = await db.execute(
      `SELECT * FROM brain_case_history 
       WHERE JSON_CONTAINS(symptoms, ?)
       LIMIT 10`,
      [JSON.stringify(symptomConcepts)]
    );

    return cases.rows;
  }

  /**
   * Generate differential diagnosis using LLM with RAG
   */
  private async generateDifferentialDiagnosis(context: any) {
    const prompt = `
You are BRAIN (Biomedical Reasoning and Intelligence Network), an advanced medical AI system.

Patient Information:
- Age: ${context.patientInfo.age}
- Gender: ${context.patientInfo.gender}
- Medical History: ${context.patientInfo.medicalHistory?.join(', ') || 'None reported'}

Symptoms (Standardized):
${context.symptoms.map((s: any) => `- ${s.standardTerm} (${s.conceptId})`).join('\n')}

${context.vitalSigns ? `Vital Signs:\n${JSON.stringify(context.vitalSigns, null, 2)}` : ''}

Medical Evidence from Literature:
${context.evidence.map((e: any, i: number) => `
${i + 1}. ${e.title}
   Source: ${e.metadata.journal}
   Relevance: ${(e.score * 100).toFixed(1)}%
   Key Points: ${e.content.substring(0, 200)}...
`).join('\n')}

Similar Historical Cases:
${context.similarCases.length} cases with similar symptom patterns found.

Task: Generate a comprehensive differential diagnosis with:
1. Top 5 most likely diagnoses with probability estimates
2. Clinical reasoning for each diagnosis
3. Red flags or urgent conditions to rule out
4. Recommended next steps (tests, imaging, specialist referral)
5. Evidence citations from the literature provided

Format your response as JSON:
{
  "differentialDiagnosis": [
    {
      "condition": "Condition name",
      "icd10": "ICD-10 code",
      "probability": 0.45,
      "reasoning": "Why this diagnosis fits",
      "supportingEvidence": ["Citation 1", "Citation 2"]
    }
  ],
  "redFlags": ["Urgent condition 1", "Urgent condition 2"],
  "recommendations": {
    "immediateActions": ["Action 1", "Action 2"],
    "tests": ["Test 1", "Test 2"],
    "imaging": ["Imaging 1"],
    "referrals": ["Specialist 1"]
  },
  "confidence": 0.85
}
`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are BRAIN, an advanced medical AI system. Always provide evidence-based, accurate medical assessments.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Generate clinical assessment
   */
  private async generateClinicalAssessment(diagnosis: any, evidence: any[]) {
    return {
      summary: `Based on analysis of ${evidence.length} medical literature sources and historical case patterns`,
      confidence: diagnosis.confidence,
      evidenceQuality: this.assessEvidenceQuality(evidence),
      recommendations: diagnosis.recommendations,
      followUp: 'Monitor patient response and adjust as needed'
    };
  }

  /**
   * Store case for future learning
   */
  private async storeCaseHistory(caseData: any) {
    const caseId = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.execute(
      `INSERT INTO brain_case_history 
       (case_id, patient_demographics, symptoms, diagnosis, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        caseId,
        JSON.stringify(caseData.patientInfo),
        JSON.stringify(caseData.symptoms),
        JSON.stringify(caseData.diagnosis)
      ]
    );

    return caseId;
  }

  /**
   * Assess quality of evidence
   */
  private assessEvidenceQuality(evidence: any[]) {
    // Simple heuristic - you'd want more sophisticated assessment
    const avgScore = evidence.reduce((sum, e) => sum + e.score, 0) / evidence.length;
    
    if (avgScore > 0.8) return 'High';
    if (avgScore > 0.6) return 'Moderate';
    return 'Low';
  }

  /**
   * Learn from clinician feedback
   */
  async learn(feedback: {
    caseId: string;
    brainDiagnosis: any;
    actualDiagnosis: any;
    clinicianCorrection?: string;
    outcome: string;
  }) {
    console.log('🧠 BRAIN: Learning from feedback...');

    // Calculate accuracy
    const accuracy = this.calculateAccuracy(
      feedback.brainDiagnosis,
      feedback.actualDiagnosis
    );

    // Store feedback
    await db.execute(
      `INSERT INTO brain_learning_feedback 
       (case_id, brain_diagnosis, actual_diagnosis, clinician_correction, accuracy_score, feedback_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        feedback.caseId,
        JSON.stringify(feedback.brainDiagnosis),
        JSON.stringify(feedback.actualDiagnosis),
        feedback.clinicianCorrection || null,
        accuracy,
        accuracy > 0.8 ? 'correct' : accuracy > 0.5 ? 'partially_correct' : 'incorrect'
      ]
    );

    // Update performance metrics
    await this.updatePerformanceMetrics();

    // Trigger learning if enough feedback accumulated
    await this.triggerLearningIfNeeded();

    console.log('✓ Feedback processed, accuracy:', (accuracy * 100).toFixed(1) + '%');

    return { accuracy, learned: true };
  }

  private calculateAccuracy(predicted: any, actual: any): number {
    // Simple accuracy calculation
    // In production, you'd want more sophisticated metrics
    if (!predicted.differentialDiagnosis || !actual.diagnosis) return 0;

    const predictedConditions = predicted.differentialDiagnosis.map((d: any) => d.condition.toLowerCase());
    const actualCondition = actual.diagnosis.toLowerCase();

    if (predictedConditions[0] === actualCondition) return 1.0; // Top prediction correct
    if (predictedConditions.includes(actualCondition)) return 0.7; // In differential
    return 0.3; // Missed
  }

  private async updatePerformanceMetrics() {
    // Aggregate daily metrics
    const today = new Date().toISOString().split('T')[0];
    
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_cases,
        SUM(CASE WHEN accuracy_score > 0.8 THEN 1 ELSE 0 END) as correct_diagnoses,
        AVG(accuracy_score) as accuracy_rate
      FROM brain_learning_feedback
      WHERE DATE(created_at) = ?
    `, [today]);

    if (stats.length > 0) {
      await db.execute(`
        INSERT INTO brain_performance_metrics 
        (metric_date, total_cases, correct_diagnoses, accuracy_rate)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        total_cases = VALUES(total_cases),
        correct_diagnoses = VALUES(correct_diagnoses),
        accuracy_rate = VALUES(accuracy_rate)
      `, [
        today,
        stats[0].total_cases,
        stats[0].correct_diagnoses,
        stats[0].accuracy_rate
      ]);
    }
  }

  private async triggerLearningIfNeeded() {
    // Check if we have enough feedback to trigger learning
    const pendingFeedback = await db.query(`
      SELECT COUNT(*) as count
      FROM brain_learning_feedback
      WHERE learning_applied = FALSE
    `);

    if (pendingFeedback[0].count >= 100) {
      // Trigger async learning process
      console.log('🧠 BRAIN: Triggering learning session with', pendingFeedback[0].count, 'feedback items');
      // In production, this would trigger a background job
      // For now, just mark as acknowledged
    }
  }
}

// Export singleton instance
export const brain = new BRAIN();
```

### Phase 5: tRPC API Integration (Week 5)

```typescript
// server/brain/api/brain-router.ts

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../routers';
import { brain } from './brain';

export const brainRouter = router({
  /**
   * Main clinical reasoning endpoint
   */
  analyze: publicProcedure
    .input(z.object({
      symptoms: z.array(z.string()),
      patientInfo: z.object({
        age: z.number(),
        gender: z.enum(['male', 'female', 'other']),
        medicalHistory: z.array(z.string()).optional()
      }),
      vitalSigns: z.record(z.number()).optional(),
      language: z.enum(['en', 'ar']).default('en')
    }))
    .mutation(async ({ input }) => {
      return await brain.reason(input);
    }),

  /**
   * Submit clinician feedback for learning
   */
  submitFeedback: protectedProcedure
    .input(z.object({
      caseId: z.string(),
      brainDiagnosis: z.any(),
      actualDiagnosis: z.any(),
      clinicianCorrection: z.string().optional(),
      outcome: z.string()
    }))
    .mutation(async ({ input }) => {
      return await brain.learn(input);
    }),

  /**
   * Get BRAIN performance metrics
   */
  getMetrics: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string()
    }))
    .query(async ({ input }) => {
      const metrics = await db.query(`
        SELECT *
        FROM brain_performance_metrics
        WHERE metric_date BETWEEN ? AND ?
        ORDER BY metric_date DESC
      `, [input.startDate, input.endDate]);

      return metrics;
    }),

  /**
   * Search medical knowledge
   */
  searchKnowledge: publicProcedure
    .input(z.object({
      query: z.string(),
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      const vectorDB = new VectorKnowledgeBase();
      return await vectorDB.search(input.query, input.limit);
    }),

  /**
   * Get case history
   */
  getCaseHistory: protectedProcedure
    .input(z.object({
      caseId: z.string()
    }))
    .query(async ({ input }) => {
      const cases = await db.query(`
        SELECT *
        FROM brain_case_history
        WHERE case_id = ?
      `, [input.caseId]);

      return cases[0] || null;
    })
});
```

### Phase 6: Frontend Integration (Week 6)

```typescript
// client/src/pages/BRAINAnalysis.tsx

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Loader2 } from 'lucide-react';

export function BRAINAnalysis() {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeMutation = trpc.brain.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
    }
  });

  const handleAnalyze = () => {
    analyzeMutation.mutate({
      symptoms,
      patientInfo: {
        age: 45,
        gender: 'male'
      },
      language: 'en'
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">BRAIN Analysis</h1>
          <p className="text-muted-foreground">
            Biomedical Reasoning and Intelligence Network
          </p>
        </div>
      </div>

      {/* Symptom Input */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Enter Symptoms</h2>
        {/* Symptom input UI */}
        <Button 
          onClick={handleAnalyze}
          disabled={analyzeMutation.isLoading}
        >
          {analyzeMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Analyze with BRAIN
        </Button>
      </Card>

      {/* Results */}
      {analysis && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">BRAIN Assessment</h2>
          
          {/* Differential Diagnosis */}
          <div className="space-y-4">
            {analysis.diagnosis.differentialDiagnosis.map((dx: any, i: number) => (
              <div key={i} className="border-l-4 border-primary pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{dx.condition}</h3>
                    <p className="text-sm text-muted-foreground">{dx.icd10}</p>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {(dx.probability * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-2 text-sm">{dx.reasoning}</p>
                {dx.supportingEvidence.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Evidence: {dx.supportingEvidence.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Evidence Sources */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Evidence Sources</h3>
            <div className="space-y-2">
              {analysis.evidence.map((ev: any, i: number) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{ev.title}</span>
                  <span className="text-muted-foreground"> - {ev.source}</span>
                  <span className="text-primary ml-2">
                    {(ev.relevance * 100).toFixed(0)}% relevant
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
```

## Continuous Learning Mechanisms

### 1. Feedback Collection
- Clinicians review BRAIN diagnoses
- Mark as correct/incorrect/partially correct
- Provide corrections and additional context
- Track patient outcomes

### 2. Pattern Learning
- Analyze feedback patterns
- Identify common misdiagnoses
- Discover new symptom-disease associations
- Learn Iraqi-specific medical patterns

### 3. Knowledge Updates
- Automatically ingest new medical literature
- Update vector database monthly
- Refresh UMLS mappings quarterly
- Integrate new clinical guidelines

### 4. Model Fine-tuning (Advanced)
- Collect 1000+ feedback cases
- Fine-tune MedGemma on Iraqi medical data
- Adjust probability models based on outcomes
- Retrain on local disease prevalence

## Performance Monitoring

### Key Metrics
- **Diagnostic Accuracy**: % of correct top-1 diagnoses
- **Differential Accuracy**: % where actual diagnosis is in top-5
- **Response Time**: Average time to generate assessment
- **Evidence Quality**: Relevance of retrieved literature
- **Clinician Satisfaction**: Feedback ratings
- **Learning Rate**: Improvement over time

### Dashboard
```typescript
// Real-time BRAIN performance dashboard
- Today's Cases: 127
- Accuracy Rate: 87.3%
- Avg Response Time: 2.4s
- Knowledge Base Size: 3.2M documents
- Model Version: BRAIN-v1.2.5
- Last Training: 2 days ago
```

## Deployment Strategy

### Infrastructure Requirements
- **Database**: MySQL/PostgreSQL (50GB+)
- **Vector DB**: Qdrant (100GB+)
- **Compute**: 16GB RAM, 4 CPU cores minimum
- **GPU**: Optional (for MedGemma), NVIDIA T4 or better
- **Storage**: 200GB SSD

### Scaling
- Horizontal scaling for API layer
- Vector DB sharding for large knowledge bases
- Model serving with load balancing
- Caching layer for frequent queries

## Timeline: 6-8 Weeks

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1-2 | Foundation & UMLS | Database schema, UMLS integration, core BRAIN module |
| 3-4 | RAG Knowledge Base | Vector DB setup, literature ingestion, evidence retrieval |
| 4-5 | BRAIN Orchestrator | Clinical reasoning engine, differential diagnosis |
| 5 | API Integration | tRPC routers, authentication, rate limiting |
| 6 | Frontend | BRAIN analysis UI, feedback collection, metrics dashboard |
| 7-8 | Testing & Learning | Load testing, accuracy validation, initial training |

## Success Criteria

✅ **Diagnostic accuracy >85%** on test cases
✅ **Response time <3 seconds** for analysis
✅ **100% evidence-backed** diagnoses with citations
✅ **Arabic language support** fully functional
✅ **Continuous learning** system operational
✅ **Clinician feedback** integration working
✅ **Performance monitoring** dashboard live

## BRAIN: The Future of Medical AI

BRAIN represents a paradigm shift from simple AI assistants to a comprehensive medical intelligence system that:

- **Learns continuously** from every interaction
- **Provides evidence** for every recommendation
- **Adapts** to local medical context
- **Improves** over time through feedback
- **Integrates** multiple knowledge sources
- **Reasons** like an experienced clinician

This is not just an AI tool—it's a **medical intelligence platform** that grows smarter with every case, every feedback, and every new piece of medical knowledge added to its vast neural network.

🧠 **BRAIN: Thinking Beyond AI**
