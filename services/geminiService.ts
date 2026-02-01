
import { GoogleGenAI, Type } from "@google/genai";
import { VibeAnalysis } from "../types";

const getAI = () => {
  const apiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY) || (process.env?.GEMINI_API_KEY);
  if (!apiKey) {
    console.warn("Gemini API key not found. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const ai = getAI();

export async function analyzeRoomVibe(count: number): Promise<VibeAnalysis> {
  try {
    if (!ai) throw new Error("AI not initialized");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Current room status: ${count} users present in a frosted glass digital lounge. Provide a poetic 1-sentence analysis of the mood and one suggested action.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
              description: "A poetic one-sentence description of the current room vibe.",
            },
            suggestedAction: {
              type: Type.STRING,
              description: "A small interaction for the user to try.",
            },
            energyLevel: {
              type: Type.NUMBER,
              description: "A value between 0 and 100 representing the vibe intensity.",
            },
          },
          required: ["message", "suggestedAction", "energyLevel"],
        },
      },
    });

    console.log("Gemini Room Vibe Response:", response);
    const text = response.text;
    if (!text) return {
      message: "A quiet hum of digital existence fills the space.",
      suggestedAction: "Watch the shadows dance.",
      energyLevel: 10,
    };

    return JSON.parse(text.trim()) as VibeAnalysis;
  } catch (error) {
    console.error("Gemini Vibe Error:", error);
    return {
      message: "A quiet hum of digital existence fills the space.",
      suggestedAction: "Watch the shadows dance.",
      energyLevel: 10,
    };
  }
}

export async function getPoeticLocation(lat: number, lng: number): Promise<string> {
  try {
    if (!ai) throw new Error("AI not initialized");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Identify the city and country for latitude ${lat} and longitude ${lng}. Then, provide a concise poetic identifier for this place (maximum 5 words). Example: 'Emerald Seattle' or 'Golden Kyoto'. Return ONLY the identifier text.`,
    });

    console.log("Gemini Location Response:", response);
    const generatedText = response.text;
    if (generatedText) {
      return generatedText.trim();
    }

    return "Common Ground";
  } catch (error) {
    console.error("Location Service Error:", error);
    return "Somewhere Together";
  }
}
