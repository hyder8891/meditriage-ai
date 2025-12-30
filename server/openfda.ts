/**
 * OpenFDA API Integration
 * https://open.fda.gov/apis/
 * 
 * Provides access to:
 * - Drug adverse events
 * - Drug labeling information
 * - Device adverse events
 * - Food recalls
 * - Drug enforcement reports
 */

const OPENFDA_BASE_URL = "https://api.fda.gov";

interface OpenFDASearchParams {
  search?: string;
  limit?: number;
  skip?: number;
  sort?: string;
}

interface OpenFDAResponse<T> {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: T[];
}

/**
 * Search drug adverse events
 * @param params Search parameters
 * @returns Adverse event reports
 */
export async function searchDrugAdverseEvents(params: OpenFDASearchParams) {
  const queryParams = new URLSearchParams();
  
  if (params.search) queryParams.append("search", params.search);
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.skip) queryParams.append("skip", params.skip.toString());
  if (params.sort) queryParams.append("sort", params.sort);
  
  const url = `${OPENFDA_BASE_URL}/drug/event.json?${queryParams.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenFDA API error: ${response.statusText}`);
  }
  
  return await response.json() as OpenFDAResponse<any>;
}

/**
 * Search drug labeling information
 * @param params Search parameters
 * @returns Drug label data
 */
export async function searchDrugLabels(params: OpenFDASearchParams) {
  const queryParams = new URLSearchParams();
  
  if (params.search) queryParams.append("search", params.search);
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.skip) queryParams.append("skip", params.skip.toString());
  
  const url = `${OPENFDA_BASE_URL}/drug/label.json?${queryParams.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenFDA API error: ${response.statusText}`);
  }
  
  return await response.json() as OpenFDAResponse<any>;
}

/**
 * Search drug enforcement reports (recalls)
 * @param params Search parameters
 * @returns Enforcement/recall data
 */
export async function searchDrugEnforcement(params: OpenFDASearchParams) {
  const queryParams = new URLSearchParams();
  
  if (params.search) queryParams.append("search", params.search);
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.skip) queryParams.append("skip", params.skip.toString());
  
  const url = `${OPENFDA_BASE_URL}/drug/enforcement.json?${queryParams.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenFDA API error: ${response.statusText}`);
  }
  
  return await response.json() as OpenFDAResponse<any>;
}

/**
 * Search device adverse events
 * @param params Search parameters
 * @returns Device adverse event reports
 */
export async function searchDeviceAdverseEvents(params: OpenFDASearchParams) {
  const queryParams = new URLSearchParams();
  
  if (params.search) queryParams.append("search", params.search);
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.skip) queryParams.append("skip", params.skip.toString());
  
  const url = `${OPENFDA_BASE_URL}/device/event.json?${queryParams.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenFDA API error: ${response.statusText}`);
  }
  
  return await response.json() as OpenFDAResponse<any>;
}

/**
 * Search food recalls
 * @param params Search parameters
 * @returns Food recall data
 */
export async function searchFoodRecalls(params: OpenFDASearchParams) {
  const queryParams = new URLSearchParams();
  
  if (params.search) queryParams.append("search", params.search);
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.skip) queryParams.append("skip", params.skip.toString());
  
  const url = `${OPENFDA_BASE_URL}/food/enforcement.json?${queryParams.toString()}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenFDA API error: ${response.statusText}`);
  }
  
  return await response.json() as OpenFDAResponse<any>;
}

/**
 * Get drug safety information for a specific drug
 * @param drugName Drug name to search
 * @returns Combined safety information
 */
export async function getDrugSafetyInfo(drugName: string) {
  try {
    const [adverseEvents, labels, enforcement] = await Promise.allSettled([
      searchDrugAdverseEvents({ 
        search: `patient.drug.medicinalproduct:"${drugName}"`,
        limit: 10 
      }),
      searchDrugLabels({ 
        search: `openfda.brand_name:"${drugName}" OR openfda.generic_name:"${drugName}"`,
        limit: 1 
      }),
      searchDrugEnforcement({ 
        search: `openfda.brand_name:"${drugName}" OR openfda.generic_name:"${drugName}"`,
        limit: 5 
      })
    ]);
    
    return {
      adverseEvents: adverseEvents.status === 'fulfilled' ? adverseEvents.value : null,
      labels: labels.status === 'fulfilled' ? labels.value : null,
      enforcement: enforcement.status === 'fulfilled' ? enforcement.value : null,
    };
  } catch (error) {
    console.error('Error fetching drug safety info:', error);
    throw error;
  }
}
