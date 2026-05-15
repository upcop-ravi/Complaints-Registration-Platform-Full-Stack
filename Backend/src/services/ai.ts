import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateFollowUpQuestion = async (complaintText: string): Promise<string> => {
  const prompt = `You are an AI assistant for a complaint registration portal. A user has submitted the following complaint: "${complaintText}". Ask exactly one short, relevant follow-up question to gather more useful information about this complaint. Do not provide any introduction or explanation, just the question.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });
    return response.text || 'Could you please provide more details?';
  } catch (error) {
    console.error('Error generating AI question:', error);
    return 'Could you please provide more details?';
  }
};
