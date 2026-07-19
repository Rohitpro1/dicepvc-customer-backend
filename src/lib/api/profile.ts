import { fetchWithRetry } from "./client";
import { CustomerProfile, CustomerUpdateInput } from "./types";

export const profileService = {
  /**
   * Fetches the authenticated customer's full profile.
   * Backend: GET /api/v1/customers/me → CustomerDetailsOut
   */
  async getUserProfile(): Promise<CustomerProfile> {
    const res = await fetchWithRetry("/customers/me");
    return res.json();
  },

  /**
   * Updates mutable profile fields.
   * Backend: PUT /api/v1/customers/me → CustomerDetailsOut
   * Only fields in CustomerUpdateInput are accepted by the backend.
   * The backend does NOT accept `name` or `email` in this endpoint.
   */
  async updateUserProfile(payload: CustomerUpdateInput): Promise<CustomerProfile> {
    const res = await fetchWithRetry("/customers/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
