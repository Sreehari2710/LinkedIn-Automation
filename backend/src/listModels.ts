import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: 'c:/Users/User/Desktop/Web D\Linkedin Automation/backend/.env' });

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;

    try {
        const res = await fetch(url);
        const data: any = await res.json();
        fs.writeFileSync('gemini_models_list.json', JSON.stringify(data, null, 2));
        console.log("Models list written to gemini_models_list.json");
    } catch (e: any) {
        console.error("Error listing models:", e.message);
    }
}

listModels();
