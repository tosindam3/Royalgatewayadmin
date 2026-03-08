
import { GoogleGenAI, Type } from "@google/genai";

/**
 * PRODUCTION-GRADE GENAI SERVICE
 * Optimized for Gemini 3 Flash/Pro models.
 */

// Fixed: Corrected initialization to use import.meta.env for Vite compatibility
const getAI = () => {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY || (process as any).env.API_KEY;

  if (!apiKey || apiKey.includes('AQ.Ab8RN')) {
    console.warn("Gemini API Key missing or invalid. AI features will be limited.");
    return null;
  }

  return new GoogleGenAI({ apiKey });
};

// Internal standard configuration for RoyalgatewayAdmin platform
const HR_SYSTEM_INSTRUCTION = `
You are the RoyalgatewayAdmin Senior Management Consultant. 
Your tone is professional, strategic, and concise. 
Avoid jargon unless specifically relating to HR operations (e.g., OKRs, KPIs, retention, churn).
Always prioritize data-driven recommendations.
`;

export const suggestKeyResults = async (objectiveTitle: string) => {
  try {
    const ai = getAI();
    if (!ai) return [];
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Generate 3 measurable Key Results for the OKR objective: "${objectiveTitle}"`,
      config: {
        systemInstruction: HR_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              targetValue: { type: Type.NUMBER },
              unit: { type: Type.STRING }
            },
            required: ["description", "targetValue", "unit"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini KR Generation Error:", error);
    return [];
  }
};

export const generateFormTemplate = async (prompt: string) => {
  try {
    const ai = getAI();
    if (!ai) return null;
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Generate a performance evaluation form template based on this requirement: "${prompt}"`,
      config: {
        systemInstruction: HR_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            fields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: {
                    type: Type.STRING,
                    description: "One of: SHORT_TEXT, PARAGRAPH, MULTIPLE_CHOICE, CHECKBOXES, DROPDOWN, RATING, DATE, FILE, KPI"
                  },
                  label: { type: Type.STRING },
                  placeholder: { type: Type.STRING },
                  required: { type: Type.BOOLEAN },
                  weight: { type: Type.NUMBER },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["id", "type", "label", "required", "weight"]
              }
            }
          },
          required: ["title", "description", "fields"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Form Generation Error:", error);
    return null;
  }
};

export const generateHRAssistantResponse = async (prompt: string, context: string) => {
  try {
    const ai = getAI();
    if (!ai) return "AI Assistant unavailable (Invalid Key).";
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `CONTEXT: ${context}\nQUERY: ${prompt}`,
      config: {
        systemInstruction: HR_SYSTEM_INSTRUCTION,
        maxOutputTokens: 256,
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Assistant Error:", error);
    return null;
  }
};

export const summarizePerformance = async (kpis: any[]) => {
  try {
    const ai = getAI();
    if (!ai) return "AI Summary unavailable (Invalid Key).";

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Synthesize a 2-sentence performance summary for this dataset: ${JSON.stringify(kpis)}`,
      config: {
        systemInstruction: HR_SYSTEM_INSTRUCTION,
        temperature: 0.2
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Insufficient data for strategic synthesis.";
  }
};
