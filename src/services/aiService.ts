import supabase from './supabaseClient';

/**
 * AI Service for interacting with Gemini through Supabase Edge Functions
 */

interface WritingAnalysisResult {
  summary: string;
  entities: Array<{ name: string; type: string }>;
  dates: Array<{ date: string; significance: string }>;
  legalConcepts: string[];
  suggestedTopics: string[];
  confidenceScore: number;
}

interface FileAnalysisResult {
  analysis: {
    summary: string;
    documentType: string;
    keyEntities: Array<{ name: string; role: string }>;
    keyDates: Array<{ date: string; significance: string }>;
    legalIssues: string[];
    keyFacts: string[];
    relevantLaw: string[];
    suggestedKeywords: string[];
  };
  chunksProcessed: number;
}

interface QAResult {
  answer: string;
  confidence: number;
  citations: Array<{ text: string; source: string }>;
  needsAttorneyReview: boolean;
  matchingChunks?: Array<{
    id: string;
    similarity: number;
    preview: string;
  }>;
}

/**
 * Analyze text content using Gemini 2.5 Pro
 * @param text Text content to analyze
 * @param projectId Optional project ID for context
 * @returns Analysis results
 */
export const analyzeWritingContext = async (
  text: string,
  projectId?: string
): Promise<WritingAnalysisResult> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'analyze-writing-context',
      {
        body: { text, projectId },
      }
    );

    if (error) {
      throw new Error(`Error analyzing writing: ${error.message}`);
    }

    return data as WritingAnalysisResult;
  } catch (error) {
    console.error('Failed to analyze writing context:', error);
    throw error;
  }
};

/**
 * Analyze a document file using Gemini 2.5 Pro
 * Processes embeddings and saves to vector database
 * @param fileId ID of the file to analyze
 * @returns Analysis results and processing stats
 */
export const analyzeFile = async (fileId: string): Promise<FileAnalysisResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-file', {
      body: { fileId },
    });

    if (error) {
      throw new Error(`Error analyzing file: ${error.message}`);
    }

    return data as FileAnalysisResult;
  } catch (error) {
    console.error('Failed to analyze file:', error);
    throw error;
  }
};

/**
 * Ask a question about a project using RAG and Gemini 2.5 Pro
 * @param projectId ID of the project to question
 * @param question The user's question
 * @param limit Optional limit of context chunks to retrieve
 * @returns Answer with citations and confidence
 */
export const askProjectQuestion = async (
  projectId: string,
  question: string,
  limit: number = 5
): Promise<QAResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('project-qa', {
      body: { projectId, question, limit },
    });

    if (error) {
      throw new Error(`Error processing question: ${error.message}`);
    }

    return data as QAResult;
  } catch (error) {
    console.error('Failed to process question:', error);
    throw error;
  }
};

/**
 * Get filename suggestions using AI
 * @param fileId ID of the file to generate suggestions for
 * @returns Array of suggested filenames
 */
export const getSuggestedFilenames = async (
  fileId: string
): Promise<{ suggestedNames: string[]; nextExhibitId: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'suggest-filename',
      {
        body: { fileId },
      }
    );

    if (error) {
      throw new Error(`Error suggesting filenames: ${error.message}`);
    }

    return data as { suggestedNames: string[]; nextExhibitId: string };
  } catch (error) {
    console.error('Failed to get filename suggestions:', error);
    throw error;
  }
};

export default {
  analyzeWritingContext,
  analyzeFile,
  askProjectQuestion,
  getSuggestedFilenames,
}; 