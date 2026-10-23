import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { useState, useCallback } from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import Toast from "./components/Toast"
import type { ToastMessage, ToastType } from "./components/Toast"
import Landing from "./pages/Landing"
import AuthPage from "./pages/AuthPage"
import Dashboard from "./pages/Dashboard"
import DocumentsPage from "./pages/DocumentsPage"
import ChatPage from "./pages/ChatPage"
import HistoryPage from "./pages/HistoryPage"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? <>{children}</> : <Navigate to="/auth" replace />
}

function AppRoutes() {
  const location = useLocation()
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage addToast={addToast} />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard addToast={addToast} /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DocumentsPage addToast={addToast} /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage addToast={addToast} /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage addToast={addToast} /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="h-screen overflow-hidden">
        <AppRoutes />
      </div>
    </AuthProvider>
  )
}




