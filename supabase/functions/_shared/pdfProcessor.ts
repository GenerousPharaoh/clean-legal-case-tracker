// Helper module for PDF text extraction and thumbnail generation
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/+esm";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/build/pdf.worker.min.js';

/**
 * Extract text from a PDF file
 * @param pdfBuffer The PDF file as ArrayBuffer
 * @returns Extracted text or null if extraction failed
 */
export async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string | null> {
  try {
    console.log("Extracting text from PDF file...");
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    
    if (!pdf) {
      throw new Error("Failed to load PDF document");
    }
    
    const numPages = pdf.numPages;
    let extractedText = '';
    
    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      if (content && content.items) {
        // Concatenate the text items with line breaks between them
        const pageText = content.items
          .map(item => 'str' in item ? item.str : '')
          .join(' ');
          
        extractedText += pageText + '\n\n';
      }
    }
    
    if (!extractedText) {
      throw new Error("No text extracted from PDF");
    }
    
    return extractedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return null;
  }
}

/**
 * Generate a thumbnail from a PDF file
 * @param pdfBuffer The PDF file as ArrayBuffer
 * @param pageNum The page number to use for the thumbnail (default: 1)
 * @returns A base64-encoded PNG image or null if generation failed
 */
export async function generatePdfThumbnail(
  pdfBuffer: ArrayBuffer, 
  pageNum: number = 1
): Promise<string | null> {
  try {
    console.log(`Generating thumbnail from PDF page ${pageNum}...`);
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    
    if (!pdf) {
      throw new Error("Failed to load PDF document");
    }
    
    // Ensure page number is valid
    const validPageNum = Math.min(Math.max(1, pageNum), pdf.numPages);
    
    // Get the specified page
    const page = await pdf.getPage(validPageNum);
    
    // Set scale for thumbnail (adjust as needed for desired size)
    const scale = 0.5;
    const viewport = page.getViewport({ scale });
    
    // Create a canvas
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error("Failed to create canvas context");
    }
    
    // Render the page to the canvas
    await page.render({
      canvasContext: context,
      viewport
    }).promise;
    
    // Convert the canvas to a PNG blob
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    
    // Convert blob to base64
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("Error generating PDF thumbnail:", error);
    return null;
  }
} 