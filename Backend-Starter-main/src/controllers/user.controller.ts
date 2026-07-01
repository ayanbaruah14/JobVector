import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "856746625056-13v68muq7qtpnp9s5q3ipfd7mkq8vb99.apps.googleusercontent.com");
import User, { type IUser } from "../models/user.model.js";
import { LinkExtractionService } from "../services/link-extraction.service.js";
import { AIService } from "../services/ai.service.js";
import { PineconeService } from "../services/pinecone.service.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const createUser = async (req: Request, res: Response) => {
    try {
        const userData = req.body;

        const newUser = new User({ ...userData, isProfileComplete: false });
        await newUser.save();

        res.status(201).json({ message: "User created successfully", user: newUser, _id: newUser._id });
    } catch (error: any) {
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let isMatch = false;
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            // Legacy plain text check
            isMatch = user.password === password;
            if (isMatch) {
                // Trigger the pre('save') hook to hash the plaintext password
                user.password = password;
                await user.save();
            }
        }

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.status(200).json({ message: "Login successful", user, _id: user._id });
    } catch (error: any) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};

export const googleAuthUser = async (req: Request, res: Response) => {
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
        
        let user = await User.findOne({ email });
        
        if (!user) {
            // Create user if not exists
            user = new User({ 
                name: name || "Google User", 
                email, 
                password: Math.random().toString(36).slice(-10), // Random password for google users
                isProfileComplete: false 
            });
            await user.save();
        }

        res.status(200).json({ message: "Google Login successful", user, _id: user._id });
    } catch (error: any) {
        res.status(500).json({ message: "Error with Google Auth", error: error.message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "UserId is required for update" });
        }

        const updateData = { ...req.body, isProfileComplete: true };
        delete updateData.email;
        delete updateData.password;
        delete updateData._id;
        delete updateData.userId;

        // Generate updated professional summary based on new profile data
        const oldUser = await User.findById(userId);
        const combinedData = { ...(oldUser?.toObject() || {}), ...updateData };
        const newSummary = await AIService.generateCandidateSummary(combinedData);
        if (newSummary) {
            updateData.professionalSummary = newSummary;
        }

        const updatedUser = await User.findOneAndUpdate({ _id: userId }, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // --- RAG INTEGRATION: Generate Embedding and Save to Pinecone ---
        try {
            let embeddingText = `Skills: ${(updatedUser.skills || []).join(", ")}. Experience: ${updatedUser.experience} years. Roles: ${(updatedUser.preferredRoles || []).join(", ")}.`;
            if (updatedUser.professionalSummary) {
                embeddingText += `\nProfessional Summary: ${updatedUser.professionalSummary}`;
            }
            const embedding = await AIService.generateEmbedding(embeddingText);
            
            if (embedding && embedding.length > 0) {
                updatedUser.embedding = embedding;
                await updatedUser.save();
                
                // Save to Pinecone
                await PineconeService.upsertVector(updatedUser._id.toString(), embedding);
            }
        } catch (embeddingError) {
            console.error("Error generating or saving embedding on profile update:", embeddingError);
        }
        // ---------------------------------------------------------------

        res.status(200).json({ message: "User updated successfully", user: updatedUser });

    } catch (error: any) {
        console.error("Update User Error:", error);
        res.status(500).json({ message: "Error updating user", error: error.message });
    }
};


export const getUserApplications = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const jobs = await import("../models/job.model.js").then(m => m.default.find({ _id: { $in: user.appliedJobs } }));
        res.status(200).json({ applications: jobs });
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching applications", error: error.message });
    }
};

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching profile", error: error.message });
    }
};

