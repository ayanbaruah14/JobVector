import express from "express";
import healthRoute from "./routes/health.route.js";
import userRoutes from "./routes/user.route.js";
import jobRoutes from "./routes/job.route.js";
import companyRoutes from "./routes/company.route.js";

import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Serve the uploads directory statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", healthRoute);
app.use("/user", userRoutes);
app.use("/jobs", jobRoutes);
app.use("/company", companyRoutes);

export default app;
