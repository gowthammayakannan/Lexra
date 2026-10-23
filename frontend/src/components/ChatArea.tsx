import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, User, Loader, Scale } from "lucide-react"
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

export default function ChatArea({ tenantId, hasDocuments, addToast }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

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
      const msg = err?.response?.data?.detail || "Something went wrong"
      addToast("error", msg)
      setMessages(prev => [...prev, { role: "assistant", content: msg, error: true }])
    } finally { setLoading(false) }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  const isEmpty = messages.length === 0

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0f]">

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center gap-6 px-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center">
              <Scale size={28} className="text-violet-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white/80 mb-2">Lexra Legal Intelligence</h3>
              <p className="text-sm text-white/30 max-w-sm leading-relaxed">
                {hasDocuments
                  ? "Your documents are ready. Ask anything and get cited answers instantly."
                  : "Upload a legal document to get started. Ask questions, get cited answers."}
              </p>
            </div>
            {hasDocuments && (
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {["What are the termination clauses?", "Summarize the key obligations", "What is the penalty for breach?", "What are the subletting rules?"].map(q => (
                  <button key={q} onClick={() => { setInput(q); }}
                    className="text-left px-4 py-3 rounded-xl bg-white/3 border border-white/6 text-xs text-white/50 hover:text-white/70 hover:bg-white/5 hover:border-violet-500/20 transition-all">
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={14} className="text-violet-400" />
                  </div>
                )}
                <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  {msg.role === "user" ? (
                    <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-sm px-5 py-3 rounded-2xl rounded-tr-md shadow-lg shadow-violet-500/10 leading-relaxed">
                      {msg.content}
                    </div>
                  ) : (
                    <div className={`text-sm leading-relaxed px-5 py-4 rounded-2xl rounded-tl-md border
                      ${msg.error
                        ? "bg-red-500/5 border-red-500/20 text-red-300"
                        : "bg-white/3 border-white/6 text-white/80"
                      }`}>
                      {msg.content}
                    </div>
                  )}
                  {msg.sources && msg.sources.length > 0 && <SourceCard sources={msg.sources} />}
                  {msg.chunks !== undefined && (
                    <p className="text-[10px] text-white/20 mt-1.5 px-1">{msg.chunks} chunks · mock mode</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={14} className="text-white/40" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Sparkles size={14} className="text-violet-400" />
                </div>
                <div className="bg-white/3 border border-white/6 rounded-2xl rounded-tl-md px-5 py-4">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className={`flex items-end gap-3 bg-white/4 border rounded-2xl px-4 py-3 transition-all duration-200
            ${!hasDocuments ? "border-white/5 opacity-50" : "border-white/8 focus-within:border-violet-500/30 focus-within:bg-white/5"}`}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={hasDocuments ? "Ask anything about your documents..." : "Upload a document to start asking questions..."}
              disabled={!hasDocuments || loading}
              rows={1}
              className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none disabled:cursor-not-allowed leading-relaxed py-0.5"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || !hasDocuments || loading}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all">
              {loading ? <Loader size={13} className="text-white animate-spin" /> : <Send size={13} className="text-white" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-white/15 mt-2">Lexra uses hybrid RAG — answers are grounded in your documents</p>
        </div>
      </div>
    </main>
  )
}
