import client from "./src/config/qdrant.js";

async function testConnection() {
  try {
    const result = await client.getCollections();
    console.log("Connected to Qdrant successfully!");
    console.log("Existing collections:", result.collections);
  } catch (err) {
    console.error("Failed to connect to Qdrant:", err.message);
  }
}

testConnection();