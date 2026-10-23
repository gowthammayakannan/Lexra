"""
Lexra — Vector Store
======================
Manages ChromaDB collections per tenant.
Handles document insertion, deletion, and retrieval.
Multi-tenant: each tenant gets their own collection.
"""

import os
import chromadb
from chromadb.config import Settings


def get_chroma_client(persist_dir: str = "./data/chroma_db") -> chromadb.ClientAPI:
    """
    Get persistent ChromaDB client.
    Data survives restarts — stored on disk.
    """
    os.makedirs(persist_dir, exist_ok=True)
    client = chromadb.PersistentClient(path=persist_dir)
    return client


def get_or_create_collection(client: chromadb.ClientAPI, tenant_id: str):
    """
    Get or create a ChromaDB collection for a tenant.
    Collection name: lexra_{tenant_id}
    """
    collection_name = f"lexra_{tenant_id}"
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}  # cosine similarity
    )
    print(f"[VectorStore] Collection '{collection_name}' ready — {collection.count()} docs")
    return collection


def add_chunks(collection, chunks: list[dict]) -> int:
    """
    Add document chunks to ChromaDB collection.

    Args:
        collection: ChromaDB collection
        chunks: List of {id, text, metadata} dicts from loader.py

    Returns:
        Number of chunks added
    """
    if not chunks:
        return 0

    ids       = [c["id"] for c in chunks]
    documents = [c["text"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]

    # ChromaDB handles embedding generation internally
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )

    print(f"[VectorStore] Added {len(chunks)} chunks → total: {collection.count()}")
    return len(chunks)


def semantic_search(
    collection,
    query: str,
    top_k: int = 5,
    tenant_id: str = None
) -> list[dict]:
    """
    Semantic similarity search in ChromaDB.

    Returns:
        List of {id, text, metadata, score} dicts
    """
    where_filter = {}
    if tenant_id:
        where_filter = {"tenant_id": {"$eq": tenant_id}}

    results = collection.query(
        query_texts=[query],
        n_results=min(top_k, collection.count()),
        where=where_filter if where_filter else None
    )

    output = []
    for i in range(len(results["documents"][0])):
        output.append({
            "id":       results["ids"][0][i],
            "text":     results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "score":    round(1 - results["distances"][0][i], 4)
        })

    return output


def delete_document(collection, source_filename: str, tenant_id: str) -> int:
    """
    Delete all chunks from a specific document for a tenant.
    """
    results = collection.get(
        where={
            "$and": [
                {"tenant_id": {"$eq": tenant_id}},
                {"source": {"$eq": source_filename}}
            ]
        }
    )

    if results["ids"]:
        collection.delete(ids=results["ids"])
        print(f"[VectorStore] Deleted {len(results['ids'])} chunks for '{source_filename}'")
        return len(results["ids"])

    return 0


def get_collection_stats(collection) -> dict:
    """Return basic stats about the collection"""
    return {
        "collection_name": collection.name,
        "total_chunks": collection.count(),
    }


if __name__ == "__main__":
    # Quick test
    from loader import chunk_text

    client = get_chroma_client("./data/chroma_db_test")
    collection = get_or_create_collection(client, tenant_id="lawfirm_001")

    # Add test chunks
    test_chunks = [
        {
            "id": "test_001",
            "text": "The tenant shall pay rent of five thousand rupees every month.",
            "metadata": {"source": "lease.pdf", "page_num": 1, "chunk_index": 0, "tenant_id": "lawfirm_001", "char_count": 62}
        },
        {
            "id": "test_002",
            "text": "Section 14(2)(b) states that subletting is strictly prohibited.",
            "metadata": {"source": "lease.pdf", "page_num": 2, "chunk_index": 0, "tenant_id": "lawfirm_001", "char_count": 62}
        },
        {
            "id": "test_003",
            "text": "Either party may terminate with thirty days written notice.",
            "metadata": {"source": "lease.pdf", "page_num": 3, "chunk_index": 0, "tenant_id": "lawfirm_001", "char_count": 58}
        }
    ]

    add_chunks(collection, test_chunks)

    print("\n--- Semantic Search Test ---")
    results = semantic_search(collection, "monthly rent payment", top_k=2)
    for r in results:
        print(f"  [{r['score']}] {r['text'][:70]}")

    print("\n--- Stats ---")
    stats = get_collection_stats(collection)
    print(f"  {stats}")

    # Cleanup test db
    import shutil
    shutil.rmtree("./data/chroma_db_test", ignore_errors=True)
    print("\n[Test] vectorstore.py ✅")
