import client from "./../config/qdrant.js";
import crypto from "crypto";

const COLLECTION = process.env.QDRANT_COLLECTION || "gehu_documents";
const DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION) || 384;

let isQdrantAvailable = null;

export async function checkQdrantConnection() {
  try {
    await client.getCollections();
    isQdrantAvailable = true;
    return true;
  } catch (err) {
    isQdrantAvailable = false;
    return false;
  }
}

export async function ensureCollectionExists() {
  try {
    const isConnected = await checkQdrantConnection();
    if (!isConnected) return false;

    const existing = await client.getCollections();
    const alreadyExists = existing.collections.some((c) => c.name === COLLECTION);

    if (!alreadyExists) {
      await client.createCollection(COLLECTION, {
        vectors: {
          size: DIMENSION,
          distance: "Cosine",
        },
      });
      console.log(`[Qdrant] Collection "${COLLECTION}" created.`);
    }
    return true;
  } catch (err) {
    console.warn("[Qdrant] Failed to verify/create collection:", err.message);
    return false;
  }
}

export async function upsertChunks(chunksWithVectors) {
  try {
    const available = await checkQdrantConnection();
    if (!available) {
      console.warn("[Qdrant] Qdrant unavailable, skipping remote Qdrant upsert.");
      return 0;
    }

    await ensureCollectionExists();

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
        fileName: chunk.fileName || null,
      },
    }));

    await client.upsert(COLLECTION, { points });
    console.log(`[Qdrant] Stored ${points.length} vectors in collection '${COLLECTION}'.`);
    return points.length;
  } catch (err) {
    console.warn("[Qdrant] Error upserting chunks:", err.message);
    return 0;
  }
}

export async function searchSimilarVectors(queryVector, limit = 5) {
  try {
    const available = await checkQdrantConnection();
    if (!available) return [];

    const results = await client.query(COLLECTION, {
      query: queryVector,
      limit,
      with_payload: true,
    });
    return results.points || [];
  } catch (err) {
    console.warn("[Qdrant] Search error:", err.message);
    return [];
  }
}

export async function deleteDocumentVectors(documentId) {
  try {
    const available = await checkQdrantConnection();
    if (!available) return;

    await client.delete(COLLECTION, {
      filter: {
        must: [{ key: "document_id", match: { value: documentId } }],
      },
    });
  } catch (err) {
    console.warn("[Qdrant] Delete error:", err.message);
  }
}