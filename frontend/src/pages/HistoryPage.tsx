import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Clock, MessageSquare, Loader, ArrowUpRight } from "lucide-react"
import { AppShell } from "./Dashboard"
import { getHistory } from "../api/lexra"
import type { ToastType } from "../api/lexra"

interface Props { addToast: (type: ToastType, msg: string) => void }

function groupByDate(items: any[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const week = new Date(today); week.setDate(week.getDate() - 7)

  const groups: Record<string, any[]> = { "Today": [], "Yesterday": [], "Last 7 days": [], "Older": [] }

  items.forEach(item => {
    const d = new Date(item.created_at)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (day >= today) groups["Today"].push(item)
    else if (day >= yesterday) groups["Yesterday"].push(item)
    else if (day >= week) groups["Last 7 days"].push(item)
    else groups["Older"].push(item)
  })

  return Object.entries(groups).filter(([, items]) => items.length > 0)
}

export default function HistoryPage({ addToast }: Props) {
  const navigate = useNavigate()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => addToast("error", "Could not load history"))
      .finally(() => setLoading(false))
  }, [])

  const handleClick = (query: string) => {
    sessionStorage.setItem("lexra_prefill_query", query)
    navigate("/chat")
  }

  const grouped = groupByDate(history)

  return (
    <AppShell current="/history">
      <div className="flex-1 overflow-y-auto p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">History</h1>
          <p className="text-white/25 text-xs">Click any query to continue the conversation</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader size={24} className="text-white/20 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <Clock size={36} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/20 text-sm">No history yet</p>
            <button onClick={() => navigate("/chat")}
              className="mt-4 text-xs text-orange-400 hover:text-orange-300 transition-colors">
              Start a conversation →
            </button>
          </div>
        ) : (
          <div className="max-w-xl space-y-6">
            {grouped.map(([label, items]) => (
              <div key={label}>
                <p className="text-[10px] text-white/20 uppercase tracking-widest font-semibold mb-2 px-1">{label}</p>
                <div className="space-y-1">
                  {items.map((h, i) => (
                    <motion.button key={h.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleClick(h.query)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-white/4 group transition-all">
                      <MessageSquare size={14} className="text-white/20 shrink-0" />
                      <span className="text-sm text-white/60 group-hover:text-white/80 truncate transition-colors flex-1">
                        {h.query}
                      </span>
                      <ArrowUpRight size={13} className="text-white/0 group-hover:text-white/25 shrink-0 transition-all" />
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
