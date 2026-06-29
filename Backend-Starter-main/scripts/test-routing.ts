import dotenv from "dotenv";
import { AIService } from "../src/services/ai.service.js";

dotenv.config();

async function test() {
    console.log("Testing Intent Classification...");
    
    const queries = [
        "5 years of experience in React and Node",
        "Looking for a proactive leader who has scaled distributed systems",
        "Java backend developer",
        "Someone who builds great UIs and is a good communicator"
    ];

    for (const q of queries) {
        console.log(`\nQuery: "${q}"`);
        const result = await AIService.classifySearchIntent(q);
        console.log(JSON.stringify(result, null, 2));
    }
}
test();
