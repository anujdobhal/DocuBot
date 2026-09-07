from pydantic import BaseModel
from typing import Optional

class ChunkResponse(BaseModel):
    id: str
    document_id: str
    filename: str
    chunk_index: int
    text: str
    created_at: str

class DocumentResponse(BaseModel):
    document_id: str
    filename: str
    chunk_count: int
    created_at: str

class UploadResponse(BaseModel):
    document_id: str
    filename: str
    chunk_count: int
    message: str

class HealthResponse(BaseModel):
    status: str
    collection: str
    vector_size: int
    embedding_model: str
