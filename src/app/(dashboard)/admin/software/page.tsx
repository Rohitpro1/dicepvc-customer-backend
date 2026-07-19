"use client";

import React, { useState } from "react";
import { 
  Terminal, 
  Plus, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Laptop,
  Layers,
  History
} from "lucide-react";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAvailableDownloads, useCreateSoftwareVersionMutation } from "@/hooks/useQueryHooks";

export default function AdminSoftwarePage() {
  const { data: downloads, isLoading } = useAvailableDownloads();
  const createVersionMutation = useCreateSoftwareVersionMutation();

  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [minOsVersion, setMinOsVersion] = useState("Windows 10");

  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg("");
    setFeedbackType("");

    createVersionMutation.mutate(
      {
        version,
        changelog,
        download_url: downloadUrl,
        min_os_version: minOsVersion
      },
      {
        onSuccess: () => {
          setFeedbackType("success");
          setFeedbackMsg("New software version deployed successfully!");
          setVersion("");
          setChangelog("");
          setDownloadUrl("");
          setTimeout(() => {
            setFeedbackMsg("");
            setFeedbackType("");
          }, 3000);
        },
        onError: (err: any) => {
          setFeedbackType("error");
          setFeedbackMsg(err.message || "Failed to publish version. Check version format (e.g. 2.4.2).");
        }
      }
    );
  };

  return (
    <main className="p-base md:p-md lg:p-lg min-h-screen relative overflow-y-auto max-w-container-max mx-auto w-full">
      {/* Background Glows */}
      <div className="fixed -z-10 top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed -z-10 bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="mb-md">
        <ProfileHeader pageName="Software Fleet Releases" />
      </div>

      <div className="flex flex-col gap-md mt-md">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface font-bold">Daemon Version Deployment</h1>
          <p className="text-on-surface-variant font-body-md">
            Manage printing daemon software versions, publish changelogs, and register secure build packages.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
          {/* New Release Form */}
          <Card className="lg:col-span-7 p-lg" animateHover={false}>
            <form onSubmit={handleSubmit} className="space-y-md">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface border-b border-outline-variant/10 pb-xs mb-sm flex items-center gap-xs">
                <Terminal className="w-5 h-5 text-primary" /> Deploy New Build Version
              </h3>

              {/* Version String */}
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline" htmlFor="version">
                  Version String (e.g. 2.5.0)
                </label>
                <Input
                  id="version"
                  type="text"
                  placeholder="2.5.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  required
                />
              </div>

              {/* Download URL */}
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline" htmlFor="url">
                  Binary Package URL
                </label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://storage.googleapis.com/dicepvc/dicepvc-daemon-2.5.0.exe"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  required
                />
              </div>

              {/* Min OS Version */}
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline" htmlFor="os">
                  Minimum Compatible OS Version
                </label>
                <Input
                  id="os"
                  type="text"
                  placeholder="Windows 10"
                  value={minOsVersion}
                  onChange={(e) => setMinOsVersion(e.target.value)}
                  required
                />
              </div>

              {/* Changelog */}
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline" htmlFor="changelog">
                  Changelog / Deployment Notes
                </label>
                <textarea
                  id="changelog"
                  rows={4}
                  placeholder="Describe bug fixes, new features, and security enhancements..."
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container/50 border border-outline-variant/20 rounded-xl font-label-md text-on-surface focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Action and feedback */}
              <div className="pt-base border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-base">
                <div>
                  {feedbackMsg && (
                    <div className={`p-sm rounded-xl text-label-md font-bold flex items-center gap-xs ${
                      feedbackType === "success" 
                        ? "bg-secondary-container text-on-secondary-container" 
                        : "bg-error-container text-on-error-container"
                    }`}>
                      {feedbackType === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {feedbackMsg}
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={createVersionMutation.isPending}
                  className="flex items-center gap-xs font-semibold px-md"
                >
                  {createVersionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Deploy Software
                </Button>
              </div>
            </form>
          </Card>

          {/* Active Downloads List */}
          <Card className="lg:col-span-5 p-lg" animateHover={false}>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface border-b border-outline-variant/10 pb-xs mb-md flex items-center gap-xs">
              <History className="w-5 h-5 text-secondary" /> Active Fleet Versions
            </h3>

            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto my-lg" />
            ) : (downloads || []).length === 0 ? (
              <p className="text-label-md text-on-surface-variant text-center py-md">No software releases found.</p>
            ) : (
              <div className="space-y-md">
                {(downloads || []).map((ver: any) => (
                  <div key={ver.id} className="p-sm border border-outline-variant/10 rounded-xl hover:bg-surface-container-low/40 transition-colors">
                    <div className="flex justify-between items-start mb-xs">
                      <div>
                        <span className="font-bold text-label-md text-on-surface">{ver.name}</span>
                        <p className="text-[10px] text-outline font-semibold">Version: {ver.version}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                        {ver.category}
                      </span>
                    </div>
                    
                    <a 
                      href={ver.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-secondary hover:underline inline-flex items-center gap-xs mt-sm font-bold"
                    >
                      Inspect Secure Binary <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
