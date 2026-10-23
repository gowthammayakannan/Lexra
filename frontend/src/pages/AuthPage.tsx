import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Canvas, useFrame } from "@react-three/fiber"
import { MeshDistortMaterial, Sphere, Stars } from "@react-three/drei"
import { useGoogleLogin } from "@react-oauth/google"
import { googleAuth } from "../api/lexra"
import { Scale, Mail, Lock, ArrowRight, Eye, EyeOff, Loader, ArrowLeft } from "lucide-react"
import { login, register } from "../api/lexra"
import { useAuth } from "../context/AuthContext"
import * as THREE from "three"
import type { ToastType } from "../api/lexra"

function BgSphere() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.x = s.clock.elapsedTime * 0.15
      ref.current.rotation.y = s.clock.elapsedTime * 0.2
    }
  })
  return (
    <Sphere ref={ref} args={[2.5, 64, 64]}>
      <MeshDistortMaterial color="#8b5cf6" distort={0.5} speed={2} opacity={0.08} transparent wireframe />
    </Sphere>
  )
}

import { useRef } from "react"

interface Props {
  addToast: (type: ToastType, msg: string) => void
}

export default function AuthPage({ addToast }: Props) {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [tab, setTab] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const submit = async () => {
    if (!email || !password) { addToast("error", "All fields required"); return }
    setLoading(true)
    try {
      const res = tab === "login" ? await login(email, password) : await register(email, password)
      authLogin(res.token, res.email)
      addToast("success", tab === "login" ? "Welcome back!" : "Account created!")
      navigate("/dashboard")
    } catch (err: any) {
      addToast("error", err?.response?.data?.detail || "Authentication failed")
    } finally { setLoading(false) }
  }

  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
    setGoogleLoading(true)
    try {
      const res = await googleAuth(tokenResponse.access_token)
      authLogin(res.token, res.email)
      addToast("success", `Welcome, ${res.email}!`)
      navigate("/dashboard")
    } catch (err: any) {
      addToast("error", err?.response?.data?.detail || "Google sign-in failed")
    } finally { setGoogleLoading(false) }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => addToast("error", "Google sign-in failed")
  })

  return (
    <div className="min-h-screen bg-[#050508] flex overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center p-16">
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 5] }}>
            <Stars radius={80} depth={50} count={2000} factor={3} fade speed={0.5} />
            <ambientLight intensity={0.2} />
            <pointLight position={[5, 5, 5]} color="#8b5cf6" intensity={2} />
            <pointLight position={[-5, -5, -5]} color="#06b6d4" intensity={1} />
            <BgSphere />
          </Canvas>
        </div>
        <div className="relative z-10 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.8 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-violet-500/30">
            <Scale size={36} className="text-white" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-4">Legal Intelligence<br />at Your Fingertips</motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-white/40 max-w-xs mx-auto leading-relaxed">
            Upload documents. Ask questions. Get cited answers in seconds.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="flex justify-center gap-8 mt-12">
            {[["98%", "Recall"], ["<2s", "Speed"], ["3", "LLMs"]].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-2xl font-black gradient-text">{v}</p>
                <p className="text-xs text-white/25 mt-1">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 to-cyan-950/10" />
        
        <motion.button onClick={() => navigate("/")}
          whileHover={{ x: -4 }}
          className="absolute top-8 left-8 flex items-center gap-2 text-white/30 hover:text-white/60 text-sm transition-colors">
          <ArrowLeft size={16} /> Back
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Scale size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">Lexra</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            {tab === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-white/40 text-sm mb-10">
            {tab === "login" ? "Sign in to your workspace" : "Start your free account today"}
          </p>

          {/* Tab toggle */}
          <div className="flex bg-white/4 rounded-2xl p-1 mb-8 border border-white/6">
            {(["login", "register"] as const).map(t => (
              <motion.button key={t} onClick={() => setTab(t)} className="relative flex-1 py-3 rounded-xl text-sm font-medium z-10">
                {tab === t && (
                  <motion.div layoutId="tab" className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-xl border border-white/10" />
                )}
                <span className={`relative ${tab === t ? "text-white" : "text-white/35"} transition-colors`}>
                  {t === "login" ? "Sign In" : "Register"}
                </span>
              </motion.button>
            ))}
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div className="relative group">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-cyan-400 transition-colors z-10" />
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                className="w-full bg-white/4 border border-white/8 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/40 focus:bg-white/6 transition-all" />
            </div>

            {/* Password */}
            <div className="relative group">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition-colors z-10" />
              <input type={showPass ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                className="w-full bg-white/4 border border-white/8 rounded-2xl pl-12 pr-12 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40 focus:bg-white/6 transition-all" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <motion.button onClick={submit} disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-violet-600 text-white rounded-2xl py-4 font-semibold text-sm flex items-center justify-center gap-2 shadow-2xl shadow-violet-500/20 hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? <Loader size={16} className="animate-spin" /> :
                <>{tab === "login" ? "Sign In" : "Create Account"} <ArrowRight size={16} /></>}
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-white/20">or</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Google Auth */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => googleLogin()}
              disabled={googleLoading}
              className="w-full bg-white text-gray-700 rounded-2xl py-3.5 font-medium text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-60">
              {googleLoading ? <Loader size={16} className="animate-spin text-gray-500" /> : (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
                </svg>
              )}
              Continue with Google
            </motion.button>
          </div>

          <p className="text-center text-sm text-white/25 mt-8">
            {tab === "login" ? "New to Lexra? " : "Already have an account? "}
            <button onClick={() => setTab(tab === "login" ? "register" : "login")}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              {tab === "login" ? "Create account" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

