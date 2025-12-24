/**
 * Medical Knowledge Database Schema
 * 
 * This schema defines the structure for storing comprehensive medical knowledge
 * adapted for Iraqi healthcare context. It replaces brain-embedded knowledge
 * with maintainable, auditable, and scalable database-backed knowledge.
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Diseases Database
 * Comprehensive disease information with Iraqi context
 */
export const diseases = sqliteTable('diseases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  icdCode: text('icd_code').notNull().unique(), // ICD-10 or ICD-11 code
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  localName: text('local_name'), // Common Iraqi/Arabic colloquial name
  category: text('category').notNull(), // infectious, chronic, acute, etc.
  prevalenceIraq: text('prevalence_iraq'), // high, medium, low, rare
  description: text('description').notNull(),
  symptoms: text('symptoms').notNull(), // JSON array of symptom IDs
  riskFactors: text('risk_factors'), // JSON array
  complications: text('complications'), // JSON array
  differentialDiagnosis: text('differential_diagnosis'), // JSON array of disease IDs
  redFlags: text('red_flags'), // JSON array of red flag IDs
  treatmentProtocol: text('treatment_protocol'), // JSON object
  prognosis: text('prognosis'),
  preventionMeasures: text('prevention_measures'), // JSON array
  specialConsiderations: text('special_considerations'), // Iraqi-specific considerations
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  version: integer('version').notNull().default(1),
});

/**
 * Medications Database
 * Comprehensive medication information with Iraqi availability
 */
export const medications = sqliteTable('medications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  genericName: text('generic_name').notNull(),
  brandNames: text('brand_names'), // JSON array of brand names available in Iraq
  nameAr: text('name_ar').notNull(),
  drugClass: text('drug_class').notNull(),
  mechanism: text('mechanism'),
  indications: text('indications').notNull(), // JSON array
  contraindications: text('contraindications'), // JSON array
  sideEffects: text('side_effects'), // JSON array
  interactions: text('interactions'), // JSON array of drug IDs
  dosageAdult: text('dosage_adult'),
  dosagePediatric: text('dosage_pediatric'),
  dosageElderly: text('dosage_elderly'),
  routeOfAdministration: text('route_of_administration'), // oral, IV, IM, etc.
  availabilityIraq: text('availability_iraq').notNull(), // widely_available, limited, rare, not_available
  approximateCost: text('approximate_cost'), // price range in IQD
  requiresPrescription: integer('requires_prescription', { mode: 'boolean' }).notNull(),
  pregnancyCategory: text('pregnancy_category'),
  lactationSafety: text('lactation_safety'),
  renalAdjustment: text('renal_adjustment'),
  hepaticAdjustment: text('hepatic_adjustment'),
  monitoringRequired: text('monitoring_required'), // JSON array
  specialInstructions: text('special_instructions'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  version: integer('version').notNull().default(1),
});

/**
 * Symptoms Database
 * Comprehensive symptom catalog with severity indicators
 */
