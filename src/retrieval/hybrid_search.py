"""
Lexra — Hybrid Search Engine
==============================
Combines ChromaDB (semantic) + BM25 (keyword) using
Reciprocal Rank Fusion (RRF) for best-of-both retrieval.

Flow:
  query → [semantic search] ──┐
       → [BM25 search]   ──┤
                             ▼
                        RRF reranking
                             ▼
                        top_k results
"""

from rank_bm25 import BM25Okapi
from typing import Optional


class HybridSearchEngine:
    """
    Hybrid search engine for Lexra.
    Must be initialized with chunks after loading documents.
    """

    def __init__(self, rrf_k: int = 60):
        """
        Args:
            rrf_k: RRF constant (default 60 — standard value)
                   Higher k = less weight on top-ranked results
        """
        self.rrf_k = rrf_k
        self.documents: list[str] = []
        self.doc_ids: list[str] = []
        self.metadatas: list[dict] = []
        self.bm25: Optional[BM25Okapi] = None
        self._is_ready = False

    def index(self, chunks: list[dict]) -> None:
        """
        Build BM25 index from chunks.
        Call this after loading documents into ChromaDB.

        Args:
            chunks: List of {id, text, metadata} dicts
        """
        self.documents = [c["text"] for c in chunks]
        self.doc_ids   = [c["id"] for c in chunks]
        self.metadatas = [c["metadata"] for c in chunks]

        # Tokenize for BM25
        tokenized = [doc.lower().split() for doc in self.documents]
        self.bm25 = BM25Okapi(tokenized)
        self._is_ready = True

        print(f"[HybridSearch] BM25 index built — {len(self.documents)} chunks indexed")

    def bm25_search(self, query: str, top_k: int = 10) -> list[dict]:
        """
        BM25 keyword search.
        Returns top_k results sorted by BM25 score.
        """
        if not self._is_ready:
            raise RuntimeError("Call index() before searching")

        tokenized_query = query.lower().split()
        scores = self.bm25.get_scores(tokenized_query)

        ranked_indices = sorted(
            range(len(scores)),
            key=lambda i: scores[i],
            reverse=True
        )[:top_k]

        return [
            {
                "id":       self.doc_ids[i],
                "text":     self.documents[i],
                "metadata": self.metadatas[i],
                "score":    round(float(scores[i]), 4),
                "method":   "bm25"
            }
            for i in ranked_indices
        ]

    def reciprocal_rank_fusion(
        self,
        semantic_results: list[dict],
        bm25_results: list[dict]
    ) -> list[dict]:
        """
        Combine semantic and BM25 results using RRF.

        RRF formula: score(d) = Σ 1 / (k + rank(d))
        Applied across both result lists.
        """
        rrf_scores: dict[str, float] = {}
        doc_map:    dict[str, dict]  = {}

        # Score from semantic ranks
        for rank, result in enumerate(semantic_results):
            doc_id = result["id"]
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + 1.0 / (self.rrf_k + rank + 1)
            doc_map[doc_id] = result

        # Score from BM25 ranks
        for rank, result in enumerate(bm25_results):
            doc_id = result["id"]
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + 1.0 / (self.rrf_k + rank + 1)
            if doc_id not in doc_map:
                doc_map[doc_id] = result

        # Sort by combined RRF score
        ranked = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

        return [
            {
                **doc_map[doc_id],
                "rrf_score": round(score, 6),
                "method": "hybrid_rrf"
            }
            for doc_id, score in ranked
        ]

    def search(
        self,
        query: str,
        collection,
        top_k: int = 5,
        tenant_id: Optional[str] = None
    ) -> list[dict]:
        """
        Full hybrid search: semantic + BM25 + RRF.

        Args:
            query: User query string
            collection: ChromaDB collection
            top_k: Number of results to return
            tenant_id: Filter by tenant (multi-tenancy)

        Returns:
            List of top_k results sorted by RRF score
        """
        if not self._is_ready:
            raise RuntimeError("Call index() before searching")

        fetch_k = min(top_k * 3, len(self.documents))  # fetch more, rerank to top_k

        # ── Semantic search via ChromaDB ──────────────────────────────────────
        where_filter = {}
        if tenant_id:
            where_filter = {"tenant_id": {"$eq": tenant_id}}

        chroma_results = collection.query(
            query_texts=[query],
            n_results=fetch_k,
            where=where_filter if where_filter else None
        )

        semantic_results = [
            {
                "id":       chroma_results["ids"][0][i],
                "text":     chroma_results["documents"][0][i],
                "metadata": chroma_results["metadatas"][0][i],
                "score":    round(1 - chroma_results["distances"][0][i], 4),
                "method":   "semantic"
            }
            for i in range(len(chroma_results["documents"][0]))
        ]

        # ── BM25 search ───────────────────────────────────────────────────────
        bm25_results = self.bm25_search(query, top_k=fetch_k)

        # Filter by tenant if needed
        if tenant_id:
            bm25_results = [
                r for r in bm25_results
                if r["metadata"].get("tenant_id") == tenant_id
            ]

        # ── RRF fusion ────────────────────────────────────────────────────────
        fused_results = self.reciprocal_rank_fusion(semantic_results, bm25_results)

        return fused_results[:top_k]


