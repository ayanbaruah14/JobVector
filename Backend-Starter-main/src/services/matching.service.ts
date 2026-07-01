import Job, { type IJob } from "../models/job.model.js";
import { type IUser } from "../models/user.model.js";
import { PineconeService } from "./pinecone.service.js";
import { AIService } from "./ai.service.js";
import { BM25 } from "./bm25.service.js";

export const findMatches = async (user: IUser): Promise<IJob[]> => {
    // 1. If user doesn't have an embedding, fallback to basic MongoDB query
    if (!user.embedding || user.embedding.length === 0) {
        console.warn(`User ${user._id} has no embedding. Falling back to basic fetch.`);
        const fallbackJobs = await Job.find({ 
            _id: { $nin: user.appliedJobs }
        }).limit(10);
        return fallbackJobs;
    }

    // 2. Fetch all open jobs they haven't applied to yet
    const jobs = await Job.find({ _id: { $nin: user.appliedJobs } });
    if (jobs.length === 0) return [];

    let rankedJobs: any[] = jobs.map(j => j.toObject());

    // 3. Keyword Search Score (BM25)
    const corpus = rankedJobs.map(job => {
        const title = job.title || "";
        const desc = job.description || "";
        const skills = (job.requiredSkills || []).join(" ");
        return `${title} ${desc} ${skills}`;
    });
    
    const bm25 = new BM25(corpus);
    const userQuery = [
        ...(user.skills || []),
        user.professionalSummary || "",
        ...(user.preferredRoles || [])
    ].join(" ");
    
    const bm25Scores = bm25.search(userQuery);
    const maxBm25 = Math.max(...bm25Scores, 0.0001); // Avoid division by zero
    
    rankedJobs = rankedJobs.map((job, index) => {
        const keywordScore = bm25Scores[index] / maxBm25;
        return { ...job, keywordScore };
    });

    rankedJobs.sort((a, b) => b.keywordScore - a.keywordScore);
    rankedJobs.forEach((job, index) => { job.keywordRank = index + 1; });

    // 4. Vector Search Score
    const calculateCosineSimilarity = (vecA: number[], vecB: number[]) => {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        let dotProduct = 0, normA = 0, normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            const vA = vecA[i] || 0;
            const vB = vecB[i] || 0;
            dotProduct += vA * vB;
            normA += vA * vA;
            normB += vB * vB;
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    rankedJobs = rankedJobs.map(job => {
        const vectorScore = (job.embedding && job.embedding.length > 0) ? calculateCosineSimilarity(user.embedding!, job.embedding) : 0;
        return { ...job, vectorScore };
    });

    rankedJobs.sort((a, b) => b.vectorScore - a.vectorScore);
    rankedJobs.forEach((job, index) => { job.vectorRank = index + 1; });

    // 5. Hybrid RRF Score
    const k = 60;
    rankedJobs.forEach(job => {
        job.hybridRrfScore = (1 / (k + job.keywordRank)) + (1 / (k + job.vectorRank));
    });

    rankedJobs.sort((a, b) => b.hybridRrfScore - a.hybridRrfScore);
    
    // 6. Select Top 10 for LLM Reranking
    const top10Jobs = rankedJobs.slice(0, 10);

    console.log(`[Hybrid RAG] Re-ranking Top ${top10Jobs.length} jobs with Gemini...`);
    const reRankedJobs = await AIService.evaluateJobMatch(user, top10Jobs);

    // Return the final ranked jobs (LLM handles final sort and slice in the service, but let's ensure it here just in case)
    reRankedJobs.sort((a, b) => b.score - a.score);
    return reRankedJobs.slice(0, 10);
};
