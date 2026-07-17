import { fetchWithRetry } from "./client";
import { User } from "./types";

export const profileService = {
  async getUserProfile(): Promise<User> {
    const res = await fetchWithRetry("/customers/me");
    const data = await res.json();
    return {
      id: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: data.created_at || new Date().toISOString()
    };
  },

  async updateUserProfile(name: string, email: string): Promise<User> {
    const res = await fetchWithRetry("/customers/me", {
      method: "PUT",
      body: JSON.stringify({ name, email })
    });
    const data = await res.json();
    return {
      id: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: data.created_at || new Date().toISOString()
    };
  }
};
