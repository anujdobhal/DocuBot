# RAG Admin Portal

Local-first administration portal for a RAG chatbot.

## Current capabilities
- Upload PDF, DOCX, and TXT files
- Extract text
- Split text into overlapping chunks
- Generate local embeddings
- Store chunk vectors and metadata in Qdrant local storage
- View stored chunks
- Delete individual documents and all of their chunks
- Search/filter the chunk table

## Architecture
Browser -> FastAPI -> document extraction -> chunking -> embedding -> Qdrant

Qdrant runs in local persistent mode under `data/qdrant/`; no separate Qdrant server is required for this first phase.

## Run on Windows

1. Install Python 3.11+.
2. Open PowerShell in this folder.
3. Run:
   `Set-ExecutionPolicy -Scope Process Bypass`
   `./setup.ps1`
4. Start:
   `./run.ps1`
5. Open:
   `http://127.0.0.1:8000`

The first upload can take longer because Sentence Transformers downloads the embedding model once.

## Important
This project intentionally keeps the LLM out of the ingestion/admin layer. A future Llama 3.2 1B inference service can consume retrieved chunks later without changing the upload pipeline.