export const completeUserProfile = async (
    req: Request,
    res: Response
) => {
    try {
        console.log("completeUserProfile called");


        const { userId, ...manualData } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "UserId is required" });
        }

        const files = req.files as Express.Multer.File[];

        let links: string[] = [];
        try {
            if (manualData.links) {
                links = JSON.parse(manualData.links);
            } else if (manualData.projectLinks) {

                links = Array.isArray(manualData.projectLinks) ? manualData.projectLinks : manualData.projectLinks.split(',').map((l: string) => l.trim());
            }
        } catch (e) {
            console.log("Error parsing links:", e);
        }

        let resumeParts: any[] = [];
        let resumeUrl = "";

        if (files && files.length > 0) {
            for (const file of files) {
                if (file.mimetype === "application/pdf") {
                    try {
                        resumeParts.push({
                            inlineData: {
                                data: file.buffer.toString("base64"),
                                mimeType: "application/pdf"
                            }
                        });
                        
                        const uploadDir = path.join(__dirname, "../../uploads/resumes");
                        if (!fs.existsSync(uploadDir)) {
                            fs.mkdirSync(uploadDir, { recursive: true });
                        }
                        const uniqueFilename = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
                        const filePath = path.join(uploadDir, uniqueFilename);
                        fs.writeFileSync(filePath, file.buffer);
                        
                        const serverUrl = process.env.SERVER_URL || "http://localhost:5002";
                        resumeUrl = `${serverUrl}/uploads/resumes/${uniqueFilename}`;
                        
                    } catch (e: any) {
                        console.error(`Failed to process PDF ${file.originalname}:`, e);
                    }
                }
            }
        }


        if (links && links.length > 0) {
            for (const link of links) {
                if (typeof link === "string" && link.startsWith("http")) {
                    try {
                        const text = await LinkExtractionService.extractTextFromLink(link);
                        resumeParts.push(`\n--- LINK: ${link} ---\n${text}`);
                    } catch (e: any) {
                        console.error(`Failed to parse link ${link}:`, e);
                    }
                }
            }
        }


        let aiData: any = {};
        if (resumeParts.length > 0) {
            console.log("Sending documents to OpenAI...", resumeParts.length, "parts");
            try {
                aiData = await AIService.parseResume(resumeParts);
                console.log("AI Data Recieved:", Object.keys(aiData));
            } catch (error) {
                console.error("OpenAI Error:", error);
            }
        }



        const cleanManualData: any = {};
        Object.keys(manualData).forEach(key => {
            if (manualData[key] !== undefined && manualData[key] !== "" && manualData[key] !== "null") {

                if (!isNaN(Number(manualData[key])) && key !== 'phoneNumber' && key !== 'password') {
                    cleanManualData[key] = Number(manualData[key]);
                } else if (typeof manualData[key] === 'string' && ['skills', 'preferredRoles', 'preferredLocations', 'preferredJobTypes', 'projectLinks'].includes(key)) {
                    cleanManualData[key] = manualData[key].split(',').map((s: string) => s.trim());
                } else {
                    cleanManualData[key] = manualData[key];
                }
            }
        });

        const finalData: any = { ...cleanManualData, ...aiData, isProfileComplete: true };
        if (resumeUrl) {
            finalData.resumeUrl = resumeUrl;
        }

        delete finalData.email;
        delete finalData.password;
        delete finalData._id;
        delete finalData.userId;
        
        const oldUser = await User.findById(userId);
        
        // If we didn't just generate a new summary from a resume, unconditionally generate one from the updated manual profile data
        if (!aiData.professionalSummary) {
            const combinedData = { ...(oldUser?.toObject() || {}), ...finalData };
            const newSummary = await AIService.generateCandidateSummary(combinedData);
            if (newSummary) {
                finalData.professionalSummary = newSummary;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(userId, finalData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // --- RAG INTEGRATION: Generate Embedding and Save to Pinecone ---
        try {
            let embeddingText = `Skills: ${(updatedUser.skills || []).join(", ")}. Experience: ${updatedUser.experience} years. Roles: ${(updatedUser.preferredRoles || []).join(", ")}.`;
            if (updatedUser.professionalSummary) {
                embeddingText += `\nProfessional Summary: ${updatedUser.professionalSummary}`;
            }
            const embedding = await AIService.generateEmbedding(embeddingText);
            
            if (embedding && embedding.length > 0) {
                updatedUser.embedding = embedding;
                await updatedUser.save();
                
                // Save to Pinecone
                await PineconeService.upsertVector(updatedUser._id.toString(), embedding);
            }
        } catch (embeddingError) {
            console.error("Error generating or saving embedding on profile update:", embeddingError);
        }
        // ---------------------------------------------------------------



        res.status(200).json({
            message: "Profile completed successfully",
            user: updatedUser,
            aiSourceUsed: resumeParts.length > 0
        });

    } catch (err: any) {
        console.error("Profile Completion Error:", err);
        res.status(500).json({
            error: "Error completing profile",
            details: err.message
        });
    }
};
