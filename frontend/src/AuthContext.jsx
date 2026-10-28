import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

function readSaved() {
  try {
    const saved = localStorage.getItem("scener_auth");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readSaved);

  function saveLogin(data) {
    localStorage.setItem("scener_auth", JSON.stringify(data));
    setAuth(data);
  }

  function logout() {
    localStorage.removeItem("scener_auth");
    setAuth(null);
  }

  // api.js fires this when the server says the saved token is no longer valid.
  useEffect(() => {
    window.addEventListener("scener:logout", logout);
    return () => window.removeEventListener("scener:logout", logout);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, saveLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
