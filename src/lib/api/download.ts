import { fetchWithRetry } from "./client";
import { DownloadItem } from "./types";

export const downloadService = {
  async getAvailableDownloads(): Promise<DownloadItem[]> {
    const res = await fetchWithRetry("/downloads");
    const data = await res.json();
    
    // Map backend active versions to frontend DownloadItem type
    return data.map((ver: any) => ({
      id: ver.id,
      name: `DicePVC Terminal Daemon (${ver.release_type === "stable" ? "Stable" : "Beta"})`,
      version: ver.version,
      platform: "All", // Universal binaries
      size: "18.4 MB", // Standard package sizing
      url: ver.signed_download_url,
      category: "CLI"
    }));
  }
};
