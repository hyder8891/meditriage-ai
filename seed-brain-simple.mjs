/**
 * Simplified BRAIN Knowledge Seeding - Works with existing table structure
 * Primary key is concept_id (not auto-increment id)
 */
import mysql from 'mysql2/promise';
import { clinicalGuidelines, symptomDiseaseMappings } from './server/brain/knowledge/training-data.ts';

const DATABASE_URL = process.env.DATABASE_URL;

async function seedBRAIN() {
  console.log('🧠 Starting BRAIN knowledge base seeding (simplified)...');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Clear existing data
    await connection.execute('TRUNCATE TABLE brain_knowledge_relationships');
    await connection.execute('DELETE FROM brain_knowledge_concepts WHERE 1=1');
    
    console.log('\n📚 Seeding clinical guidelines...');
    
    for (const guideline of clinicalGuidelines) {
      const conceptId = `CG-${guideline.id}`;
      await connection.execute(
        `INSERT INTO brain_knowledge_concepts 
         (concept_id, concept_type, name, description, category, source)
         VALUES (?, 'disease', ?, ?, ?, ?)`,
        [
          conceptId,
          guideline.condition,
          JSON.stringify({
            diagnosticCriteria: guideline.diagnosticCriteria,
            redFlags: guideline.redFlags,
            investigations: guideline.firstLineInvestigations,
            treatment: guideline.treatment
          }),
          guideline.category,
          guideline.source
        ]
      );
      console.log(`  ✓ ${guideline.condition}`);
    }
    
    console.log('\n🔗 Seeding symptom-disease mappings...');
    let totalRelationships = 0;
    
    for (const mapping of symptomDiseaseMappings) {
      // Insert symptom
      const symptomConceptId = `SYM-${mapping.symptom.replace(/\s+/g, '-').toUpperCase()}`;
      await connection.execute(
        `INSERT INTO brain_knowledge_concepts 
         (concept_id, concept_type, name, description, source)
         VALUES (?, 'symptom', ?, ?, 'BRAIN Training Data')`,
        [
          symptomConceptId,
          mapping.symptom,
          `Symptom: ${mapping.symptom}`
        ]
      );
      
      // Insert diseases and relationships
      for (const disease of mapping.possibleDiseases) {
        const diseaseConceptId = `DIS-${disease.disease.replace(/\s+/g, '-').toUpperCase()}`;
        
        // Insert disease
        await connection.execute(
          `INSERT INTO brain_knowledge_concepts 
           (concept_id, concept_type, name, description, source)
           VALUES (?, 'disease', ?, ?, 'BRAIN Training Data')
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [
            diseaseConceptId,
            disease.disease,
            JSON.stringify({
              associatedSymptoms: disease.associatedSymptoms,
              distinguishingFeatures: disease.distinguishingFeatures,
              probability: disease.probability
            })
          ]
        );
        
        // Create relationship
        const confidence = {
          'very_common': 0.9,
          'common': 0.7,
          'uncommon': 0.4,
          'rare': 0.2
        }[disease.probability] || 0.5;
        
        await connection.execute(
          `INSERT INTO brain_knowledge_relationships 
           (concept_id_1, relationship_type, concept_id_2, confidence)
           VALUES (?, 'may_indicate', ?, ?)`,
          [
            symptomConceptId,
            diseaseConceptId,
            confidence
          ]
        );
        totalRelationships++;
      }
      
      console.log(`  ✓ ${mapping.symptom} → ${mapping.possibleDiseases.length} diseases`);
    }
    
    console.log(`\n✅ Seeding complete!`);
    console.log(`   - ${clinicalGuidelines.length} clinical guidelines`);
    console.log(`   - ${symptomDiseaseMappings.length} symptom categories`);
    console.log(`   - ${totalRelationships} symptom-disease relationships`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedBRAIN().catch(console.error);
