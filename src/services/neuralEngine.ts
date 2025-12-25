/**
 * ⚡ EMPRATA NEURAL ENGINE™ v3.0 ⚡
 * Production-Ready AI Service with Extreme Fidelity & Commercial Quality
 * 
 * Updates:
 * - Smart crop to 1080x1080 (Delivery Apps standard)
 * - Optimized prompts for food identity preservation
 * - Performance improvements (gemini-1.5-flash, no enhance)
 * - Commercial photography keywords for realism
 */

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Optimized for speed: gemini-1.5-flash is faster than 2.5
const PREFERRED_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.5-flash-latest";

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
 * This ensures consistent output format for Delivery Apps
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
      // Calculate crop dimensions (center crop to square)
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;

      // Set canvas to target size
      canvas.width = targetSize;
      canvas.height = targetSize;

      // Draw cropped and resized image
      ctx.drawImage(
        img,
        x, y, size, size,  // Source crop
        0, 0, targetSize, targetSize  // Destination
      );

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(croppedFile);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/jpeg',
        0.95  // High quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Main Image Generation Function
 * Uses hybrid approach: Gemini for analysis → Pollinations for rendering
 */
export async function generateFoodImage(
  params: GenerateImageParams
): Promise<GenerateImageResponse> {
  console.log("🚀 [Emprata Neural Engine™ v3.0] Iniciando geração...");
  console.log("📊 Parâmetros:", { 
    vibe: params.vibe, 
    angle: params.angle, 
    lightIntensity: params.lightIntensity 
  });

  // 1. Validation
  if (!API_KEY) {
    console.error("❌ ERRO CRÍTICO: API Key não encontrada no .env");
    return { 
      success: false, 
      error: "Configuração de API ausente. Verifique a chave do Google AI." 
    };
  }

  try {
    // 2. Smart Crop to 1080x1080 (Delivery Apps standard)
    console.log("✂️ Processando imagem para formato quadrado 1080x1080...");
    const croppedFile = await resizeToSquare(params.file, 1080);
    console.log("✅ Imagem processada:", croppedFile.size, "bytes");

    // 3. Convert to base64
    console.log("📸 Convertendo para base64...");
    const base64Image = await fileToBase64(croppedFile);
    
    // 4. Generate technical prompt using Gemini Vision
    console.log("🧠 Analisando imagem com Gemini Vision (Fidelity Mode)...");
    const analysisPrompt = await analyzeImageWithGemini(
      base64Image, 
      croppedFile.type,
      params.vibe,
      params.angle,
      params.lightIntensity || 50
    );

    if (!analysisPrompt) {
      return {
        success: false,
        error: "Falha na análise da imagem. Tente novamente."
      };
    }

    console.log("✅ Prompt gerado (Fidelity Mode):", analysisPrompt.substring(0, 150) + "...");

    // 5. Generate final image using Pollinations (Flux Model)
    console.log("🎨 Gerando imagem final com Pollinations (1080x1080)...");
    const finalImageUrl = await generateWithPollinations(analysisPrompt);

    console.log("✅ [Emprata Neural Engine™] Geração concluída com sucesso!");
    
    return {
      success: true,
      imageUrl: finalImageUrl,
      debugInfo: {
        usedModel: "Gemini 1.5 Flash + Pollinations Flux",
        promptGenerated: analysisPrompt
      }
    };

  } catch (error: any) {
    console.error("❌ [Neural Engine Error]:", error);
    return {
      success: false,
      error: error.message || "Erro desconhecido na Engine Neural."
    };
  }
}

/**
 * Step 1: Analyze image with Gemini Vision and generate technical prompt
 * Optimized for EXTREME FIDELITY and commercial realism
 */
async function analyzeImageWithGemini(
  base64Image: string,
  mimeType: string,
  vibe: string,
  angle: string,
  lightIntensity: number
): Promise<string | null> {
  
  // Build optimized system prompt for fidelity
  const systemPrompt = buildFidelityPrompt(vibe, angle, lightIntensity);

  // Try preferred model first (1.5-flash for speed)
  try {
    console.log(`🔄 Usando modelo otimizado: ${PREFERRED_MODEL}...`);
    const result = await callGeminiAPI(PREFERRED_MODEL, systemPrompt, base64Image, mimeType);
    if (result) return result;
  } catch (error: any) {
    console.warn(`⚠️ Modelo ${PREFERRED_MODEL} falhou, tentando fallback...`);
  }

  // Fallback
  try {
    console.log(`🔄 Usando fallback: ${FALLBACK_MODEL}...`);
    const result = await callGeminiAPI(FALLBACK_MODEL, systemPrompt, base64Image, mimeType);
    if (result) return result;
  } catch (error: any) {
    console.error(`❌ Fallback também falhou: ${error.message}`);
  }

  return null;
}

