import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem("imovies_user");
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return config;
});

export const errMsg = (err) => err.response?.data?.message || err.message || "Something went wrong";

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

export const money = (n) => "₹" + Number(n).toLocaleString("en-IN");

export default api;
