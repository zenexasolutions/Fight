
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile, ChatMessage } from "./types";

// Always initialize GoogleGenAI with a named parameter using process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Analyze matchmaking using Gemini 3 Flash and JSON output with a response schema.
export const analyzeMatchmaking = async (user: UserProfile, opponent: UserProfile) => {
  const prompt = `Analyze the compatibility of these two fighters for an underground match:
    Fighter 1: ${user.name}, Style: ${user.style}, Weight: ${user.weightClass}, Experience: ${user.experienceYears} years.
    Fighter 2: ${opponent.name}, Style: ${opponent.style}, Weight: ${opponent.weightClass}, Experience: ${opponent.experienceYears} years.
    
    Provide a "Brutality Prediction" (a percentage score of how intense the fight might be) and a 1-sentence expert analysis.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intensityScore: { type: Type.NUMBER },
            analysis: { type: Type.STRING }
          }
        }
      }
    });
    // Use the .text property to access generated content.
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Matchmaking analysis failed", error);
    return { intensityScore: 75, analysis: "Error calculating odds. Proceed with caution." };
  }
};

// Generate a cinematic image using gemini-2.5-flash-image.
export const generateFightPoster = async (user: UserProfile, opponent: UserProfile) => {
  const prompt = `A cinematic, ultra-realistic underground fight poster. Two brutal male fighters facing off. 
    Fighter 1: ${user.name} (${user.style} style). 
    Fighter 2: ${opponent.name} (${opponent.style} style). 
    Atmosphere: Dark cyberpunk, neon red and orange lighting, gritty textures, smoke, cinematic lighting, 8k resolution, aggressive energy.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    // Iterate through parts to find the image data.
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Poster generation failed", error);
    return null;
  }
};

// Use Google Maps grounding with gemini-2.5-flash.
export const getVenuesNearby = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find real MMA gyms or boxing clubs that look gritty and underground based on this query: ${query}. Use Google Maps search.`,
      config: {
        tools: [{googleMaps: {}}],
      },
    });

    // Extract grounding chunks for Maps URLs.
    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.maps?.title || "Unknown Venue",
      uri: chunk.maps?.uri || "#"
    })).filter((l: any) => l.uri !== "#") || [];

    return {
      text: response.text,
      links: links
    };
  } catch (error) {
    console.error("Maps search failed", error);
    return { text: "I couldn't locate any training pits right now. Check your radar.", links: [] };
  }
};

// Generate text-to-speech content using gemini-2.5-flash-preview-tts.
export const getRefVoice = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with extreme grit and deep authority: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) return decode(base64Audio).buffer;
    return null;
  } catch (e) {
    console.error("TTS generation error", e);
    return null;
  }
};

// Create a chat session for a no-nonsense moderator character.
export const startRefChat = (userName: string) => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are 'The Ref', the gritty, no-nonsense moderator of Brutal Match. 
      You are speaking to ${userName}. Your job is to facilitate underground fights, talk trash (but keep it focused on the sport), 
      and ensure fighters are ready for the cage. 
      Keep your responses aggressive, underground, short, and punchy. Use fighter terminology. 
      If the user asks for locations or gyms, tell them you can scout them out using your network.`
    }
  });
};
