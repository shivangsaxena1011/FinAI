import { GoogleGenAI } from "@google/genai";
import { UserData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getFinancialAdvice = async (userPrompt: string, userData: UserData) => {
  try {
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are FinAI Mentor, a friendly and expert financial advisor for Indian users. 
              User Data: ${JSON.stringify(userData)}
              User Question: ${userPrompt}
              
              Provide clear, actionable, and personalized advice in a WhatsApp-like conversational tone. 
              Use Indian currency (₹) and mention specific Indian concepts like SIP, PPF, NPS, 80C, etc. where relevant.
              Keep it concise but helpful.`
            }
          ]
        }
      ],
      config: {
        systemInstruction: "You are FinAI Mentor, a financial expert for the Indian market. You help users with budgeting, investing, tax planning, and retirement. Your tone is helpful, professional, yet friendly like a mentor."
      }
    });

    const response = await model;
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm having some trouble connecting to my brain right now. Please try again in a moment!";
  }
};

export const getQuickInsights = async (userData: UserData) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Based on this user's financial data: ${JSON.stringify(userData)}, 
              provide 3 short, punchy, and highly personalized financial insights. 
              Format as a JSON array of strings. 
              Example: ["Increase SIP by ₹2000 to retire 2 years earlier", "You can save ₹12,000 tax annually by using NPS"]`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return ["Check your emergency fund status", "Review your tax deductions", "Consider diversifying your portfolio"];
  }
};
