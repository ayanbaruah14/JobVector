import mongoose, { Schema, Document } from "mongoose";

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
    },

    { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
