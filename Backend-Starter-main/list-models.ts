import dotenv from "dotenv";
dotenv.config();
async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log(JSON.stringify(data.models.map((m: any) => m.name), null, 2));
    } catch (e) {
        console.error(e);
    }
}
listModels();
