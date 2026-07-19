import { fetchWithRetry } from "./client";
import { LicenseKey } from "./types";

export const licenseService = {
  async getActiveLicenses(): Promise<LicenseKey[]> {
    const res = await fetchWithRetry("/licenses/my");
    const data = await res.json();
    return data.map((lic: any) => ({
      id: lic.id,
      key: lic.license_key,
      plan: lic.plan_name ?? "Standard Plan",
      status: lic.status ?? "active",
      createdAt: lic.created_at,
      expiresAt: lic.expires_at,
      activeDevices: lic.active_devices_count ?? 0,
      maxDevices: lic.max_devices ?? 5,
    }));
  },

  /**
   * Revokes a license by ID.
   * Backend: POST /api/v1/admin/licenses/{license_id}/block
   * Requires admin role.
   */
  async revokeLicense(id: string): Promise<void> {
    await fetchWithRetry(`/admin/licenses/${id}/block`, {
      method: "POST",
    });
  },
};
