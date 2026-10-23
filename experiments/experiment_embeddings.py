"""
EXPERIMENT 1 — Understanding Embeddings & Semantic Search
==========================================================
Goal: Understand WHY we need hybrid search by seeing where
pure semantic search succeeds and where it fails.

Run: python experiments/experiment_embeddings.py
"""

import chromadb

# ── 1. Setup ChromaDB with built-in embeddings ──────────────────────────────
# ChromaDB uses sentence-transformers internally (all-MiniLM-L6-v2)
# No API key needed — runs locally

client = chromadb.Client()
collection = client.create_collection(name="lexra_experiment")

# ── 2. Sample legal document chunks ─────────────────────────────────────────
# Simulating what we'd extract from law firm PDFs

documents = [
    "The tenant shall pay rent of five thousand rupees on the first day of every month.",
    "In case of breach of contract, the defaulting party shall pay a penalty of ten percent.",
    "The lease agreement shall be valid for a period of eleven months from the date of signing.",
    "Section 14(2)(b) of the agreement states that subletting is strictly prohibited.",
    "Either party may terminate this agreement with thirty days written notice.",
    "The security deposit of fifty thousand rupees shall be refunded within thirty days of vacating.",
    "All disputes shall be resolved through arbitration in accordance with the Arbitration Act.",
    "The landlord shall ensure all electrical fittings are in working condition at the time of possession.",
]

# Add documents to ChromaDB
collection.add(
    documents=documents,
    ids=[f"doc_{i}" for i in range(len(documents))]
)

print("=" * 60)
print("LEXRA — Experiment 1: Semantic Search")
print("=" * 60)
print(f"Loaded {len(documents)} document chunks into ChromaDB\n")

# ── 3. Test queries ──────────────────────────────────────────────────────────

queries = [
    # Semantic query — different words, same meaning
    ("What is the monthly payment amount?", "semantic"),
    # Exact legal term — where semantic might miss
    ("Section 14(2)(b)", "exact_term"),
    # Paraphrased query
    ("Can I give my apartment to someone else?", "paraphrase"),
    # Penalty query
    ("What happens if someone breaks the contract?", "semantic"),
]

for query, query_type in queries:
    print(f"Query ({query_type}): '{query}'")
    print("-" * 50)

    results = collection.query(
        query_texts=[query],
        n_results=2
    )

    for i, (doc, distance) in enumerate(zip(
        results["documents"][0],
        results["distances"][0]
    )):
        similarity = round(1 - distance, 3)
        print(f"  Result {i+1} [score: {similarity}]:")
        print(f"  → {doc[:80]}...")
    print()

# ── 4. Show the problem with pure semantic search ────────────────────────────
print("=" * 60)
print("PROBLEM DEMO: Where semantic search fails")
print("=" * 60)

exact_query = "14(2)(b)"
results = collection.query(query_texts=[exact_query], n_results=1)
doc = results["documents"][0][0]
distance = results["distances"][0][0]
similarity = round(1 - distance, 3)

print(f"\nSearching for exact clause: '{exact_query}'")
print(f"Best match [score: {similarity}]:")
print(f"→ {doc[:100]}")

if "14(2)(b)" in doc:
    print("\n✅ Semantic search FOUND the exact clause")
else:
    print("\n❌ Semantic search MISSED the exact clause!")
    print("   → This is why we need BM25 keyword search alongside semantic search")
    print("   → Hybrid = Semantic + BM25 = best of both worlds")

print("\n" + "=" * 60)
print("Next step: experiments/experiment_bm25.py")
print("=" * 60)
