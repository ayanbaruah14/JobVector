import mongoose from "mongoose";
import dotenv from "dotenv";
import Job from "../src/models/job.model.js";
import { AIService } from "../src/services/ai.service.js";
import { PineconeService } from "../src/services/pinecone.service.js";
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hackathon";
const syncJobs = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB Connected for Job Sync");
        const jobs = await Job.find({});
        console.log(`Found ${jobs.length} jobs. Syncing to Pinecone...`);
        let synced = 0;
        for (const job of jobs) {
            const jobText = `Title: ${job.title}. Skills: ${(job.requiredSkills || []).join(", ")}. Description: ${job.description}`;
            const embedding = await AIService.generateEmbedding(jobText);
            if (embedding && embedding.length > 0) {
                await PineconeService.upsertVector(job._id.toString(), embedding, { type: "job" });
                synced++;
                console.log(`Synced Job: ${job.title}`);
            }
            else {
                console.warn(`Failed to generate embedding for ${job.title}`);
            }
        }
        console.log(`Successfully synced ${synced}/${jobs.length} jobs to Pinecone.`);
        process.exit(0);
    }
    catch (err) {
        console.error("Job Sync Error:", err);
        process.exit(1);
    }
};
syncJobs();
//# sourceMappingURL=sync-jobs.js.map