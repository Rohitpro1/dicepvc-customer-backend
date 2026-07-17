export class APIError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
    this.name = "APIError";
  }
}

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://dicepvc-backend.onrender.com/api/v1";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

export async function fetchWithRetry(
  endpoint: string,
  options: RequestInit = {},
  retries = 3,
  delay = 500
): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;
  
  // Set credentials mode to include secure HTTPOnly cookies (for CSRF/refresh tokens)
  options.credentials = "include";

  // Setup headers
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Inject Access Token from localStorage if present
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

      // Handle 401 Unauthorized - Silent token refresh
      if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
        if (typeof window !== "undefined") {
          if (!isRefreshing) {
            isRefreshing = true;
            try {
              const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
              });
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                const newToken = refreshData.access_token || refreshData.token;
                if (newToken) {
                  localStorage.setItem("access_token", newToken);
                  onRefreshed(newToken);
                }
              } else {
                // Refresh failed - clear tokens and redirect to login
                localStorage.removeItem("access_token");
                window.location.href = "/login";
                throw new APIError(401, "Session expired");
              }
            } catch (err) {
              localStorage.removeItem("access_token");
              window.location.href = "/login";
              throw err;
            } finally {
              isRefreshing = false;
            }
          }

          // Wait for the token refresh to complete, then retry the request
          const refreshedToken = await new Promise<string>((resolve) => {
            subscribeTokenRefresh((token) => resolve(token));
          });
          const newHeaders: Headers = new Headers(options.headers as any);
          newHeaders.set("Authorization", `Bearer ${refreshedToken}`);
          options.headers = newHeaders;
          return await fetch(url, options);
        }
      }

      if (!response.ok) {
        let errBody;
        try {
          errBody = await response.json();
        } catch {
          errBody = null;
        }
        throw new APIError(response.status, errBody?.error || `HTTP error! status: ${response.status}`, errBody);
      }
      return response;
    } catch (err) {
      const isLast = i === retries - 1;
      if (isLast) throw err;
      
      // Calculate exponential backoff
      const currentDelay = delay * Math.pow(2, i);
      await new Promise((res) => setTimeout(res, currentDelay));
    }
  }
  throw new Error("Request failed after max retries");
}

export async function mockRequest<T>(
  data: T,
  latency = 500,
  shouldSimulateRetryError = false
): Promise<T> {
  await new Promise((res) => setTimeout(res, latency));
  return data;
}
