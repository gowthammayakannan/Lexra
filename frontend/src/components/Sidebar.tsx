import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Loader, ChevronDown } from "lucide-react"
import { uploadDocument, listDocuments } from "../api/lexra"
import type { DocumentList, ToastType } from "../api/lexra"

interface Props {
  tenantId: string
  onUploadSuccess: (f: string) => void
  addToast: (type: ToastType, message: string) => void
}

export default function Sidebar({ tenantId, onUploadSuccess, addToast }: Props) {
  const [uploading, setUploading] = useState(false)
  const [docs, setDocs] = useState<DocumentList | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [docsOpen, setDocsOpen] = useState(true)

  const loadDocs = async () => {
    setLoadingDocs(true)
    try { setDocs(await listDocuments(tenantId)) } catch {} finally { setLoadingDocs(false) }
  }

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    if (!file.name.endsWith(".pdf")) { addToast("error", "Only PDF files supported"); return }
    setUploading(true)
    try {
      const res = await uploadDocument(file, tenantId)
      addToast("success", `${res.chunks_added} chunks indexed`)
      onUploadSuccess(res.filename)
      await loadDocs()
    } catch (err: any) {
      addToast("error", err?.response?.data?.detail || "Upload failed")
    } finally { setUploading(false) }
  }, [tenantId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, multiple: false
  })

  return (
    <aside className="w-72 h-full flex flex-col border-r border-white/5 bg-[#0d0d15]">
      
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Documents</h2>

        {/* Upload zone */}
        <div {...getRootProps()}
          className={`relative group rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-200
            ${isDragActive
              ? "border-violet-500 bg-violet-500/10"
              : uploading
                ? "border-white/10 bg-white/5"
                : "border-white/10 hover:border-violet-500/50 hover:bg-white/3"
            }`}>
          <input {...getInputProps()} />
          
          <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors
            ${isDragActive ? "bg-violet-500/20" : "bg-white/5 group-hover:bg-violet-500/10"}`}>
            {uploading
              ? <Loader size={18} className="text-violet-400 animate-spin" />
              : <Upload size={18} className={isDragActive ? "text-violet-400" : "text-white/30 group-hover:text-violet-400"} />
            }
          </div>

          {uploading ? (
            <p className="text-xs text-white/40">Processing...</p>
          ) : isDragActive ? (
            <p className="text-xs text-violet-400 font-medium">Drop to upload</p>
          ) : (
            <>
              <p className="text-xs text-white/60 font-medium mb-1">Drop PDF here</p>
              <p className="text-xs text-white/25">or click to browse</p>
            </>
          )}
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-4">
        <button
          onClick={() => { setDocsOpen(!docsOpen); if (!docs) loadDocs() }}
          className="w-full flex items-center justify-between text-xs text-white/40 hover:text-white/60 mb-3 transition-colors">
          <span className="uppercase tracking-widest font-semibold">Uploaded</span>
          <div className="flex items-center gap-2">
            {loadingDocs && <Loader size={12} className="animate-spin" />}
            <ChevronDown size={12} className={`transition-transform ${docsOpen ? "rotate-0" : "-rotate-90"}`} />
          </div>
        </button>

        {docsOpen && (
          <div className="flex flex-col gap-1">
            {!docs || docs.documents.length === 0 ? (
              <p className="text-xs text-white/20 py-2 text-center">No documents yet</p>
            ) : (
              docs.documents.map(doc => (
                <div key={doc}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/3 hover:bg-white/5 transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                    <FileText size={13} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 truncate font-medium">{doc}</p>
                    <p className="text-xs text-white/25 mt-0.5">{docs.total_chunks} chunks</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="px-3 py-2.5 rounded-lg bg-white/3">
          <p className="text-xs text-white/25 font-medium mb-1">Tenant</p>
          <p className="text-xs text-violet-400 font-mono">{tenantId}</p>
        </div>
      </div>
    </aside>
  )
}

