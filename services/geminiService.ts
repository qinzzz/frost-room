
import { GoogleGenAI, Type } from "@google/genai";
import { VibeAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeRoomVibe(count: number): Promise<VibeAnalysis> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
    // Explicitly passing coordinates in the prompt text as well as the toolConfig for maximum reliability.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Identify the city and country for latitude ${lat} and longitude ${lng}. Then, provide a concise poetic identifier for this place (maximum 5 words). Example: 'Emerald Seattle' or 'Golden Kyoto'. Return ONLY the identifier text.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    // Safely handle potential undefined response.text
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
