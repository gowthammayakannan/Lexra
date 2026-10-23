# Lexra — Legal Document Intelligence

> Multi-tenant RAG pipeline for legal document Q&A — powered by Hybrid Search + Groq AI

![Lexra](https://img.shields.io/badge/Lexra-RAG_Pipeline-6366f1?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.146-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)

---

## What is Lexra?

Lexra is a production-grade **Retrieval Augmented Generation (RAG)** system for legal document analysis. Upload PDFs, ask questions in plain English (or any language), and get precise AI-powered answers.

Unlike basic document search, Lexra uses **Hybrid Search** — combining semantic vector search with BM25 keyword search via Reciprocal Rank Fusion (RRF) — to retrieve the most relevant document chunks before generating answers.

---

## Architecture

```
PDF Upload → Chunking → ChromaDB (vectors) + BM25 Index
                                    ↓
User Query → Hybrid Search (Semantic + BM25 + RRF Reranking)
                                    ↓
              Retrieved Chunks → Groq (Qwen3.8B) → Answer
```

---

## Features

- **Hybrid RAG** — Semantic + BM25 + RRF reranking
- **Multi-tenant** — complete data isolation per tenant
- **Groq AI** — fast inference with Qwen 3.8B
- **JWT Auth** — register/login + Google OAuth
- **Chat persistence** — messages survive navigation
- **GPT-style history** — grouped by date, click to replay
- **React frontend** — dark theme, animations, markdown rendering
- **Docker** — containerized deployment ready

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SQLite |
| Vector DB | ChromaDB |
| Search | sentence-transformers, rank-bm25 |
| AI | Groq API (Qwen 3.8B) |
| Frontend | React, TypeScript, Vite, Tailwind, Framer Motion |
| Auth | JWT + Google OAuth |
| DevOps | Docker, docker-compose |

---

## Local Setup

### Backend

```bash
cd lexra
pip install -r requirements.txt
cp .env.example .env
# Add your GROQ_API_KEY to .env
python run.py
```

### Frontend

```bash
cd lexra/frontend
npm install
cp .env.example .env
# Add VITE_GOOGLE_CLIENT_ID to frontend/.env
npm run dev
```

Open `http://localhost:5173`

---

## Environment Variables

**Backend `.env`:**
```
GROQ_API_KEY=your_groq_key
SECRET_KEY=your_jwt_secret
CHROMA_PERSIST_DIR=./data/chroma_db
DATABASE_URL=sqlite:///./data/lexra.db
```

**Frontend `.env`:**
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register with email/password |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/google` | Login with Google OAuth |
| POST | `/upload` | Upload PDF document |
| POST | `/query` | Query documents with AI |
| GET | `/documents` | List uploaded documents |
| GET | `/history` | Get query history |
| GET | `/health` | Health check |

---

## Docker

```bash
docker-compose up --build
```

---

*Built with hybrid RAG architecture — semantic + BM25 + RRF — for production-grade document intelligence.*
