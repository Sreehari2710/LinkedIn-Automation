import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();


export interface LeadQualityResult {
    qualityScore: number;
    qualityReason: string;
    isQualified: boolean;
}

// Model fallback chain - Updated to match models available to your key
const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

export const analyzeLead = async (description: string, authorHeadline: string, targetKeyword: string): Promise<LeadQualityResult> => {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`System: Analysis trigger. API Key starts with: ${apiKey?.substring(0, 4)}...`);

    if (!apiKey) {
        console.error("Critical: GEMINI_API_KEY is missing in environment variables!");
    }

    const genAI = new GoogleGenerativeAI(apiKey || "");
    let lastError: any = null;

    for (const modelName of MODELS) {
        try {
            console.log(`Attempting analysis with model: ${modelName}`);
            // Let the SDK handle the default API version (or use v1beta for newest models)
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `
                Analyze the following LinkedIn post and author headline to determine if this is a high-quality lead specifically for the keyword: "${targetKeyword}".
                
                Author Headline: ${authorHeadline}
                Post Content: ${description}
                
                Evaluate based on:
                1. How relevant is the post/author to "${targetKeyword}"?
                2. Professional standing of the author (e.g., decision-maker, expert).
                3. Relevance of the post content to business growth, hiring, or industry trends in the "${targetKeyword}" space.
                4. Tone and clarity.
                
                Return ONLY a JSON object with the following structure:
                {
                    "qualityScore": (number from 0 to 100),
                    "qualityReason": (brief string explaining why it's good or bad for "${targetKeyword}"),
                    "isQualified": (boolean, true if score >= 70)
                }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                console.log(`✅ Analysis successful with model: ${modelName}`);
                return JSON.parse(jsonMatch[0]) as LeadQualityResult;
            }
            throw new Error("Failed to parse JSON from Gemini response");

        } catch (error: any) {
            lastError = error;
            console.error(`❌ Model ${modelName} failed:`, error.message);
            // Continue to next model in chain
        }
    }

    console.error("All Gemini models failed. Last error details:", lastError);
    return {
        qualityScore: 0,
        qualityReason: `Error during analysis: ${lastError?.message || 'Unknown error'}`,
        isQualified: false
    };
};
