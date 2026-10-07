import client from "./src/config/qdrant.js";

async function createCollectionIfMissing() {
  const collectionName = process.env.QDRANT_COLLECTION || "gehu_documents";
  const dimension = parseInt(process.env.EMBEDDING_DIMENSION) || 384;

  try {
    const existing = await client.getCollections();
    const alreadyExists = existing.collections.some((c) => c.name === collectionName);

    if (alreadyExists) {
      console.log(`Collection "${collectionName}" already exists in Qdrant.`);
      return;
    }

    await client.createCollection(collectionName, {
      vectors: {
        size: dimension,
        distance: "Cosine",
      },
    });

    console.log(`Collection "${collectionName}" created successfully (${dimension} dimensions, Cosine distance).`);
  } catch (err) {
    console.error(`Failed to connect or create Qdrant collection: ${err.message}`);
  }
}

createCollectionIfMissing();