import client from "./src/config/qdrant.js";
import dotenv from "dotenv";
dotenv.config();

function looksGarbled(text) {
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  if (lines.length === 0) return true;
  const avgLineLength = lines.reduce((sum, l) => sum + l.length, 0) / lines.length;
  return avgLineLength < 4; // short, fragmented lines = likely scrambled table/scan noise
}

async function diagnose() {
  const COLLECTION = process.env.QDRANT_COLLECTION;

  // Scroll through ALL stored points
  let offset = null;
  let total = 0;
  let garbledCount = 0;
  const garbledDocs = new Set();
  const categoryCounts = {};
  const categoryGarbledCounts = {};

  do {
    const res = await client.scroll(COLLECTION, {
      limit: 200,
      offset,
      with_payload: true,
    });

    for (const point of res.points) {
      total++;
      const cat = point.payload.category || "unknown";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      if (looksGarbled(point.payload.text)) {
        garbledCount++;
        garbledDocs.add(point.payload.title);
        categoryGarbledCounts[cat] = (categoryGarbledCounts[cat] || 0) + 1;
      }
    }

    offset = res.next_page_offset;
  } while (offset !== null && offset !== undefined);

  console.log(`\nTotal chunks scanned: ${total}`);
  console.log(`Garbled/suspicious chunks: ${garbledCount} (${((garbledCount/total)*100).toFixed(1)}%)`);
  console.log(`\nDocuments affected (${garbledDocs.size}):`);
  garbledDocs.forEach(t => console.log(` - ${t}`));

  console.log(`\n--- Chunks per category ---`);
  console.log(categoryCounts);
  console.log(`\n--- Garbled chunks per category ---`);
  console.log(categoryGarbledCounts);
}

diagnose();