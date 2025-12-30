/**
 * ClinicalTrials.gov API Integration
 * https://clinicaltrials.gov/data-api/api
 * 
 * Provides access to:
 * - Clinical trial search by condition
 * - Trial details and eligibility criteria
 * - Trial locations and contact information
 * - Trial status and enrollment
 * - Trial results and outcomes
 */

import { ENV } from "./_core/env";

const CLINICALTRIALS_BASE_URL = "https://clinicaltrials.gov/api/v2";
const NCBI_API_KEY = ENV.ncbiApiKey; // ClinicalTrials.gov is part of NCBI

interface ClinicalTrialSearchParams {
  query?: string;
  condition?: string;
  intervention?: string;
  location?: string;
  status?: string[];
  phase?: string[];
  pageSize?: number;
  pageToken?: string;
}

interface ClinicalTrial {
  protocolSection: {
    identificationModule: {
      nctId: string;
      orgStudyIdInfo: { id: string };
      organization: { fullName: string; class: string };
      briefTitle: string;
      officialTitle?: string;
    };
    statusModule: {
      statusVerifiedDate: string;
      overallStatus: string;
      expandedAccessInfo?: { hasExpandedAccess: boolean };
      startDateStruct: { date: string; type: string };
      primaryCompletionDateStruct?: { date: string; type: string };
      completionDateStruct?: { date: string; type: string };
    };
    sponsorCollaboratorsModule: {
      responsibleParty?: { type: string };
      leadSponsor: { name: string; class: string };
    };
    descriptionModule?: {
      briefSummary?: string;
      detailedDescription?: string;
    };
    conditionsModule?: {
      conditions: string[];
    };
    designModule?: {
      studyType: string;
      phases?: string[];
      designInfo?: {
        allocation?: string;
        interventionModel?: string;
        primaryPurpose?: string;
        maskingInfo?: { masking: string };
      };
      enrollmentInfo?: {
        count: number;
        type: string;
      };
    };
    armsInterventionsModule?: {
      interventions: Array<{
        type: string;
        name: string;
        description?: string;
      }>;
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      healthyVolunteers?: boolean;
      sex?: string;
      minimumAge?: string;
      maximumAge?: string;
      stdAges?: string[];
    };
    contactsLocationsModule?: {
      centralContacts?: Array<{
        name: string;
        role: string;
        phone?: string;
        email?: string;
      }>;
      locations?: Array<{
        facility: string;
        status?: string;
        city?: string;
        state?: string;
        zip?: string;
        country: string;
        geoPoint?: {
          lat: number;
          lon: number;
        };
      }>;
    };
  };
}

/**
 * Search clinical trials
 * @param params Search parameters
 * @returns Clinical trial results
 */
