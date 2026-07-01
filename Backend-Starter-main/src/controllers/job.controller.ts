import { Request, Response } from "express";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import { findMatches } from "../services/matching.service.js";
import mongoose from "mongoose";
import { AIService } from "../services/ai.service.js";
import { PineconeService } from "../services/pinecone.service.js";
import { BM25 } from "../services/bm25.service.js";

export const addJob = async (req: Request, res: Response) => {
    try {
        const jobData = req.body;
        const newJob = new Job(jobData);
        await newJob.save();

        // Generate embedding for Job and save to Pinecone
        try {
            // 1. Generate the AI Summary of the Ideal Candidate Profile
            const aiSummary = await AIService.summarizeJobPost(newJob);
            if (aiSummary) {
                newJob.aiSummary = aiSummary;
            }

            // 2. Generate the embedding based on the AI Summary (or fallback to raw text)
            let embeddingText = aiSummary || `Title: ${newJob.title}. Skills: ${(newJob.requiredSkills || []).join(", ")}. Description: ${newJob.description}`;
            
            const embedding = await AIService.generateEmbedding(embeddingText);
            if (embedding && embedding.length > 0) {
                newJob.embedding = embedding;
                await newJob.save();
                await PineconeService.upsertVector(newJob._id.toString(), embedding, { type: "job" });
            }
        } catch (embedError) {
            console.error("Failed to embed job into Pinecone:", embedError);
        }

        res.status(201).json({ message: "Job added successfully", job: newJob, _id: newJob._id });
    } catch (error: any) {
        res.status(500).json({ message: "Error adding job", error: error.message });
    }
};

export const recommendJobs = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const forceRefresh = req.query.forceRefresh === 'true';

        if (!id) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Cache duration: 24 hours
        const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;
        const isCacheValid = user.lastRecommendationsFetch && 
                             user.cachedRecommendations && 
                             user.cachedRecommendations.length > 0 &&
                             (Date.now() - new Date(user.lastRecommendationsFetch).getTime()) < CACHE_DURATION_MS;

        if (!forceRefresh && isCacheValid) {
            return res.status(200).json({ recommendations: user.cachedRecommendations });
        }

        const recommendations = await findMatches(user);
        
        // Cache the new recommendations
        user.cachedRecommendations = recommendations;
        user.lastRecommendationsFetch = new Date();
        await user.save();

        res.status(200).json({ recommendations });
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching recommendations", error: error.message });
    }
};

