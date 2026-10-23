export type ToastType = "success" | "error" | "info"
import axios from "axios"

const BASE = import.meta.env.VITE_API_URL || "/api"

const getHeaders = () => {
  const token = localStorage.getItem("lexra_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface UploadResponse { filename: string; tenant_id: string; chunks_added: number; total_chunks: number; message: string }
export interface Source { label: string; file: string; page: number; excerpt: string }
export interface QueryResponse { query: string; answer: string; sources: Source[]; model: string; chunks_retrieved: number; tenant_id: string }
export interface DocumentList { tenant_id: string; documents: string[]; total_chunks: number }
export interface AuthResponse { token: string; email: string; message: string }

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await axios.post(`${BASE}/auth/login`, { email, password })
  return res.data
}

export const register = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await axios.post(`${BASE}/auth/register`, { email, password })
  return res.data
}

export const uploadDocument = async (file: File, tenantId: string): Promise<UploadResponse> => {
  const form = new FormData()
  form.append("file", file)
  const res = await axios.post(`${BASE}/upload?tenant_id=${tenantId}`, form, { headers: { "Content-Type": "multipart/form-data", ...getHeaders() } })
  return res.data
}

export interface HistoryMessage { role: string; content: string }

export const queryDocuments = async (
  query: string,
  tenantId: string,
  topK = 5,
  useMock = false,
  history: HistoryMessage[] = []
): Promise<QueryResponse> => {
  const res = await axios.post(`${BASE}/query`, {
    query,
    tenant_id: tenantId,
    top_k: topK,
    use_mock: useMock,
    history
  }, { headers: getHeaders() })
  return res.data
}

export const listDocuments = async (tenantId: string): Promise<DocumentList> => {
  const res = await axios.get(`${BASE}/documents?tenant_id=${tenantId}`, { headers: getHeaders() })
  return res.data
}

export const deleteDocument = async (tenantId: string, filename: string): Promise<void> => {
  await axios.delete(`${BASE}/documents?tenant_id=${tenantId}&filename=${filename}`, { headers: getHeaders() })
}

export const getHistory = async (): Promise<any[]> => {
  const res = await axios.get(`${BASE}/history`, { headers: getHeaders() })
  return res.data
}


export const googleAuth = async (credential: string): Promise<AuthResponse> => {
  const res = await axios.post(`${BASE}/auth/google`, { credential })
  return res.data
}
