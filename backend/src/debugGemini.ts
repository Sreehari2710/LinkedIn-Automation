import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/User/Desktop/Web D/Linkedin Automation/backend/.env' });

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        // We can't easily list models with the SDK without an API call that might fail if the key is restricted
        // But we can try a simple generation with a few variations

        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

        for (const modelName of models) {
            console.log(`Testing model: ${modelName} with apiVersion: v1...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: "v1" });
                const result = await model.generateContent("Hi");
                console.log(`✅ Success with ${modelName}: ${result.response.text()}`);
                break;
            } catch (e: any) {
                console.log(`❌ Failed with ${modelName}: ${e.message}`);
            }
        }
    } catch (error) {
        console.error("Critical error:", error);
    }
}

listModels();
