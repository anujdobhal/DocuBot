import express from "express";
import { store } from "../services/store.service.js";
import { generateEmbedding } from "../services/embedding.service.js";

const router = express.Router();

/**
 * GET /api/dashboard/stats
 * Provides overview metrics for admin dashboard
 */
router.get("/dashboard/stats", (req, res) => {
  const stats = store.getStats();
  return res.json(stats);
});

/**
 * POST /api/chat
 * Vector RAG search for chatbot
 */
router.post("/chat", async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ message: "A valid question is required." });
  }

  try {
    const queryVector = await generateEmbedding(question);
    const matches = await store.searchChunks(queryVector, 4);

    const sources = matches.map((m) => ({
      title: m.title || "University Document",
      docName: m.title || "Document",
      page: (m.chunk_index || 0) + 1,
      snippet: m.text.slice(0, 220) + (m.text.length > 220 ? "..." : ""),
      score: m.score,
    }));

    // If matches found, synthesize contextual response preview
    let answer = "";
    if (matches.length > 0) {
      const topContent = matches.map((m) => m.text).join("\n\n");
      answer = `Based on the official documents:\n\n${topContent.slice(0, 600)}...`;
    } else {
      answer = "I could not find relevant details regarding your inquiry in the current official university documents.";
    }

    return res.json({
      answer,
      sources,
    });
  } catch (err) {
    console.error("[Chat / RAG Error]:", err.message);
    return res.status(500).json({
      message: `Failed to retrieve context: ${err.message}`,
    });
  }
});

export default router;
