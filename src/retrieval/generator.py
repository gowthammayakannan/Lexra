"""
Lexra - Answer Generator
Behavior like GPT/Gemini:
- General chat: answer naturally in same language
- Document query: use RAG context
- Conversation history: remember context
- Intent detection: auto-detect if doc query needed
"""
import os
import re
from dotenv import load_dotenv
load_dotenv()

SYSTEM_PROMPT = """You are Lexra, an intelligent AI assistant — similar to ChatGPT or Gemini.

Your behavior:
1. GENERAL CHAT: Answer naturally, friendly, concisely. Match the user's language (English, Tamil, Tanglish, Hindi etc.)
2. DOCUMENT QUERIES: When document excerpts are provided, use them to answer. Be precise.
3. LANGUAGE: If user writes in Tamil or Tanglish, respond in the same style.
4. FORMAT: Use markdown for structured answers. Keep responses concise unless detail is asked.
5. NEVER say "Based on the document" or "According to the excerpts" — just answer directly.
6. CASUAL TALK: For greetings, casual questions ("enna pandra", "how are you") — respond naturally, don't search documents.

Examples:
- "hi" → "Hi! How can I help you today?"
- "enna pandra" → "நான் நல்லா இருக்கேன்! என்ன help வேணும்?"
- "what is rent" [with doc] → "The monthly rent is Rs. 5,000, payable on the 1st of every month."
- "summarize" [with doc] → Full document summary
"""

CASUAL_PATTERNS = [
    r"^(hi|hello|hey|sup|yo|hola)[\s!.,]*$",
    r"^(how are you|how r u|wassup|what.s up)[\s!.,?]*$",
    r"^(ok|okay|thanks|thank you|cool|nice|great|good)[\s!.,]*$",
    r"^(enna pandra|enna panra|ena pandre|enna achu|what.s wrong|what happened)[\s!.,?]*$",
    r"^(bye|goodbye|see you|take care)[\s!.,]*$",
    r"^[\W\s]{0,3}$",  # just punctuation/spaces
]

def is_casual_query(query: str) -> bool:
    q = query.lower().strip()
    for pattern in CASUAL_PATTERNS:
        if re.match(pattern, q, re.IGNORECASE):
            return True
    return len(q.split()) <= 2 and not any(kw in q for kw in ["what", "how", "when", "where", "why", "who", "explain", "summarize", "analyze", "rent", "penalty", "clause", "section"])


def build_context(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks):
        source = chunk.get("metadata", {}).get("source", "unknown")
        page = chunk.get("metadata", {}).get("page_num", "?")
        parts.append(f"[{source}, p.{page}]\n{chunk.get('text', '')}")
    return "\n\n---\n\n".join(parts)


def generate_with_groq(
    query: str,
    chunks: list[dict],
    history: list[dict] | None = None
) -> dict:
    """Generate with Groq — with conversation history and smart context"""
    from groq import Groq

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Build messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add conversation history (last 6 turns)
    if history:
        for turn in history[-6:]:
            messages.append({"role": turn["role"], "content": turn["content"]})

    # Decide whether to include doc context
    casual = is_casual_query(query)

    if chunks and not casual:
        context = build_context(chunks)
        user_msg = f"""[Document Context Available]
{context}

---
User question: {query}"""
    else:
        user_msg = query

    messages.append({"role": "user", "content": user_msg})

    res = client.chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=messages,
        max_tokens=600,
        temperature=0.4
    )

    return {
        "answer": res.choices[0].message.content.strip(),
        "sources": [],
        "model": "qwen3.8-27b (groq)",
        "chunk_count": len(chunks)
    }


def generate_with_gemini(
    query: str,
    chunks: list[dict],
    history: list[dict] | None = None
) -> dict:
    """Fallback: Google Gemini"""
    from google import genai

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    models = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash"]

    casual = is_casual_query(query)

    if chunks and not casual:
        context = build_context(chunks)
        prompt = f"{SYSTEM_PROMPT}\n\n[Document Context]\n{context}\n\nQuestion: {query}"
    else:
        prompt = f"{SYSTEM_PROMPT}\n\nUser: {query}"

    for model_name in models:
        try:
            res = client.models.generate_content(model=model_name, contents=prompt)
            return {
                "answer": res.text.strip(),
                "sources": [],
                "model": f"gemini ({model_name})",
                "chunk_count": len(chunks)
            }
        except Exception as e:
            print(f"[Generator] {model_name}: {str(e)[:60]}")
            continue

    raise Exception("All Gemini models unavailable")


def generate_answer(
    query: str,
    chunks: list[dict],
    history: list[dict] | None = None,
    model: str = "default",
    temperature: float = 0.4
) -> dict:
    """Main entry — Groq → Gemini → Mock"""

    if os.getenv("GROQ_API_KEY"):
        try:
            return generate_with_groq(query, chunks, history)
        except Exception as e:
            print(f"[Generator] Groq failed: {e}")

    if os.getenv("GEMINI_API_KEY"):
        try:
            return generate_with_gemini(query, chunks, history)
        except Exception as e:
            print(f"[Generator] Gemini failed: {e}")

    return generate_answer_mock(query, chunks)


def generate_answer_mock(query: str, chunks: list[dict]) -> dict:
    """Offline mock"""
    q = query.lower().strip()

    if is_casual_query(q):
        casual_responses = {
            "hi": "Hi! How can I help you today?",
            "hello": "Hello! What can I do for you?",
            "enna pandra": "நான் நல்லா இருக்கேன்! என்ன help வேணும்?",
        }
        for key, resp in casual_responses.items():
            if key in q:
                return {"answer": resp, "sources": [], "model": "mock", "chunk_count": 0}
        return {"answer": "Hey! How can I help?", "sources": [], "model": "mock", "chunk_count": 0}

    if not chunks:
        return {"answer": "Please upload a document or add an API key for general questions.", "sources": [], "model": "mock", "chunk_count": 0}

    query_words = [w for w in q.split() if len(w) > 3]
    scored = sorted([(sum(1 for w in query_words if w in c["text"].lower()), c) for c in chunks], key=lambda x: x[0], reverse=True)
    best_score, best_chunk = scored[0]

    if best_score == 0:
        return {"answer": "I couldn't find specific information about that in your documents.", "sources": [], "model": "mock", "chunk_count": len(chunks)}

    text = best_chunk["text"].strip()
    sentences = [s.strip() for s in text.replace("\n", " ").split(".") if len(s.strip()) > 15]
    relevant = sorted([(sum(1 for w in query_words if w in s.lower()), s) for s in sentences], key=lambda x: x[0], reverse=True)
    answer = ". ".join(s for _, s in relevant[:2]) + "." if relevant and relevant[0][0] > 0 else sentences[0] + "."
    return {"answer": answer.strip().replace("..", "."), "sources": [], "model": "mock", "chunk_count": len(chunks)}
