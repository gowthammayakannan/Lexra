import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Loader } from "lucide-react"
import { uploadDocument, listDocuments } from "../api/lexra"
import type { DocumentList, ToastType } from "../api/lexra"

interface Props {
  tenantId: string
  onUploadSuccess: (filename: string) => void
  addToast: (type: ToastType, message: string) => void
}

export default function UploadPanel({ tenantId, onUploadSuccess, addToast }: Props) {
  const [uploading, setUploading] = useState(false)
  const [docs, setDocs] = useState<DocumentList | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(false)

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    if (!file.name.endsWith(".pdf")) { addToast("error", "Only PDF files supported"); return }
    setUploading(true)
    try {
      const res = await uploadDocument(file, tenantId)
      addToast("success", res.message)
      onUploadSuccess(res.filename)
      await loadDocs()
    } catch (err: any) {
      addToast("error", err?.response?.data?.detail || "Upload failed")
    } finally {
      setUploading(false)
    }
  }, [tenantId])

  const loadDocs = async () => {
    setLoadingDocs(true)
    try {
      const res = await listDocuments(tenantId)
      setDocs(res)
    } catch { } finally {
      setLoadingDocs(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false
  })

  return (
    <div className="flex flex-col gap-4">
      <div {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive ? "border-indigo-400 bg-indigo-950/40" : "border-slate-600 hover:border-indigo-500 bg-slate-800/50"}`}>
        <input {...getInputProps()} />
        {uploading
          ? <Loader className="mx-auto text-indigo-400 animate-spin" size={32} />
          : <Upload className="mx-auto mb-3 text-indigo-400" size={32} />
        }
        {isDragActive
          ? <p className="text-indigo-300 font-medium">Drop the PDF here...</p>
          : uploading
            ? <p className="text-slate-300 text-sm">Uploading...</p>
            : <div>
                <p className="text-slate-300 font-medium">Drag & drop a PDF</p>
                <p className="text-slate-500 text-sm mt-1">or click to browse</p>
              </div>
        }
      </div>

      <button onClick={loadDocs}
        className="text-sm text-indigo-400 hover:text-indigo-300 text-left flex items-center gap-1">
        {loadingDocs ? <Loader size={14} className="animate-spin" /> : null}
        View uploaded documents
      </button>

      {docs && (
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-2">{docs.total_chunks} chunks indexed</p>
          {docs.documents.length === 0
            ? <p className="text-slate-500 text-sm">No documents uploaded yet</p>
            : docs.documents.map(doc => (
                <div key={doc} className="flex items-center gap-2 py-1">
                  <FileText size={14} className="text-indigo-400 shrink-0" />
                  <span className="text-slate-300 text-sm truncate">{doc}</span>
                </div>
              ))
          }
        </div>
      )}
    </div>
  )
}

