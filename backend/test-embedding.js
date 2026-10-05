import fs from "fs";
import { cleanText, validateExtractedText } from "./src/services/cleaning.service.js";
import { chunkText, buildChunkObjects, validateChunks } from "./src/services/chunking.service.js";
import { generateChunkEmbeddings } from "./src/services/embedding.service.js";

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

console.log(`Generating embeddings for ${validated.length} chunks...\n`);

const chunksWithVectors = await generateChunkEmbeddings(validated);

console.log("--- First chunk with embedding ---");
console.log("Text:", chunksWithVectors[0].text.slice(0, 80) + "...");
console.log("Vector length:", chunksWithVectors[0].vector.length);
console.log("First 5 numbers of the vector:", chunksWithVectors[0].vector.slice(0, 5));