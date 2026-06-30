import { Request, Response } from "express";
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "856746625056-13v68muq7qtpnp9s5q3ipfd7mkq8vb99.apps.googleusercontent.com");
import Company from "../models/company.model.js";
import User from "../models/user.model.js";
import { PineconeService } from "../services/pinecone.service.js";
import { AIService } from "../services/ai.service.js";

export const createCompany = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const existingCompany = await Company.findOne({ email });
        if (existingCompany) {
            return res.status(400).json({ message: "Company with this email already exists" });
        }

        const newCompany = new Company({
            name,
            email,
            password,
            jobsIds: []
        });

        await newCompany.save();

        res.status(201).json({ message: "Company registered successfully", company: newCompany, _id: newCompany._id });
    } catch (error: any) {
        res.status(500).json({ message: "Error registering company", error: error.message });
    }
};

export const loginCompany = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const company = await Company.findOne({ email });

        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        if (company.password !== password) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.status(200).json({ message: "Login successful", company, _id: company._id });
    } catch (error: any) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};

export const googleAuthCompany = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID || "856746625056-13v68muq7qtpnp9s5q3ipfd7mkq8vb99.apps.googleusercontent.com",
        });
        
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ message: "Invalid Google token" });
        }

        const { email, name } = payload;
        
        let company = await Company.findOne({ email });
        
        if (!company) {
            company = new Company({ 
                name: name || "Google Company", 
                email, 
                password: Math.random().toString(36).slice(-10),
                jobsIds: []
            });
            await company.save();
        }

        res.status(200).json({ message: "Google Login successful", company, _id: company._id });
    } catch (error: any) {
        res.status(500).json({ message: "Error with Google Auth", error: error.message });
    }
};

export const searchCandidates = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== "string") {
            return res.status(400).json({ message: "Search query is required" });
        }

        // 1. Classify the Intent & Generate Multi-Queries
        const intent = await AIService.classifySearchIntent(q);
        const queries = intent.queries && intent.queries.length > 0 ? intent.queries : [q];

        console.log(`\n[Search] Original: "${q}"`);
        console.log(`[Search] AI Generated Variations:`, queries);

        // RRF (Reciprocal Rank Fusion) Score Map
        const rrfScores: { [userId: string]: number } = {};
        const k = 60; // Standard RRF constant

        const addToRRF = (userIds: string[]) => {
            userIds.forEach((id, index) => {
                const rank = index + 1;
                rrfScores[id] = (rrfScores[id] || 0) + (1 / (k + rank));
            });
        };

        // 2. Execute Concurrent Hybrid Retrieval
        const promises: Promise<void>[] = [];

        // A. Pinecone Semantic Searches (Multi-Query)
        queries.forEach((queryVariation: string) => {
            promises.push((async () => {
                const vector = await AIService.generateEmbedding(queryVariation);
                if (vector && vector.length > 0) {
                    const topIds = await PineconeService.searchVectors(vector, 10);
                    addToRRF(topIds);
                }
            })());
        });

        // B. MongoDB Analytical/Keyword Search
        promises.push((async () => {
            const mongoQuery: any = {};
            if (intent.type === "analytical" && intent.filters?.skills && intent.filters.skills.length > 0) {
                mongoQuery.skills = { $in: intent.filters.skills.map((s: string) => new RegExp(s, "i")) };
            } else {
                // Basic fallback keyword search for semantic queries
                const firstWord = q.split(" ")[0];
                if (firstWord) {
                    mongoQuery.skills = { $regex: new RegExp(firstWord, "i") };
                }
            }
            if (intent.filters?.minExperience) {
                mongoQuery.experience = { $gte: intent.filters.minExperience };
            }
            
            const mongoUsers = await User.find(mongoQuery).select('_id').limit(10);
            addToRRF(mongoUsers.map(u => u._id.toString()));
        })());

        // Wait for all databases to return results
        await Promise.all(promises);

        // 3. Sort by Fused RRF Score
        const fusedUserIds = Object.keys(rrfScores).sort((a, b) => (rrfScores[b] || 0) - (rrfScores[a] || 0));
        
        console.log(`[Search] RRF Fused Candidate Count: ${fusedUserIds.length}`);

        if (fusedUserIds.length === 0) {
            return res.status(200).json({ candidates: [] });
        }

        // Fetch top 8 candidates from MongoDB
        const topCandidatesIds = fusedUserIds.slice(0, 8);
        const candidates = await User.find({ _id: { $in: topCandidatesIds } });

        // 4. LLM Re-ranking (Cross-Encoder Style)
        console.log(`[Search] Re-ranking Top ${candidates.length} candidates...`);
        const reRankedCandidates = await AIService.rerankCandidates(q, candidates);

        // Return Top 5 to the frontend
        res.status(200).json({ candidates: reRankedCandidates.slice(0, 5) });

    } catch (error: any) {
        console.error("Search Error:", error);
        res.status(500).json({ message: "Error searching candidates", error: error.message });
    }
};
