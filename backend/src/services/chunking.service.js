import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "../config/env.js";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: parseInt(process.env.CHUNK_SIZE) || 500,
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 80,
  separators: ["\n\n", "\n", ". ", " ", ""],
});

export async function chunkText(cleanedText) {
  const rawChunks = await splitter.splitText(cleanedText);
  return rawChunks;
}

export function buildChunkObjects(rawChunks, documentId, docMeta = {}) {
  return rawChunks.map((text, index) => ({
    document_id: documentId,
    chunk_index: index,
    text: text.trim(),
    ...docMeta, // title, url, category, type — passed in from the record
  }));
}

export function validateChunks(chunks) {
  if (!chunks || chunks.length === 0) {
    throw new Error("CHUNKING_FAILED: No chunks were produced");
  }
  const meaningful = chunks.filter(c => c.text.length > 10);
  if (meaningful.length === 0) {
    throw new Error("CHUNKING_FAILED: All chunks were empty or too short");
  }
  return meaningful;
}