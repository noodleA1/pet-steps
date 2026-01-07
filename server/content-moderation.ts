/**
 * Content Moderation & Safety Utilities
 * 
 * Handles prompt sanitization, image validation, and content approval
 */

import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";
import type { ElementType } from "../shared/game-types";

// Maximum prompt length to prevent jailbreaking
export const MAX_PROMPT_LENGTH = 200;

// Blocked keywords for inappropriate content
const BLOCKED_KEYWORDS = [
  // Explicit content
  "nude", "naked", "nsfw", "explicit", "sexual", "porn", "xxx",
  "genitalia", "breasts", "penis", "vagina", "buttocks",
  // Violence
  "gore", "blood", "murder", "kill", "death", "corpse", "dead body",
  // Profanity (common)
  "fuck", "shit", "ass", "bitch", "damn", "crap",
  // Hate speech indicators
  "racist", "nazi", "hate", "slur",
  // Jailbreak attempts
  "ignore previous", "disregard instructions", "bypass", "jailbreak",
  "pretend you are", "act as if", "roleplay as",
];

// Element-specific visual traits for seeding prompts
export const ELEMENT_TRAITS: Record<ElementType, string[]> = {
  fire: [
    "flames", "ember glow", "orange and red coloring", "smoke wisps",
    "fiery mane", "glowing eyes", "volcanic patterns", "heat shimmer"
  ],
  water: [
    "aquatic features", "fins", "scales", "blue and cyan coloring",
    "water droplets", "flowing patterns", "gills", "bioluminescent spots"
  ],
  earth: [
    "rocky texture", "crystalline features", "green and brown coloring",
    "moss patches", "stone armor", "root-like appendages", "gem-encrusted"
  ],
  air: [
    "feathered wings", "cloud-like fur", "white and silver coloring",
    "ethereal glow", "wind swirls", "floating particles", "translucent features"
  ],
};

// Evolution stage descriptions for maturity guidance
export const EVOLUTION_MATURITY: Record<number, string> = {
  1: "baby creature, small and cute, round features, big eyes, playful appearance",
  20: "juvenile creature, slightly larger, developing features, more defined shape",
  40: "adolescent creature, medium size, emerging power features, sharper details",
  60: "adult creature, full size, powerful presence, mature features, battle-ready",
  80: "elder creature, majestic and wise, ornate details, legendary appearance",
};

/**
 * Check if a prompt contains blocked keywords
 */
export function containsBlockedContent(text: string): { blocked: boolean; reason?: string } {
  const lowerText = text.toLowerCase();
  
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return {
        blocked: true,
        reason: `Content contains inappropriate language. Please use family-friendly descriptions.`
      };
    }
  }
  
  return { blocked: false };
}

/**
 * Sanitize and validate a user prompt
 */
export function sanitizePrompt(prompt: string): { 
  valid: boolean; 
  sanitized?: string; 
  error?: string 
} {
  // Check length
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return {
      valid: false,
      error: `Prompt too long. Please keep it under ${MAX_PROMPT_LENGTH} characters.`
    };
  }
  
  // Check for blocked content
  const blockCheck = containsBlockedContent(prompt);
  if (blockCheck.blocked) {
    return {
      valid: false,
      error: blockCheck.reason
    };
  }
  
  // Remove any potential injection attempts
  let sanitized = prompt
    .replace(/[<>{}[\]]/g, '') // Remove brackets that could be used for injection
    .replace(/\n/g, ' ') // Remove newlines
    .trim();
  
  return { valid: true, sanitized };
}

/**
 * Build an element-aware prompt with maturity guidance
 */
export function buildEnhancedPrompt(
  userPrompt: string,
  element: ElementType,
  evolutionLevel: number,
  secondaryElement?: ElementType
): string {
  // Get element traits
  const primaryTraits = ELEMENT_TRAITS[element];
  const secondaryTraits = secondaryElement ? ELEMENT_TRAITS[secondaryElement] : [];
  
  // Get maturity stage
  let maturityStage = 1;
  if (evolutionLevel >= 80) maturityStage = 80;
  else if (evolutionLevel >= 60) maturityStage = 60;
  else if (evolutionLevel >= 40) maturityStage = 40;
  else if (evolutionLevel >= 20) maturityStage = 20;
  
  const maturityDesc = EVOLUTION_MATURITY[maturityStage];
  
  // Select random traits (2-3 from primary, 1 from secondary if exists)
  const selectedPrimary = primaryTraits
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .join(", ");
  
  const selectedSecondary = secondaryTraits.length > 0
    ? `, with hints of ${secondaryTraits[Math.floor(Math.random() * secondaryTraits.length)]}`
    : "";
  
  // Build the full prompt
  const basePrompt = `A fantasy pet creature, ${maturityDesc}, ${selectedPrimary}${selectedSecondary}`;
  const userAdditions = userPrompt ? `, ${userPrompt}` : "";
  const styleGuide = ", game art style, clean design, transparent background, centered composition, high quality";
  
  return `${basePrompt}${userAdditions}${styleGuide}`;
}

/**
 * Use AI to enhance and clean a user's prompt suggestion
 */
export async function enhanceUserPrompt(
  userSuggestion: string,
  element: ElementType,
  evolutionLevel: number
): Promise<{ enhanced: string; wasModified: boolean }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that enhances pet creature descriptions for a family-friendly game. 
Your job is to:
1. Keep the user's creative intent
2. Remove any inappropriate content
3. Add element-appropriate details (${element} element)
4. Make it suitable for AI image generation
5. Keep it under 100 words

