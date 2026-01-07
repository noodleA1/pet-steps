/**
 * Background Removal Utility
 * 
 * Removes backgrounds from pet images for clean display
 * Uses the built-in image generation service with inpainting/editing
 */

import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";

/**
 * Remove background from a pet image
 * Uses AI to isolate the creature and make background transparent
 */
export async function removeBackground(imageUrl: string): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    // Use image-to-image with a prompt to isolate the subject
    const result = await generateImage({
      prompt: "Isolate the creature/pet in this image, remove the background completely, make background transparent, keep only the main subject, clean edges, no background elements",
      originalImages: [{ url: imageUrl }],
    });
    
    if (!result.url) {
      return {
        success: false,
        error: "Background removal failed"
      };
    }
    
    return {
      success: true,
      url: result.url
    };
  } catch (error) {
    console.error("Background removal error:", error);
    return {
      success: false,
      error: "Background removal failed. Please try again."
    };
  }
}

/**
 * Process a pet image: remove background and optimize for display
 */
export async function processPetImage(imageUrl: string): Promise<{
  success: boolean;
  processedUrl?: string;
  originalUrl: string;
  error?: string;
}> {
  // First, try to remove the background
  const bgRemovalResult = await removeBackground(imageUrl);
  
  if (!bgRemovalResult.success || !bgRemovalResult.url) {
    // If background removal fails, return the original
    return {
      success: true,
      processedUrl: imageUrl,
      originalUrl: imageUrl,
      error: "Background removal unavailable, using original image"
    };
  }
  
  return {
    success: true,
    processedUrl: bgRemovalResult.url,
    originalUrl: imageUrl
  };
}
