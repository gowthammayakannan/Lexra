import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, Loader, ChevronRight } from "lucide-react"
import { AppShell } from "./Dashboard"
import { uploadDocument, listDocuments } from "../api/lexra"
import type { ToastType } from "../api/lexra"

interface Props { addToast: (type: ToastType, msg: string) => void }

export default function DocumentsPage({ addToast }: Props) {
  const [uploading, setUploading] = useState(false)
  const [docs, setDocs] = useState<string[]>([])
  const [totalChunks, setTotalChunks] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const r = await listDocuments("lawfirm_001")
      setDocs(r.documents)
      setTotalChunks(r.total_chunks)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file?.name.endsWith(".pdf")) { addToast("error", "Only PDFs supported"); return }
    setUploading(true)
    try {
      const r = await uploadDocument(file, "lawfirm_001")
      addToast("success", `${r.chunks_added} chunks indexed from ${r.filename}`)
      await load()
    } catch (e: any) {
      addToast("error", e?.response?.data?.detail || "Upload failed")
    } finally { setUploading(false) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, multiple: false
  })

  return (
    <AppShell current="/documents">
      <div className="flex-1 overflow-y-auto p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Documents</h1>
          <p className="text-white/30 text-sm">{totalChunks} chunks indexed across {docs.length} documents</p>
        </motion.div>

        {/* Upload zone */}
        <div {...getRootProps()}
          className={`relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer mb-8 transition-all duration-300 overflow-hidden
            ${isDragActive ? "border-violet-500 bg-violet-500/10" : "border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5"}`}>
          <input {...getInputProps()} />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 pointer-events-none" />
          <motion.div animate={{ y: isDragActive ? -10 : 0 }} className="relative">
            <div className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center transition-all
              ${isDragActive ? "bg-violet-500/30 scale-110" : "bg-white/5"}`}>
              {uploading ? <Loader size={32} className="text-violet-400 animate-spin" /> :
                <Upload size={32} className={isDragActive ? "text-violet-400" : "text-white/25"} />}
            </div>
            <p className="text-lg font-semibold text-white/70 mb-2">
              {isDragActive ? "Drop your PDF here" : uploading ? "Processing..." : "Upload a PDF document"}
            </p>
            <p className="text-sm text-white/25">Drag & drop or click to browse · PDF only</p>
          </motion.div>
        </div>

        {/* Document list */}
        <div className="space-y-3">
          <AnimatePresence>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader size={24} className="text-white/20 animate-spin" />
              </div>
            ) : docs.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 text-white/20">
                <FileText size={40} className="mx-auto mb-4 opacity-30" />
                <p>No documents uploaded yet</p>
              </motion.div>
            ) : docs.map((doc, i) => (
              <motion.div key={doc}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ x: 4 }}
                className="flex items-center gap-4 glass rounded-2xl px-5 py-4 border border-violet-500/10 hover:border-violet-500/20 transition-all cursor-default">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 font-medium truncate">{doc}</p>
                  <p className="text-xs text-white/25 mt-0.5">{totalChunks} chunks · lawfirm_001</p>
                </div>
                <ChevronRight size={16} className="text-white/15" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  )
}




