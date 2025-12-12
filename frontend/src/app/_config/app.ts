export const IS_DEMO_MODE = (process.env.NEXT_PUBLIC_DEMO_MODE ?? "false") === "true";
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/convert";

// Base URL for backend API (admin/auth/health). If not set, derive from API_URL by stripping `/convert`.
export const BACKEND_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL ??
	API_URL.replace(/\/convert\/?$/, "");

// Public key (safe to expose in browser). If your system auto-injects, set NEXT_PUBLIC_GEMINI_API_KEY.
export const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";
