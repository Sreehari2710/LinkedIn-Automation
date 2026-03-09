import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: 'c:/Users/User/Desktop/Web D/Linkedin Automation/backend/.env' });

async function listExactModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
    try {
        const res = await fetch(url);
        const data: any = await res.json();
        fs.writeFileSync('available_models.json', JSON.stringify(data, null, 2));
        console.log("Check available_models.json");
    } catch (e: any) {
        console.error("Failed:", e.message);
    }
}

listExactModels();
