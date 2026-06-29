import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
    title: string;
    company: string;
    companyEmail: string;
    companyPassword: string;
    requiredSkills: string[];
    minExperience: number;
    location: string;
    salary: number;
    jobType: string;
    description: string;
    peopleIds: string[];
    preferredCandidates?: string;
    aiSummary?: string;
    embedding?: number[];
}

const JobSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        company: { type: String, required: true },
        companyEmail: { type: String, required: true },
        companyPassword: { type: String, required: true },
        requiredSkills: { type: [String], required: true },
        minExperience: { type: Number, required: true },
        location: { type: String, required: true },
        salary: { type: Number, required: true },
        jobType: { type: String, required: true },
        description: { type: String, required: true },
        peopleIds: { type: [String], default: [] },
        preferredCandidates: { type: String },
        aiSummary: { type: String },
        embedding: { type: [Number], default: [] },
    },

    { timestamps: true }
);

export default mongoose.model<IJob>("Job", JobSchema);
