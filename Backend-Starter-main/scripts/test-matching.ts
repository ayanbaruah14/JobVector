import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/user.model.js";
import { findMatches } from "../src/services/matching.service.js";
import { PineconeService } from "../src/services/pinecone.service.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hackathon";

const testMatching = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB Connected");

        // Find a user, any user
        const user = await User.findOne({});
        if (!user) {
            console.log("No users found in DB!");
            process.exit(0);
        }

        console.log(`Testing with user: ${user.name} (${user._id})`);
        console.log(`User has embedding: ${!!user.embedding && user.embedding.length > 0}`);

        if (user.embedding && user.embedding.length > 0) {
            console.log("Testing Pinecone search directly...");
            const pineconeRes = await PineconeService.searchVectors(user.embedding, 15, { type: { $eq: "job" } });
            console.log("Raw Pinecone Search Results:", pineconeRes);
        }

        console.log("\nCalling findMatches...");
        const matches = await findMatches(user);
        
        console.log(`Found ${matches.length} matches.`);
        if (matches.length > 0) {
            console.log("Top Match:", matches[0].title);
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

testMatching();
