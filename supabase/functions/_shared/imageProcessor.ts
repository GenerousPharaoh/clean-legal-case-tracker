// Helper module for image processing, OCR, and thumbnail generation
import { ImageAnnotatorClient } from 'https://esm.sh/@google-cloud/vision@4.0.1';

/**
 * Extract text from an image using Google Cloud Vision API
 * @param imageBuffer The image file as ArrayBuffer
 * @returns Extracted text or null if extraction failed
 */
export async function extractTextFromImage(
  imageBuffer: ArrayBuffer,
  apiKey?: string
): Promise<string | null> {
  try {
    console.log("Extracting text from image using OCR...");
    
    if (!apiKey) {
      throw new Error("Google Cloud Vision API Key is required for OCR");
    }
    
    // Create a client with API key
    const client = new ImageAnnotatorClient({ 
      credentials: { client_email: null, private_key: null },
      auth: { apiKey }
    });
    
    // Convert buffer to base64
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    // Perform OCR
    const [result] = await client.textDetection({
      image: { content: base64Image }
    });
    
    if (!result || !result.fullTextAnnotation) {
      console.warn("No text detected in the image");
      return "";
    }
    
    return result.fullTextAnnotation.text || "";
  } catch (error) {
    console.error("Error extracting text from image:", error);
    return null;
  }
}

/**
 * Generate a thumbnail from an image
 * @param imageBuffer The image file as ArrayBuffer
 * @param maxWidth Maximum width of the thumbnail
 * @param maxHeight Maximum height of the thumbnail
 * @returns A base64-encoded image or null if generation failed
 */
export async function generateImageThumbnail(
  imageBuffer: ArrayBuffer,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<string | null> {
  try {
    console.log("Generating image thumbnail...");
    
    // Create an image bitmap from the buffer
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    const imageBitmap = await createImageBitmap(blob);
    
    // Calculate thumbnail dimensions while maintaining aspect ratio
    let width = imageBitmap.width;
    let height = imageBitmap.height;
    
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }
    
    // Create a canvas with the calculated dimensions
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Failed to create canvas context");
    }
    
    // Draw the image to the canvas with the new dimensions
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // Convert the canvas to a blob
    const thumbnailBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
    
    // Convert blob to base64
    const buffer = await thumbnailBlob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Error generating image thumbnail:", error);
    return null;
  }
} 