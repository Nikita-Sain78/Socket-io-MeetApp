// routes/video.route.js
import express from "express";
import { getVideoToken } from "../controllers/video.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/token", protectRoute, getVideoToken);

export default router;
