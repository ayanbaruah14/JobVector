import { AIService } from "./src/services/ai.service.js";
async function test() {
    const user = { skills: ["React"], experience: 2 };
    const job = { title: "Frontend", requiredSkills: ["React"], description: "test" };
    try {
        console.log("Testing Interview Prep...");
        const result = await AIService.generateInterviewPrep(user, job);
        console.log("Result:", result);
    }
    catch (e) {
        console.error("Test failed:", e);
    }
}
test();
//# sourceMappingURL=test-prep.js.map