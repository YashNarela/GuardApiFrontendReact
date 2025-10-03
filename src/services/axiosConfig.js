import axios from "axios";

// Set base URL for ALL axios requests
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

// Optional: Add interceptors for global error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default axios;
