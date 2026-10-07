import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { upsertChunks, searchSimilarVectors, deleteDocumentVectors } from "./qdrant.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../data");

const DOCS_FILE = path.join(DATA_DIR, "documents.json");
const CHUNKS_FILE = path.join(DATA_DIR, "chunks.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf-8");
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content || "[]");
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
  }
}

// Compute cosine similarity between two float vectors
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const store = {
  getDocuments({ search = "", page = 1, limit = 10 } = {}) {
    const docs = readJsonFile(DOCS_FILE);
    let filtered = [...docs];

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.uploadedBy?.toLowerCase().includes(q) ||
          d.type?.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const start = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(start, start + limitNum);

    return {
      documents: paginated,
      total,
      page: pageNum,
      totalPages,
    };
  },

  getDocumentById(id) {
    const docs = readJsonFile(DOCS_FILE);
    return docs.find((d) => d.id === id) || null;
  },

  saveDocument(doc) {
    const docs = readJsonFile(DOCS_FILE);
    const existingIndex = docs.findIndex((d) => d.id === doc.id);
    if (existingIndex >= 0) {
      docs[existingIndex] = { ...docs[existingIndex], ...doc };
    } else {
      docs.unshift(doc);
    }
    writeJsonFile(DOCS_FILE, docs);
    return doc;
  },

  deleteDocument(id) {
    let docs = readJsonFile(DOCS_FILE);
    docs = docs.filter((d) => d.id !== id);
    writeJsonFile(DOCS_FILE, docs);

    // Delete chunks
    let chunks = readJsonFile(CHUNKS_FILE);
    chunks = chunks.filter((c) => c.document_id !== id);
    writeJsonFile(CHUNKS_FILE, chunks);

    // Delete from Qdrant if available
    deleteDocumentVectors(id).catch((err) =>
      console.warn("Failed to delete Qdrant vectors:", err.message)
    );

    return true;
  },

  async storeChunks(chunksWithVectors) {
    const existingChunks = readJsonFile(CHUNKS_FILE);
    // Append or replace
    const docId = chunksWithVectors[0]?.document_id;
    const filtered = existingChunks.filter((c) => c.document_id !== docId);
    const updated = [...filtered, ...chunksWithVectors];
    writeJsonFile(CHUNKS_FILE, updated);

    // Also push to Qdrant
    await upsertChunks(chunksWithVectors);

    return chunksWithVectors.length;
  },

  getChunksByDocumentId(documentId) {
    const chunks = readJsonFile(CHUNKS_FILE);
    return chunks.filter((c) => c.document_id === documentId);
  },

  async searchChunks(queryVector, limit = 4) {
    // 1. Try Qdrant first
    try {
      const qdrantResults = await searchSimilarVectors(queryVector, limit);
      if (qdrantResults && qdrantResults.length > 0) {
        return qdrantResults.map((r) => ({
          score: r.score,
          text: r.payload.text,
          title: r.payload.title,
          document_id: r.payload.document_id,
          chunk_index: r.payload.chunk_index,
        }));
      }
    } catch (e) {
      console.warn("[Store] Qdrant search skipped:", e.message);
    }

    // 2. Fall back to local exact cosine similarity
    const chunks = readJsonFile(CHUNKS_FILE);
    if (!chunks || chunks.length === 0) return [];

    const scored = chunks
      .map((c) => ({
        score: cosineSimilarity(queryVector, c.vector),
        text: c.text,
        title: c.title || c.fileName || "Document",
        document_id: c.document_id,
        chunk_index: c.chunk_index,
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
  },

  getStats() {
    const docs = readJsonFile(DOCS_FILE);
    const chunks = readJsonFile(CHUNKS_FILE);

    return {
      total: docs.length,
      completed: docs.filter((d) => d.status === "Completed").length,
      processing: docs.filter((d) => d.status === "Processing").length,
      failed: docs.filter((d) => d.status === "Failed").length,
      totalChunks: chunks.length,
    };
  },
};
