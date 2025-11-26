
import { GoogleGenAI, Type } from "@google/genai";

// Safely retrieve API Key, defaulting to empty string if process is undefined (browser env)
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';

const ai = new GoogleGenAI({ apiKey });

const LANGUAGE_MAP: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'ar': 'Arabic',
  'sv': 'Swedish',
  'pt': 'Portuguese'
};

export const generateTaskBreakdown = async (taskTitle: string, languageCode: string = 'en'): Promise<string[]> => {
  if (!apiKey) {
    console.warn("API Key is missing. AI features will not work.");
    return [];
  }

  const languageName = LANGUAGE_MAP[languageCode] || 'English';
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Break down the following task into 3 to 5 smaller, actionable sub-tasks. The output must be in ${languageName} language. Keep them concise. Task: "${taskTitle}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const subtasks = JSON.parse(jsonText) as string[];
    return subtasks;
  } catch (error) {
    console.error("Error generating subtasks:", error);
    return [];
  }
};
