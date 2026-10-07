import express from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import { store } from "../services/store.service.js";
import { extractTextFromFile } from "../services/extraction.service.js";
import { cleanText, validateExtractedText } from "../services/cleaning.service.js";
import { chunkText, buildChunkObjects, validateChunks } from "../services/chunking.service.js";
import { generateChunkEmbeddings } from "../services/embedding.service.js";

const router = express.Router();

// Configure multer with memory storage (max 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".pdf" || ext === ".docx" || ext === ".txt") {
      cb(null, true);
    } else {
      cb(new Error("Only .pdf, .docx, and .txt files are allowed."));
    }
  },
});

/**
 * GET /api/documents
 * List all documents with pagination & search
 */
router.get("/", (req, res) => {
  const { search, page, limit } = req.query;
  const result = store.getDocuments({ search, page, limit });
  return res.json(result);
});

/**
 * GET /api/documents/:id
 * Retrieve single document details
 */
router.get("/:id", (req, res) => {
  const doc = store.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ message: "Document not found." });
  }
  return res.json({ document: doc });
});

/**
 * GET /api/documents/:id/chunks
 * Retrieve all chunks for a document
 */
router.get("/:id/chunks", (req, res) => {
  const chunks = store.getChunksByDocumentId(req.params.id);
  return res.json({
    documentId: req.params.id,
    totalChunks: chunks.length,
    chunks: chunks.map((c) => ({
      chunk_index: c.chunk_index,
      text: c.text,
      title: c.title,
    })),
  });
});

/**
 * POST /api/documents/upload
 * Full RAG Ingestion Pipeline: Upload -> Extract -> Clean -> Chunk -> Embed -> Store
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file was uploaded." });
  }

  const file = req.file;
  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  const docId = `doc-${crypto.randomBytes(6).toString("hex")}`;
  const now = new Date().toISOString();

  // Create initial document record with Processing status
  let docRecord = {
    id: docId,
    name: file.originalname,
    type: ext,
    fileSize: file.size,
    uploadedAt: now,
    uploadedBy: "Admin",
    status: "Processing",
    chunkCount: null,
    processingStartTime: now,
    processingEndTime: null,
    errorMessage: null,
    rawText: null,
  };
  store.saveDocument(docRecord);

  try {
    console.log(`[RAG Pipeline] Processing upload "${file.originalname}" (${file.size} bytes)...`);

    // 1. Text Extraction
    const rawText = await extractTextFromFile(file.buffer, file.originalname, file.mimetype);
    console.log(`[RAG Pipeline] Extracted ${rawText?.length || 0} characters.`);

    // 2. Cleaning & Validation
    const cleanedText = validateExtractedText(cleanText(rawText));

    // Save text for potential reprocess
    docRecord.rawText = cleanedText;

    // 3. Chunking
    const rawChunks = await chunkText(cleanedText);
    const chunkObjects = buildChunkObjects(rawChunks, docId, {
      title: path.parse(file.originalname).name,
      fileName: file.originalname,
      fileType: ext,
      category: "academic",
    });
    const validatedChunks = validateChunks(chunkObjects);
    console.log(`[RAG Pipeline] Generated ${validatedChunks.length} chunks.`);

    // 4. Embedding Generation
    console.log(`[RAG Pipeline] Generating embeddings for ${validatedChunks.length} chunks...`);
    const chunksWithVectors = await generateChunkEmbeddings(validatedChunks);

    // 5. Store chunks & vectors
    const storedCount = await store.storeChunks(chunksWithVectors);
    console.log(`[RAG Pipeline] Successfully stored ${storedCount} chunks.`);

    // Update document status to Completed
    const finishedAt = new Date().toISOString();
    docRecord = {
      ...docRecord,
      status: "Completed",
      chunkCount: storedCount,
      processingEndTime: finishedAt,
      errorMessage: null,
    };
    store.saveDocument(docRecord);

    return res.status(201).json({
      message: `Successfully processed and indexed "${file.originalname}" with ${storedCount} chunks.`,
      document: docRecord,
    });
  } catch (err) {
    console.error(`[RAG Pipeline] Failed processing "${file.originalname}":`, err.message);

    const finishedAt = new Date().toISOString();
    docRecord = {
      ...docRecord,
      status: "Failed",
      chunkCount: 0,
      processingEndTime: finishedAt,
      errorMessage: err.message || "Failed to process document into vector chunks.",
    };
    store.saveDocument(docRecord);

    return res.status(500).json({
      message: `Document processing failed: ${err.message}`,
      document: docRecord,
    });
  }
});

/**
 * POST /api/documents/:id/reprocess
 * Re-runs chunking and embedding for an existing document
 */
router.post("/:id/reprocess", async (req, res) => {
  const doc = store.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ message: "Document not found." });
  }

  const startTime = new Date().toISOString();
  doc.status = "Processing";
  doc.processingStartTime = startTime;
  doc.errorMessage = null;
  store.saveDocument(doc);

  try {
    if (!doc.rawText) {
      throw new Error("No raw text cached for this document to reprocess.");
    }

    const cleanedText = validateExtractedText(cleanText(doc.rawText));
    const rawChunks = await chunkText(cleanedText);
    const chunkObjects = buildChunkObjects(rawChunks, doc.id, {
      title: path.parse(doc.name).name,
      fileName: doc.name,
      fileType: doc.type,
      category: "academic",
    });
    const validatedChunks = validateChunks(chunkObjects);
    const chunksWithVectors = await generateChunkEmbeddings(validatedChunks);
    const storedCount = await store.storeChunks(chunksWithVectors);

    doc.status = "Completed";
    doc.chunkCount = storedCount;
    doc.processingEndTime = new Date().toISOString();
    store.saveDocument(doc);

    return res.json({
      message: `Document successfully reprocessed (${storedCount} chunks).`,
      document: doc,
    });
  } catch (err) {
    doc.status = "Failed";
    doc.errorMessage = err.message;
    doc.processingEndTime = new Date().toISOString();
    store.saveDocument(doc);

    return res.status(500).json({
      message: `Reprocessing failed: ${err.message}`,
      document: doc,
    });
  }
});

/**
 * DELETE /api/documents/:id
 * Deletes document and cleans up chunks
 */
router.delete("/:id", (req, res) => {
  const doc = store.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ message: "Document not found." });
  }

  store.deleteDocument(req.params.id);
  return res.json({ success: true, message: `Document "${doc.name}" deleted successfully.` });
});

export default router;
