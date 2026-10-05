import { generateEmbedding } from "./src/services/embedding.service.js";
import { searchSimilarVectors } from "./src/services/qdrant.service.js";

async function askQuestion(question) {
  console.log(`\n=== Question: "${question}" ===`);

  const queryVector = await generateEmbedding(question);
  const results = await searchSimilarVectors(queryVector, 3);

  results.forEach((r, i) => {
    console.log(`\nResult ${i + 1} (score: ${r.score.toFixed(4)}) — from "${r.payload.title}"`);
    console.log(r.payload.text.slice(0, 200) + "...");
  });
}

await askQuestion("What is the hostel fee at GEHU?");
await askQuestion("What documents are required for admission?");
await askQuestion("What is the capital of France?"); // should return low scores — unrelated question