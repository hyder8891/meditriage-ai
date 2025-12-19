/**
 * BRAIN Medical Knowledge Module
 * Handles medical concept lookup, relationships, and terminology mapping
 * Uses raw SQL for complex queries with BRAIN-specific tables
 */

import mysql from 'mysql2/promise';

export interface MedicalConcept {
  conceptId: string;
  conceptName: string;
  semanticType: string;
  definition?: string;
  source: string;
}

export interface ConceptRelationship {
  from: string;
  relationshipType: string;
  to: string;
  confidence: number;
}

let _connection: mysql.Connection | null = null;

async function getConnection() {
  if (!_connection && process.env.DATABASE_URL) {
    try {
      _connection = await mysql.createConnection(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[BRAIN] Failed to connect to database:", error);
      _connection = null;
    }
  }
  return _connection;
}

export class MedicalKnowledge {
  /**
   * Find medical concept by term
   */
  async findConcept(term: string, language: 'en' | 'ar' = 'en'): Promise<MedicalConcept[]> {
    const conn = await getConnection();
    if (!conn) throw new Error('Database not available');

    const normalized = this.normalizeTerm(term);
    
    const [rows] = await conn.execute(
      `SELECT concept_id, concept_name, semantic_type, definition, source
       FROM brain_knowledge_concepts
       WHERE LOWER(concept_name) LIKE ?
       LIMIT 10`,
      [`%${normalized}%`]
    );

    return (rows as any[]).map(c => ({
      conceptId: c.concept_id,
      conceptName: c.concept_name,
      semanticType: c.semantic_type,
      definition: c.definition,
      source: c.source
    }));
  }

  /**
   * Get concept by ID
   */
  async getConceptById(conceptId: string): Promise<MedicalConcept | null> {
    const conn = await getConnection();
    if (!conn) throw new Error('Database not available');
    
    const [rows] = await conn.execute(
      `SELECT concept_id, concept_name, semantic_type, definition, source
       FROM brain_knowledge_concepts
       WHERE concept_id = ?`,
      [conceptId]
    );

    const row = (rows as any[])[0];
    if (!row) return null;

    return {
      conceptId: row.concept_id,
      conceptName: row.concept_name,
      semanticType: row.semantic_type,
      definition: row.definition,
      source: row.source
    };
  }

  /**
   * Get relationships for a concept
   */
  async getRelationships(conceptId: string): Promise<ConceptRelationship[]> {
    const conn = await getConnection();
    if (!conn) throw new Error('Database not available');
    
    const [rows] = await conn.execute(
      `SELECT concept_id_1, relationship_type, concept_id_2, confidence
       FROM brain_knowledge_relationships
       WHERE concept_id_1 = ? OR concept_id_2 = ?`,
      [conceptId, conceptId]
    );

    return (rows as any[]).map(r => ({
      from: r.concept_id_1,
      relationshipType: r.relationship_type,
      to: r.concept_id_2,
      confidence: r.confidence
    }));
  }

  /**
   * Find possible diagnoses for symptoms
   */
  async findDiagnosesForSymptoms(symptomConceptIds: string[]): Promise<Array<{
    diagnosis: MedicalConcept;
    confidence: number;
    reasoning: string;
  }>> {
    if (symptomConceptIds.length === 0) return [];

    const conn = await getConnection();
    if (!conn) throw new Error('Database not available');

    // Find all diseases that are related to these symptoms
    const placeholders = symptomConceptIds.map(() => '?').join(',');
    
    const [rows] = await conn.execute(
      `SELECT DISTINCT 
         c.concept_id, c.concept_name, c.semantic_type, c.definition, c.source,
         AVG(r.confidence) as avg_confidence,
         COUNT(*) as symptom_match_count
       FROM brain_knowledge_concepts c
       JOIN brain_knowledge_relationships r ON (
         (r.concept_id_2 = c.concept_id AND r.concept_id_1 IN (${placeholders}))
         OR (r.concept_id_1 = c.concept_id AND r.concept_id_2 IN (${placeholders}))
       )
       WHERE c.semantic_type = 'Disease or Syndrome'
       AND r.relationship_type IN ('may_indicate', 'associated_with', 'causes')
       GROUP BY c.concept_id, c.concept_name, c.semantic_type, c.definition, c.source
       ORDER BY symptom_match_count DESC, avg_confidence DESC
       LIMIT 10`,
      [...symptomConceptIds, ...symptomConceptIds]
    );

    return (rows as any[]).map(d => ({
      diagnosis: {
        conceptId: d.concept_id,
        conceptName: d.concept_name,
        semanticType: d.semantic_type,
        definition: d.definition,
        source: d.source
      },
      confidence: d.avg_confidence,
      reasoning: `Matches ${d.symptom_match_count} of ${symptomConceptIds.length} symptoms`
    }));
  }

  /**
   * Add new medical concept
   */
  async addConcept(concept: {
    conceptId: string;
    conceptName: string;
    semanticType: string;
    definition?: string;
    source: string;
  }): Promise<void> {
    const conn = await getConnection();
    if (!conn) throw new Error('Database not available');
    
    await conn.execute(
      `INSERT INTO brain_knowledge_concepts 
       (concept_id, concept_name, semantic_type, definition, source)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       concept_name = VALUES(concept_name),
       definition = VALUES(definition),
       updated_at = CURRENT_TIMESTAMP`,
      [
        concept.conceptId,
        concept.conceptName,
        concept.semanticType,
        concept.definition || null,
        concept.source
      ]
    );
  }

  /**
   * Add relationship between concepts
   */
  async addRelationship(rel: {
    conceptId1: string;
    relationshipType: string;
    conceptId2: string;
    confidence: number;
    source: string;
  }): Promise<void> {
    const conn = await getConnection();
    if (!conn) throw new Error('Database not available');
    
    await conn.execute(
      `INSERT INTO brain_knowledge_relationships 
       (concept_id_1, relationship_type, concept_id_2, confidence, source)
       VALUES (?, ?, ?, ?, ?)`,
      [
        rel.conceptId1,
        rel.relationshipType,
        rel.conceptId2,
        rel.confidence,
        rel.source
      ]
    );
  }

  /**
   * Normalize medical term for search
   */
  private normalizeTerm(term: string): string {
    return term
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Get knowledge base statistics
   */
  async getStatistics(): Promise<{
    totalConcepts: number;
    totalRelationships: number;
    conceptsByType: Record<string, number>;
  }> {
    const conn = await getConnection();
    if (!conn) throw new Error('Database not available');
    
    const [conceptCount] = await conn.execute('SELECT COUNT(*) as count FROM brain_knowledge_concepts');
    const [relCount] = await conn.execute('SELECT COUNT(*) as count FROM brain_knowledge_relationships');
    const [typeCount] = await conn.execute(`
      SELECT semantic_type, COUNT(*) as count 
      FROM brain_knowledge_concepts 
      GROUP BY semantic_type
    `);

    const conceptsByType: Record<string, number> = {};
    for (const row of typeCount as any[]) {
      conceptsByType[row.semantic_type] = row.count;
    }

    return {
      totalConcepts: (conceptCount as any[])[0].count,
      totalRelationships: (relCount as any[])[0].count,
      conceptsByType
    };
  }
}

// Export singleton instance
export const medicalKnowledge = new MedicalKnowledge();
