import { GoogleGenerativeAI } from "@google/generative-ai";

// URGENTE: Substitua pela sua API KEY real se ainda não estiver configurada no .env
const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || "SUA_API_KEY_AQUI";

const genAI = new GoogleGenerativeAI(API_KEY);

// Configuração do Modelo de Inteligência Lógica (Texto/Dados)
// Usando o novo Gemini 3 Pro Preview conforme solicitado
export const logicModel = genAI.getGenerativeModel({ 
  model: "gemini-3-pro-preview",
  generationConfig: {
    temperature: 0.7, // Criatividade equilibrada
    topP: 0.8,
    topK: 40,
  }
});

// Função auxiliar para garantir JSON válido (útil para o cardápio)
export async function generateJSON(prompt: string, schema?: any) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3-pro-preview",
    generationConfig: { responseMimeType: "application/json" }
  });
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
