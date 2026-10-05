import fs from "fs";
import crypto from "crypto";
import { cleanText, validateExtractedText } from "./src/services/cleaning.service.js";
import { chunkText, buildChunkObjects, validateChunks } from "./src/services/chunking.service.js";
import { generateChunkEmbeddings } from "./src/services/embedding.service.js";
import { upsertChunks } from "./src/services/qdrant.service.js";

function makeDocumentId(url) {
  return crypto.createHash("md5").update(url).digest("hex").slice(0, 12);
}

async function importDataset() {
  const raw = fs.readFileSync("../major_project/gehu_data/dataset.json", "utf-8");
  const dataset = JSON.parse(raw);

  console.log(`Loaded ${dataset.length} records from dataset.json\n`);

  let totalChunksStored = 0;
  let recordsSucceeded = 0;
  let recordsFailed = 0;
  const failures = [];

  for (let i = 0; i < dataset.length; i++) {
    const record = dataset[i];
    const documentId = makeDocumentId(record.url);

    try {
      const cleaned = validateExtractedText(cleanText(record.content));
      const rawChunks = await chunkText(cleaned);
      const chunkObjects = buildChunkObjects(rawChunks, documentId, {
        title: record.title,
        url: record.url,
        category: record.category,
      });
      const validated = validateChunks(chunkObjects);
      const chunksWithVectors = await generateChunkEmbeddings(validated);
      const count = await upsertChunks(chunksWithVectors);

      totalChunksStored += count;
      recordsSucceeded++;

      console.log(`[${i + 1}/${dataset.length}]  "${record.title?.slice(0, 50)}" — ${count} chunks stored`);
    } catch (err) {
      recordsFailed++;
      failures.push({ url: record.url, title: record.title, error: err.message });
      console.log(`[${i + 1}/${dataset.length}]  "${record.title?.slice(0, 50)}" — skipped (${err.message})`);
    }
  }

  console.log("\n==================================================");
  console.log("IMPORT COMPLETE");
  console.log("==================================================");
  console.log(`Records processed successfully: ${recordsSucceeded}`);
  console.log(`Records failed/skipped: ${recordsFailed}`);
  console.log(`Total chunks stored in Qdrant: ${totalChunksStored}`);

  if (failures.length > 0) {
    fs.writeFileSync("import-failures.json", JSON.stringify(failures, null, 2));
    console.log(`\nFailure details saved to import-failures.json`);
  }
}

importDataset();