import axios from "axios";
import { useStore } from "./store";
import { toast } from "sonner";

export const api = axios.create({
  baseURL: "http://localhost:8000",
});

// Intercept requests to inject the Bearer token
api.interceptors.request.use((config) => {
  // We use `getState()` so we can read the store outside of React components
  let token = useStore.getState().token;
  
  // Fallback to localStorage if zustand hasn't hydrated yet
  if (!token && typeof window !== "undefined") {
    const storage = localStorage.getItem("taskflow-auth-storage");
    if (storage) {
      try {
        const parsed = JSON.parse(storage);
        token = parsed.state?.token;
      } catch (e) {
        // ignore parse error
      }
    }
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useStore.getState().logout();
      if (typeof window !== "undefined") {
        toast.error("Session expired. Please login again.");
        // Redirect to login page using window.location to ensure full refresh
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
