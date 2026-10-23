"""
EXPERIMENT 2 — BM25 Keyword Search
====================================
Goal: Show how BM25 catches what semantic search missed.
      Then compare both side by side.

Run: python experiments/experiment_bm25.py
"""

from rank_bm25 import BM25Okapi
import chromadb

# ── Same documents as Experiment 1 ──────────────────────────────────────────
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

# ── 1. Setup BM25 ────────────────────────────────────────────────────────────
# Tokenize: split each doc into words
tokenized_docs = [doc.lower().split() for doc in documents]
bm25 = BM25Okapi(tokenized_docs)

# ── 2. Setup ChromaDB (semantic) ─────────────────────────────────────────────
client = chromadb.Client()
collection = client.create_collection(name="lexra_bm25_exp")
collection.add(
    documents=documents,
    ids=[f"doc_{i}" for i in range(len(documents))]
)

def bm25_search(query, top_k=2):
    """BM25 keyword search"""
    tokenized_query = query.lower().split()
    scores = bm25.get_scores(tokenized_query)
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    return [(documents[i], round(scores[i], 3)) for i in top_indices]

def semantic_search(query, top_k=2):
    """ChromaDB semantic search"""
    results = collection.query(query_texts=[query], n_results=top_k)
    return [
        (doc, round(1 - dist, 3))
        for doc, dist in zip(results["documents"][0], results["distances"][0])
    ]

# ── 3. Head-to-head comparison ───────────────────────────────────────────────
print("=" * 65)
print("LEXRA — Experiment 2: BM25 vs Semantic — Head to Head")
print("=" * 65)

test_cases = [
    {
        "query": "14(2)(b)",
        "expected": "subletting is strictly prohibited",
        "type": "Exact legal term"
    },
    {
        "query": "Section 14",
        "expected": "subletting is strictly prohibited",
        "type": "Partial clause reference"
    },
    {
        "query": "What happens if someone breaks the contract?",
        "expected": "breach of contract... penalty",
        "type": "Paraphrased semantic query"
    },
    {
        "query": "Can I give my apartment to someone else?",
        "expected": "subletting is strictly prohibited",
        "type": "Paraphrased meaning query"
    },
    {
        "query": "monthly rent amount",
        "expected": "five thousand rupees",
        "type": "Keyword query"
    },
    {
        "query": "terminate the agreement",
        "expected": "thirty days written notice",
        "type": "Direct keyword match"
    },
]

semantic_wins = 0
bm25_wins = 0

for tc in test_cases:
    query = tc["query"]
    expected = tc["expected"]
    qtype = tc["type"]

    sem_results = semantic_search(query)
    bm25_results = bm25_search(query)

    sem_top = sem_results[0][0]
    bm25_top = bm25_results[0][0]

    sem_correct = expected.split()[0].lower() in sem_top.lower()
    bm25_correct = expected.split()[0].lower() in bm25_top.lower()

    if sem_correct:
        semantic_wins += 1
    if bm25_correct:
        bm25_wins += 1

    print(f"\n[{qtype}]")
    print(f"Query: '{query}'")
    print(f"Expected: '...{expected}...'")
    print(f"  Semantic [{sem_results[0][1]}]: {'✅' if sem_correct else '❌'} {sem_top[:70]}...")
    print(f"  BM25     [{bm25_results[0][1]}]: {'✅' if bm25_correct else '❌'} {bm25_top[:70]}...")

print("\n" + "=" * 65)
print(f"SCORECARD:")
print(f"  Semantic wins : {semantic_wins} / {len(test_cases)}")
print(f"  BM25 wins     : {bm25_wins} / {len(test_cases)}")
print("=" * 65)
print("\nKEY INSIGHT:")
print("  → Semantic is better for meaning-based queries")
print("  → BM25 is better for exact terms and clause numbers")
print("  → Neither alone is enough for legal documents")
print("  → Solution: Combine both = Hybrid Search")
print("\nNext step: experiments/experiment_hybrid.py")
print("=" * 65)
