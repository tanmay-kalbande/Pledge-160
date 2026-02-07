import { GoogleGenAI, Type } from "@google/genai";
import { MotivationResponse } from "../types";

const apiKey = process.env.API_KEY;

export const getDailyMotivation = async (day: number, mood: string): Promise<MotivationResponse> => {
  if (!apiKey) {
    // Fallback if no API key provided
    return {
      quote: "Discipline is doing what needs to be done, even if you don't want to do it.",
      author: "Unknown"
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      We are two friends on a 160-day challenge to quit a bad habit (NoFap/Semen Retention/Dopamine Detox).
      We are currently on Day ${day}. 
      The current mood is: ${mood}.
      
      Generate a short, powerful, stoic, or scientific motivational quote to keep us focused. 
      Do not be preachy. Be like a strict but caring mentor.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING },
            author: { type: Type.STRING }
          },
          required: ['quote', 'author']
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as MotivationResponse;
    }
    
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      quote: "The only easy day was yesterday.",
      author: "Navy SEALs"
    };
  }
};