if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

    import chromadb
    from src.ingestion.vectorstore import get_chroma_client, get_or_create_collection, add_chunks

    # ── Setup ─────────────────────────────────────────────────────────────────
    client     = get_chroma_client("./data/chroma_db_test")
    collection = get_or_create_collection(client, tenant_id="test_firm")

    test_chunks = [
        {"id": "c1", "text": "The tenant shall pay rent of five thousand rupees on the first day of every month.", "metadata": {"source": "lease.pdf", "page_num": 1, "chunk_index": 0, "tenant_id": "test_firm", "char_count": 82}},
        {"id": "c2", "text": "In case of breach of contract, the defaulting party shall pay a penalty of ten percent.", "metadata": {"source": "lease.pdf", "page_num": 2, "chunk_index": 0, "tenant_id": "test_firm", "char_count": 87}},
        {"id": "c3", "text": "Section 14(2)(b) of the agreement states that subletting is strictly prohibited.", "metadata": {"source": "lease.pdf", "page_num": 3, "chunk_index": 0, "tenant_id": "test_firm", "char_count": 79}},
        {"id": "c4", "text": "Either party may terminate this agreement with thirty days written notice.", "metadata": {"source": "lease.pdf", "page_num": 4, "chunk_index": 0, "tenant_id": "test_firm", "char_count": 72}},
        {"id": "c5", "text": "The security deposit of fifty thousand rupees shall be refunded within thirty days.", "metadata": {"source": "lease.pdf", "page_num": 5, "chunk_index": 0, "tenant_id": "test_firm", "char_count": 81}},
        {"id": "c6", "text": "All disputes shall be resolved through arbitration in accordance with the Arbitration Act.", "metadata": {"source": "lease.pdf", "page_num": 6, "chunk_index": 0, "tenant_id": "test_firm", "char_count": 89}},
    ]

    add_chunks(collection, test_chunks)

    # ── Run hybrid search ─────────────────────────────────────────────────────
    engine = HybridSearchEngine(rrf_k=60)
    engine.index(test_chunks)

    queries = [
        "14(2)(b) subletting clause",
        "monthly rent payment",
        "terminate the agreement",
        "security deposit refund",
    ]

    print("\n" + "=" * 65)
    print("HYBRID SEARCH ENGINE — Live Test")
    print("=" * 65)

    for query in queries:
        print(f"\nQuery: '{query}'")
        results = engine.search(query, collection, top_k=2, tenant_id="test_firm")
        for i, r in enumerate(results):
            print(f"  {i+1}. [rrf:{r['rrf_score']}] {r['text'][:70]}...")

    # Cleanup
    import shutil
    shutil.rmtree("./data/chroma_db_test", ignore_errors=True)
    print("\n[Test] hybrid_search.py ✅")
