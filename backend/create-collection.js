import client from "./src/config/qdrant.js";
import dotenv from "dotenv";
dotenv.config();

async function createCollectionIfMissing() {
  const collectionName = process.env.QDRANT_COLLECTION;
  const dimension = parseInt(process.env.EMBEDDING_DIMENSION);

  const existing = await client.getCollections();
  const alreadyExists = existing.collections.some(c => c.name === collectionName);

  if (alreadyExists) {
    console.log(`Collection "${collectionName}" already exists — skipping creation.`);
    return;
  }

  await client.createCollection(collectionName, {
    vectors: {
      size: dimension,
      distance: "Cosine",
    },
  });

  console.log(`Collection "${collectionName}" created successfully (${dimension} dimensions, cosine distance).`);
}

createCollectionIfMissing();