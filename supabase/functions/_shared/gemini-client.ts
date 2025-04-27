import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/generative-ai@0.2.0";

// Initialize the Google Generative AI with API key
const getGeminiClient = () => {
  const apiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not set in environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Extract text from an image using Gemini Vision
 * @param imageBytes The image byte array
 * @param mimeType The MIME type of the image
 * @returns Extracted text from the image
 */
export async function extractTextFromImageWithGemini(
  imageBytes: Uint8Array,
  mimeType: string
): Promise<string> {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const prompt = "Extract and return ALL text visible in this document/image. Maintain formatting where possible. Return ONLY the extracted text, with no additional commentary.";
    
    const generationConfig = {
      temperature: 0.1,
      topK: 32,
      topP: 1,
      maxOutputTokens: 8192,
    };
    
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];

    const imageData = {
      inlineData: {
        data: arrayBufferToBase64(imageBytes),
        mimeType,
      },
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }, imageData] }],
      generationConfig,
      safetySettings,
    });

    return result.response.text().trim();
  } catch (error) {
    console.error("Error extracting text with Gemini Vision:", error);
    throw new Error(`Failed to extract text using Gemini Vision: ${error.message}`);
  }
}

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: Uint8Array): string {
  const binary = [];
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary.push(String.fromCharCode(bytes[i]));
  }
  
  return btoa(binary.join(''));
} 