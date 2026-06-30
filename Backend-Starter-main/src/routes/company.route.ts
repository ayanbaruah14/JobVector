import express from "express";
import { createCompany, loginCompany, searchCandidates, googleAuthCompany } from "../controllers/company.controller.js";
import { getCompanyJobs } from "../controllers/job.controller.js";

const router = express.Router();

router.post("/register", createCompany);
router.post("/login", loginCompany);
router.post("/google", googleAuthCompany);
router.get("/jobs", getCompanyJobs);
router.get("/search-candidates", searchCandidates);

export default router;
