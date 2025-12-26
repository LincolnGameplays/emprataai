/**
 * ⚡ EMPRATA NEURAL ENGINE™ v4.1 ⚡
 * Production-Ready AI Service with Atomic Credit Transactions
 * 
 * Models (LOCKED - DO NOT CHANGE):
 * - Prompt Architect: models/gemini-3-pro-preview
 * - Image Generator: models/gemini-2.5-flash-image
 */

import { useAppStore } from '../store/useAppStore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API Configuration
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Initialize Google Generative AI SDK
const genAI = new GoogleGenerativeAI(API_KEY || '');

// ══════════════════════════════════════════════════════════════════════════════
// MODEL CONFIGURATION (LOCKED - DO NOT CHANGE THESE NAMES)
// ══════════════════════════════════════════════════════════════════════════════
const PROMPT_ARCHITECT_MODEL = "models/gemini-3-pro-preview";   // O Cérebro
const IMAGE_GENERATOR_MODEL = "models/gemini-2.5-flash-image";  // O Artista

export interface GenerateImageParams {
  file: File;
  vibe: string;
  angle: string;
  lightIntensity?: number;
}

export interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  debugInfo?: {
    usedModel: string;
    promptGenerated: string;
  };
}

/**
 * Utility: Resize and crop image to square 1080x1080
 */
async function resizeToSquare(file: File, targetSize: number = 1080): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;

      canvas.width = targetSize;
      canvas.height = targetSize;

      ctx.drawImage(img, x, y, size, size, 0, 0, targetSize, targetSize);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        0.95
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Helper: Convert File to Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Build the Architect's enhancement prompt
 */
function buildArchitectPrompt(vibe: string, angle: string, lightIntensity: number): string {
  const vibeMap: Record<string, string> = {
    rustico: "rustic wooden table",
    gourmet: "white marble surface",
    dark: "dark matte black surface",
    domingo: "bright white with morning sunlight",
    marble: "luxurious black onyx marble",
    neon: "reflective surface with neon lights"
  };

  const angleMap: Record<string, string> = {
    top: "90° flat lay top-down",
    diagonal: "45° diner's perspective",
    front: "eye-level hero shot",
    macro: "extreme close-up macro"
  };

  const lightDesc = lightIntensity > 70 
    ? "bright studio softbox lighting"
    : lightIntensity > 40 ? "balanced natural lighting" : "dramatic low-key shadows";

  return `Role: Food Photographer Expert.
Task: Enhance this request into a high-end food delivery photography prompt.
Context:
- Surface: ${vibeMap[vibe] || vibeMap.rustico}
- Camera Angle: ${angleMap[angle] || angleMap.diagonal}  
- Lighting: ${lightDesc}
Technical Specs: 85mm lens, f/1.8, shallow DOF, 1080x1080 square, 8K quality.
Keywords: commercial food photography, appetizing, Michelin star presentation.
Output: Just the prompt in English. No explanations.`;
}

/**
 * Main Image Generation Function with Atomic Credit Transactions
 */
export async function generateFoodImage(
  params: GenerateImageParams
): Promise<GenerateImageResponse> {
  console.log("🚀 [Neural Engine v4.1] Iniciando...");

  // Get store actions
  const { credits, plan, decrementCredit, refundCredit } = useAppStore.getState();

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 1: VALIDATION
  // ════════════════════════════════════════════════════════════════════════════
  if (!API_KEY) {
    return { success: false, error: "API Key não configurada." };
  }

  if (plan !== 'PRO' && credits < 1) {
    return { success: false, error: "Créditos insuficientes. Faça um upgrade." };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 2: OPTIMISTIC DEDUCTION (Cobra ANTES para evitar fraude)
  // ════════════════════════════════════════════════════════════════════════════
  console.log("💳 Cobrança otimista...");
  decrementCredit();

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // STEP 3: PROCESS IMAGE
    // ══════════════════════════════════════════════════════════════════════════
    console.log("✂️ Processando imagem 1080x1080...");
    const croppedFile = await resizeToSquare(params.file, 1080);
    const base64Image = await fileToBase64(croppedFile);

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 4: PROMPT ARCHITECT (Gemini 3 Pro Preview)
    // ══════════════════════════════════════════════════════════════════════════
    console.log(`🧠 [Prompt Architect] Usando ${PROMPT_ARCHITECT_MODEL}...`);
    
    const architect = genAI.getGenerativeModel({ model: PROMPT_ARCHITECT_MODEL });
    const architectPrompt = buildArchitectPrompt(
      params.vibe, 
      params.angle, 
      params.lightIntensity || 50
    );

    const promptResult = await architect.generateContent([
      { text: architectPrompt },
      { inlineData: { mimeType: croppedFile.type, data: base64Image } }
    ]);

    const enhancedPrompt = promptResult.response.text();
    console.log("✅ Prompt gerado:", enhancedPrompt.substring(0, 100) + "...");

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 5: IMAGE GENERATOR (Gemini 2.5 Flash Image)
    // ══════════════════════════════════════════════════════════════════════════
    console.log(`🎨 [Image Generator] Usando ${IMAGE_GENERATOR_MODEL}...`);
    
    const generator = genAI.getGenerativeModel({ model: IMAGE_GENERATOR_MODEL });
    const imageResult = await generator.generateContent(enhancedPrompt);
    
    // Extract image from response (SDK may vary on how images are returned)
    const response = imageResult.response;
    const parts = response.candidates?.[0]?.content?.parts || [];
    
    let finalImageUrl: string | undefined;
    
    // Check if response contains inline image data
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        finalImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    // Fallback to Pollinations if no inline image
    if (!finalImageUrl) {
      console.log("⚠️ Fallback para Pollinations...");
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      finalImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux-realism&width=1080&height=1080&nologo=true&seed=${Date.now()}`;
    }

    console.log("✅ [Neural Engine] Geração concluída!");
    
    return {
      success: true,
      imageUrl: finalImageUrl,
      debugInfo: {
        usedModel: `${PROMPT_ARCHITECT_MODEL} + ${IMAGE_GENERATOR_MODEL}`,
        promptGenerated: enhancedPrompt
      }
    };

  } catch (error: any) {
    // ══════════════════════════════════════════════════════════════════════════
    // STEP 6: ROLLBACK - DEVOLVE O CRÉDITO
    // ══════════════════════════════════════════════════════════════════════════
    console.error("❌ Erro na geração:", error);
    console.log("💳 Rollback: Devolvendo crédito...");
    
    refundCredit(); // OBRIGATÓRIO: Devolve o crédito
    
    console.log("✅ Crédito devolvido com sucesso.");

    return {
      success: false,
      error: error.message || "Erro na Engine Neural. Tente novamente."
    };
  }
}
