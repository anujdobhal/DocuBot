import fs from "fs";
import { cleanText, validateExtractedText } from "./src/services/cleaning.service.js";
import { chunkText, buildChunkObjects, validateChunks } from "./src/services/chunking.service.js";

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

console.log(`Produced ${validated.length} chunks from this document.\n`);
console.log("--- First chunk ---");
console.log(validated[0]);
console.log("\n--- Second chunk (if exists) ---");
console.log(validated[1] || "(only 1 chunk produced)");