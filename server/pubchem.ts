/**
 * PubChem API Integration
 * https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
 * 
 * Provides access to:
 * - Chemical compound information
 * - Drug structures and properties
 * - Bioassay data
 * - Drug-drug interactions
 * - Pharmacological data
 */

import { ENV } from "./_core/env";

const PUBCHEM_BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const NCBI_API_KEY = ENV.ncbiApiKey;

interface PubChemCompound {
  CID: number;
  MolecularFormula?: string;
  MolecularWeight?: number;
  IUPACName?: string;
  Title?: string;
  InChI?: string;
  InChIKey?: string;
  CanonicalSMILES?: string;
  IsomericSMILES?: string;
}

/**
 * Search compounds by name
 * @param name Compound or drug name
 * @returns List of matching compound CIDs
 */
export async function searchCompoundByName(name: string): Promise<number[]> {
  const url = `${PUBCHEM_BASE_URL}/compound/name/${encodeURIComponent(name)}/cids/JSON`;
  
  const response = await fetch(url, {
    headers: NCBI_API_KEY ? { 'api_key': NCBI_API_KEY } : {}
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      return []; // No results found
    }
    throw new Error(`PubChem API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.IdentifierList?.CID || [];
}

/**
 * Get compound details by CID
 * @param cid Compound ID
 * @returns Compound information
 */
export async function getCompoundByCID(cid: number) {
  const url = `${PUBCHEM_BASE_URL}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,Title,InChI,InChIKey,CanonicalSMILES,IsomericSMILES/JSON`;
  
  const response = await fetch(url, {
    headers: NCBI_API_KEY ? { 'api_key': NCBI_API_KEY } : {}
  });
  
  if (!response.ok) {
    throw new Error(`PubChem API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.PropertyTable?.Properties?.[0] as PubChemCompound;
}

/**
 * Get compound description
 * @param cid Compound ID
 * @returns Compound description
 */
export async function getCompoundDescription(cid: number) {
  const url = `${PUBCHEM_BASE_URL}/compound/cid/${cid}/description/JSON`;
  
  const response = await fetch(url, {
    headers: NCBI_API_KEY ? { 'api_key': NCBI_API_KEY } : {}
  });
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  return data.InformationList?.Information?.[0];
}

/**
 * Get compound synonyms (brand names, generic names, etc.)
 * @param cid Compound ID
 * @returns List of synonyms
 */
export async function getCompoundSynonyms(cid: number): Promise<string[]> {
  const url = `${PUBCHEM_BASE_URL}/compound/cid/${cid}/synonyms/JSON`;
  
  const response = await fetch(url, {
    headers: NCBI_API_KEY ? { 'api_key': NCBI_API_KEY } : {}
  });
  
  if (!response.ok) {
    return [];
  }
  
  const data = await response.json();
  return data.InformationList?.Information?.[0]?.Synonym || [];
}

/**
 * Get drug interactions for a compound
 * @param cid Compound ID
 * @returns Drug interaction information
 */
export async function getDrugInteractions(cid: number) {
  // PubChem doesn't have direct drug-drug interaction endpoint
  // We'll use the compound classification and properties
  const url = `${PUBCHEM_BASE_URL}/compound/cid/${cid}/classification/JSON`;
  
  const response = await fetch(url, {
    headers: NCBI_API_KEY ? { 'api_key': NCBI_API_KEY } : {}
  });
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  return data;
}

/**
 * Get bioassay data for a compound
 * @param cid Compound ID
 * @returns Bioassay information
 */
export async function getCompoundBioassays(cid: number) {
  const url = `${PUBCHEM_BASE_URL}/compound/cid/${cid}/assaysummary/JSON`;
  
  const response = await fetch(url, {
    headers: NCBI_API_KEY ? { 'api_key': NCBI_API_KEY } : {}
  });
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  return data;
}

/**
 * Get comprehensive drug information
 * @param drugName Drug name (brand or generic)
 * @returns Complete drug information
 */
export async function getDrugInfo(drugName: string) {
  try {
    // Search for compound
    const cids = await searchCompoundByName(drugName);
    
    if (cids.length === 0) {
      return null;
    }
    
    const primaryCID = cids[0];
    
    // Fetch all information in parallel
    const [compound, description, synonyms, classification] = await Promise.allSettled([
      getCompoundByCID(primaryCID),
      getCompoundDescription(primaryCID),
      getCompoundSynonyms(primaryCID),
      getDrugInteractions(primaryCID)
    ]);
    
    return {
      cid: primaryCID,
      compound: compound.status === 'fulfilled' ? compound.value : null,
      description: description.status === 'fulfilled' ? description.value : null,
      synonyms: synonyms.status === 'fulfilled' ? synonyms.value : [],
      classification: classification.status === 'fulfilled' ? classification.value : null,
      alternativeCIDs: cids.slice(1, 5) // Keep up to 4 alternative matches
    };
  } catch (error) {
    console.error('Error fetching drug info from PubChem:', error);
    throw error;
  }
}

/**
 * Search for similar compounds (drug alternatives)
 * @param cid Compound ID
 * @param threshold Similarity threshold (0-100)
 * @returns List of similar compound CIDs
 */
export async function getSimilarCompounds(cid: number, threshold: number = 95) {
  const url = `${PUBCHEM_BASE_URL}/compound/fastsimilarity_2d/cid/${cid}/cids/JSON?Threshold=${threshold}`;
  
  const response = await fetch(url, {
    headers: NCBI_API_KEY ? { 'api_key': NCBI_API_KEY } : {}
  });
  
  if (!response.ok) {
    return [];
  }
  
  const data = await response.json();
  return data.IdentifierList?.CID || [];
}

/**
 * Get compound image (2D structure)
 * @param cid Compound ID
 * @param size Image size (small, medium, large)
 * @returns Image URL
 */
export function getCompoundImageURL(cid: number, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const sizeMap = {
    small: '200x200',
    medium: '400x400',
    large: '800x800'
  };
  
  return `https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${cid}&t=l&w=${sizeMap[size].split('x')[0]}&h=${sizeMap[size].split('x')[1]}`;
}

/**
 * Check drug-drug interactions between two compounds
 * @param drug1Name First drug name
 * @param drug2Name Second drug name
 * @returns Interaction information
 */
export async function checkDrugDrugInteraction(drug1Name: string, drug2Name: string) {
  try {
    const [drug1Info, drug2Info] = await Promise.all([
      getDrugInfo(drug1Name),
      getDrugInfo(drug2Name)
    ]);
    
    if (!drug1Info || !drug2Info) {
      return null;
    }
    
    // Get classifications for both drugs
    const drug1Class = drug1Info.classification;
    const drug2Class = drug2Info.classification;
    
    return {
      drug1: {
        name: drug1Name,
        cid: drug1Info.cid,
        compound: drug1Info.compound,
        classification: drug1Class
      },
      drug2: {
        name: drug2Name,
        cid: drug2Info.cid,
        compound: drug2Info.compound,
        classification: drug2Class
      },
      // Note: PubChem doesn't provide direct interaction data
      // This would need to be cross-referenced with other databases
      note: "For detailed interaction information, cross-reference with DrugBank or FDA databases"
    };
  } catch (error) {
    console.error('Error checking drug-drug interaction:', error);
    throw error;
  }
}
