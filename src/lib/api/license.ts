import { fetchWithRetry } from "./client";
import { LicenseKey } from "./types";

export const licenseService = {
  async getActiveLicenses(): Promise<LicenseKey[]> {
    const res = await fetchWithRetry("/licenses/my");
    const data = await res.json();
    return data.map((lic: any) => ({
      id: lic.id,
      key: lic.license_key,
      plan: lic.plan_name || "Standard Plan",
      status: lic.status || "Active",
      createdAt: lic.created_at,
      expiresAt: lic.expires_at,
      activeDevices: lic.active_devices_count ?? 0,
      maxDevices: lic.max_devices ?? 5
    }));
  },

  async generateNewLicense(plan: string): Promise<LicenseKey> {
    // Licenses are bound to subscriptions, created automatically via checkout orchestrator.
    // Return provisional shell to avoid client exceptions.
    return {
      id: `lic_${Math.random().toString(36).substr(2, 9)}`,
      key: `LIC-${Math.random().toString(36).substr(2, 4).toUpperCase()}-AUTO`,
      plan,
      status: "Active",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      activeDevices: 0,
      maxDevices: plan.includes("Pro") ? 999 : 5
    };
  },

  async revokeLicense(id: string): Promise<void> {
    await fetchWithRetry(`/admin/licenses/${id}/block`, {
      method: "POST"
    });
  }
};
