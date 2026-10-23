import { useState, useRef, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Sparkles, User, Loader, Scale, Paperclip, X, FileText, CheckCircle, Trash2 } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { AppShell } from "./Dashboard"
import { queryDocuments, uploadDocument } from "../api/lexra"
import type { ToastType } from "../api/lexra"

interface Msg { role: "user" | "assistant"; content: string; error?: boolean }
interface Props { addToast: (type: ToastType, msg: string) => void }

const suggestions = [
  "What are the subletting rules?",
  "What is the penalty for breach?",
  "What is the notice period?",
  "What does the security deposit say?",
]

export default function ChatPage({ addToast }: Props) {
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const saved = sessionStorage.getItem("lexra_chat_messages")
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(() =>
    sessionStorage.getItem("lexra_uploaded_file") || null
  )
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Persist messages to sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem("lexra_chat_messages", JSON.stringify(messages)) } catch {}
  }, [messages])

  // Persist uploadedFile
  useEffect(() => {
    if (uploadedFile) sessionStorage.setItem("lexra_uploaded_file", uploadedFile)
    else sessionStorage.removeItem("lexra_uploaded_file")
  }, [uploadedFile])

  // Prefill from history page
  useEffect(() => {
    const prefill = sessionStorage.getItem("lexra_prefill_query")
    if (prefill) {
      sessionStorage.removeItem("lexra_prefill_query")
      send(prefill)
    }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // Handle file upload
  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".pdf")) { addToast("error", "Only PDF files supported"); return }
    setUploading(true)
    setMessages(prev => [...prev, {
      role: "user",
      content: `📎 Uploading: ${file.name}`
    }])
    try {
      const res = await uploadDocument(file, "lawfirm_001")
      setUploadedFile(res.filename)
      addToast("success", `${res.chunks_added} chunks indexed`)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `✅ **${res.filename}** uploaded. You can now ask questions about this document.`
      }])
    } catch (err: any) {
      addToast("error", err?.response?.data?.detail || "Upload failed")
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Upload failed. Please try again.",
        error: true
      }])
    } finally { setUploading(false) }
  }, [addToast])

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) handleFile(files[0])
  }, [handleFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, multiple: false, noClick: true
  })

  const send = async (q?: string) => {
    const query = (q || input).trim()
    if (!query || loading) return
    setMessages(prev => [...prev, { role: "user", content: query }])
    setInput("")
    setLoading(true)
    try {
      const hist = messages
        .filter(m => !m.content.startsWith("📎"))
        .slice(-8)
        .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
      const res = await queryDocuments(query, "lawfirm_001", 5, false, hist)
      setMessages(prev => [...prev, { role: "assistant", content: res.answer }])
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Something went wrong."
      addToast("error", msg)
      setMessages(prev => [...prev, { role: "assistant", content: msg, error: true }])
    } finally { setLoading(false) }
  }

  return (
    <AppShell current="/chat">
      <div className="flex-1 flex flex-col overflow-hidden" {...getRootProps()}>
        <input {...getInputProps()} />

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-emerald-500/10 border-2 border-dashed border-emerald-500/50 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <FileText size={48} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-emerald-300 text-lg font-semibold">Drop PDF to upload</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="px-8 py-4 border-b border-white/5 flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold">Lexra Chat</h1>
            <p className="text-xs text-white/30">Chat or upload a document to analyze</p>
          </div>
          {uploadedFile && (
            <div className="ml-auto flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <CheckCircle size={12} />
              <span className="truncate max-w-32">{uploadedFile}</span>
              <button onClick={() => setUploadedFile(null)} className="text-emerald-400/50 hover:text-emerald-400">
                <X size={12} />
              </button>
            </div>
          )}
          {messages.length > 0 && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setMessages([]); setUploadedFile(null); sessionStorage.removeItem("lexra_chat_messages") }}
              className={`${uploadedFile ? "ml-2" : "ml-auto"} flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all`}>
              <Trash2 size={12} /> New chat
            </motion.button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/15 flex items-center justify-center mb-6">
                <Scale size={32} className="text-emerald-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white/70 mb-2">Ask me anything</h3>
              <p className="text-sm text-white/25 mb-3 text-center max-w-sm">
                Chat with AI or upload a PDF to analyze your documents
              </p>
              <p className="text-xs text-white/15 mb-10 flex items-center gap-1">
                <Paperclip size={11} /> Attach PDF using the button below
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
                {suggestions.map(s => (
                  <motion.button key={s} onClick={() => send(s)}
                    whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                    className="text-left glass border border-white/6 rounded-2xl px-4 py-3 text-xs text-white/45 hover:text-white/70 hover:border-emerald-500/20 transition-all">
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={15} className="text-emerald-400" />
                      </div>
                    )}
                    <div className={`max-w-[78%] text-sm leading-relaxed px-5 py-4 rounded-2xl whitespace-pre-wrap
                      ${msg.role === "user"
                        ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-md shadow-lg shadow-emerald-500/15"
                        : msg.error
                          ? "bg-red-500/5 border border-red-500/20 text-red-300 rounded-tl-md"
                          : "bg-white/4 border border-white/8 text-white/85 rounded-tl-md"}`}>
                      {msg.role === "assistant" && !msg.error
                          ? <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                          : msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0 mt-0.5">
                        <User size={14} className="text-white/35" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Sparkles size={15} className="text-emerald-400" />
                  </div>
                  <div className="glass border border-white/8 rounded-2xl rounded-tl-md px-5 py-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.span key={i} className="w-2 h-2 bg-emerald-400 rounded-full"
                          animate={{ y: [0, -8, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="p-6 border-t border-white/5 shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end gap-2 glass border border-white/8 rounded-2xl px-4 py-3 focus-within:border-emerald-500/30 transition-colors">

              {/* Upload button */}
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Upload PDF"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 border border-white/8 flex items-center justify-center shrink-0 transition-all disabled:opacity-40">
                {uploading
                  ? <Loader size={14} className="text-emerald-400 animate-spin" />
                  : <Paperclip size={14} className="text-white/35 hover:text-emerald-400" />
                }
              </motion.button>
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
                onChange={e => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = "" }}} />

              {/* Text input */}
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }}}
                placeholder="Ask anything or drop a PDF to upload..."
                disabled={loading || uploading}
                rows={1}
                className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none disabled:cursor-not-allowed py-0.5"
              />

              {/* Send button */}
              <motion.button onClick={() => send()} disabled={!input.trim() || loading || uploading}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 disabled:opacity-30 transition-all">
                {loading ? <Loader size={13} className="text-white animate-spin" /> : <Send size={13} className="text-white" />}
              </motion.button>
            </div>
            <p className="text-center text-[10px] text-white/12 mt-2">Powered by Hybrid RAG + Groq · General & document queries supported</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
