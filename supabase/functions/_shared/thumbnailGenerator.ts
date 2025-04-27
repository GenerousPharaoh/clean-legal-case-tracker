import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

/**
 * Creates a thumbnail for a file and stores it in Supabase Storage
 * 
 * @param fileBuffer - The file buffer to create a thumbnail from
 * @param fileType - The MIME type of the file
 * @param fileId - The ID of the file (used for naming the thumbnail)
 * @param bucket - The storage bucket to store the thumbnail in
 * @param client - The Supabase client instance
 * @returns The public URL of the thumbnail
 */
export async function createThumbnail(
  fileBuffer: ArrayBuffer,
  fileType: string,
  fileId: string,
  bucket: string,
  client: SupabaseClient
): Promise<string | null> {
  try {
    // Determine file type and generate appropriate thumbnail
    let thumbnailBlob: Blob | null = null;
    
    // Process by file type
    if (fileType.includes('pdf')) {
      thumbnailBlob = await createPdfThumbnail(fileBuffer);
    } else if (
      fileType.includes('image') || 
      fileType.includes('jpeg') || 
      fileType.includes('jpg') || 
      fileType.includes('png') || 
      fileType.includes('webp')
    ) {
      thumbnailBlob = await createImageThumbnail(fileBuffer);
    } else {
      // Generate a generic thumbnail for other file types
      thumbnailBlob = await createGenericThumbnail(fileType);
    }
    
    if (thumbnailBlob) {
      // Upload the thumbnail and get its URL
      return await uploadThumbnail(thumbnailBlob, fileId, bucket, client);
    }
    
    return null;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    return null;
  }
}

/**
 * Creates a thumbnail from a PDF file
 * 
 * @param fileBuffer - The PDF file buffer
 * @returns A Blob containing the thumbnail image
 */
async function createPdfThumbnail(fileBuffer: ArrayBuffer): Promise<Blob | null> {
  try {
    // Import PDF.js
    const pdfJS = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm');
    pdfJS.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    
    // Load the PDF
    const loadingTask = pdfJS.getDocument({ data: new Uint8Array(fileBuffer) });
    const pdf = await loadingTask.promise;
    
    // Get the first page
    const page = await pdf.getPage(1);
    
    // Set viewport dimensions
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = Math.min(300 / viewport.width, 300 / viewport.height);
    const scaledViewport = page.getViewport({ scale });
    
    // Create canvas
    const canvas = new OffscreenCanvas(scaledViewport.width, scaledViewport.height);
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not create canvas context');
    }
    
    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: scaledViewport
    }).promise;
    
    // Convert canvas to blob
    return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
  } catch (error) {
    console.error('Error creating PDF thumbnail:', error);
    return null;
  }
}

/**
 * Creates a thumbnail from an image file
 * 
 * @param fileBuffer - The image file buffer
 * @returns A Blob containing the resized thumbnail image
 */
async function createImageThumbnail(fileBuffer: ArrayBuffer): Promise<Blob | null> {
  try {
    // Create blob and image
    const blob = new Blob([fileBuffer]);
    const blobUrl = URL.createObjectURL(blob);
    
    // Create an image element
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = blobUrl;
    });
    
    // Calculate thumbnail dimensions (max 300px keeping aspect ratio)
    const MAX_SIZE = 300;
    let width = img.width;
    let height = img.height;
    
    if (width > height) {
      if (width > MAX_SIZE) {
        height = Math.round(height * (MAX_SIZE / width));
        width = MAX_SIZE;
      }
    } else {
      if (height > MAX_SIZE) {
        width = Math.round(width * (MAX_SIZE / height));
        height = MAX_SIZE;
      }
    }
    
    // Create canvas and resize image
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    
    ctx.drawImage(img, 0, 0, width, height);
    
    // Clean up
    URL.revokeObjectURL(blobUrl);
    
    // Convert canvas to blob
    return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
  } catch (error) {
    console.error('Error creating image thumbnail:', error);
    return null;
  }
}

/**
 * Creates a generic thumbnail for file types without visual representation
 * 
 * @param fileType - The MIME type of the file
 * @returns A Blob containing the generic thumbnail image
 */
async function createGenericThumbnail(fileType: string): Promise<Blob | null> {
  try {
    // Create a canvas for the generic thumbnail
    const canvas = new OffscreenCanvas(300, 300);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    
    // Set background color based on file type
    let bgColor = '#f0f0f0';
    let icon = '📄';
    
    // Choose a color and icon based on file type
    if (fileType.includes('docx') || fileType.includes('word')) {
      bgColor = '#295396';
      icon = '📝';
    } else if (fileType.includes('xlsx') || fileType.includes('excel')) {
      bgColor = '#1D6F42';
      icon = '📊';
    } else if (fileType.includes('pptx') || fileType.includes('powerpoint')) {
      bgColor = '#D04423';
      icon = '📊';
    } else if (fileType.includes('text') || fileType.includes('txt')) {
      bgColor = '#7d7d7d';
      icon = '📄';
    } else if (fileType.includes('zip') || fileType.includes('archive')) {
      bgColor = '#FFC107';
      icon = '🗃️';
    } else if (fileType.includes('audio')) {
      bgColor = '#8BC34A';
      icon = '🔊';
    } else if (fileType.includes('video')) {
      bgColor = '#FF5722';
      icon = '🎬';
    }
    
    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 300, 300);
    
    // Draw icon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 150, 150);
    
    // Convert canvas to blob
    return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
  } catch (error) {
    console.error('Error creating generic thumbnail:', error);
    return null;
  }
}

/**
 * Uploads a thumbnail to Supabase Storage
 * 
 * @param thumbnailBlob - The thumbnail blob to upload
 * @param fileId - The ID of the original file
 * @param bucket - The storage bucket to upload to
 * @param client - The Supabase client instance
 * @returns The public URL of the uploaded thumbnail
 */
async function uploadThumbnail(
  thumbnailBlob: Blob,
  fileId: string,
  bucket: string,
  client: SupabaseClient
): Promise<string | null> {
  try {
    // Create a thumbnail path
    const thumbnailPath = `thumbnails/${fileId}.jpg`;
    
    // Upload the thumbnail
    const { error } = await client.storage
      .from(bucket)
      .upload(thumbnailPath, thumbnailBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    // Get the public URL
    const { data } = client.storage
      .from(bucket)
      .getPublicUrl(thumbnailPath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    return null;
  }
} 