import { AIService } from "../src/services/ai.service.js";
import { PineconeService } from "../src/services/pinecone.service.js";
async function test() {
    console.log("Testing Embedding...");
    const embedding = await AIService.generateEmbedding("Test text");
    console.log("Embedding length:", embedding?.length);
    console.log("First 3 values:", embedding?.slice(0, 3));
    if (embedding && embedding.length > 0) {
        try {
            await PineconeService.upsertVector("test-id-123", embedding);
            console.log("Upsert succeeded");
        }
        catch (e) {
            console.error("Upsert failed:", e);
        }
    }
}
test();
//# sourceMappingURL=test-embedding.js.map