If the input contains inappropriate content, replace it with family-friendly alternatives while keeping the spirit of the request.`
        },
        {
          role: "user",
          content: `Enhance this pet description for a level ${evolutionLevel} ${element}-type creature: "${userSuggestion}"`
        }
      ],
      maxTokens: 150,
    });
    
    const enhanced = response.choices[0]?.message?.content as string || userSuggestion;
    return {
      enhanced,
      wasModified: enhanced !== userSuggestion
    };
  } catch (error) {
    // If AI enhancement fails, use the sanitized version
    const sanitized = sanitizePrompt(userSuggestion);
    return {
      enhanced: sanitized.sanitized || userSuggestion,
      wasModified: false
    };
  }
}

/**
 * Validate an uploaded image using AI vision
 * Returns whether the image is appropriate for the app
 */
export async function validateUploadedImage(imageUrl: string): Promise<{
  valid: boolean;
  reason?: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a content moderator for a family-friendly pet game app. 
Analyze the image and determine if it's appropriate for use as a pet reference.

REJECT images that contain:
- Human faces or bodies
- Explicit or sexual content
- Violence or gore
- Inappropriate text or symbols
- Real-world weapons

ACCEPT images that contain:
- Animals (pets, wildlife)
- Cartoon/animated characters
- Fantasy creatures
- Nature scenes
- Abstract art

Respond with JSON: {"valid": true/false, "reason": "brief explanation"}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Is this image appropriate for use as a pet reference?" },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      maxTokens: 100,
    });
    
    try {
      const content = response.choices[0]?.message?.content as string || '{"valid": false, "reason": "Unable to analyze image"}';
      const result = JSON.parse(content);
      return result;
    } catch {
      // If parsing fails, be conservative
      return { valid: false, reason: "Unable to verify image content. Please try a different image." };
    }
  } catch (error) {
    // If vision check fails, allow with warning
    console.error("Image validation error:", error);
    return { valid: true, reason: "Image accepted (validation unavailable)" };
  }
}

/**
 * Validate a generated image before showing to user
 */
export async function validateGeneratedImage(imageUrl: string): Promise<{
  approved: boolean;
  reason?: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a content moderator for a family-friendly pet game app.
Analyze this AI-generated pet image and determine if it's appropriate.

REJECT if the image contains:
- Any human features
- Explicit or inappropriate content
- Disturbing or scary imagery (for children)
- Text or watermarks
- Low quality or broken generation

APPROVE if the image shows:
- A cute/cool fantasy creature
- Appropriate for all ages
- Clear and well-generated

Respond with JSON: {"approved": true/false, "reason": "brief explanation"}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Is this generated pet image appropriate?" },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      maxTokens: 100,
    });
    
    try {
      const content = response.choices[0]?.message?.content as string || '{"approved": false, "reason": "Unable to analyze"}';
      const result = JSON.parse(content);
      return result;
    } catch {
      return { approved: true, reason: "Approved (validation parse error)" };
    }
  } catch (error) {
    // If validation fails, approve by default to not block user
    console.error("Generated image validation error:", error);
    return { approved: true, reason: "Approved (validation unavailable)" };
  }
}

/**
 * Generate a pet image with full safety pipeline
 */
export async function generateSafePetImage(options: {
  userPrompt: string;
  element: ElementType;
  evolutionLevel: number;
  secondaryElement?: ElementType;
  referenceImageUrl?: string;
}): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
  tokensCharged: boolean;
}> {
  const { userPrompt, element, evolutionLevel, secondaryElement, referenceImageUrl } = options;
  
  // Step 1: Sanitize user prompt
  const sanitized = sanitizePrompt(userPrompt);
  if (!sanitized.valid) {
    return {
      success: false,
      error: sanitized.error,
      tokensCharged: false // Don't charge for blocked prompts
    };
  }
  
  // Step 2: If reference image provided, validate it
  if (referenceImageUrl) {
    const imageValidation = await validateUploadedImage(referenceImageUrl);
    if (!imageValidation.valid) {
      return {
        success: false,
        error: imageValidation.reason || "Please use a different image. Human photos and explicit content are not allowed.",
        tokensCharged: false // Don't charge for rejected uploads
      };
    }
  }
  
  // Step 3: Build enhanced prompt
  const enhancedPrompt = buildEnhancedPrompt(
    sanitized.sanitized || "",
    element,
    evolutionLevel,
    secondaryElement
  );
  
  // Step 4: Generate the image
  try {
    const result = await generateImage({
      prompt: enhancedPrompt,
      originalImages: referenceImageUrl ? [{ url: referenceImageUrl }] : undefined,
    });
    
    if (!result.url) {
      return {
        success: false,
        error: "Image generation failed. Please try again.",
        tokensCharged: false
      };
    }
    
    // Step 5: Validate generated image
    const generatedValidation = await validateGeneratedImage(result.url);
    if (!generatedValidation.approved) {
      return {
        success: false,
        error: "Generated image didn't meet quality standards. Please try different description.",
        tokensCharged: false // Don't charge for failed generations
      };
    }
    
    // Success!
    return {
      success: true,
      imageUrl: result.url,
      tokensCharged: true // Only charge on success
    };
  } catch (error) {
    console.error("Pet image generation error:", error);
    return {
      success: false,
      error: "Image generation failed. Please try again later.",
      tokensCharged: false
    };
  }
}
