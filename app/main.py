from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import (
    ALLOWED_EXTENSIONS,
    MAX_UPLOAD_MB,
    COLLECTION_NAME,
    EMBEDDING_MODEL,
)
from app.schemas import UploadResponse, DocumentResponse, HealthResponse
from app.services.extractor import extract_text
from app.services.chunker import chunk_text
from app.services.qdrant_store import (
    ensure_collection,
    add_document,
    delete_document,
    list_chunks,
    count_chunks,
)
from app.services.embeddings import vector_size

app = FastAPI(
    title="RAG Admin Portal",
    version="1.0.0",
    description="Local document ingestion and Qdrant administration layer.",
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.on_event("startup")
def startup():
    ensure_collection()

@app.get("/", include_in_schema=False)
def home():
    return FileResponse("app/static/index.html")

@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        collection=COLLECTION_NAME,
        vector_size=vector_size(),
        embedding_model=EMBEDDING_MODEL,
    )

@app.post("/api/documents/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    filename = Path(file.filename or "unknown").name
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Only PDF, DOCX, and TXT files are supported.")

    content = await file.read()
    if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(413, f"Maximum file size is {MAX_UPLOAD_MB} MB.")

    document_id = str(uuid4())
    temp_path = Path("uploads") / f"{document_id}{suffix}"

    try:
        temp_path.write_bytes(content)
        text = extract_text(temp_path)

        if not text.strip():
            raise HTTPException(400, "No extractable text was found in the document.")

        chunks = chunk_text(text)
        if not chunks:
            raise HTTPException(400, "Document produced zero chunks.")

        count = add_document(document_id, filename, chunks)

        return UploadResponse(
            document_id=document_id,
            filename=filename,
            chunk_count=count,
            message="Document processed and stored in Qdrant.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, f"Document processing failed: {exc}") from exc
    finally:
        if temp_path.exists():
            temp_path.unlink()

@app.get("/api/chunks")
def get_chunks(
    limit: int = Query(200, ge=1, le=1000),
):
    points, next_offset = list_chunks(limit=limit)
    items = []
    for p in points:
        payload = p.payload or {}
        items.append({
            "id": str(p.id),
            "document_id": payload.get("document_id"),
            "filename": payload.get("filename"),
            "chunk_index": payload.get("chunk_index"),
            "text": payload.get("text"),
            "created_at": payload.get("created_at"),
        })

    return {
        "items": items,
        "count": len(items),
        "total_chunks": count_chunks(),
        "next_offset": next_offset,
    }

@app.delete("/api/documents/{document_id}", status_code=204)
def delete_document_endpoint(document_id: str):
    delete_document(document_id)
    return None

@app.get("/api/documents")
def get_documents():
    # Build a document-level view from Qdrant payloads.
    points, _ = list_chunks(limit=1000)
    docs = {}

    for p in points:
        payload = p.payload or {}
        doc_id = payload.get("document_id")
        if not doc_id:
            continue

        if doc_id not in docs:
            docs[doc_id] = {
                "document_id": doc_id,
                "filename": payload.get("filename"),
                "chunk_count": 0,
                "created_at": payload.get("created_at"),
            }

        docs[doc_id]["chunk_count"] += 1

    return {"items": list(docs.values()), "count": len(docs)}
