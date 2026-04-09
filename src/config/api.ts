import axios from 'axios';

// Prefer the documented backend env name and keep the legacy one as fallback.
const API_URL =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',},
});
