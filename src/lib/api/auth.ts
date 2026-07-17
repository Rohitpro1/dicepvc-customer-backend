import { fetchWithRetry } from "./client";
import { User, AuthResponse } from "./types";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetchWithRetry("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: email, password }) // OAuth2 Password flow expects username/password
    });
    const data = await res.json();
    
    // Extract token
    const token = data.access_token || data.token;
    
    // Store access token in client storage
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }

    // Build user object matching types interface
    const user: User = {
      id: data.user?.id || "usr_unknown",
      email: data.user?.email || email,
      name: data.user?.name || "Customer",
      role: data.user?.role || "customer",
      createdAt: data.user?.created_at || new Date().toISOString()
    };

    return {
      token,
      user
    };
  },

  async register(email: string, name: string, password: string): Promise<void> {
    await fetchWithRetry("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password })
    });
  },

  async logout(): Promise<void> {
    try {
      await fetchWithRetry("/auth/logout", {
        method: "POST"
      });
    } catch {
      // Allow clean logout even if session server call fails
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
  },

  async getCurrentUser(): Promise<User> {
    const res = await fetchWithRetry("/auth/me");
    const data = await res.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: data.created_at || new Date().toISOString()
    };
  }
};
