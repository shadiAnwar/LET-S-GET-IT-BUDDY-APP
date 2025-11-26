import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTaskBreakdown = async (taskTitle: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Break down the following task into 3 to 5 smaller, actionable sub-tasks. Keep them concise. Task: "${taskTitle}"`,
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