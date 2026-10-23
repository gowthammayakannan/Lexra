import { useEffect } from "react"
import { CheckCircle, AlertCircle, Info, X } from "lucide-react"

export type ToastType = "success" | "error" | "info"

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

interface Props {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export default function Toast({ toasts, onRemove }: Props) {
  useEffect(() => {
    toasts.forEach(t => {
      const timer = setTimeout(() => onRemove(t.id), 3000)
      return () => clearTimeout(timer)
    })
  }, [toasts])

  if (!toasts.length) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm min-w-64 max-w-80
          ${t.type === "success" ? "bg-green-900 border border-green-700 text-green-100" : ""}
          ${t.type === "error"   ? "bg-red-900 border border-red-700 text-red-100" : ""}
          ${t.type === "info"    ? "bg-indigo-900 border border-indigo-700 text-indigo-100" : ""}
        `}>
          {t.type === "success" && <CheckCircle size={16} className="shrink-0" />}
          {t.type === "error"   && <AlertCircle size={16} className="shrink-0" />}
          {t.type === "info"    && <Info size={16} className="shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)}><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}
