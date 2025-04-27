import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm";
import { extractTextFromImage } from "./imageProcessor.ts";
import { extractTextFromDocx } from "./docxProcessor.ts";
import { createThumbnail } from "./thumbnailGenerator.ts";

interface FileProcessingResult {
  text: string | null;
  thumbnailUrl: string | null;
  error: string | null;
}

/**
 * Process a file to extract text and generate thumbnails
 * @param fileId The ID of the file in the database
 * @param supabase The Supabase client instance
 * @param bucket The storage bucket name
 * @param filePath The path to the file in storage
 * @returns Processing result with extracted text and thumbnail URL
 */
export async function processFile(
  fileId: string,
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  filePath: string
): Promise<FileProcessingResult> {
  try {
    console.log(`Processing file: ${fileId} from ${bucket}/${filePath}`);

    // Get file metadata from database
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .select("file_name, file_type, content_type, size")
      .eq("id", fileId)
      .single();

    if (fileError || !fileData) {
      return {
        text: null,
        thumbnailUrl: null,
        error: `Failed to fetch file metadata: ${fileError?.message || "File not found"}`,
      };
    }

    // Check file size limits
    const fileSizeInMB = (fileData.size || 0) / (1024 * 1024);
    const MAX_FILE_SIZE_MB = 50; // Set a reasonable limit
    if (fileSizeInMB > MAX_FILE_SIZE_MB) {
      return {
        text: null,
        thumbnailUrl: null,
        error: `File size (${fileSizeInMB.toFixed(2)}MB) exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB}MB`,
      };
    }

    // Download file from storage
    const { data: fileBuffer, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (downloadError || !fileBuffer) {
      return {
        text: null,
        thumbnailUrl: null,
        error: `Failed to download file: ${downloadError?.message || "Unknown error"}`,
      };
    }

    // Initialize result
    let result: FileProcessingResult = {
      text: null,
      thumbnailUrl: null,
      error: null,
    };

    // Extract text based on file type
    const fileType = (fileData.file_type || fileData.content_type || "").toLowerCase();
    
    try {
      // Process by file type
      if (fileType.includes("pdf")) {
        result = await processPdf(fileBuffer, fileId, bucket, supabase);
      } else if (
        fileType.includes("image") || 
        fileType.includes("jpeg") || 
        fileType.includes("jpg") || 
        fileType.includes("png")
      ) {
        result = await processImage(fileBuffer, fileId, bucket, supabase);
      } else if (fileType.includes("docx") || fileType.includes("word")) {
        result = await processDocx(fileBuffer, fileId, bucket, supabase);
      } else if (fileType.includes("txt") || fileType.includes("text") || fileType.includes("plain")) {
        result = await processText(fileBuffer, fileId, bucket, supabase);
      } else {
        result.error = `Unsupported file type: ${fileType}`;
      }
    } catch (extractionError) {
      console.error(`Error processing file ${fileId}:`, extractionError);
      result.error = `Text extraction failed: ${extractionError.message}`;
    }

    // Generate thumbnail if needed and not already done in file-specific processing
    if (!result.thumbnailUrl) {
      try {
        const thumbnailUrl = await createThumbnail(
          fileBuffer, 
          fileType, 
          fileId, 
          bucket, 
          supabase
        );
        result.thumbnailUrl = thumbnailUrl;
      } catch (thumbnailError) {
        console.error(`Error generating thumbnail for ${fileId}:`, thumbnailError);
        // Don't overwrite extraction error if it exists
        if (!result.error) {
          result.error = `Thumbnail generation failed: ${thumbnailError.message}`;
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error in processFile:", error);
    return {
      text: null,
      thumbnailUrl: null,
      error: `File processing failed: ${error.message}`,
    };
  }
}

/**
 * Process a PDF file to extract text and generate a thumbnail
 */
async function processPdf(
  fileBuffer: ArrayBuffer,
  fileId: string,
  bucket: string,
  supabase: ReturnType<typeof createClient>
): Promise<FileProcessingResult> {
  try {
    // Load PDF.js (necessary for web workers)
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
    
    // Load the PDF document
    const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(fileBuffer) }).promise;
    
    // Concatenate text from all pages
    let extractedText = "";
    
    // Process up to 100 pages (for very large PDFs)
    const maxPages = Math.min(pdfDoc.numPages, 100);
    
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str)
        .join(" ");
        
      extractedText += pageText + "\n\n";
    }
    
    // Generate a thumbnail from the first page
    const firstPage = await pdfDoc.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1.0 });
    
    // Create a canvas and render the first page
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");
    
    if (!context) {
      throw new Error("Failed to create canvas context");
    }
    
    await firstPage.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
    
    // Convert canvas to Blob
    const thumbnailBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.7 });
    
    // Upload thumbnail to storage
    const thumbnailPath = `thumbnails/${fileId}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(thumbnailPath, thumbnailBlob, {
        contentType: "image/jpeg",
        upsert: true,
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);
    }
    
    // Get public URL for the thumbnail
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(thumbnailPath);
    
    return {
      text: extractedText,
      thumbnailUrl: publicUrlData.publicUrl,
      error: null,
    };
  } catch (error) {
    console.error("Error processing PDF:", error);
    return {
      text: null,
      thumbnailUrl: null,
      error: `PDF processing failed: ${error.message}`,
    };
  }
}

/**
 * Process an image file to extract text and use the image as a thumbnail
 */
async function processImage(
  fileBuffer: ArrayBuffer,
  fileId: string,
  bucket: string,
  supabase: ReturnType<typeof createClient>
): Promise<FileProcessingResult> {
  try {
    // Extract text from image using OCR
    const text = await extractTextFromImage(fileBuffer);
    
    // Use the image itself as the thumbnail
    const thumbnailPath = `thumbnails/${fileId}.jpg`;
    
    // Create a smaller version for the thumbnail
    const thumbnailBlob = await createThumbnail(
      fileBuffer, 
      "image/jpeg", 
      fileId, 
      bucket, 
      supabase
    );
    
    // Get public URL for the thumbnail
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(thumbnailPath);
    
    return {
      text,
      thumbnailUrl: publicUrlData.publicUrl,
      error: null,
    };
  } catch (error) {
    console.error("Error processing image:", error);
    return {
      text: null,
      thumbnailUrl: null,
      error: `Image processing failed: ${error.message}`,
    };
  }
}

/**
 * Process a DOCX file to extract text and generate a thumbnail
 */
async function processDocx(
  fileBuffer: ArrayBuffer,
  fileId: string,
  bucket: string,
  supabase: ReturnType<typeof createClient>
): Promise<FileProcessingResult> {
  try {
    // Extract text from DOCX
    const text = await extractTextFromDocx(fileBuffer);
    
    // Create a generic thumbnail for docx files
    const thumbnailUrl = await createGenericThumbnail(
      "docx", 
      fileId, 
      bucket, 
      supabase
    );
    
    return {
      text,
      thumbnailUrl,
      error: null,
    };
  } catch (error) {
    console.error("Error processing DOCX:", error);
    return {
      text: null,
      thumbnailUrl: null,
      error: `DOCX processing failed: ${error.message}`,
    };
  }
}

/**
 * Process a plain text file
 */
async function processText(
  fileBuffer: ArrayBuffer,
  fileId: string,
  bucket: string,
  supabase: ReturnType<typeof createClient>
): Promise<FileProcessingResult> {
  try {
    // Convert ArrayBuffer to text
    const text = new TextDecoder().decode(fileBuffer);
    
    // Create a generic thumbnail for text files
    const thumbnailUrl = await createGenericThumbnail(
      "txt", 
      fileId, 
      bucket, 
      supabase
    );
    
    return {
      text,
      thumbnailUrl,
      error: null,
    };
  } catch (error) {
    console.error("Error processing text file:", error);
    return {
      text: null,
      thumbnailUrl: null,
      error: `Text file processing failed: ${error.message}`,
    };
  }
}

/**
 * Create a generic thumbnail for file types that don't have visual content
 */
async function createGenericThumbnail(
  fileType: string,
  fileId: string,
  bucket: string,
  supabase: ReturnType<typeof createClient>
): Promise<string | null> {
  try {
    // Simple canvas-based thumbnail with file type indicator
    const canvas = new OffscreenCanvas(200, 200);
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
      throw new Error("Failed to create canvas context");
    }
    
    // Set background
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, 200, 200);
    
    // Draw file type indicator
    ctx.fillStyle = "#333333";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fileType.toUpperCase(), 100, 100);
    
    // Convert to blob
    const thumbnailBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.9 });
    
    // Upload the thumbnail
    const thumbnailPath = `thumbnails/${fileId}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(thumbnailPath, thumbnailBlob, {
        contentType: "image/jpeg",
        upsert: true,
      });
      
    if (uploadError) {
      throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(thumbnailPath);
      
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error creating generic thumbnail:", error);
    return null;
  }
} 