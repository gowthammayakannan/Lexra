import { createContext, useContext, useState, useCallback } from "react"
import type { ReactNode } from "react"

interface AuthContextType {
  token: string
  email: string
  isLoggedIn: boolean
  login: (token: string, email: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem("lexra_token") || "")
  const [email, setEmail] = useState(localStorage.getItem("lexra_email") || "")

  const login = useCallback((t: string, e: string) => {
    localStorage.setItem("lexra_token", t)
    localStorage.setItem("lexra_email", e)
    setToken(t)
    setEmail(e)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("lexra_token")
    localStorage.removeItem("lexra_email")
    setToken("")
    setEmail("")
  }, [])

  return (
    <AuthContext.Provider value={{ token, email, isLoggedIn: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