/**
 * Call Google Gemini API
 */
async function callGeminiAPI(
  modelName: string,
  prompt: string,
  base64Image: string,
  mimeType: string
): Promise<string | null> {
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Google API Error (${response.status}):`, errorText);
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!resultText) {
    throw new Error("Resposta vazia da API");
  }

  return resultText.trim();
}

/**
 * Build ULTRA-REALISTIC 8K prompt for cinematic commercial quality
 * Optimized for FLUX.1 with extreme detail and photorealism
 */
function buildFidelityPrompt(vibe: string, angle: string, lightIntensity: number): string {
  // Vibe-specific surface descriptions
  const vibeContext: Record<string, string> = {
    rustico: "rustic wooden table with natural wood grain texture and warm earthy tones",
    gourmet: "pristine white marble surface with subtle veining, luxury minimalist aesthetic",
    dark: "dark matte black surface with moody cinematic atmosphere and deep shadows",
    domingo: "bright white surface bathed in natural morning sunlight, fresh and cheerful ambiance",
    marble: "luxurious black onyx marble with golden veining, high-end restaurant presentation",
    neon: "reflective dark surface with vibrant neon accent lighting in background, futuristic urban vibe"
  };

  // Angle-specific camera direction (Professional Photography Terms)
  const angleContext: Record<string, string> = {
    top: "Knolling photography, 90-degree top down view, shot from directly above in bird's eye view, geometric composition, flat lay style",
    diagonal: "45-degree angle, diner's perspective, shallow depth of field, inviting composition, shot at three-quarter view with professional dynamic framing",
    front: "Eye-level shot, straight on angle, imposing scale, macro details, shot from front view at table level with hero perspective",
    macro: "Macro lens 100mm, extreme close-up, texture focus, bokeh background, intimate detail shot with f/2.8 shallow depth of field"
  };

  // Lighting setup based on intensity
  const lightingContext = lightIntensity > 70 
    ? "bright professional studio lighting with multiple softboxes, high key photography, perfectly lit with rim lighting, volumetric light rays"
    : lightIntensity > 40
    ? "balanced natural studio lighting with soft diffused light, professional three-point lighting setup with key light, fill light, and rim light for separation"
    : "low key dramatic lighting with single key light, deep shadows for mood, intimate cinematic atmosphere with subtle rim light";

  return `You are a world-class Commercial Food Photographer and Prompt Engineer specializing in 8K ultra-realistic imagery with EXTREME MICRO-DETAIL FIDELITY.

STEP 1: ANALYZE & IDENTIFY
Look at the food in the image. What is it specifically? Be extremely precise.
Examples:
- NOT "burger" → "Gourmet double smash burger with brioche bun and melted aged cheddar"
- NOT "sushi" → "Fresh salmon nigiri with wasabi and pickled ginger"
- NOT "açaí" → "Açaí bowl topped with granola, sliced banana, and honey drizzle"

STEP 2: CREATE A PHOTOREALISTIC PROMPT (FLUX RAW MODE)
Generate a highly detailed, technical prompt for an AI image generator that will produce cinema-grade commercial food photography with IMPERCEPTIBLE IMPERFECTIONS for ultimate realism.

MANDATORY QUALITY KEYWORDS (Include ALL):
- "8k resolution"
- "photorealistic"
- "hyper-realistic"
- "cinematic food photography"
- "commercial advertising quality"
- "macro lens details"
- "insane detail"
- "octane render"
- "raytracing"
- "professional food styling"
- "RAW unedited photography"
- "natural imperfections"
- "tactile textures"

TECHNICAL SETUP:
- Camera: "Shot on Fujifilm GFX 100 medium format camera with 100mm macro lens"
- Aperture: "f/2.8 for shallow depth of field"
- Focus: "Tack sharp focus on main subject with beautiful bokeh background blur"

LIGHTING (CRITICAL):
- ${lightingContext}
- "Soft shadows for dimension and depth"
- "Highlight specular reflections on wet/glossy surfaces"
- "Micro-reflections showing light source in sauces and liquids"
- Add "volumetric steam rising" or "cold mist effect" if applicable to the food

COMPOSITION:
- ${angleContext[angle] || angleContext.diagonal}
- "Center frame composition with rule of thirds"
- "Square 1:1 aspect ratio"
- "Professional food styling and plating"

BACKGROUND & CONTEXT:
- Place on: ${vibeContext[vibe] || vibeContext.rustico}
- "Blurred background with shallow depth of field"
- "Professional studio environment"

EXTREME MICRO-DETAIL REALISM (CRITICAL FOR AUTHENTICITY):
Add these imperceptible imperfections and tactile details that make food look REAL, not AI-generated:

Universal Details:
- "Tiny air bubbles trapped in sauces and liquids"
- "Microscopic condensation droplets on cold surfaces"
- "Natural color variations and gradients within ingredients"
- "Subtle fingerprints or handling marks on plates (barely visible)"
- "Tiny herb fragments or seasoning particles scattered naturally"
- "Slight asymmetry in plating (nothing is perfectly centered in real life)"
- "Micro-scratches on plates from use"
- "Natural shadows cast by garnishes"

TEXTURE DETAILS (Be Specific):
Describe the appetizing micro-details that make food look irresistible:

- If BURGER: "melting cheese with glossy sheen dripping over edges, charred grill marks on beef patty with caramelized crust, sesame seeds on toasted bun with golden brown spots, fresh lettuce with water droplets and natural leaf veins visible, pickles with brine sheen, ketchup with slight separation showing oil, tiny steam wisps rising from hot patty"

- If AÇAÍ: "frosty purple açaí with ice crystals visible on surface, crunchy granola texture with individual oat pieces, fresh fruit with natural sheen and tiny imperfections in skin, condensation on bowl exterior, drizzle patterns showing honey viscosity, tiny air pockets in açaí texture"

- If SUSHI: "glistening fresh fish with natural oil sheen and translucent edges, perfectly shaped rice grains with slight stickiness visible, wasabi paste texture with fibrous details, soy sauce reflection showing light source, pickled ginger with natural color variations, tiny sesame seeds with individual detail"

- If PIZZA: "stretchy melted mozzarella with cheese pull showing stringy texture, bubbled crispy crust with char spots and flour dusting, fresh basil leaves with natural oil glands visible, tomato sauce texture with herb flecks, slight grease sheen on pepperoni, steam rising from hot cheese"

- If PASTA: "al dente pasta with sauce coating each strand showing viscosity, parmesan shavings with irregular edges and natural aging spots, herb garnish with water droplets, steam rising with visible heat distortion, olive oil pooling with rainbow sheen, tiny black pepper specks"

- If STEAK: "charred exterior with Maillard reaction crust, pink medium-rare interior with visible meat fibers and marbling, juice pooling on plate with fat globules, grill marks with caramelized edges, herb butter melting with visible dairy fat separation, salt crystals catching light"

- If DESSERT: "powdered sugar with slight clumping and uneven distribution, chocolate ganache with mirror-like gloss and tiny air bubbles, fresh berries with natural bloom and tiny seeds visible, cream with soft peaks showing dairy texture, caramel with viscous drip patterns"

STYLE KEYWORDS:
- "Magazine cover worthy"
- "Michelin star presentation"
- "Appetizing and mouth-watering"
- "Natural food colors enhanced but not oversaturated"
- "Professional color grading with film-like quality"
- "Authentic restaurant photography"
- "Imperfectly perfect plating"

OUTPUT FORMAT:
Return ONLY the complete prompt as a single detailed paragraph. No explanations, no markdown, no extra text. Just the raw prompt.

Example output structure:
"Professional commercial food photography of [SPECIFIC FOOD ITEM with detailed description], [EXTREME TEXTURE DETAILS with imperfections], placed on [BACKGROUND], [CAMERA ANGLE], shot on Fujifilm GFX 100 with 100mm macro lens at f/2.8, [LIGHTING DESCRIPTION with specular highlights], shallow depth of field with tack sharp focus, [MICRO-DETAIL IMPERFECTIONS], 8k resolution, photorealistic, hyper-realistic, RAW unedited photography, cinematic quality, commercial advertising grade, macro lens details showing [SPECIFIC MICRO-DETAILS], insane detail, tactile textures, natural imperfections, octane render, raytracing, professional food styling, magazine cover worthy, Michelin star presentation, appetizing and mouth-watering, authentic restaurant photography"`;
}

/**
 * Step 2: Generate final image using Pollinations.ai (Flux Model)
 * Optimized for speed and quality with forced 1080x1080 output
 */
async function generateWithPollinations(prompt: string): Promise<string> {
  // Encode prompt for URL
  const encodedPrompt = encodeURIComponent(prompt);
  
  // Optimized Pollinations URL:
  // - flux-realism model (best for food)
  // - 1080x1080 (Delivery Apps standard)
  // - nologo=true (clean output)
  // - enhance=false (faster, less artificial)
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux-realism&width=1080&height=1080&nologo=true&enhance=false&seed=${Date.now()}`;
  
  console.log("🎨 URL da imagem gerada (1080x1080):", imageUrl);
  
  return imageUrl;
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
      const base64 = result.split(",")[1]; // Remove data:image/jpeg;base64, prefix
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}
