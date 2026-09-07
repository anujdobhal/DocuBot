from datetime import datetime, timezone
from uuid import uuid4

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

from app.config import COLLECTION_NAME, QDRANT_DIR
from app.services.embeddings import embed_texts, vector_size

client = QdrantClient(path=str(QDRANT_DIR))

def ensure_collection() -> None:
    collections = {c.name for c in client.get_collections().collections}
    if COLLECTION_NAME not in collections:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=vector_size(), distance=Distance.COSINE),
        )

def add_document(document_id: str, filename: str, chunks: list[str]) -> int:
    ensure_collection()
    vectors = embed_texts(chunks)
    created_at = datetime.now(timezone.utc).isoformat()

    points = []
    for index, (text, vector) in enumerate(zip(chunks, vectors)):
        points.append(
            PointStruct(
                id=str(uuid4()),
                vector=vector,
                payload={
                    "document_id": document_id,
                    "filename": filename,
                    "chunk_index": index,
                    "text": text,
                    "created_at": created_at,
                },
            )
        )

    if points:
        client.upsert(collection_name=COLLECTION_NAME, points=points, wait=True)

    return len(points)

def delete_document(document_id: str) -> None:
    ensure_collection()
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="document_id",
                    match=MatchValue(value=document_id),
                )
            ]
        ),
        wait=True,
    )

def list_chunks(limit: int = 200, offset=None):
    ensure_collection()
    points, next_offset = client.scroll(
        collection_name=COLLECTION_NAME,
        limit=limit,
        offset=offset,
        with_payload=True,
        with_vectors=False,
    )
    return points, next_offset

def count_chunks() -> int:
    ensure_collection()
    return client.count(collection_name=COLLECTION_NAME, exact=True).count
