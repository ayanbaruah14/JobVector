import express from "express";
import { createUser, updateUser, getUserApplications, completeUserProfile, getUserProfile, loginUser, googleAuthUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/create", createUser);
router.post("/login", loginUser);
router.post("/google", googleAuthUser);
router.put("/update", updateUser);
router.get("/profile/:id", getUserProfile);
router.get("/:id/applications", getUserApplications);

router.put(
    "/complete-profile",
    upload.array("files"),
    completeUserProfile
);

export default router;
