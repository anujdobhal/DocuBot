import client from "./../config/qdrant.js";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

const COLLECTION = process.env.QDRANT_COLLECTION;

export async function upsertChunks(chunksWithVectors) {
  const points = chunksWithVectors.map((chunk) => ({
    id: crypto.randomUUID(),
    vector: chunk.vector,
    payload: {
      document_id: chunk.document_id,
      chunk_index: chunk.chunk_index,
      text: chunk.text,
      title: chunk.title || null,
      url: chunk.url || null,
      category: chunk.category || null,
    },
  }));

  await client.upsert(COLLECTION, { points });
  return points.length;
}

export async function searchSimilarVectors(queryVector, limit = 5) {
  const results = await client.query(COLLECTION, {
    query: queryVector,
    limit,
    with_payload: true,
  });
  return results.points;
}

export async function deleteDocumentVectors(documentId) {
  await client.delete(COLLECTION, {
    filter: {
      must: [{ key: "document_id", match: { value: documentId } }],
    },
  });
}