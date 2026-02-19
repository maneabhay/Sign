
import { GoogleGenAI } from "@google/genai";
import { Language, LanguageNames } from "../types";

/**
 * Helper to get a fresh AI instance.
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Evaluate user's practice gesture against a target.
 * Instructions: Be extremely lenient! If it's roughly similar, approve it.
 */
export const evaluatePractice = async (imageBase64: string, targetSign: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: `The user is practicing the ASL sign for "${targetSign}". 
                   CRITICAL RULE: We are teaching beginners. Be extremely lenient and encouraging. 
                   If the hand shape or position is even slightly similar to the correct sign, mark "correct": true.
                   "Close enough" is "Correct". Do not be strict about perfect finger placement.
                   
                   Respond ONLY in JSON: 
                   {
                     "correct": boolean, 
                     "feedback": "A very positive, encouraging message.",
                     "isSimilar": boolean
                   }` }
        ]
      },
      config: { 
        responseMimeType: "application/json",
        temperature: 0.9 
      }
    });

    const result = JSON.parse(response.text || '{"correct": false, "feedback": "Nice try! Let\'s try one more time.", "isSimilar": false}');
    if (result.isSimilar) result.correct = true;
    
    return result;
  } catch (error) {
    console.error("Evaluation error:", error);
    return { correct: false, feedback: "You're doing great! Try to position your hand clearly in the light.", isSimilar: false };
  }
};

/**
 * Describe sign briefly with hand positions.
 */
export const describeSignStream = async (text: string, language: Language, onChunk: (text: string) => void) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: `Explain briefly (max 12 words) how to sign the ${LanguageNames[language]} phrase '${text}' in ASL. Focus on hand positions.`,
    });

    for await (const chunk of response) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Describe stream error:", error);
  }
};

/**
 * Generate a 3D style image of a sign.
 */
export const generateSignImage = async (text: string, language: Language) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A professional 3D animated character on a clean white background performing the ASL sign for: "${text}". High contrast, clear hand visibility.` }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};

/**
 * Generate a high-quality video of a sign using Veo.
 */
export const generateSignVideo = async (text: string, language: Language) => {
  try {
    const ai = getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `High-quality 3D character in a bright studio performing the ASL sign for: "${text}". Smooth, professional animation.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    let pollCount = 0;
    while (!operation.done && pollCount < 40) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      pollCount++;
    }

    if (!operation.done) throw new Error("Video generation timed out.");

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (error: any) {
    console.error("Video generation error:", error);
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_REQUIRED");
    }
    throw error;
  }
};

/**
 * Recognize an ASL gesture or sentence from one or more images.
 */
export const recognizeGesture = async (imagesBase64: string | string[], language: Language) => {
  try {
    const ai = getAI();
    const images = Array.isArray(imagesBase64) ? imagesBase64 : [imagesBase64];
    
    const parts = images.map(data => ({
      inlineData: { mimeType: 'image/jpeg', data }
    }));

    parts.push({
      text: `Analyze the American Sign Language (ASL) gesture(s) in these image(s). 
             ${images.length > 1 ? "This is a sequence of frames from a recording." : "This is a single snapshot."}
             Identify the intent and translate it into a natural, complete sentence in ${LanguageNames[language]}. 
             Return only the translated sentence text.`
    } as any);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
    });

    return response.text?.trim() || "No gesture detected.";
  } catch (error) {
    console.error("Recognition error:", error);
    return "Could not translate. Please try again.";
  }
};

export const testBackend = async () => {
  const res = await fetch(
    "https://abhaymane.pythonanywhere.com/api/test"
  );
  return res.json();
};

