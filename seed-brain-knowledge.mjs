/**
 * Seed BRAIN Knowledge Base with Comprehensive Medical Training Data
 * Run this script to populate the brain_knowledge_concepts table with clinical guidelines
 */

import mysql from 'mysql2/promise';
import { clinicalGuidelines, symptomDiseaseMappings } from './server/brain/knowledge/training-data.ts';

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root@localhost:3306/mydoctor';

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
         (concept_type, name, description, category, source, created_at, updated_at)
         VALUES ('disease', ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         description = VALUES(description),
         source = VALUES(source),
         updated_at = NOW()`,
        [guideline.condition, definition, guideline.category, guideline.source]
      );
      
      console.log(`  ✓ Added: ${guideline.condition}`);
    }
    
    // Seed symptom-disease mappings
    console.log('\n🔗 Seeding symptom-disease mappings...');
    for (const mapping of symptomDiseaseMappings) {
      const symptomId = `SYM-${mapping.symptom.replace(/\s+/g, '-').toUpperCase()}`;
      
      // Add symptom as a concept
      const [symptomResult] = await connection.execute(
        `INSERT INTO brain_knowledge_concepts 
         (concept_type, name, description, source, created_at, updated_at)
         VALUES ('symptom', ?, ?, 'BRAIN Training Data', NOW(), NOW())
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [mapping.symptom, JSON.stringify(mapping.possibleDiseases)]
      );
      
      const symptomConceptId = symptomResult.insertId || (
        await connection.execute(
          `SELECT id FROM brain_knowledge_concepts WHERE name = ? AND concept_type = 'symptom'`,
          [mapping.symptom]
        )
      )[0][0].id;
      
      // Create relationships between symptoms and diseases
      for (const disease of mapping.possibleDiseases) {
        const diseaseId = `DIS-${disease.disease.replace(/\s+/g, '-').toUpperCase()}`;
        
        // Add disease as a concept if not exists
        const [diseaseResult] = await connection.execute(
          `INSERT INTO brain_knowledge_concepts 
           (concept_type, name, description, source, created_at, updated_at)
           VALUES ('disease', ?, ?, 'BRAIN Training Data', NOW(), NOW())
           ON DUPLICATE KEY UPDATE updated_at = NOW()`,
          [disease.disease, JSON.stringify({
            associatedSymptoms: disease.associatedSymptoms,
            distinguishingFeatures: disease.distinguishingFeatures,
            probability: disease.probability
          })]
        );
        
        const diseaseConceptId = diseaseResult.insertId || (
          await connection.execute(
            `SELECT id FROM brain_knowledge_concepts WHERE name = ? AND concept_type = 'disease'`,
            [disease.disease]
          )
        )[0][0].id;
        
        // Create symptom-disease relationship
        const confidence = {
          'very_common': 0.9,
          'common': 0.7,
          'uncommon': 0.4,
          'rare': 0.2
        }[disease.probability];
        
        await connection.execute(
          `INSERT INTO brain_knowledge_relationships 
           (from_concept_id, relationship_type, to_concept_id, confidence, associated_symptoms, distinguishing_features, created_at, updated_at)
           VALUES (?, 'may_indicate', ?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
           confidence = VALUES(confidence),
           updated_at = NOW()`,
          [
            symptomConceptId, 
            diseaseConceptId, 
            confidence,
            JSON.stringify(disease.associatedSymptoms),
            JSON.stringify(disease.distinguishingFeatures)
          ]
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
