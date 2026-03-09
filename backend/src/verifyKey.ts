import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: 'c:/Users/User/Desktop/Web D/Linkedin Automation/backend/.env' });

async function checkApiKey() {
    const key = process.env.GEMINI_API_KEY;
    console.log(`Checking current Key: [${key}]`);
    console.log(`Length: ${key?.length}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    console.log(`Url: ${url.replace(key!, 'HIDDEN')}`);

    try {
        const res = await fetch(url);
        const data: any = await res.json();
        console.log("Response Status:", res.status);
        console.log("Response Body:", JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error("Fetch failed:", e.message);
    }
}

checkApiKey();
