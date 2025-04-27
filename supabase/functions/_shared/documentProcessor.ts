// Document processor for DOCX and TXT files
import { Document } from 'https://deno.land/x/docx/mod.ts';

/**
 * Extract text from a DOCX file
 * @param docxBuffer The DOCX file as ArrayBuffer
 * @returns Extracted text or null if extraction failed
 */
export async function extractTextFromDocx(docxBuffer: ArrayBuffer): Promise<string | null> {
  try {
    console.log("Extracting text from DOCX document...");
    
    // Parse the document
    const document = new Document(docxBuffer);
    
    // Extract text from the document
    const paragraphs: string[] = [];
    
    // Iterate through document content
    for (const paragraph of document.getParagraphs()) {
      paragraphs.push(paragraph.getText());
    }
    
    return paragraphs.join('\n\n');
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    return null;
  }
}

/**
 * Extract text from a TXT file
 * @param txtBuffer The TXT file as ArrayBuffer
 * @returns Extracted text or null if extraction failed
 */
export async function extractTextFromTxt(txtBuffer: ArrayBuffer): Promise<string | null> {
  try {
    console.log("Extracting text from TXT document...");
    
    // Convert the buffer to text
    const text = new TextDecoder().decode(txtBuffer);
    
    return text;
  } catch (error) {
    console.error("Error extracting text from TXT:", error);
    return null;
  }
}

/**
 * Generate a thumbnail for a document
 * This is a placeholder since text documents don't have a natural preview image
 * @returns A base64-encoded generic document icon
 */
export function generateDocumentThumbnail(): string {
  // Return a generic document icon for text documents (base64 encoded SVG)
  return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0MjU3YjIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1maWxlLXRleHQiPjxwYXRoIGQ9Ik0xNCAySDZhMiAyIDAgMCAwLTIgMnYxNmEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJ2LTEyIj48L3BhdGg+PHBhdGggZD0iTTE0IDJ2NGg0Ij48L3BhdGg+PHBhdGggZD0iTTggMTNoOCI+PC9wYXRoPjxwYXRoIGQ9Ik04IDE3aDgiPjwvcGF0aD48cGF0aCBkPSJNOCA4aDgiPjwvcGF0aD48L3N2Zz4=";
} 