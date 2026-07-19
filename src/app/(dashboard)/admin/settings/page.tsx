"use client";

import React, { useState } from "react";
import { 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Database,
  History,
  FileText
} from "lucide-react";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  useAdminSyncLogs, 
  useAdminSyncDiscrepancies, 
  useAdminTriggerSyncMutation 
} from "@/hooks/useQueryHooks";

export default function AdminSettingsPage() {
  const { data: syncLogsData, isLoading: logsLoading } = useAdminSyncLogs(1, 10);
  const { data: discrepanciesData, isLoading: discLoading } = useAdminSyncDiscrepancies();
  const triggerSyncMutation = useAdminTriggerSyncMutation();

  const [feedback, setFeedback] = useState("");

  const handleTriggerSync = () => {
    setFeedback("");
    triggerSyncMutation.mutate(undefined, {
      onSuccess: (data) => {
        setFeedback(data.message || "License synchronization job dispatched successfully!");
        setTimeout(() => setFeedback(""), 4000);
      },
      onError: (err: any) => {
        setFeedback(err.message || "Failed to trigger synchronization.");
      }
    });
  };

  const logs = syncLogsData?.results || [];
  const discrepancies = discrepanciesData?.discrepancies || [];

  return (
    <main className="p-base md:p-md lg:p-lg min-h-screen relative overflow-y-auto max-w-container-max mx-auto w-full">
      {/* Background Glows */}
      <div className="fixed -z-10 top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed -z-10 bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="mb-md">
        <ProfileHeader pageName="System Settings" />
      </div>

      <div className="flex flex-col gap-md mt-md">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface font-bold">System Settings</h1>
          <p className="text-on-surface-variant font-body-md">
            Trigger downstream license synchronization, audit active service discrepancies, and configure platform parameters.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
          {/* Cache Sync Trigger and Discrepancies */}
          <section className="lg:col-span-7 flex flex-col gap-md">
            {/* Sync trigger */}
            <Card className="p-lg flex flex-col justify-between gap-sm" animateHover={false}>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-xs flex items-center gap-xs">
                  <Database className="w-5 h-5 text-primary" /> License Service Sync
                </h3>
                <p className="text-on-surface-variant font-body-md mb-md">
                  Manually trigger background synchronization to reconcile local cache serial numbers with the primary licensing service.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-base border-t border-outline-variant/10 pt-md mt-sm">
                <div>
                  {feedback && (
                    <p className="text-label-sm font-bold text-secondary animate-pulse">{feedback}</p>
                  )}
                </div>
                <Button
                  onClick={handleTriggerSync}
                  disabled={triggerSyncMutation.isPending}
                  className="flex items-center gap-xs font-semibold w-full sm:w-auto"
                >
                  {triggerSyncMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Trigger Cache Re-Sync
                </Button>
              </div>
            </Card>

            {/* Active Discrepancies */}
            <Card className="p-lg" animateHover={false}>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface border-b border-outline-variant/10 pb-xs mb-md flex items-center gap-xs">
                <AlertTriangle className="w-5 h-5 text-error" /> Sync Discrepancies
              </h3>

              {discLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto my-md" />
              ) : discrepancies.length === 0 ? (
                <div className="py-md text-center text-secondary flex items-center gap-sm justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" /> All local cached keys match central licensing database.
                </div>
              ) : (
                <div className="space-y-sm">
                  {discrepancies.map((d: any, idx: number) => (
                    <div key={idx} className="p-sm bg-error-container/10 border border-error/20 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-error">Key Mismatch</span>
                        <p className="text-on-surface-variant mt-xs">Local status: {d.local_status} • Service status: {d.remote_status}</p>
                      </div>
                      <code className="bg-white/40 border px-2 py-0.5 rounded text-[10px] font-mono">{d.license_key}</code>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* Sync History Logs */}
          <section className="lg:col-span-5">
            <Card className="p-lg" animateHover={false}>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface border-b border-outline-variant/10 pb-xs mb-md flex items-center gap-xs">
                <History className="w-5 h-5 text-secondary" /> Synchronization History
              </h3>

              {logsLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto my-md" />
              ) : logs.length === 0 ? (
                <p className="text-label-md text-on-surface-variant text-center py-md">No sync history logs found.</p>
              ) : (
                <div className="space-y-md">
                  {logs.map((log: any) => {
                    const runDate = log.run_at ? new Date(log.run_at).toLocaleDateString() : "N/A";
                    return (
                      <div key={log.id} className="p-sm border border-outline-variant/10 rounded-xl hover:bg-surface-container-low/40 transition-all">
                        <div className="flex justify-between items-center mb-xs">
                          <span className="font-bold text-xs text-on-surface">Re-sync Run Completed</span>
                          <span className="text-[10px] text-outline font-semibold">{runDate}</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">Processed: {log.processed_keys} keys • Reconciled: {log.reconciled_discrepancies} mismatches</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