export async function searchClinicalTrials(params: ClinicalTrialSearchParams) {
  const queryParams = new URLSearchParams();
  
  // Build query string
  const queryParts: string[] = [];
  
  if (params.query) {
    queryParts.push(params.query);
  }
  
  if (params.condition) {
    queryParts.push(`AREA[ConditionSearch]${params.condition}`);
  }
  
  if (params.intervention) {
    queryParts.push(`AREA[InterventionSearch]${params.intervention}`);
  }
  
  if (params.location) {
    queryParts.push(`AREA[LocationSearch]${params.location}`);
  }
  
  if (params.status && params.status.length > 0) {
    queryParts.push(`AREA[OverallStatus](${params.status.join(" OR ")})`);
  }
  
  if (params.phase && params.phase.length > 0) {
    queryParts.push(`AREA[Phase](${params.phase.join(" OR ")})`);
  }
  
  if (queryParts.length > 0) {
    queryParams.append("query.cond", queryParts.join(" AND "));
  }
  
  queryParams.append("format", "json");
  queryParams.append("pageSize", (params.pageSize || 20).toString());
  
  if (params.pageToken) {
    queryParams.append("pageToken", params.pageToken);
  }
  
  const url = `${CLINICALTRIALS_BASE_URL}/studies?${queryParams.toString()}`;
  
  const headers: HeadersInit = {
    'Accept': 'application/json'
  };
  
  if (NCBI_API_KEY) {
    headers['api_key'] = NCBI_API_KEY;
  }
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`ClinicalTrials.gov API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Get detailed information about a specific clinical trial
 * @param nctId NCT ID (e.g., NCT00000000)
 * @returns Trial details
 */
export async function getClinicalTrialDetails(nctId: string) {
  const url = `${CLINICALTRIALS_BASE_URL}/studies/${nctId}`;
  
  const headers: HeadersInit = {
    'Accept': 'application/json'
  };
  
  if (NCBI_API_KEY) {
    headers['api_key'] = NCBI_API_KEY;
  }
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`ClinicalTrials.gov API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Search trials by condition with filtering
 * @param condition Medical condition
 * @param options Additional filters
 * @returns Filtered trial results
 */
export async function searchTrialsByCondition(
  condition: string,
  options?: {
    recruiting?: boolean;
    country?: string;
    phase?: string[];
    limit?: number;
  }
) {
  const params: ClinicalTrialSearchParams = {
    condition,
    pageSize: options?.limit || 20
  };
  
  if (options?.recruiting) {
    params.status = ["RECRUITING", "NOT_YET_RECRUITING"];
  }
  
  if (options?.country) {
    params.location = options.country;
  }
  
  if (options?.phase) {
    params.phase = options.phase;
  }
  
  return searchClinicalTrials(params);
}

/**
 * Check if a patient matches trial eligibility criteria
 * @param trialId NCT ID
 * @param patientData Patient information
 * @returns Eligibility assessment
 */
export async function checkTrialEligibility(
  trialId: string,
  patientData: {
    age: number;
    gender: string;
    conditions: string[];
    medications?: string[];
  }
) {
  const trial = await getClinicalTrialDetails(trialId);
  
  if (!trial?.protocolSection?.eligibilityModule) {
    return {
      eligible: null,
      reason: "Eligibility criteria not available"
    };
  }
  
  const eligibility = trial.protocolSection.eligibilityModule;
  const matches: string[] = [];
  const mismatches: string[] = [];
  
  // Check age
  if (eligibility.minimumAge || eligibility.maximumAge) {
    const minAge = eligibility.minimumAge ? parseInt(eligibility.minimumAge) : 0;
    const maxAge = eligibility.maximumAge ? parseInt(eligibility.maximumAge) : 999;
    
    if (patientData.age >= minAge && patientData.age <= maxAge) {
      matches.push(`Age (${patientData.age}) is within range`);
    } else {
      mismatches.push(`Age (${patientData.age}) is outside range ${minAge}-${maxAge}`);
    }
  }
  
  // Check gender
  if (eligibility.sex && eligibility.sex !== "ALL") {
    if (eligibility.sex.toLowerCase() === patientData.gender.toLowerCase()) {
      matches.push(`Gender matches (${patientData.gender})`);
    } else {
      mismatches.push(`Gender mismatch (requires ${eligibility.sex})`);
    }
  }
  
  // Check healthy volunteers
  if (eligibility.healthyVolunteers === false && patientData.conditions.length === 0) {
    mismatches.push("Trial does not accept healthy volunteers");
  }
  
  return {
    eligible: mismatches.length === 0,
    matches,
    mismatches,
    criteria: eligibility.eligibilityCriteria,
    note: "This is a preliminary assessment. Please consult with the trial coordinator for definitive eligibility."
  };
}

/**
 * Get trials near a specific location
 * @param location City, state, or country
 * @param condition Medical condition
 * @param radiusMiles Search radius in miles
 * @returns Nearby trials
 */
export async function getTrialsNearLocation(
  location: string,
  condition?: string,
  radiusMiles: number = 50
) {
  const params: ClinicalTrialSearchParams = {
    location,
    pageSize: 50
  };
  
  if (condition) {
    params.condition = condition;
  }
  
  return searchClinicalTrials(params);
}

/**
 * Get recruiting trials for a specific condition
 * @param condition Medical condition
 * @param limit Maximum number of results
 * @returns Active recruiting trials
 */
export async function getRecruitingTrials(condition: string, limit: number = 20) {
  return searchTrialsByCondition(condition, {
    recruiting: true,
    limit
  });
}

/**
 * Parse eligibility criteria into structured format
 * @param criteriaText Raw eligibility criteria text
 * @returns Structured criteria
 */
export function parseEligibilityCriteria(criteriaText: string) {
  const lines = criteriaText.split('\n').map(l => l.trim()).filter(l => l);
  
  const inclusion: string[] = [];
  const exclusion: string[] = [];
  
  let currentSection: 'inclusion' | 'exclusion' | null = null;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('inclusion criteria')) {
      currentSection = 'inclusion';
      continue;
    }
    
    if (lowerLine.includes('exclusion criteria')) {
      currentSection = 'exclusion';
      continue;
    }
    
    if (currentSection === 'inclusion') {
      inclusion.push(line);
    } else if (currentSection === 'exclusion') {
      exclusion.push(line);
    }
  }
  
  return {
    inclusion,
    exclusion,
    raw: criteriaText
  };
}
