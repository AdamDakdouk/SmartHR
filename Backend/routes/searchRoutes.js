import express from "express";
import SearchController from "../controllers/Search.controller.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateJWT, SearchController.search);
router.get("/type/:type", authenticateJWT, SearchController.searchByType);

export default router;
