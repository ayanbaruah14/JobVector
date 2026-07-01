import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    age?: number;
    experience?: number;
    skills?: string[];
    totalProjects: number;
    projectLinks: string[];
    preferredRoles: string[];
    preferredLocations: string[];
    expectedSalary?: number;
    jobType?: string; 
    location?: string;
    preferredJobTypes: string[];
    appliedJobs: string[];
    isProfileComplete: boolean;
    embedding?: number[];
    resumeUrl?: string;
    professionalSummary?: string;
    cachedRecommendations?: any[];
    lastRecommendationsFetch?: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        age: { type: Number },
        experience: { type: Number },
        skills: { type: [String], default: [] },
        totalProjects: { type: Number, default: 0 },
        projectLinks: { type: [String], default: [] },
        preferredRoles: { type: [String], default: [] },
        preferredLocations: { type: [String], default: [] },
        expectedSalary: { type: Number },
        jobType: { type: String },
        location: { type: String },
        preferredJobTypes: { type: [String], default: [] },
        appliedJobs: { type: [String], default: [] },
        isProfileComplete: { type: Boolean, default: false },
        embedding: { type: [Number], default: [] },
        resumeUrl: { type: String },
        professionalSummary: { type: String },
        cachedRecommendations: { type: [Schema.Types.Mixed], default: [] },
        lastRecommendationsFetch: { type: Date },
    },

    { timestamps: true }
);

UserSchema.pre("save", async function (this: IUser) {
    if (!this.isModified("password")) return;
    try {
        // Only hash if it's not already a bcrypt hash
        if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$')) return;
        
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err: any) {
        throw err;
    }
});

export default mongoose.model<IUser>("User", UserSchema);
