import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader, AlertCircle } from "lucide-react"
import { queryDocuments } from "../api/lexra"
import type { ToastType } from "../api/lexra"
import SourceCard from "./SourceCard"

interface Source { label: string; file: string; page: number; excerpt: string }
interface Message {
  role: "user" | "assistant"
  content: string
  sources?: Source[]
  chunks?: number
  error?: boolean
}

interface Props {
  tenantId: string
  hasDocuments: boolean
  addToast: (type: ToastType, message: string) => void
}

export default function ChatPanel({ tenantId, hasDocuments, addToast }: Props) {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Upload a PDF document to get started. I will answer questions from it with source citations."
  }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  useEffect(() => {
    if (hasDocuments && messages.length === 1) {
      setMessages([{ role: "assistant", content: "Document uploaded. Ask me anything about it." }])
    }
  }, [hasDocuments])

  const send = async () => {
    const query = input.trim()
    if (!query || loading) return
    setMessages(prev => [...prev, { role: "user", content: query }])
    setInput("")
    setLoading(true)
    try {
      const res = await queryDocuments(query, tenantId, 5, true)
      setMessages(prev => [...prev, { role: "assistant", content: res.answer, sources: res.sources, chunks: res.chunks_retrieved }])
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Something went wrong"
      addToast("error", detail)
      setMessages(prev => [...prev, { role: "assistant", content: detail, error: true }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-sm" :
                  msg.error ? "bg-red-900/40 text-red-300 border border-red-800" :
                  "bg-slate-800 text-slate-200 rounded-tl-sm"}`}>
                {msg.error && <AlertCircle size={14} className="inline mr-1" />}
                {msg.content}
              </div>
              {msg.sources && msg.sources.length > 0 && <SourceCard sources={msg.sources} />}
              {msg.chunks !== undefined && <p className="text-xs text-slate-500 mt-1 px-1">{msg.chunks} chunks retrieved</p>}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center shrink-0 mt-1">
                <User size={14} className="text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader size={16} className="animate-spin text-indigo-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="mt-4 flex gap-2">
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder={hasDocuments ? "Ask a question about your documents..." : "Upload a document first..."}
          disabled={!hasDocuments || loading} rows={1}
          className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" />
        <button onClick={send} disabled={!input.trim() || !hasDocuments || loading}
          className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  )
}
