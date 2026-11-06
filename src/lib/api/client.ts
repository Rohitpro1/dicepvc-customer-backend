export class APIError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
    this.name = "APIError";
  }
}

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://dicepvc-backend.onrender.com/api/v1";

let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new APIError(401, "Session expired");
      const data = await response.json();
      if (!data.access_token) throw new APIError(401, "Session expired");
      localStorage.setItem("access_token", data.access_token);
      return data.access_token as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function fetchWithRetry(
  endpoint: string,
  options: RequestInit = {},
  retries = 3,
  delay = 500
): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;

  // Always send credentials so HTTPOnly refresh-token cookie is included
  options.credentials = "include";

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Inject access token from localStorage
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  options.headers = headers;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      // 401 handling — silent token refresh then single retry
      if (
        response.status === 401 &&
        !endpoint.includes("/auth/login") &&
        !endpoint.includes("/auth/refresh")
      ) {
        if (typeof window !== "undefined") {
          let refreshedToken: string;
          try {
            refreshedToken = await refreshAccessToken();
          } catch (err) {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
            throw err;
          }
          const retryHeaders: Headers = new Headers(options.headers as HeadersInit);
          retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
          options.headers = retryHeaders;
          return await fetch(url, options);
        }
      }

      if (!response.ok) {
        let errBody: any;
        try {
          errBody = await response.json();
        } catch {
          errBody = null;
        }
        throw new APIError(
          response.status,
          errBody?.error || `HTTP error! status: ${response.status}`,
          errBody
        );
      }

      return response;
    } catch (err) {
      const isLast = i === retries - 1;
      if (isLast) throw err;
      const currentDelay = delay * Math.pow(2, i);
      await new Promise((res) => setTimeout(res, currentDelay));
    }
  }

  throw new Error("Request failed after max retries");
}
