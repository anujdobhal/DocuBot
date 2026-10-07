# DocuBot

DocuBot is a document-aware RAG (Retrieval-Augmented Generation) project for a college or academic knowledge assistant. It allows users to upload policy and academic documents, split them into searchable chunks, generate embeddings, and answer questions using the most relevant document content.

This repository currently contains:
- a React + Vite frontend for the student chatbot and admin portal
- an Express backend for uploading, processing, indexing, and querying documents
- a Qdrant vector database layer for semantic retrieval
- a JSON-based local store for document and chunk metadata during development

---

## Project overview

The system follows a standard RAG workflow:

1. A document is uploaded or seeded into the backend.
2. Text is extracted from the file.
3. The content is cleaned and normalized.
4. The text is split into smaller overlapping chunks.
5. Each chunk is vectorized using an embedding model.
6. The chunks are stored in a search index and in local JSON files.
7. A user question is embedded and matched against the indexed chunks.
8. The most relevant chunks are used as context to answer the question.

This makes DocuBot useful for academic and administrative questions such as fee policies, regulations, course details, hostel policies, and similar college documentation.

---

## Current progress

The project is in a working prototype stage with the core data flow already implemented:

- frontend chat and admin views are present
- backend APIs are active for document upload, document listing, reprocessing, and chat/search
- the ingestion pipeline is implemented end-to-end
- sample academic documents are automatically seeded when the backend starts with no stored records
- chunking and embedding generation are working with the `Xenova/all-MiniLM-L6-v2` model
- vectors are being stored in Qdrant, with a local JSON fallback for resilience and debugging

This is not a final production deployment yet, but the basic RAG workflow is already functional and useful for document-based Q&A.

---

## Repository structure

```text
DocuBot/
├── backend/
│   ├── data/
│   │   ├── documents.json
│   │   └── chunks.json
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   └── package.json
├── src/
│   ├── components/
│   ├── pages/
│   └── App.jsx
├── .env.example
├── package.json
├── vite.config.js
├── README.md
├── index.html
└── .gitignore
```

---

## Tech stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js + Express
- Document parsing: `pdf-parse`, `mammoth`
- Chunking: `@langchain/textsplitters`
- Embeddings: `@xenova/transformers`
- Vector database: Qdrant
- Local persistence: JSON files under `backend/data`

---

## Backend processing flow

The ingestion flow is implemented in the backend routes and services:

1. `POST /api/documents/upload`
   - receives a PDF, DOCX, or TXT file
   - creates a document entry with `Processing` status

2. `extractTextFromFile()`
   - extracts raw text from the uploaded file

3. `cleanText()` and `validateExtractedText()`
   - clean and validate the extracted text before indexing

4. `chunkText()`
   - splits the cleaned text into smaller chunks using `RecursiveCharacterTextSplitter`
   - default settings: `chunkSize = 500` and `chunkOverlap = 80`

5. `generateChunkEmbeddings()`
   - creates a 384-dimensional embedding for each chunk using the Xenova sentence-transformer model

6. `store.storeChunks()`
   - writes the chunk metadata locally and upserts vectors into Qdrant

7. `POST /api/chat`
   - embeds the user's question
   - searches for similar chunks
   - returns the matching passages as the retrieval context

---

## Where and how chunks are being stored

Chunks are stored in two layers.

### 1) Local JSON storage

File: `backend/data/chunks.json`

This file keeps the chunk records in plain JSON so they remain easy to inspect, debug, and recover without the Qdrant service. Each chunk stores metadata such as:
- `document_id`
- `chunk_index`
- `text`
- `title`
- `fileName`
- `fileType`
- `category`
- `vector`

The document metadata is kept separately in:
- `backend/data/documents.json`

This file stores document id, name, type, upload date, status, chunk count, and processing metadata.

### 2) Qdrant vector index

The backend uses Qdrant through `backend/src/services/qdrant.service.js`.

The relevant configuration is in `.env.example`:
- `QDRANT_URL=http://localhost:6333`
- `QDRANT_COLLECTION=gehu_documents`
- `EMBEDDING_DIMENSION=384`

When a document is processed, each chunk is uploaded as a Qdrant point with:
- a vector embedding
- `document_id`
- `chunk_index`
- the raw text
- file metadata such as title and file name

The system uses cosine similarity for retrieval. If Qdrant is unavailable, the app falls back to comparing vectors using the local JSON chunk records in `backend/data/chunks.json`.

In short: chunks are saved in JSON for persistence and also indexed in Qdrant for semantic search.

---

## Run the project

### Install dependencies

```bash
npm install
npm --prefix backend install
```

### Configure the environment

```bash
cp .env.example .env
```

Make sure the backend variables match the local setup, especially:
- `PORT=5000`
- `QDRANT_URL=http://localhost:6333`
- `QDRANT_COLLECTION=gehu_documents`
- `EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2`

### Start the backend

```bash
npm run backend
```

The backend runs at `http://localhost:5000`.

### Start the frontend

```bash
npm run dev
```

The frontend is typically served at `http://localhost:5173`.

---

## Notes on current behavior

- The backend auto-seeds a few sample documents on first run if the store is empty.
- Uploaded files are restricted to `.pdf`, `.docx`, and `.txt` with a 25MB limit.
- The project currently focuses on a working document search and Q&A flow rather than a full production deployment pipeline.

---

## Summary

DocuBot is a working document-based RAG prototype built for academic and administrative information retrieval. The project has already implemented the main flow: document upload, extraction, cleaning, chunking, embedding generation, vector indexing, and question answering. Chunks are currently stored both in the local JSON store at `backend/data/chunks.json` and in the Qdrant vector collection `gehu_documents`, giving the project a reliable local fallback and a fast semantic search backend.
