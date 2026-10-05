import fs from "fs";
import { cleanText, validateExtractedText } from "./src/services/cleaning.service.js";
import { chunkText, buildChunkObjects, validateChunks } from "./src/services/chunking.service.js";
import { generateChunkEmbeddings } from "./src/services/embedding.service.js";
import { upsertChunks, searchSimilarVectors } from "./src/services/qdrant.service.js";

const raw = fs.readFileSync("../major_project/gehu_data/dataset.json", "utf-8");
const dataset = JSON.parse(raw);

const firstRecord = dataset[0];

const cleaned = validateExtractedText(cleanText(firstRecord.content));
const rawChunks = await chunkText(cleaned);
const chunkObjects = buildChunkObjects(rawChunks, "doc_001", {
  title: firstRecord.title,
  url: firstRecord.url,
  category: firstRecord.category,
});
const validated = validateChunks(chunkObjects);
const chunksWithVectors = await generateChunkEmbeddings(validated);

const count = await upsertChunks(chunksWithVectors);
console.log(`Stored ${count} chunks in Qdrant.\n`);

// Now test retrieval — search using the first chunk's own text as a "query" (sanity check)
console.log("--- Testing retrieval ---");
const queryVector = chunksWithVectors[0].vector;
const results = await searchSimilarVectors(queryVector, 2);

results.forEach((r, i) => {
  console.log(`\nResult ${i + 1} (score: ${r.score.toFixed(4)}):`);
  console.log(r.payload.text.slice(0, 100) + "...");
});