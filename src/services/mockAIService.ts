/**
 * Mock AI Service to simulate food photo transformation
 */

export type FoodVibe = 'rustico' | 'gourmet' | 'dark' | 'domingo';

export interface GenerationResult {
  imageUrl: string;
  success: boolean;
}

export const mockAIService = async (image: File, vibe: FoodVibe): Promise<GenerationResult> => {
  console.log(`Processing image with vibe: ${vibe}`, image.name);
  
  // Simulated processing delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  // In a real scenario, we would use Google Vertex AI or another API
  // Commented Vertex AI implementation placeholder:
  /*
  const API_KEY = "YOUR_GOOGLE_AI_API_KEY";
  const response = await fetch("https://generativelanguage.googleapis.comv1beta/models/gemini-1.5-pro:generateContent?key=" + API_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: `Transform this food photo using a ${vibe} aesthetic. Make it look professional and appetizing...` },
          { inline_data: { mime_type: image.type, data: await fileToBase64(image) } }
        ]
      }]
    })
  });
  */

  // Map vibes to high-quality food placeholders
  const vibeToImageMap: Record<FoodVibe, string> = {
    rustico: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1200&auto=format&fit=crop",
    gourmet: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
    dark: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop",
    domingo: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?q=80&w=1200&auto=format&fit=crop"
  };

  return {
    imageUrl: vibeToImageMap[vibe] || vibeToImageMap.rustico,
    success: true
  };
};

// Helper inside source for potential future use
// const fileToBase64 = (file: File): Promise<string> => { ... }
