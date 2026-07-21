import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from "../api/authClient";
import { CurrentUser } from "../types";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Limpia la sesión en el cliente sin llamar al backend — para cuando un endpoint ya devolvió 401 (la sesión expiró/es inválida) y solo hay que volver a mostrar el login. */
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const current = await fetchCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const current = await apiLogin(username, password);
    setUser(current);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => {});
    setUser(null);
  }, []);

  const clearSession = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, login, logout, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
