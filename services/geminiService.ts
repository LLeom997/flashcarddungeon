import { GoogleGenAI, Type } from "@google/genai";
import { FlashcardData } from "../types";

export const generateFlashcardsFromTopic = async (topic: string): Promise<FlashcardData[]> => {
  // Initialize client lazily to prevent top-level crashes if process.env is not ready
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is not set. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create 10 study flashcards about "${topic}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING }
            },
            required: ["question", "answer"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");

    const rawCards = JSON.parse(jsonText);
    
    return rawCards.map((card: any, index: number) => ({
      id: `ai-${index}-${Date.now()}`,
      question: card.question,
      answer: card.answer
    }));

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};