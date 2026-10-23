import { useState } from "react"
import { X, LogIn, UserPlus, Loader, Scale } from "lucide-react"
import { login, register } from "../api/lexra"
import type { ToastType } from "../api/lexra"

interface Props {
  onSuccess: (token: string, email: string) => void
  onClose: () => void
  addToast: (type: ToastType, message: string) => void
}

export default function AuthModal({ onSuccess, onClose, addToast }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !password) { addToast("error", "Email and password required"); return }
    setLoading(true)
    try {
      const res = tab === "login" ? await login(email, password) : await register(email, password)
      localStorage.setItem("lexra_token", res.token)
      localStorage.setItem("lexra_email", res.email)
      onSuccess(res.token, res.email)
    } catch (err: any) {
      addToast("error", err?.response?.data?.detail || "Authentication failed")
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d15] border border-white/8 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Scale size={15} className="text-white" />
              </div>
              <span className="text-white font-semibold">Lexra</span>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
              <X size={14} />
            </button>
          </div>

          <h2 className="text-lg font-semibold text-white mb-1">
            {tab === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-sm text-white/35 mb-6">
            {tab === "login" ? "Sign in to your workspace" : "Start using Lexra for free"}
          </p>

          {/* Tabs */}
          <div className="flex bg-white/4 rounded-xl p-1 mb-6">
            {(["login", "register"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all
                  ${tab === t ? "bg-white/8 text-white shadow-sm" : "text-white/35 hover:text-white/55"}`}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 transition-colors" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 transition-colors" />
          
          <button onClick={submit} disabled={loading}
            className="w-full mt-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20">
            {loading ? <Loader size={15} className="animate-spin" /> :
              tab === "login" ? <><LogIn size={15} /> Sign In</> : <><UserPlus size={15} /> Create Account</>}
          </button>

          <p className="text-center text-xs text-white/20 mt-1">
            {tab === "login" ? "No account?" : "Already have one?"}
            <button onClick={() => setTab(tab === "login" ? "register" : "login")}
              className="text-violet-400 hover:text-violet-300 ml-1 transition-colors">
              {tab === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
