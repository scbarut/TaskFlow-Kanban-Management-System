import axios from "axios";
import { useStore } from "./store";

export const api = axios.create({
  baseURL: "http://localhost:8000",
});

// Intercept requests to inject the Bearer token
api.interceptors.request.use((config) => {
  // We use `getState()` so we can read the store outside of React components
  const token = useStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
