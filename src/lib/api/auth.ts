import { fetchWithRetry } from "./client";
import { User, AuthResponse } from "./types";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetchWithRetry("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    const token = data.access_token;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }

    const user: User = {
      id: data.user?.id ?? "",
      email: data.user?.email ?? email,
      name: data.user?.name ?? "Customer",
      role: data.user?.role ?? "customer",
      status: data.user?.status ?? "active",
      createdAt: data.user?.created_at ?? new Date().toISOString(),
    };

    return { token, user };
  },

  /**
   * Registration requires name, email, password, company_name, and phone.
   * All five fields are required by the backend RegisterInput schema.
   */
  async register(
    email: string,
    name: string,
    password: string,
    company_name: string,
    phone: string
  ): Promise<void> {
    await fetchWithRetry("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, company_name, phone }),
    });
  },

  async logout(): Promise<void> {
    try {
      await fetchWithRetry("/auth/logout", { method: "POST" });
    } catch {
      // Allow clean logout even if the server call fails
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
  },

  /**
   * Fetches the authenticated user's profile.
   * Backend route: GET /api/v1/customers/me → CustomerDetailsOut.
   * Note: the backend exposes `user_id` (not `id`) for the auth identifier.
   */
  async getCurrentUser(): Promise<User> {
    const res = await fetchWithRetry("/customers/me");
    const data = await res.json();
    return {
      id: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
      status: data.status,
      createdAt: data.created_at ?? new Date().toISOString(),
    };
  },
};
