import { createContext, useContext, useState } from "react";

const DEFAULT_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL || "admin@gmail.com";
const DEFAULT_PASSWORD =
  import.meta.env.VITE_ADMIN_PASSWORD || "admin123";


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = async ({ email, password }) => {
    if (email !== DEFAULT_EMAIL || password !== DEFAULT_PASSWORD) {
      return false;
    }

    const authUser = { email };
    setUser(authUser);
    localStorage.setItem("auth_user", JSON.stringify(authUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
