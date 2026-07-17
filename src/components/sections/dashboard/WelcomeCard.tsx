"use client";

import React from "react";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import { useUserProfile, useAvailableDownloads } from "@/hooks/useQueryHooks";

export default function WelcomeCard() {
  const { data: profile } = useUserProfile();
  const { data: downloads } = useAvailableDownloads();

  const latestVersion = downloads?.[0]?.version || "v2.4.1";
  const firstName = profile?.name ? profile.name.split(" ")[0] : "Customer";

  return (
    <Card className="flex flex-col md:flex-row justify-between items-center gap-md relative overflow-hidden" animateHover>
      <div className="relative z-10 space-y-sm text-center md:text-left">
        <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Good Morning, {firstName} 👋</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-lg leading-relaxed">
          Your precision PVC requests are being processed with our AI-driven security verification. Update your software to access the latest biometric encryption modules.
        </p>
        <div className="pt-sm">
          <Button 
            size="md" 
            className="flex items-center gap-2 mx-auto md:mx-0"
            onClick={() => {
              if (downloads?.[0]?.url) {
                window.open(downloads[0].url, "_blank");
              }
            }}
          >
            <Download className="w-4 h-4" />
            Download Software {latestVersion}
          </Button>
        </div>
      </div>
      {/* Ambient visual overlay */}
      <div className="w-48 h-48 md:w-64 md:h-64 absolute -right-12 -bottom-12 opacity-10 bg-primary rounded-full blur-[80px] pointer-events-none"></div>
      <div className="relative z-10 w-full max-w-[200px]">
        <img 
          className="w-full drop-shadow-2xl rotate-12" 
          alt="Sleek PVC card" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbTnEtFhCkym-iYENhps8YgdkwYuy7SS_cbnr9IqcM2zBvjkTzOYzn3jK6FQMaLbgoHzTiTkxh-4ZsCZUh4fwvLhbrKH0JRtPOoFOSry5nFe1hLAMqYOq78uHnov0FIlhyx6GhWoVtDMq1Wh269Pg68VlTWpJxlKfCGjYIMt8UAVH7g4rDsWwsoPb3d7OEn6qXv31NwqZ5eunf3s8fYzvmgN1k6fFE22R2iP2R8MNmHydgRAufSsX4"
        />
      </div>
    </Card>
  );
}