export const symptoms = sqliteTable('symptoms', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nameEn: text('name_en').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  localName: text('local_name'), // Common Iraqi description
  category: text('category').notNull(), // pain, respiratory, neurological, etc.
  description: text('description'),
  severityIndicators: text('severity_indicators'), // JSON object: mild, moderate, severe
  associatedConditions: text('associated_conditions'), // JSON array of disease IDs
  redFlagSymptom: integer('red_flag_symptom', { mode: 'boolean' }).notNull().default(0),
  urgencyLevel: text('urgency_level'), // routine, urgent, emergency
  commonInIraq: integer('common_in_iraq', { mode: 'boolean' }).notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Medical Procedures Database
 * Procedures available in Iraqi healthcare system
 */
export const procedures = sqliteTable('procedures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cptCode: text('cpt_code'), // CPT code if applicable
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  category: text('category').notNull(), // diagnostic, therapeutic, surgical, etc.
  description: text('description').notNull(),
  indications: text('indications'), // JSON array
  contraindications: text('contraindications'), // JSON array
  complications: text('complications'), // JSON array
  preparationRequired: text('preparation_required'),
  procedureSteps: text('procedure_steps'), // JSON array
  postProcedureCare: text('post_procedure_care'),
  recoveryTime: text('recovery_time'),
  availabilityIraq: text('availability_iraq').notNull(), // widely_available, major_cities, baghdad_only, not_available
  facilityRequirements: text('facility_requirements'), // JSON array of facility type IDs
  approximateCost: text('approximate_cost'), // price range in IQD
  insuranceCoverage: text('insurance_coverage'), // typically_covered, partial, not_covered
  specialConsiderations: text('special_considerations'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  version: integer('version').notNull().default(1),
});

/**
 * Red Flags Database
 * Critical warning signs requiring immediate attention
 */
export const redFlags = sqliteTable('red_flags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  category: text('category').notNull(), // cardiovascular, neurological, respiratory, etc.
  description: text('description').notNull(),
  clinicalSignificance: text('clinical_significance').notNull(),
  associatedConditions: text('associated_conditions'), // JSON array of disease IDs
  urgencyLevel: text('urgency_level').notNull(), // immediate, urgent, semi_urgent
  recommendedAction: text('recommended_action').notNull(),
  timeToTreatment: text('time_to_treatment'), // minutes, hours
  facilityRequired: text('facility_required'), // emergency_room, hospital, specialist
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Healthcare Facility Types
 * Types of healthcare facilities in Iraqi system
 */
export const facilityTypes = sqliteTable('facility_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nameEn: text('name_en').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  description: text('description'),
  capabilities: text('capabilities'), // JSON array of services/procedures
  typicalEquipment: text('typical_equipment'), // JSON array
  staffingRequirements: text('staffing_requirements'), // JSON array
  emergencyCapable: integer('emergency_capable', { mode: 'boolean' }).notNull(),
  icuCapable: integer('icu_capable', { mode: 'boolean' }).notNull(),
  surgeryCapable: integer('surgery_capable', { mode: 'boolean' }).notNull(),
  diagnosticCapabilities: text('diagnostic_capabilities'), // JSON array
  commonInIraq: integer('common_in_iraq', { mode: 'boolean' }).notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Clinical Guidelines
 * Evidence-based clinical guidelines adapted for Iraqi context
 */
export const clinicalGuidelines = sqliteTable('clinical_guidelines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  titleAr: text('title_ar').notNull(),
  category: text('category').notNull(), // diagnosis, treatment, prevention, etc.
  diseaseIds: text('disease_ids'), // JSON array of related disease IDs
  source: text('source').notNull(), // WHO, ACC/AHA, Iraqi MOH, etc.
  evidenceLevel: text('evidence_level').notNull(), // A, B, C
  recommendation: text('recommendation').notNull(),
  recommendationAr: text('recommendation_ar').notNull(),
  rationale: text('rationale'),
  iraqiAdaptations: text('iraqi_adaptations'), // Modifications for Iraqi context
  implementationConsiderations: text('implementation_considerations'),
  references: text('references'), // JSON array
  lastReviewed: integer('last_reviewed', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  version: integer('version').notNull().default(1),
});

/**
 * Symptom-Disease Associations
 * Mapping between symptoms and diseases with probability weights
 */
export const symptomDiseaseAssociations = sqliteTable('symptom_disease_associations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symptomId: integer('symptom_id').notNull().references(() => symptoms.id),
  diseaseId: integer('disease_id').notNull().references(() => diseases.id),
  associationStrength: real('association_strength').notNull(), // 0.0 to 1.0
  specificity: text('specificity').notNull(), // high, medium, low
  sensitivity: text('sensitivity').notNull(), // high, medium, low
  typicalPresentation: integer('typical_presentation', { mode: 'boolean' }).notNull().default(1),
  atypicalPresentation: integer('atypical_presentation', { mode: 'boolean' }).notNull().default(0),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Drug Interactions
 * Comprehensive drug-drug interaction database
 */
export const drugInteractions = sqliteTable('drug_interactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  drug1Id: integer('drug1_id').notNull().references(() => medications.id),
  drug2Id: integer('drug2_id').notNull().references(() => medications.id),
  severityLevel: text('severity_level').notNull(), // major, moderate, minor
  interactionType: text('interaction_type').notNull(), // pharmacokinetic, pharmacodynamic
  mechanism: text('mechanism'),
  clinicalEffect: text('clinical_effect').notNull(),
  management: text('management').notNull(),
  references: text('references'), // JSON array
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Knowledge Version Tracking
 * Track updates and versions of medical knowledge
 */
export const knowledgeVersions = sqliteTable('knowledge_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type').notNull(), // disease, medication, procedure, etc.
  entityId: integer('entity_id').notNull(),
  version: integer('version').notNull(),
  changeType: text('change_type').notNull(), // created, updated, deprecated
  changeDescription: text('change_description'),
  changedBy: text('changed_by'),
  reviewedBy: text('reviewed_by'),
  approvedBy: text('approved_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
