#!/usr/bin/env node
/**
 * Load Medical Ontologies into BRAIN Knowledge Base
 * 
 * This script processes Disease Ontology and Human Phenotype Ontology
 * JSON files and loads them into the BRAIN database.
 */

import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

// Database connection from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

async function main() {
  console.log('🧠 BRAIN Data Loader Starting...\n');
  
  // Parse database URL
  const dbUrl = new URL(DATABASE_URL);
  const connection = await mysql.createConnection({
    host: dbUrl.hostname,
    port: dbUrl.port || 3306,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
    ssl: { rejectUnauthorized: false }
  });

  console.log('✓ Connected to database\n');

  try {
    // Load Disease Ontology
    console.log('📚 Loading Disease Ontology...');
    const diseaseData = JSON.parse(readFileSync('/home/ubuntu/disease-ontology.json', 'utf8'));
    await loadDiseaseOntology(connection, diseaseData);
    
    // Load Human Phenotype Ontology
    console.log('\n📚 Loading Human Phenotype Ontology...');
    const phenotypeData = JSON.parse(readFileSync('/home/ubuntu/human-phenotype-ontology.json', 'utf8'));
    await loadPhenotypeOntology(connection, phenotypeData);
    
    console.log('\n✅ BRAIN Knowledge Base loaded successfully!');
    console.log('\n📊 Summary:');
    
    // Get counts
    const [concepts] = await connection.execute('SELECT COUNT(*) as count FROM brain_knowledge_concepts');
    const [relationships] = await connection.execute('SELECT COUNT(*) as count FROM brain_knowledge_relationships');
    
    console.log(`   - Medical Concepts: ${concepts[0].count.toLocaleString()}`);
    console.log(`   - Relationships: ${relationships[0].count.toLocaleString()}`);
    
  } catch (error) {
    console.error('\n❌ Error loading data:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function loadDiseaseOntology(connection, data) {
  const graphs = data.graphs || [];
  let conceptCount = 0;
  let relationshipCount = 0;
  
  for (const graph of graphs) {
    const nodes = graph.nodes || [];
    
    for (const node of nodes) {
      // Skip meta nodes
      if (!node.id || node.id.startsWith('_:')) continue;
      
      const conceptId = node.id.replace('http://purl.obolibrary.org/obo/', '');
      
      // Skip if not a disease concept
      if (!conceptId.startsWith('DOID_')) continue;
      
      const conceptName = node.lbl || '';
      const definition = node.meta?.definition?.val || '';
      const synonyms = (node.meta?.synonyms || []).map(s => s.val).join('; ');
      
      try {
        await connection.execute(
          `INSERT INTO brain_knowledge_concepts 
           (concept_id, concept_name, semantic_type, definition, synonyms, source, language)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           concept_name = VALUES(concept_name),
           definition = VALUES(definition),
           synonyms = VALUES(synonyms)`,
          [conceptId, conceptName, 'Disease', definition, synonyms, 'DiseaseOntology', 'en']
        );
        conceptCount++;
        
        if (conceptCount % 1000 === 0) {
          process.stdout.write(`\r   Loaded ${conceptCount} disease concepts...`);
        }
      } catch (error) {
        // Skip duplicates or errors
        if (!error.message.includes('Duplicate')) {
          console.error(`\nError loading concept ${conceptId}:`, error.message);
        }
      }
    }
    
    // Load relationships
    const edges = graph.edges || [];
    for (const edge of edges) {
      if (!edge.sub || !edge.obj || !edge.pred) continue;
      
      const sourceId = edge.sub.replace('http://purl.obolibrary.org/obo/', '');
      const targetId = edge.obj.replace('http://purl.obolibrary.org/obo/', '');
      const relationshipType = edge.pred.replace('http://purl.obolibrary.org/obo/', '').replace('_', ' ');
      
      // Only store relationships between disease concepts
      if (!sourceId.startsWith('DOID_') || !targetId.startsWith('DOID_')) continue;
      
      try {
        await connection.execute(
          `INSERT INTO brain_knowledge_relationships 
           (source_concept_id, target_concept_id, relationship_type, source)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           relationship_type = VALUES(relationship_type)`,
          [sourceId, targetId, relationshipType, 'DiseaseOntology']
        );
        relationshipCount++;
      } catch (error) {
        // Skip duplicates
      }
    }
  }
  
  console.log(`\r   ✓ Loaded ${conceptCount} disease concepts and ${relationshipCount} relationships`);
}

async function loadPhenotypeOntology(connection, data) {
  const graphs = data.graphs || [];
  let conceptCount = 0;
  let relationshipCount = 0;
  
  for (const graph of graphs) {
    const nodes = graph.nodes || [];
    
    for (const node of nodes) {
      // Skip meta nodes
      if (!node.id || node.id.startsWith('_:')) continue;
      
      const conceptId = node.id.replace('http://purl.obolibrary.org/obo/', '');
      
      // Skip if not a phenotype concept
      if (!conceptId.startsWith('HP_')) continue;
      
      const conceptName = node.lbl || '';
      const definition = node.meta?.definition?.val || '';
      const synonyms = (node.meta?.synonyms || []).map(s => s.val).join('; ');
      
      try {
        await connection.execute(
          `INSERT INTO brain_knowledge_concepts 
           (concept_id, concept_name, semantic_type, definition, synonyms, source, language)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           concept_name = VALUES(concept_name),
           definition = VALUES(definition),
           synonyms = VALUES(synonyms)`,
          [conceptId, conceptName, 'Phenotype', definition, synonyms, 'HumanPhenotypeOntology', 'en']
        );
        conceptCount++;
        
        if (conceptCount % 1000 === 0) {
          process.stdout.write(`\r   Loaded ${conceptCount} phenotype concepts...`);
        }
      } catch (error) {
        // Skip duplicates or errors
        if (!error.message.includes('Duplicate')) {
          console.error(`\nError loading concept ${conceptId}:`, error.message);
        }
      }
    }
    
    // Load relationships
    const edges = graph.edges || [];
    for (const edge of edges) {
      if (!edge.sub || !edge.obj || !edge.pred) continue;
      
      const sourceId = edge.sub.replace('http://purl.obolibrary.org/obo/', '');
      const targetId = edge.obj.replace('http://purl.obolibrary.org/obo/', '');
      const relationshipType = edge.pred.replace('http://purl.obolibrary.org/obo/', '').replace('_', ' ');
      
      // Only store relationships between phenotype concepts
      if (!sourceId.startsWith('HP_') || !targetId.startsWith('HP_')) continue;
      
      try {
        await connection.execute(
          `INSERT INTO brain_knowledge_relationships 
           (source_concept_id, target_concept_id, relationship_type, source)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           relationship_type = VALUES(relationship_type)`,
          [sourceId, targetId, relationshipType, 'HumanPhenotypeOntology']
        );
        relationshipCount++;
      } catch (error) {
        // Skip duplicates
      }
    }
  }
  
  console.log(`\r   ✓ Loaded ${conceptCount} phenotype concepts and ${relationshipCount} relationships`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
