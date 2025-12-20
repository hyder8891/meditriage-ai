/**
 * Seed BRAIN Knowledge Base with Comprehensive Medical Training Data
 * Run this script to populate the brain_knowledge_concepts table with clinical guidelines
 */

import mysql from 'mysql2/promise';
import { clinicalGuidelines, symptomDiseaseMappings } from './server/brain/knowledge/training-data.ts';

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root@localhost:3306/meditriage';

async function seedBRAINKnowledge() {
  console.log('🧠 Starting BRAIN knowledge base seeding...');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Seed clinical guidelines as medical concepts
    console.log('\n📚 Seeding clinical guidelines...');
    for (const guideline of clinicalGuidelines) {
      const conceptId = `CG-${guideline.id}`;
      const definition = JSON.stringify({
        diagnosticCriteria: guideline.diagnosticCriteria,
        redFlags: guideline.redFlags,
        investigations: guideline.firstLineInvestigations,
        treatment: guideline.treatment,
        referralCriteria: guideline.referralCriteria
      });
      
      await connection.execute(
        `INSERT INTO brain_knowledge_concepts 
         (concept_id, concept_name, semantic_type, definition, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         definition = VALUES(definition),
         source = VALUES(source),
         updated_at = NOW()`,
        [conceptId, guideline.condition, guideline.category, definition, guideline.source]
      );
      
      console.log(`  ✓ Added: ${guideline.condition}`);
    }
    
    // Seed symptom-disease mappings
    console.log('\n🔗 Seeding symptom-disease mappings...');
    for (const mapping of symptomDiseaseMappings) {
      const symptomId = `SYM-${mapping.symptom.replace(/\s+/g, '-').toUpperCase()}`;
      
      // Add symptom as a concept
      await connection.execute(
        `INSERT INTO brain_knowledge_concepts 
         (concept_id, concept_name, semantic_type, definition, source, created_at, updated_at)
         VALUES (?, ?, 'Symptom', ?, 'BRAIN Training Data', NOW(), NOW())
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [symptomId, mapping.symptom, JSON.stringify(mapping.possibleDiseases)]
      );
      
      // Create relationships between symptoms and diseases
      for (const disease of mapping.possibleDiseases) {
        const diseaseId = `DIS-${disease.disease.replace(/\s+/g, '-').toUpperCase()}`;
        
        // Add disease as a concept if not exists
        await connection.execute(
          `INSERT IGNORE INTO brain_knowledge_concepts 
           (concept_id, concept_name, semantic_type, definition, source, created_at, updated_at)
           VALUES (?, ?, 'Disease', ?, 'BRAIN Training Data', NOW(), NOW())`,
          [diseaseId, disease.disease, JSON.stringify({
            associatedSymptoms: disease.associatedSymptoms,
            distinguishingFeatures: disease.distinguishingFeatures
          })]
        );
        
        // Create symptom-disease relationship
        const confidence = {
          'very_common': 0.9,
          'common': 0.7,
          'uncommon': 0.4,
          'rare': 0.2
        }[disease.probability];
        
        await connection.execute(
          `INSERT INTO brain_knowledge_relationships 
           (from_concept_id, relationship_type, to_concept_id, confidence, created_at, updated_at)
           VALUES (?, 'may_indicate', ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
           confidence = VALUES(confidence),
           updated_at = NOW()`,
          [symptomId, diseaseId, confidence]
        );
      }
      
      console.log(`  ✓ Mapped: ${mapping.symptom} → ${mapping.possibleDiseases.length} diseases`);
    }
    
    // Get statistics
    const [conceptCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM brain_knowledge_concepts'
    );
    const [relationshipCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM brain_knowledge_relationships'
    );
    
    console.log('\n✅ BRAIN knowledge base seeding complete!');
    console.log(`   Total concepts: ${conceptCount[0].count}`);
    console.log(`   Total relationships: ${relationshipCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Error seeding BRAIN knowledge:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run seeding
seedBRAINKnowledge()
  .then(() => {
    console.log('\n🎉 BRAIN is now smarter with enhanced medical knowledge!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  });