export const applyJob = async (req: Request, res: Response) => {
    try {
        const { userId, jobId } = req.body;

        if (!userId || !jobId) {
            return res.status(400).json({ message: "UserId and JobId are required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.appliedJobs.includes(jobId)) {
            return res.status(400).json({ message: "Already applied to this job" });
        }

        await User.findByIdAndUpdate(
            userId,
            { $addToSet: { appliedJobs: jobId } }
        );

        const job = await Job.findByIdAndUpdate(
            jobId,
            { $addToSet: { peopleIds: userId } }
        );

        if (!job) {
            await User.findByIdAndUpdate(
                userId,
                { $pull: { appliedJobs: jobId } }
            );
            return res.status(404).json({ message: "Job not found" });
        }

        res.status(200).json({ message: "Applied successfully" });

    } catch (error: any) {
        res.status(500).json({ message: "Error applying to job", error: error.message });
    }
};

export const getAllJobs = async (req: Request, res: Response) => {
    try {
        const jobs = await Job.find({});
        res.status(200).json({ jobs });
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching jobs", error: error.message });
    }
};

export const getJobApplicants = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Job ID is required" });
        }
        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        let applicants = await User.find({ _id: { $in: job.peopleIds } });

        // Calculate Vector Rank if job embedding exists
        let rankedApplicants: any[] = applicants.map(a => a.toObject());
        
        // 1. Calculate Keyword Search Score & Rank (BM25)
        const corpus = rankedApplicants.map(app => {
            const skills = (app.skills || []).join(" ");
            const summary = app.professionalSummary || "";
            const roles = (app.preferredRoles || []).join(" ");
            return `${skills} ${summary} ${roles}`;
        });
        
        const bm25 = new BM25(corpus);
        const jobQuery = [
            job.title || "",
            job.description || "",
            ...(job.requiredSkills || [])
        ].join(" ");

        const bm25Scores = bm25.search(jobQuery);
        const maxBm25 = Math.max(...bm25Scores, 0.0001);

        rankedApplicants = rankedApplicants.map((app, index) => {
            const keywordScore = bm25Scores[index] / maxBm25;
            return { ...app, keywordScore };
        });
        
        rankedApplicants.sort((a, b) => b.keywordScore - a.keywordScore);
        rankedApplicants.forEach((app, index) => { app.keywordRank = index + 1; });

        // 2. Calculate Vector Search Score & Rank
        if (job.embedding && job.embedding.length > 0) {
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

            rankedApplicants = rankedApplicants.map(app => {
                const vectorScore = (app.embedding && app.embedding.length > 0) ? calculateCosineSimilarity(job.embedding!, app.embedding) : 0;
                return { ...app, vectorScore };
            });

            rankedApplicants.sort((a, b) => b.vectorScore - a.vectorScore);
            rankedApplicants.forEach((app, index) => { app.vectorRank = index + 1; });
        } else {
            rankedApplicants.forEach((app, index) => { app.vectorRank = index + 1; app.vectorScore = 0; });
        }

        // 3. Compute First-Stage Hybrid RRF (Keyword + Vector)
        const k = 60;
        rankedApplicants.forEach(app => {
            app.hybridRrfScore = (1 / (k + app.keywordRank)) + (1 / (k + app.vectorRank));
        });

        // Sort by hybrid RRF and take Top 10 for LLM Reranking
        rankedApplicants.sort((a, b) => b.hybridRrfScore - a.hybridRrfScore);
        rankedApplicants.forEach((app, index) => { app.hybridRank = index + 1; });
        
        const top10Candidates = rankedApplicants.slice(0, 10);

        // 4. Second-Stage LLM Reranking (Only on Top 10)
        const llmRanked = await AIService.rankApplicantsForJob(job, top10Candidates);
        
        // Sort by LLM score and determine absolute top 5
        llmRanked.sort((a, b) => b.score - a.score);
        llmRanked.forEach((app, index) => { app.finalRank = index + 1; });

        const finalTop5 = llmRanked.slice(0, 5);

        res.status(200).json({ applicants: finalTop5 });
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching applicants", error: error.message });
    }
};

export const getCompanyJobs = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: "Query parameter (email or company name) is required" });
        }

        const jobs = await Job.find({
            $or: [
                { companyEmail: query },
                { company: query }
            ]
        });

        res.status(200).json({ jobs });
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching company jobs", error: error.message });
    }
};

export const deleteJob = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedJob = await Job.findByIdAndDelete(id);

        if (!deletedJob) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.status(200).json({ message: "Job deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: "Error deleting job", error: error.message });
    }
};

export const generateInterviewPrep = async (req: Request, res: Response) => {
    try {
        const { id: jobId } = req.params;
        const { userId } = req.body; // Candidate requesting the prep

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const job = await Job.findById(jobId);
        const user = await User.findById(userId);

        if (!job || !user) {
            return res.status(404).json({ message: "Job or User not found" });
        }

        const prepData = await AIService.generateInterviewPrep(user, job);

        if (!prepData) {
            return res.status(429).json({ message: "AI is currently busy due to high traffic. Please wait 30 seconds and try again!" });
        }

        res.status(200).json({ prep: prepData });

    } catch (error: any) {
        console.error("Interview Prep Error:", error);
        res.status(500).json({ message: "Error generating interview prep", error: error.message });
    }
};
