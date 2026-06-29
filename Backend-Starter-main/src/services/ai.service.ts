import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key-for-now");

export class AIService {
    private static async generateContentWithRetry(model: any, prompt: string | any[], maxRetries = 3): Promise<any> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await model.generateContent(prompt);
            } catch (error: any) {
                if (error.status === 429 && i < maxRetries - 1) {
                    let delayMs = 15000;
                    if (error.errorDetails) {
                        const retryInfo = error.errorDetails.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
                        if (retryInfo && retryInfo.retryDelay) {
                            const delaySeconds = parseInt(retryInfo.retryDelay.replace('s', ''), 10);
                            if (!isNaN(delaySeconds)) delayMs = delaySeconds * 1000 + 1000; // Add 1s buffer
                        }
                    }
                    console.warn(`[Gemini API] Rate limit hit. Retrying in ${delayMs / 1000}s... (Attempt ${i + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 60000))); // Max 60s wait
                } else {
                    throw error;
                }
            }
        }
    }

    static async parseResume(inputs: any[]): Promise<any> {
        if (!process.env.GEMINI_API_KEY) return {};
        try {
            const prompt = `
            You are a Resume Parser AI. Extract the following information from the provided resume document(s) and return it as a JSON object matching this schema:
            {
                "name": "Full Name",
                "email": "email@example.com",
                "password": "generated-secure-password", 
                "age": 25,
                "experience": 5,
                "skills": ["Skill1", "Skill2"],
                "professionalSummary": "A rich, comprehensive 1-2 paragraph summary capturing their projects, impact, achievements, and core domain expertise."
            }
            
            If a field is not found, omit it (except name, email, password which are required. Generate a random password if needed).
            Skills should be a list of technologies.
            Experience should be total years as a number.
            professionalSummary MUST be highly detailed, strictly factual, and directly reference their actual project names, specific technical achievements, tools used, and quantifiable results from the documents. Do NOT use generic filler words (like "Aspiring software engineer...", "Passionate about..."). Just state exactly what they built and achieved.
            CRITICAL: DO NOT HALLUCINATE DUMMY DATA. ONLY use information explicitly found in the provided documents.
            `;

            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite", generationConfig: { responseMimeType: "application/json" } });
            const result = await this.generateContentWithRetry(model, [prompt, ...inputs]);
            let content = result.response.text();
            
            if (!content) throw new Error("Empty response from Gemini");

            content = content.replace(/```json/i, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(content);
            
            // Fix for Gemini returning an array of strings for professionalSummary instead of a single string
            if (Array.isArray(parsedData.professionalSummary)) {
                parsedData.professionalSummary = parsedData.professionalSummary.join(" ");
            }
            
            return parsedData;

        } catch (error: any) {
            console.error("Gemini Parse Error:", error);
            console.warn("Falling back to Mock Data due to Gemini error.");
            return this.getMockData();
        }
    }

    static async generateEmbedding(text: string): Promise<number[]> {
        if (!process.env.GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY missing. Returning empty array.");
            return [];
        }
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error: any) {
            console.error("Gemini Embedding Error:", error);
            return [];
        }
    }

    static async rerankCandidates(query: string, candidates: any[]): Promise<any[]> {
        if (!process.env.GEMINI_API_KEY || candidates.length === 0) return candidates;
        
        try {
            const prompt = `
            You are a strict and expert technical recruiter. 
            The hiring manager is searching for: "${query}".
            I am providing you with a list of top candidates retrieved from our database.
            Your job is to critically evaluate how well each candidate matches the search query.
            Score them from 0 to 100, where 100 is a perfect match.
            Also, write a 1-sentence reasoning (max 20 words) explaining why you gave that score.
            
            Return a JSON array of objects with the structure:
            [ { "id": "candidate_id", "score": 95, "reasoning": "reasoning text" } ]
            
            Candidates:
            ${JSON.stringify(candidates.map(c => ({ id: c._id, skills: c.skills, experience: c.experience }))) }
            `;

            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite", generationConfig: { responseMimeType: "application/json" } });
            const result = await model.generateContent(prompt);
            let content = result.response.text();
            content = content.replace(/```json/i, '').replace(/```/g, '').trim();
            const reasoningArray = JSON.parse(content);

            const scoredCandidates = candidates.map(candidate => {
                const llmEval = reasoningArray.find((r: any) => r.id === candidate._id.toString());
                return { 
                    ...candidate.toObject(), 
                    searchScore: llmEval ? llmEval.score : 50,
                    searchReasoning: llmEval ? llmEval.reasoning : "Matched based on skills." 
                };
            });

            // Sort by the LLM assigned score
            scoredCandidates.sort((a, b) => b.searchScore - a.searchScore);
            return scoredCandidates;

        } catch (error) {
            console.error("Gemini Re-ranking Error:", error);
            return candidates;
        }
    }

    static async classifySearchIntent(query: string): Promise<any> {
        if (!process.env.GEMINI_API_KEY) {
            return { type: "semantic", queries: [query, query, query] };
        }
        
        try {
            const prompt = `
            You are a search query classifier for a job board.
            Given a recruiter's search query, determine if it is "analytical" or "semantic".
            - "analytical": highly structured, specific skills (e.g. "React", "Python"), or experience (e.g. "5 years").
            - "semantic": conversational, conceptual, or focuses on soft skills (e.g. "innovator", "good communicator").
            
            Additionally, generate exactly 3 semantically equivalent but differently phrased variations of the original query to maximize search recall in a vector database.
            
            Return a JSON object matching this schema:
            {
                "type": "analytical" | "semantic",
                "filters": {
                    "skills": ["skill1", "skill2"],
                    "minExperience": 5
                }, // only include 'filters' if type is 'analytical'
                "queries": ["variation 1", "variation 2", "variation 3"]
            }
            
            Original Query: "${query}"
            `;
            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite", generationConfig: { responseMimeType: "application/json" } });
            const result = await model.generateContent(prompt);
            let content = result.response.text();
            content = content.replace(/```json/i, '').replace(/```/g, '').trim();
            
            return JSON.parse(content);
        } catch (error) {
            console.error("Gemini Intent Classification Error:", error);
            return { type: "semantic", queries: [query, query, query] }; // fallback to original query repeated
        }
    }

    static async generateCandidateSummary(userData: any): Promise<string> {
        if (!process.env.GEMINI_API_KEY) return "";
        try {
            const prompt = `
            You are an expert career counselor. Given the following candidate profile details and their previous summary, write a strictly factual 1-2 paragraph professional summary.
            
            Candidate Details:
            Skills: ${(userData.skills || []).join(", ")}
            Experience: ${userData.experience || 0} years
            Preferred Roles: ${(userData.preferredRoles || []).join(", ")}
            Previous Summary (contains their actual projects and achievements): ${userData.professionalSummary || 'None'}
            
            CRITICAL INSTRUCTIONS:
            1. DO NOT use generic filler words like "Aspiring software engineer", "Passionate about", or "Solid grasp".
            2. You MUST retain the specific project names, technical achievements, and quantifiable results mentioned in the Previous Summary.
            3. Incorporate the new Skills and Preferred Roles into the text naturally.
            4. If Previous Summary is 'None', just write a brief factual sentence about their skills and experience.
            
            Return ONLY the summary text, no conversational filler.
            `;
            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite", generationConfig: { responseMimeType: "text/plain" } });
            const result = await this.generateContentWithRetry(model, prompt);
            return result.response.text().trim();
        } catch (error) {
            console.error("Gemini Candidate Summary Error:", error);
            return userData.professionalSummary || "";
        }
    }

    static async generateInterviewPrep(user: any, job: any): Promise<any> {
        if (!process.env.GEMINI_API_KEY) return null;
        
        try {
            const prompt = `
            You are an expert technical interviewer and career coach.
            Candidate Profile:
            Skills: ${user.skills?.join(", ")}
            Experience: ${user.experience} years
            Professional Summary: ${user.professionalSummary || 'N/A'}
            
            Target Job:
            Title: ${job.title}
            Required Skills: ${job.requiredSkills?.join(", ")}
            Job Summary: ${job.aiSummary || job.description}
            
            Based on the gap between the Candidate Profile and the Target Job, generate an interview prep document.
            Return it as a JSON object matching this schema:
            {
                "improvementPlan": "A 2-3 sentence explanation of what skills the candidate should improve or which projects they should work on to better match this particular job.",
                "interviewTopics": [
                    { "topic": "Topic Name", "details": "A short explanation of why they need to review this topic before the interview" }
                ]
            }
            Generate exactly 3 interview topics.
            `;

            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite", generationConfig: { responseMimeType: "application/json" } });
            const result = await this.generateContentWithRetry(model, prompt);
            let content = result.response.text();
            content = content.replace(/```json/i, '').replace(/```/g, '').trim();
            return JSON.parse(content);

        } catch (error) {
            console.error("Gemini Interview Prep Error:", error);
            return null;
        }
    }

    static async evaluateJobMatch(user: any, jobs: any[]): Promise<any[]> {
        if (!process.env.GEMINI_API_KEY || jobs.length === 0) return jobs;
        
        try {
            const prompt = `
            You are a strict technical career advisor. 
            I am providing you with a candidate's profile and a list of jobs they might be a fit for.
            Evaluate how well the candidate matches each job based on their skills, experience, and professional summary vs the job's requirements and AI summary.
            Score each job match from 0 to 100.
            Write a 1-sentence reasoning (max 20 words) explaining why this job is a good fit for them.
            
            Return a JSON array matching this schema:
            [ { "id": "job_id", "score": 95, "matchReasoning": "reasoning text" } ]
            
            Candidate:
            Skills: ${(user.skills || []).join(", ")}
            Experience: ${user.experience} years
            Roles: ${(user.preferredRoles || []).join(", ")}
            Professional Summary: ${user.professionalSummary || 'N/A'}

            Jobs:
            ${JSON.stringify(jobs.map(j => ({ 
                id: j._id, 
                title: j.title, 
                skills: j.requiredSkills, 
                minExperience: j.minExperience,
                jobSummary: j.aiSummary || j.description 
            })))}
            `;

            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite", generationConfig: { responseMimeType: "application/json" } });
            const result = await this.generateContentWithRetry(model, prompt);
            let content = result.response.text();
            content = content.replace(/```json/i, '').replace(/```/g, '').trim();
            const reasoningArray = JSON.parse(content);

            const scoredJobs = jobs.map(job => {
                const llmEval = reasoningArray.find((r: any) => r.id === job._id.toString());
                const jobObj = job.toObject ? job.toObject() : job;
                return { 
                    ...jobObj, 
                    score: llmEval ? llmEval.score : 50,
                    matchPercentage: llmEval ? llmEval.score : 50,
                    matchReasoning: llmEval ? llmEval.matchReasoning : "Matched based on vector similarity." 
                };
            });

            // Sort by the LLM assigned score
            scoredJobs.sort((a, b) => b.score - a.score);
            return scoredJobs;

        } catch (error) {
            console.error("Gemini Job Evaluation Error:", error);
            return jobs.map(job => {
                const jobObj = job.toObject ? job.toObject() : job;
                return { ...jobObj, score: 50, matchReasoning: "Evaluation failed." };
            });
        }
    }

    static async rankApplicantsForJob(job: any, applicants: any[]): Promise<any[]> {
        if (!process.env.GEMINI_API_KEY || applicants.length === 0) return applicants.map(a => ({ ...a, score: 50, matchReasoning: "" }));

        try {
            const prompt = `
            You are a strict technical recruiter. 
            I am providing you with a job posting and a list of candidates who applied.
            Evaluate how well each candidate matches the job based on their skills, experience, and professional summary.
            Score each candidate from 0 to 100.
            Write a 1-sentence reasoning (max 20 words) explaining why this candidate is a good/bad fit.
            
            Return a JSON array matching this schema:
            [ { "id": "candidate_id", "score": 95, "matchReasoning": "reasoning text" } ]
            
            Job Posting:
            Title: ${job.title}
            Skills Required: ${(job.requiredSkills || []).join(", ")}
            Min Experience: ${job.minExperience} years
            Description: ${job.description}
            Preferred Candidates: ${job.preferredCandidates || 'N/A'}

            Candidates:
            ${JSON.stringify(applicants.map(a => ({ 
                id: a._id, 
                skills: a.skills, 
                experience: a.experience, 
                summary: a.professionalSummary || 'No summary available.' 
            })))}
            `;

            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite", generationConfig: { responseMimeType: "application/json" } });
            const result = await this.generateContentWithRetry(model, prompt);
            let content = result.response.text();
            content = content.replace(/```json/i, '').replace(/```/g, '').trim();
            const reasoningArray = JSON.parse(content);

            const scoredApplicants = applicants.map(app => {
                const llmEval = reasoningArray.find((r: any) => r.id === app._id.toString());
                return {
                    ...app,
                    score: llmEval ? llmEval.score : 50,
                    matchReasoning: llmEval ? llmEval.matchReasoning : "Matched based on vector similarity."
                };
            });

            return scoredApplicants;
        } catch (error) {
            console.error("Gemini Applicant Ranking Error:", error);
            return applicants.map(a => ({ ...a, score: 50, matchReasoning: "Ranking failed." }));
        }
    }

    static async summarizeJobPost(jobData: any): Promise<string> {
        if (!process.env.GEMINI_API_KEY) return "";

        try {
            const prompt = `
            You are an expert technical recruiter and AI systems architect.
            I will provide you with the raw text of a job posting and the hiring manager's notes on their preferred candidate.
            Your task is to synthesize this into a rich, comprehensive 1-2 paragraph "Ideal Candidate Profile".
            This summary will be used to generate vector embeddings for semantic matching against applicant profiles, so it is CRITICAL that you use standard industry terminology, capture the nuance of the required skills, and describe the candidate's expected impact and domain expertise.
            
            Do NOT return JSON. Return ONLY the plain text summary.

            Job Title: ${jobData.title}
            Skills Required: ${(jobData.requiredSkills || []).join(", ")}
            Min Experience: ${jobData.minExperience} years
            Job Description: ${jobData.description}
            Preferred Candidate Notes: ${jobData.preferredCandidates || "None provided"}
            `;

            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite", generationConfig: { responseMimeType: "text/plain" } });
            const result = await this.generateContentWithRetry(model, prompt);
            return result.response.text().trim();
        } catch (error) {
            console.error("Gemini Job Summarization Error:", error);
            return "";
        }
    }

    static getMockData() {
        return {
            name: "Mock User",
            email: `mock.user.${Date.now()}@example.com`,
            password: "mockpassword123",
            age: 30,
            experience: 5,
            skills: ["JavaScript", "TypeScript", "Node.js", "Mocking"]
        };
    }
}
