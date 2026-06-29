import mongoose from "mongoose";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import User from "../src/models/user.model.js";
import { AIService } from "../src/services/ai.service.js";
import { PineconeService } from "../src/services/pinecone.service.js";
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hackathon";
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "trivalent-rag";
const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
const syncPinecone = async () => {
    try {
        console.log("Checking Pinecone Index...");
        const existingIndexes = (await pc.listIndexes()).indexes;
        const indexExists = existingIndexes?.find((idx) => idx.name === PINECONE_INDEX_NAME);
        if (!indexExists) {
            console.log(`Creating Pinecone index '${PINECONE_INDEX_NAME}'... (This takes about a minute)`);
            await pc.createIndex({
                name: PINECONE_INDEX_NAME,
                dimension: 3072, // gemini-embedding-2 creates 3072 dimension vectors
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
            console.log("Pinecone index created!");
            // Wait for index to be fully initialized
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB Connected for Pinecone Sync");
        const users = await User.find({});
        console.log(`Found ${users.length} users. Syncing to Pinecone...`);
        let synced = 0;
        for (const user of users) {
            const textToEmbed = `Skills: ${(user.skills || []).join(", ")}. Experience: ${user.experience} years.`;
            const embedding = await AIService.generateEmbedding(textToEmbed);
            if (embedding && embedding.length > 0) {
                user.embedding = embedding;
                await user.save();
                await PineconeService.upsertVector(user._id.toString(), embedding);
                synced++;
                console.log(`Synced ${user.name}`);
            }
            else {
                console.warn(`Failed to generate embedding for ${user.name}`);
            }
        }
        console.log(`Successfully synced ${synced}/${users.length} users to Pinecone.`);
        process.exit(0);
    }
    catch (err) {
        console.error("Sync Error:", err);
        process.exit(1);
    }
};
syncPinecone();
//# sourceMappingURL=sync-pinecone.js.map