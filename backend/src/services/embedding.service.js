import { pipeline } from "@xenova/transformers";
import "../config/env.js";

const MODEL_NAME = process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2";
const EXPECTED_DIM = parseInt(process.env.EMBEDDING_DIMENSION) || 384;

let embedder = null;

export async function getEmbedder() {
  if (!embedder) {
    console.log(`[Embedding] Loading embedding model '${MODEL_NAME}'...`);
    embedder = await pipeline("feature-extraction", MODEL_NAME);
    console.log("[Embedding] Embedding model loaded successfully.");
  }
  return embedder;
}

export async function generateEmbedding(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Text must be a non-empty string to generate embedding.");
  }
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export function validateEmbedding(vector) {
  if (!vector || vector.length !== EXPECTED_DIM) {
    throw new Error(`EMBEDDING_FAILED: Expected ${EXPECTED_DIM} dimensions, got ${vector?.length}`);
  }
  return vector;
}

export async function generateChunkEmbeddings(chunks) {
  const results = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const vector = await generateEmbedding(chunk.text);
    validateEmbedding(vector);
    results.push({ ...chunk, vector });
  }
  return results;
}