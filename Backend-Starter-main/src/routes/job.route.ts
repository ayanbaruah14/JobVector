import express from "express";
import { addJob, recommendJobs, applyJob, getAllJobs, getJobApplicants, getCompanyJobs, deleteJob, generateInterviewPrep } from "../controllers/job.controller.js";

const router = express.Router();

router.get("/company", (req, res, next) => {
    getCompanyJobs(req, res);
});
router.post("/add", addJob);
router.get("/", getAllJobs);
router.get("/recommend/:id", recommendJobs);
router.get("/:id/applicants", getJobApplicants);
router.post("/apply", applyJob);
router.delete("/:id", deleteJob);
router.post("/:id/prep", generateInterviewPrep);

export default router;

