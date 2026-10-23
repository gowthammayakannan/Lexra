import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { FileText, MessageSquare, Clock, Zap, ArrowRight, BarChart3, Scale, LogOut } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { listDocuments } from "../api/lexra"
import type { ToastType } from "../api/lexra"

interface Props { addToast?: (type: ToastType, msg: string) => void }

const navItems = [
  { icon: BarChart3, label: "Dashboard", path: "/dashboard", color: "text-cyan-400" },
  { icon: MessageSquare, label: "Chat", path: "/chat", color: "text-emerald-400" },
  { icon: Clock, label: "History", path: "/history", color: "text-orange-400" },
]

export function AppShell({ children, current }: { children: React.ReactNode; current: string }) {
  const navigate = useNavigate()
  const { email, logout } = useAuth()
  return (
    <div className="flex h-screen bg-[#050508] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 h-full flex flex-col border-r border-white/5 bg-[#080810] shrink-0">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Scale size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Lexra</p>
              <p className="text-[10px] text-white/25">Legal Intelligence</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <motion.button key={item.path} onClick={() => navigate(item.path)}
              whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${current === item.path
                  ? "bg-white/6 text-white border border-white/8"
                  : "text-white/35 hover:text-white/60 hover:bg-white/3"}`}>
              <item.icon size={16} className={current === item.path ? item.color : "text-current"} />
              {item.label}
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 truncate font-medium">{email}</p>
              <p className="text-[10px] text-white/25">lawfirm_001</p>
            </div>
          </div>
          <motion.button whileHover={{ x: 4 }} onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/25 hover:text-white/50 transition-colors">
            <LogOut size={14} /> Sign out
          </motion.button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  )
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
}

export default function Dashboard({ addToast: _addToast }: Props) {
  const navigate = useNavigate()
  const { email } = useAuth()
  const [docCount, setDocCount] = useState(0)

  useEffect(() => {
    listDocuments("lawfirm_001").then(r => setDocCount(r.documents.length)).catch(() => {})
  }, [])

  const stats = [
    { label: "Documents", value: docCount, icon: FileText, color: "from-cyan-500 to-blue-600", glow: "shadow-cyan-500/20", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { label: "Queries Today", value: 0, icon: MessageSquare, color: "from-violet-500 to-purple-600", glow: "shadow-violet-500/20", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { label: "Avg Response", value: "<2s", icon: Zap, color: "from-emerald-500 to-teal-600", glow: "shadow-emerald-500/20", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Accuracy", value: "98%", icon: BarChart3, color: "from-orange-500 to-amber-600", glow: "shadow-orange-500/20", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  ]

  return (
    <AppShell current="/dashboard">
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-sm text-white/30 mb-1">Good morning</p>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, <span className="gradient-text">{email?.split("@")[0]}</span>
          </h1>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => (
            <motion.div key={i} custom={i} initial="hidden" animate="visible" variants={cardVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`glass rounded-2xl p-5 border ${s.border} shadow-xl ${s.glow} cursor-default`}>
              <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-4`}>
                <s.icon size={18} className={`bg-gradient-to-br ${s.color}`} style={{ color: "white" }} />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-xs text-white/30">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Start Chatting CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex flex-col items-center justify-center py-8">
          <motion.button onClick={() => navigate("/chat")}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-10 py-4 rounded-2xl font-semibold text-sm shadow-2xl shadow-emerald-500/20 hover:opacity-90 transition-all">
            <MessageSquare size={18} />
            Start Chatting
            <ArrowRight size={16} />
          </motion.button>
          <p className="text-xs text-white/20 mt-3">Chat with AI · Upload documents · Get answers</p>
        </motion.div>
      </div>
    </AppShell>
  )
}



