"""
Lexra - FastAPI Application
"""
import os, sys, shutil, tempfile
from contextlib import asynccontextmanager
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from src.ingestion.loader import process_pdf
from src.ingestion.vectorstore import get_chroma_client, get_or_create_collection, add_chunks, delete_document, get_collection_stats
from src.retrieval.hybrid_search import HybridSearchEngine
from src.retrieval.generator import generate_answer, generate_answer_mock
from src.database.database import create_all_tables, get_db
from src.database.models import User, QueryLog, Document
from src.auth.auth import verify_token

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_all_tables()
    yield

app = FastAPI(title="Lexra", description="Multi-tenant RAG pipeline for legal document QA", version="0.2.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True)

from src.api.auth_routes import router as auth_router
app.include_router(auth_router)

CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma_db")
chroma_client = get_chroma_client(CHROMA_DIR)
_search_engines: dict[str, HybridSearchEngine] = {}
_tenant_chunks: dict[str, list[dict]] = {}
security = HTTPBearer(auto_error=False)

def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    if not credentials:
        return None
    payload = verify_token(credentials.credentials)
    if not payload:
        return None
    return db.query(User).filter(User.email == payload.get("sub")).first()

def get_search_engine(tenant_id: str) -> HybridSearchEngine:
    if tenant_id not in _search_engines:
        _search_engines[tenant_id] = HybridSearchEngine(rrf_k=60)
    return _search_engines[tenant_id]

class HistoryMessage(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    query: str
    tenant_id: str
    top_k: int = 5
    use_mock: bool = False
    history: list[HistoryMessage] = []

class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: list[dict]
    model: str
    chunks_retrieved: int
    tenant_id: str

class UploadResponse(BaseModel):
    filename: str
    tenant_id: str
    chunks_added: int
    total_chunks: int
    message: str

class DocumentListResponse(BaseModel):
    tenant_id: str
    documents: list[str]
    total_chunks: int

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Lexra RAG API", "version": "0.2.0"}

@app.post("/upload", response_model=UploadResponse)
async def upload_document(tenant_id: str, file: UploadFile = File(...), user=Depends(get_optional_user), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        chunks = process_pdf(file_path=tmp_path, tenant_id=tenant_id, chunk_size=500, chunk_overlap=50)
        for chunk in chunks:
            chunk["metadata"]["source"] = file.filename
        collection = get_or_create_collection(chroma_client, tenant_id)
        added = add_chunks(collection, chunks)
        if tenant_id not in _tenant_chunks:
            _tenant_chunks[tenant_id] = []
        _tenant_chunks[tenant_id].extend(chunks)
        engine = get_search_engine(tenant_id)
        engine.index(_tenant_chunks[tenant_id])
        stats = get_collection_stats(collection)
        if user and db:
            doc = Document(user_id=user.id, tenant_id=tenant_id, filename=file.filename, chunks_count=added)
            db.add(doc)
            db.commit()
        return UploadResponse(filename=file.filename, tenant_id=tenant_id, chunks_added=added, total_chunks=stats["total_chunks"], message=f"Successfully processed '{file.filename}' into {added} chunks")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

@app.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest, user=Depends(get_optional_user), db: Session = Depends(get_db)):
    engine = get_search_engine(request.tenant_id)
    collection = get_or_create_collection(chroma_client, request.tenant_id)

    # Try to search if documents are indexed
    chunks = []
    if engine._is_ready:
        try:
            chunks = engine.search(query=request.query, collection=collection, top_k=request.top_k, tenant_id=request.tenant_id)
        except Exception:
            chunks = []
    # If no chunks, Gemini will answer as general AI
    if request.use_mock:
        result = generate_answer_mock(request.query, chunks)
    else:
        history = [{"role": m.role, "content": m.content} for m in request.history]
        result = generate_answer(request.query, chunks, history=history)
    if user and db:
        log = QueryLog(user_id=user.id, tenant_id=request.tenant_id, query=request.query, answer=result["answer"], chunks_retrieved=len(chunks))
        db.add(log)
        db.commit()
    return QueryResponse(query=request.query, answer=result["answer"], sources=result["sources"], model=result["model"], chunks_retrieved=len(chunks), tenant_id=request.tenant_id)

@app.get("/documents", response_model=DocumentListResponse)
def list_documents(tenant_id: str):
    collection = get_or_create_collection(chroma_client, tenant_id)
    if collection.count() == 0:
        return DocumentListResponse(tenant_id=tenant_id, documents=[], total_chunks=0)
    all_docs = collection.get()
    filenames = list(set(m.get("source", "unknown") for m in all_docs.get("metadatas", [])))
    return DocumentListResponse(tenant_id=tenant_id, documents=sorted(filenames), total_chunks=collection.count())

@app.delete("/documents")
def remove_document(tenant_id: str, filename: str):
    collection = get_or_create_collection(chroma_client, tenant_id)
    deleted = delete_document(collection, filename, tenant_id)
    if deleted == 0:
        raise HTTPException(status_code=404, detail=f"Document not found")
    if tenant_id in _tenant_chunks:
        _tenant_chunks[tenant_id] = [c for c in _tenant_chunks[tenant_id] if c["metadata"].get("source") != filename]
        engine = get_search_engine(tenant_id)
        if _tenant_chunks[tenant_id]:
            engine.index(_tenant_chunks[tenant_id])
    return {"message": f"Deleted {deleted} chunks for '{filename}'", "tenant_id": tenant_id}

@app.get("/history")
def get_history(user=Depends(get_optional_user), db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    logs = db.query(QueryLog).filter(QueryLog.user_id == user.id).order_by(QueryLog.created_at.desc()).limit(20).all()
    return [{"id": l.id, "query": l.query, "answer": l.answer[:100] + "..." if l.answer and len(l.answer) > 100 else l.answer, "tenant_id": l.tenant_id, "chunks": l.chunks_retrieved, "created_at": str(l.created_at)} for l in logs]
