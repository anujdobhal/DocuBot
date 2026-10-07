import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import documentRoutes from "./routes/documents.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import { store } from "./services/store.service.js";
import { cleanText, validateExtractedText } from "./services/cleaning.service.js";
import { chunkText, buildChunkObjects, validateChunks } from "./services/chunking.service.js";
import { generateChunkEmbeddings } from "./services/embedding.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and body parsers
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "DocuBot RAG Engine",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api", chatRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error("[Server Error]:", err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || "An internal server error occurred.",
  });
});

// Seed sample documents if documents.json is empty
async function seedInitialDocuments() {
  const stats = store.getStats();
  if (stats.total > 0) return;

  console.log("[Seed] No documents found in store. Initializing sample documents...");

  const sampleFiles = [
    {
      id: "doc-seed-01",
      name: "Fee-Refund-Policy-2025.pdf",
      type: "pdf",
      fileSize: 124500,
      uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      uploadedBy: "Admin",
      status: "Completed",
      rawText: "University Grants Commission Fee Refund Policy and Regulations. Higher education institutions shall refund the full fee upon withdrawal within 15 days of formal closure of admissions with a maximum deduction of Rs. 1000 processing fee. For withdrawals made up to 30 days, 80% is refunded. After 30 days, no tuition fee refund is applicable.",
    },
    {
      id: "doc-seed-02",
      name: "Academic-Calendar-2025-2026.pdf",
      type: "pdf",
      fileSize: 342100,
      uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      uploadedBy: "Admin",
      status: "Completed",
      rawText: "Graphic Era Hill University Academic Calendar 2025-2026. Odd semester commences on August 1st, 2025. Mid-term examinations: October 14th to October 21st. End-term practical examinations: November 25th to December 2nd. End-semester theory examinations: December 5th to December 23rd. Winter vacation: December 24th to January 15th.",
    },
    {
      id: "doc-seed-03",
      name: "Hostel-Regulations-and-Fees.docx",
      type: "docx",
      fileSize: 89400,
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      uploadedBy: "Admin",
      status: "Completed",
      rawText: "Graphic Era Hill University Hostel and Mess Rules. Hostel fee for triple occupancy non-AC room is Rs. 85,000 per academic year including mess charges. Laundry charges are Rs. 4,750 per year. AC room fee is Rs. 1,15,000 per academic year. Curfew timing for all hostels is strictly 9:00 PM on weekdays and 9:30 PM on weekends.",
    },
  ];

  for (const doc of sampleFiles) {
    try {
      const cleanedText = validateExtractedText(cleanText(doc.rawText));
      const rawChunks = await chunkText(cleanedText);
      const chunkObjs = buildChunkObjects(rawChunks, doc.id, {
        title: path.parse(doc.name).name,
        fileName: doc.name,
        fileType: doc.type,
      });
      const validChunks = validateChunks(chunkObjs);
      const withVectors = await generateChunkEmbeddings(validChunks);
      await store.storeChunks(withVectors);

      store.saveDocument({
        ...doc,
        chunkCount: withVectors.length,
        processingStartTime: doc.uploadedAt,
        processingEndTime: doc.uploadedAt,
        errorMessage: null,
      });
      console.log(`[Seed] Seeded "${doc.name}" with ${withVectors.length} chunks.`);
    } catch (err) {
      console.warn(`[Seed] Failed seeding "${doc.name}":`, err.message);
    }
  }
}

// Start Server
app.listen(PORT, async () => {
  console.log(`==================================================`);
  console.log(` DocuBot RAG Backend Server running on port ${PORT}`);
  console.log(` REST API Base: http://localhost:${PORT}/api`);
  console.log(`==================================================`);

  try {
    await seedInitialDocuments();
  } catch (err) {
    console.warn("[Seed Error]:", err.message);
  }
});
