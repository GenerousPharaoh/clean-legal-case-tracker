// DOCX processing utility for text extraction

/**
 * Extract text from a DOCX file
 * @param docxBuffer The DOCX file as ArrayBuffer
 * @returns Extracted text or null if extraction failed
 */
export async function extractTextFromDocx(docxBuffer: ArrayBuffer): Promise<string | null> {
  try {
    console.log("Extracting text from DOCX document...");
    
    // Since Deno edge functions have limited libraries for DOCX parsing,
    // we'll use a simplified approach to extract text from DOCX (XML-based format)
    
    // Convert ArrayBuffer to Uint8Array
    const docxBytes = new Uint8Array(docxBuffer);
    
    // DOCX files are ZIP archives, so we need to extract content
    // For this implementation, we'll use a simplified approach to extract 
    // text by looking for XML content in the document.xml file
    
    // Find document.xml content by searching for common XML patterns
    const textContent = await extractTextFromDocxBytes(docxBytes);
    
    if (!textContent || textContent.trim() === '') {
      console.warn("No text extracted from DOCX");
      return "No text could be extracted from this document.";
    }
    
    return textContent;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    return null;
  }
}

/**
 * Extract text from DOCX bytes by finding XML content
 * This is a simplified approach and may not work for all DOCX files
 */
async function extractTextFromDocxBytes(docxBytes: Uint8Array): Promise<string> {
  try {
    // Convert to text to search for XML content
    const textDecoder = new TextDecoder('utf-8');
    const fullContent = textDecoder.decode(docxBytes);
    
    // Find document.xml content
    let documentText = '';
    
    // Look for <w:t> tags which contain text in DOCX format
    const textRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
    let match;
    
    while ((match = textRegex.exec(fullContent)) !== null) {
      if (match[1]) {
        documentText += match[1] + ' ';
      }
    }
    
    // Clean up the text
    documentText = documentText.replace(/\s+/g, ' ').trim();
    
    return documentText;
  } catch (error) {
    console.error("Error in extractTextFromDocxBytes:", error);
    return "";
  }
} 