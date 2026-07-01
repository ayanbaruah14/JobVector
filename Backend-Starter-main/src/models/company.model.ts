import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface ICompany extends Document {
    name: string;
    email: string;
    jobsIds: string[];
    password: string;
}

const CompanySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        jobsIds: { type: [String], default: [] },
    },
    { timestamps: true }
);

CompanySchema.pre("save", async function (this: ICompany) {
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

export default mongoose.model<ICompany>("Company", CompanySchema);
