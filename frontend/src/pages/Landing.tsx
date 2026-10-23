import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, useScroll, useTransform } from "framer-motion"
import { Canvas, useFrame } from "@react-three/fiber"
import { Sphere, MeshDistortMaterial, Float, Stars } from "@react-three/drei"
import { Scale, Zap, Shield, Search, ArrowRight, ChevronDown, MessageSquare, BarChart3, Lock } from "lucide-react"
import * as THREE from "three"

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
  })
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1.8, 64, 64]}>
        <MeshDistortMaterial
          color="#06b6d4"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          opacity={0.15}
          transparent
        />
      </Sphere>
      <Sphere args={[1.2, 32, 32]}>
        <MeshDistortMaterial
          color="#8b5cf6"
          attach="material"
          distort={0.6}
          speed={3}
          roughness={0.2}
          metalness={0.6}
          opacity={0.2}
          transparent
          wireframe
        />
      </Sphere>
    </Float>
  )
}

const features = [
  { icon: Search, color: "from-cyan-500 to-blue-600", bg: "bg-cyan-500/10", border: "border-cyan-500/20", title: "Hybrid Search", desc: "Semantic + BM25 search combined with RRF reranking for maximum retrieval accuracy" },
  { icon: MessageSquare, color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10", border: "border-violet-500/20", title: "AI-Powered Answers", desc: "GPT-4 generates grounded answers with exact source citations from your documents" },
  { icon: Shield, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20", title: "Multi-Tenant Isolation", desc: "Complete data isolation per client. Your documents never mix with others" },
  { icon: BarChart3, color: "from-orange-500 to-amber-600", bg: "bg-orange-500/10", border: "border-orange-500/20", title: "Query Analytics", desc: "Track usage patterns, monitor query history and analyze document performance" },
  { icon: Zap, color: "from-pink-500 to-rose-600", bg: "bg-pink-500/10", border: "border-pink-500/20", title: "Instant Retrieval", desc: "Sub-second hybrid search across thousands of document pages simultaneously" },
  { icon: Lock, color: "from-yellow-500 to-orange-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20", title: "JWT Authentication", desc: "Secure token-based auth with role management and session control" },
]

const steps = [
  { num: "01", color: "text-cyan-400", bg: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/30", title: "Upload Documents", desc: "Drag & drop your PDFs. Lexra chunks, embeds and indexes them instantly." },
  { num: "02", color: "text-violet-400", bg: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/30", title: "Ask Questions", desc: "Type your question in plain English. No query language needed." },
  { num: "03", color: "text-emerald-400", bg: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/30", title: "Get Cited Answers", desc: "Receive precise answers with source citations — exactly which page, which document." },
]

export default function Landing() {
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroY = useTransform(scrollY, [0, 400], [0, -60])

  return (
    <div className="min-h-screen mesh-bg">

      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-8 glass border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Scale size={15} className="text-white" />
          </div>
          <span className="text-white font-bold tracking-wide">Lexra</span>
          <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-medium">BETA</span>
        </div>
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/auth")}
            className="text-sm text-white/60 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
            Sign In
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/auth")}
            className="text-sm text-white bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-2 rounded-xl font-medium shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-opacity">
            Get Started Free
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* 3D Canvas */}
        <div className="absolute inset-0 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
            <Stars radius={100} depth={50} count={3000} factor={3} saturation={0} fade speed={1} />
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
            <AnimatedSphere />
          </Canvas>
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-6xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-xs text-cyan-400 font-medium">Hybrid RAG Pipeline · Production Ready</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Legal Intelligence<br />
              <span className="gradient-text animate-gradient">Powered by AI</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-lg text-white/50 leading-relaxed mb-10 max-w-lg">
              Upload legal documents, ask questions in plain English, get precise answers with source citations — powered by hybrid RAG with semantic + BM25 search.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4">
              <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(6,182,212,0.4)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/auth")}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-600 text-white px-8 py-4 rounded-2xl font-semibold text-sm shadow-2xl shadow-cyan-500/30 transition-all">
                Start for Free <ArrowRight size={16} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 glass text-white/70 px-8 py-4 rounded-2xl font-medium text-sm hover:text-white transition-all">
                View Demo
              </motion.button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="flex items-center gap-6 mt-10">
              {[["3", "AI Models"], ["99%", "Accuracy"], ["<2s", "Response"]].map(([val, label]) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold gradient-text">{val}</p>
                  <p className="text-xs text-white/30 mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — floating cards */}
          <div className="hidden lg:flex flex-col gap-4">
            {[
              { q: "Can the tenant sublet?", a: "Per Section 14(2)(b) — strictly prohibited", color: "border-cyan-500/20 bg-cyan-500/5", badge: "cyan" },
              { q: "What is the penalty for breach?", a: "10% of annual rent [Source 1, Page 2]", color: "border-violet-500/20 bg-violet-500/5", badge: "violet" },
              { q: "Termination notice period?", a: "30 days written notice required", color: "border-emerald-500/20 bg-emerald-500/5", badge: "emerald" },
            ].map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                whileHover={{ scale: 1.02, x: -4 }}
                className={`glass rounded-2xl p-5 border ${item.color} cursor-default`}>
                <p className="text-xs text-white/40 mb-2">{item.q}</p>
                <p className="text-sm text-white/80 font-medium">{item.a}</p>
                <div className={`mt-3 inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full
                  ${item.badge === "cyan" ? "bg-cyan-500/10 text-cyan-400" :
                    item.badge === "violet" ? "bg-violet-500/10 text-violet-400" :
                    "bg-emerald-500/10 text-emerald-400"}`}>
                  <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                  Cited answer
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20">
          <ChevronDown size={24} />
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-32 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-20">
            <p className="text-xs text-cyan-400 uppercase tracking-widest font-semibold mb-4">Features</p>
            <h2 className="text-4xl font-bold text-white mb-4">Everything you need</h2>
            <p className="text-white/40 max-w-md mx-auto">Built for legal teams that need precision, speed, and reliability</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className={`glass rounded-2xl p-6 border ${f.border} cursor-default group transition-all duration-300`}>
                <div className={`w-12 h-12 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon size={22} className={`bg-gradient-to-br ${f.color} bg-clip-text`} style={{ color: "transparent", backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
                  <f.icon size={22} className="text-white/70 absolute" />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-20">
            <p className="text-xs text-violet-400 uppercase tracking-widest font-semibold mb-4">How it works</p>
            <h2 className="text-4xl font-bold text-white mb-4">Three steps to answers</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                className="relative">
                {i < 2 && <div className="hidden md:block absolute top-8 right-0 w-1/2 h-px bg-gradient-to-r from-white/10 to-transparent" />}
                <div className={`glass rounded-2xl p-8 border ${s.border} bg-gradient-to-br ${s.bg}`}>
                  <div className={`text-5xl font-black ${s.color} opacity-30 mb-6`}>{s.num}</div>
                  <h3 className="text-white font-semibold text-lg mb-3">{s.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-strong rounded-3xl p-16 border border-white/8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-violet-500/5 to-orange-500/5 pointer-events-none" />
            <h2 className="text-4xl font-bold text-white mb-4 relative">
              Ready to get started?
            </h2>
            <p className="text-white/40 mb-10 relative">Upload your first document and get answers in seconds.</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 via-violet-600 to-orange-500 animate-gradient text-white px-10 py-4 rounded-2xl font-bold text-sm shadow-2xl">
              Start Free Today <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Scale size={11} className="text-white" />
            </div>
            <span className="text-sm text-white/40">Lexra</span>
          </div>
          <p className="text-xs text-white/20">Built with Hybrid RAG · FastAPI · React</p>
        </div>
      </footer>
    </div>
  )
}

