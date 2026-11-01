import { createContext, useContext, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

const readUser = () => {
  try {
    const s = localStorage.getItem("imovies_user");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  const save = (data) => {
    localStorage.setItem("imovies_user", JSON.stringify(data));
    setUser(data);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    save(data);
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    save(data);
  };

  const logout = () => {
    localStorage.removeItem("imovies_user");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
