import { pipeline } from "@xenova/transformers";
import dotenv from "dotenv";
dotenv.config();

let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    console.log("Loading embedding model (first time only, may take a moment)...");
    embedder = await pipeline("feature-extraction", process.env.EMBEDDING_MODEL);
    console.log("Embedding model loaded.");
  }
  return embedder;
}

export async function generateEmbedding(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export function validateEmbedding(vector) {
  const expectedDim = parseInt(process.env.EMBEDDING_DIMENSION);
  if (!vector || vector.length !== expectedDim) {
    throw new Error(`EMBEDDING_FAILED: Expected ${expectedDim} dimensions, got ${vector?.length}`);
  }
  return vector;
}

export async function generateChunkEmbeddings(chunks) {
  const results = [];
  for (const chunk of chunks) {
    const vector = await generateEmbedding(chunk.text);
    validateEmbedding(vector);
    results.push({ ...chunk, vector });
  }
  return results;
}