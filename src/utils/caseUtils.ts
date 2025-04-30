/**
 * Case Utilities
 * Helper functions for working with case data and fixing compatibility issues
 */

import type { Case } from '../types';
import { getSafeUserGetter } from './dbFix';
import { supabase } from '../supabaseClient';

/**
 * Makes sure both owner_id and created_by fields are set to the same value
 * This ensures backward compatibility and prevents foreign key constraint issues
 */
export function normalizeUserIdFields(caseData: Partial<Case>): Partial<Case> {
  if (!caseData) return caseData;
  
  const result = { ...caseData };
  
  if (result.created_by && !result.owner_id) {
    result.owner_id = result.created_by;
  } else if (result.owner_id && !result.created_by) {
    result.created_by = result.owner_id;
  }
  
  return result;
}

/**
 * Ensures all user ID fields in case data are consistent
 * Use this when creating or updating cases
 */
export function prepareCaseForDatabase(caseData: Partial<Case>, userId: string): Partial<Case> {
  if (!caseData) return {};
  
  return {
    ...caseData,
    created_by: userId,
    owner_id: userId
  };
}

/**
 * Gets the user ID from a case regardless of which field it uses
 * Handles both owner_id and created_by fields for backward compatibility
 */
export function getCaseUserId(caseData: Partial<Case> | null): string | null {
  if (!caseData) return null;
  
  return caseData.created_by || caseData.owner_id || null;
}

/**
 * Gets user information for a case safely
 * This uses the getSafeUserGetter utility from dbFix to ensure profiles exist
 */
export async function getCaseUserInfo(caseData: Partial<Case> | null) {
  if (!caseData) return null;
  
  const userId = getCaseUserId(caseData);
  if (!userId) return null;
  
  const getUserSafely = getSafeUserGetter(supabase);
  return await getUserSafely(userId);
}

/**
 * Format date string with error handling for case displays
 */
export function formatCaseDate(dateString: string | null | undefined): string {
  try {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('[caseUtils] Invalid date format:', dateString);
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (err) {
    console.error('[caseUtils] Error formatting date:', err);
    return 'Error with date';
  }
} 