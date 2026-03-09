import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: 'c:/Users/User/Desktop/Web D/Linkedin Automation/backend/.env' });

async function testFetch() {
    const key = process.env.GEMINI_API_KEY;
    let log = `Using Key ending in: ...${key?.slice(-5)}\n`;

    const versions = ['v1', 'v1beta'];
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

    for (const v of versions) {
        for (const m of models) {
            const url = `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent?key=${key}`;
            log += `Testing URL: ${url.replace(key!, 'HIDDEN')}\n`;
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
                });
                const data: any = await res.json();
                if (res.ok) {
                    log += `✅ Success with ${v}/${m}\n`;
                } else {
                    log += `❌ Failed with ${v}/${m}: ${data.error?.status} - ${data.error?.message}\n`;
                }
            } catch (e: any) {
                log += `❌ Error with ${v}/${m}: ${e.message}\n`;
            }
        }
    }
    fs.writeFileSync('gemini_debug_results.log', log);
    console.log("Results written to gemini_debug_results.log");
}

testFetch();
