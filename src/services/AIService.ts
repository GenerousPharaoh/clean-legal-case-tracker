import { supabase } from '../supabaseClient';

// Types for AI Service requests and responses
export interface OrganizationAnswers {
  goal: string;
  parties: string;
  documentTypes: string;
}

export interface OrganizationResponse {
  success: boolean;
  tags: string[];
  message: string;
  error?: string;
}

export type AnalyzeTask = 'summarize' | 'qa';

export interface AnalyzeResponse {
  success: boolean;
  result: string;
  task: AnalyzeTask;
  error?: string;
}

export interface Suggestion {
  type: 'support' | 'contradiction' | 'question' | 'elaborate';
  text: string;
  fileId?: string;
  location?: string;
  quote?: string;
}

export interface WritingAnalysisResponse {
  success: boolean;
  suggestions: Suggestion[];
  error?: string;
}

/**
 * AIService provides methods to interact with the AI capabilities 
 * through Supabase Edge Functions
 */
export const AIService = {
  /**
   * Suggest organization tags for a project based on user input
   */
  suggestOrganization: async (
    projectId: string, 
    answers: OrganizationAnswers
  ): Promise<OrganizationResponse> => {
    try {
      const { data, error } = await supabase.functions.invoke('suggest-organization', {
        body: { projectId, answers }
      });
      
      if (error) throw error;
      return data as OrganizationResponse;
    } catch (error) {
      console.error('Error suggesting organization:', error);
      return {
        success: false,
        tags: [],
        message: '',
        error: error.message || 'Failed to suggest organization'
      };
    }
  },
  
  /**
   * Get a summary of a file
   */
  summarizeFile: async (fileId: string): Promise<AnalyzeResponse> => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-file', {
        body: { fileId, task: 'summarize' }
      });
      
      if (error) throw error;
      return data as AnalyzeResponse;
    } catch (error) {
      console.error('Error summarizing file:', error);
      return {
        success: false,
        result: '',
        task: 'summarize',
        error: error.message || 'Failed to summarize file'
      };
    }
  },
  
  /**
   * Ask a question about a file
   */
  askQuestion: async (fileId: string, question: string): Promise<AnalyzeResponse> => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-file', {
        body: { fileId, task: 'qa', question }
      });
      
      if (error) throw error;
      return data as AnalyzeResponse;
    } catch (error) {
      console.error('Error asking question:', error);
      return {
        success: false,
        result: '',
        task: 'qa',
        error: error.message || 'Failed to answer question'
      };
    }
  },

  /**
   * Analyze writing context and provide suggestions based on project evidence
   */
  analyzeWritingContext: async (
    currentText: string
  ): Promise<WritingAnalysisResponse> => {
    try {
      // Get the current project from store or context if needed
      const { data, error } = await supabase.functions.invoke('analyze-writing-context', {
        body: { currentText }
      });
      
      if (error) throw error;
      return {
        success: true,
        suggestions: data.suggestions || [],
        error: ''
      };
    } catch (error) {
      console.error('Error analyzing writing context:', error);
      return {
        success: false,
        suggestions: [],
        error: error.message || 'Failed to analyze writing context'
      };
    }
  }
}; 