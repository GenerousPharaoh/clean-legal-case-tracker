import { supabase, getClientWithRetry } from '../supabaseClient';

/**
 * Base class for API services with error handling
 */
class BaseApiService {
  protected supabase = supabase;
  protected supabaseWithRetry = getClientWithRetry();

  /**
   * Execute a database operation with retry logic
   * @param operation Function that performs the database operation
   * @param errorMessage Message to log if operation fails
   * @returns Result of the operation
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorMessage = 'Database operation failed'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`[BaseApiService] ${errorMessage}:`, error);
      throw error;
    }
  }

  /**
   * Handle API errors with detailed logging
   * @param error The error object
   * @param operation Description of the operation that failed
   * @param entityId Optional ID of the entity being operated on
   */
  protected handleError(error: unknown, operation: string, entityId?: string | number): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const idInfo = entityId ? ` (ID: ${entityId})` : '';
    
    console.error(`[BaseApiService] Error in ${operation}${idInfo}: ${errorMessage}`);
    
    // Rethrow with more context
    throw new Error(`${operation} failed: ${errorMessage}`);
  }
}

export default BaseApiService; 