/**
 * Load Medical Knowledge Script
 * 
 * Loads medical knowledge from JSON files into the database.
 * Run this script to populate the knowledge base.
 * 
 * Usage: node scripts/load-knowledge.mjs
 */

import { loadAllKnowledge, validateKnowledge } from '../server/knowledge-loader.ts';

async function main() {
  console.log('🚀 Starting medical knowledge loading...\n');
  
  try {
    // Load all knowledge files
    const results = await loadAllKnowledge();
    
    console.log('\n✅ Knowledge loading complete!');
    console.log('=====================================');
    console.log(`Diseases loaded: ${results.diseases}`);
    console.log(`Symptoms loaded: ${results.symptoms}`);
    console.log(`Red Flags loaded: ${results.redFlags}`);
    console.log(`Medications loaded: ${results.medications}`);
    console.log('=====================================\n');
    
    // Validate knowledge integrity
    console.log('🔍 Validating knowledge integrity...\n');
    const validation = await validateKnowledge();
    
    if (validation.valid) {
      console.log('✅ Knowledge validation passed!\n');
    } else {
      console.log('⚠️  Knowledge validation found issues:');
      validation.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
      console.log('\nNote: Some validation errors are expected if you haven\'t created all knowledge files yet.\n');
    }
    
    console.log('🎉 Medical knowledge system is ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error loading knowledge:', error);
    process.exit(1);
  }
}

main();
