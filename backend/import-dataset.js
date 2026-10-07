import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { cleanText, validateExtractedText } from "./src/services/cleaning.service.js";
import { chunkText, buildChunkObjects, validateChunks } from "./src/services/chunking.service.js";
import { generateChunkEmbeddings } from "./src/services/embedding.service.js";
import { store } from "./src/services/store.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function makeDocumentId(url) {
  return "doc-" + crypto.createHash("md5").update(url).digest("hex").slice(0, 10);
}

async function importDataset(limit = 20) {
  const dataPath = path.resolve(__dirname, "../gehu_data/dataset.json");
  if (!fs.existsSync(dataPath)) {
    console.error(`Dataset not found at: ${dataPath}`);
    return;
  }

  const raw = fs.readFileSync(dataPath, "utf-8");
  const dataset = JSON.parse(raw);

  const recordsToProcess = limit ? dataset.slice(0, limit) : dataset;
  console.log(`Loaded ${dataset.length} records from dataset.json. Processing batch of ${recordsToProcess.length}...\n`);

  let totalChunksStored = 0;
  let recordsSucceeded = 0;
  let recordsFailed = 0;

  for (let i = 0; i < recordsToProcess.length; i++) {
    const record = recordsToProcess[i];
    const docId = makeDocumentId(record.url || `item-${i}`);
    const now = new Date().toISOString();

    try {
      const cleaned = validateExtractedText(cleanText(record.content));
      const rawChunks = await chunkText(cleaned);
      const chunkObjects = buildChunkObjects(rawChunks, docId, {
        title: record.title || "University Notice",
        fileName: record.fileName || (record.url ? path.basename(record.url) : "document"),
        category: record.category || "academic",
        url: record.url || null,
      });
      const validated = validateChunks(chunkObjects);
      const chunksWithVectors = await generateChunkEmbeddings(validated);
      const count = await store.storeChunks(chunksWithVectors);

      // Save document record in store
      store.saveDocument({
        id: docId,
        name: record.title || record.fileName || `Document ${i + 1}`,
        type: record.url?.endsWith(".pdf") ? "pdf" : "web",
        fileSize: record.content?.length || 1024,
        uploadedAt: now,
        uploadedBy: "Web Scraper",
        status: "Completed",
        chunkCount: count,
        processingStartTime: now,
        processingEndTime: now,
        errorMessage: null,
        rawText: cleaned,
      });

      totalChunksStored += count;
      recordsSucceeded++;
      console.log(`[${i + 1}/${recordsToProcess.length}] "${record.title?.slice(0, 45)}" — ${count} chunks stored`);
    } catch (err) {
      recordsFailed++;
      console.log(`[${i + 1}/${recordsToProcess.length}] "${record.title?.slice(0, 45)}" — skipped (${err.message})`);
    }
  }

  console.log("\n==================================================");
  console.log("DATASET IMPORT COMPLETE");
  console.log(`Succeeded: ${recordsSucceeded} | Failed/Skipped: ${recordsFailed}`);
  console.log(`Total chunks created and indexed: ${totalChunksStored}`);
  console.log("==================================================");
}

// Pass limit argument if provided: node import-dataset.js [limit]
const limitArg = process.argv[2] ? parseInt(process.argv[2]) : 15;
importDataset(limitArg);