import { SupabaseClient, createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { decode as decodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";
import { extractTextFromImageWithGemini } from "./gemini-client.ts";
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm";

// Set PDF.js worker path
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

// Initialize Supabase client
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(
    supabaseUrl,
    supabaseServiceKey
  );
}

/**
 * Process a file to extract text and generate thumbnails
 * @param fileId The file ID in the storage
 * @param bucketName The storage bucket name
 * @param filePath The file path within the bucket
 * @returns The extracted text and thumbnail URL
 */
export async function processFile(
  fileId: string,
  bucketName: string,
  filePath: string
): Promise<{ text: string; thumbnailUrl: string | null; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    
    // Download the file
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucketName)
      .download(filePath);
    
    if (downloadError || !fileData) {
      throw new Error(`Error downloading file: ${downloadError?.message || "No file data"}`);
    }
    
    // Get file MIME type
    const { data: fileInfo, error: fileInfoError } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    if (fileInfoError) {
      throw new Error(`Error getting file info: ${fileInfoError.message}`);
    }
    
    // Determine file type from path extension
    const fileExt = filePath.split('.').pop()?.toLowerCase() || '';
    const mimeType = getMimeTypeFromExtension(fileExt);
    
    // Extract text based on file type
    let extractedText = '';
    let thumbnailUrl: string | null = null;
    
    if (fileExt === 'pdf') {
      const result = await processPdf(fileData);
      extractedText = result.text;
      thumbnailUrl = await generatePdfThumbnail(
        supabase, 
        fileData, 
        bucketName, 
        fileId
      );
    } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff'].includes(fileExt)) {
      extractedText = await extractTextFromImageWithGemini(
        new Uint8Array(await fileData.arrayBuffer()),
        mimeType
      );
      thumbnailUrl = await generateImageThumbnail(
        supabase, 
        fileData, 
        bucketName, 
        fileId, 
        fileExt
      );
    } else if (['docx', 'doc', 'txt', 'rtf', 'odt'].includes(fileExt)) {
      // For this phase, we'll use a placeholder for document text extraction
      // This should be replaced with actual document parsing in future phases
      extractedText = "Document text extraction will be implemented in future phases";
      thumbnailUrl = null;
    } else if (['mp3', 'wav', 'ogg', 'mp4', 'avi', 'mov', 'webm'].includes(fileExt)) {
      // Placeholder for audio/video processing
      extractedText = "Audio/Video transcription will be implemented in future phases";
      thumbnailUrl = null;
    } else {
      extractedText = "Unsupported file format";
    }
    
    // Update the file metadata with the thumbnail URL if available
    if (thumbnailUrl) {
      await updateFileThumbnail(supabase, fileId, thumbnailUrl);
    }
    
    return { 
      text: extractedText, 
      thumbnailUrl 
    };
  } catch (error) {
    console.error("Error processing file:", error);
    return { 
      text: "", 
      thumbnailUrl: null, 
      error: `Failed to process file: ${error.message}` 
    };
  }
}

/**
 * Process a PDF file to extract text
 * @param file The PDF file blob
 * @returns The extracted text
 */
async function processPdf(file: Blob): Promise<{ text: string; pageCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: typedArray });
    const pdfDocument = await loadingTask.promise;
    
    const numPages = pdfDocument.numPages;
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      
      fullText += pageText + "\n\n";
    }
    
    return { text: fullText.trim(), pageCount: numPages };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Generate a thumbnail for a PDF file
 * @param supabase The Supabase client
 * @param file The PDF file blob
 * @param bucketName The storage bucket name
 * @param fileId The file ID
 * @returns The thumbnail URL
 */
async function generatePdfThumbnail(
  supabase: SupabaseClient,
  file: Blob,
  bucketName: string,
  fileId: string
): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: typedArray });
    const pdfDocument = await loadingTask.promise;
    
    // Get the first page for the thumbnail
    const page = await pdfDocument.getPage(1);
    
    // Set the scale for the thumbnail (adjust as needed)
    const scale = 1.5;
    const viewport = page.getViewport({ scale });
    
    // Create a canvas to render the page
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");
    
    if (!context) {
      throw new Error("Failed to create canvas context");
    }
    
    // Render the page to the canvas
    const renderContext = {
      canvasContext: context,
      viewport,
    };
    
    await page.render(renderContext).promise;
    
    // Convert the canvas to a blob
    const thumbnailBlob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.8,
    });
    
    // Upload the thumbnail to storage
    const thumbnailPath = `thumbnails/${fileId}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(thumbnailPath, thumbnailBlob, {
        contentType: "image/jpeg",
        upsert: true,
      });
    
    if (uploadError) {
      throw new Error(`Error uploading thumbnail: ${uploadError.message}`);
    }
    
    // Get the public URL for the thumbnail
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(thumbnailPath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error generating PDF thumbnail:", error);
    return null;
  }
}

/**
 * Generate a thumbnail for an image file
 * @param supabase The Supabase client
 * @param file The image file blob
 * @param bucketName The storage bucket name
 * @param fileId The file ID
 * @param fileExt The file extension
 * @returns The thumbnail URL
 */
async function generateImageThumbnail(
  supabase: SupabaseClient,
  file: Blob,
  bucketName: string,
  fileId: string,
  fileExt: string
): Promise<string | null> {
  try {
    // For images, we'll create a resized version as the thumbnail
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    
    // Create an image from the blob
    const img = new Image();
    const imageBitmap = await createImageBitmap(file);
    
    // Calculate dimensions for the thumbnail (max size 300px)
    const MAX_SIZE = 300;
    let width = imageBitmap.width;
    let height = imageBitmap.height;
    
    if (width > height) {
      if (width > MAX_SIZE) {
        height = Math.floor(height * (MAX_SIZE / width));
        width = MAX_SIZE;
      }
    } else {
      if (height > MAX_SIZE) {
        width = Math.floor(width * (MAX_SIZE / height));
        height = MAX_SIZE;
      }
    }
    
    // Create a canvas for the thumbnail
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
      throw new Error("Failed to create canvas context");
    }
    
    // Draw the image on the canvas
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // Convert the canvas to a blob
    const thumbnailBlob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.8,
    });
    
    // Upload the thumbnail to storage
    const thumbnailPath = `thumbnails/${fileId}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(thumbnailPath, thumbnailBlob, {
        contentType: "image/jpeg",
        upsert: true,
      });
    
    if (uploadError) {
      throw new Error(`Error uploading thumbnail: ${uploadError.message}`);
    }
    
    // Get the public URL for the thumbnail
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(thumbnailPath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error generating image thumbnail:", error);
    return null;
  }
}

/**
 * Update the file metadata with the thumbnail URL
 * @param supabase The Supabase client
 * @param fileId The file ID
 * @param thumbnailUrl The thumbnail URL
 */
async function updateFileThumbnail(
  supabase: SupabaseClient,
  fileId: string,
  thumbnailUrl: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("files")
      .update({ thumbnail_url: thumbnailUrl })
      .eq("id", fileId);
    
    if (error) {
      throw new Error(`Error updating file metadata: ${error.message}`);
    }
  } catch (error) {
    console.error("Error updating file thumbnail:", error);
    throw new Error(`Failed to update file thumbnail: ${error.message}`);
  }
}

/**
 * Get MIME type from file extension
 * @param extension The file extension
 * @returns The MIME type
 */
function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'tiff': 'image/tiff',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    'odt': 'application/vnd.oasis.opendocument.text',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'webm': 'video/webm',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
} 