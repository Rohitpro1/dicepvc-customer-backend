"use client";

import React from "react";
import { ShieldCheck, TrendingUp, Cpu, HelpCircle } from "lucide-react";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { StatCard } from "@/components/ui/StatCard";
import WelcomeCard from "@/components/sections/dashboard/WelcomeCard";
import ClientSyncCard from "@/components/sections/dashboard/ClientSyncCard";
import PrintVolumeChart from "@/components/sections/dashboard/PrintVolumeChart";
import ActivityTable from "@/components/sections/dashboard/ActivityTable";
import LicenseActivationCard from "@/components/sections/dashboard/LicenseActivationCard";
import Skeleton from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import {
  useDashboardStats,
  useSubscriptionDetails,
} from "@/hooks/useQueryHooks";

export default function CustomerDashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: subDetails, isLoading: subLoading } = useSubscriptionDetails();

  const isLoading = statsLoading || subLoading;

  // Compute days remaining dynamically from subscription details
  const daysRemaining = (() => {
    if (!subDetails?.nextBillingDate) return 0;
    const expiry = new Date(subDetails.nextBillingDate);
    const diff = expiry.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const progress = Math.min(100, Math.max(0, (daysRemaining / 365) * 100));

  if (isLoading) {
    return (
      <main className="p-base md:p-md lg:p-lg min-h-screen flex flex-col gap-md lg:gap-lg overflow-x-hidden max-w-container-max mx-auto w-full">
        {/* Header */}
        <ProfileHeader pageName="Dashboard" />

        {/* Welcome & Concierge Skeletons */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          <Skeleton className="lg:col-span-2 h-[220px]" />
          <Skeleton className="h-[220px]" />
        </section>

        {/* Stats Skeletons */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </section>

        {/* Chart & Tables Skeletons */}
        <section className="grid grid-cols-1 xl:grid-cols-4 gap-md">
          <Skeleton className="xl:col-span-2 h-[380px]" />
          <Skeleton className="xl:col-span-2 h-[380px]" />
        </section>
      </main>
    );
  }

  return (
    <main className="p-base md:p-md lg:p-lg min-h-screen flex flex-col gap-md lg:gap-lg overflow-x-hidden max-w-container-max mx-auto w-full">
      {/* Header with Notification bell */}
      <ProfileHeader pageName="Dashboard" />

      {/* Welcome & Concierge section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <WelcomeCard />
        <ClientSyncCard />
      </section>

      {/* Stats Grid using StatCards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard
          label="Current Plan"
          value={subDetails?.planName || "Standard"}
          icon={<ShieldCheck className="text-primary w-6 h-6 fill-primary/10" />}
          borderLeftColor="primary"
        />
        <StatCard
          label="Active Workstations"
          value={`${stats?.active_licenses || 0} Devices`}
          icon={<Cpu className="text-outline-variant w-6 h-6" />}
          trend="Syncing"
          trendType="positive"
        />
        <StatCard
          label="Days Remaining"
          value={daysRemaining}
          progress={progress}
        />
        <StatCard
          label="Open Tickets"
          value={stats?.open_tickets ?? 0}
          icon={<HelpCircle className="text-outline-variant w-6 h-6" />}
        />
      </section>

      {/* Print Volume Analytics & Activity table list */}
      <section className="grid grid-cols-1 xl:grid-cols-4 gap-md">
        <PrintVolumeChart />
        <ActivityTable />
      </section>

      {/* Activations & Guides */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-md">
        <LicenseActivationCard />
        
        {/* Reusable Template widget */}
        <Card className="overflow-hidden p-0 group flex flex-col justify-between" animateHover>
          <div className="h-44 overflow-hidden relative">
            <div 
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
              style={{ 
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDMorH0gaGxe2No0BRRQKqASQ0tM3ElHjCKpZ4BIUvr_bbr2cEck6zFb4TqxpVP4DGPDiG6lCQbJHEDKhMUKjonwJUr_6PJqA6WTSX32pOIuIU805df2dsWezbvwTgZ-_vQ7QWNazQpJnLA5A6zsMY3wT2Ru5RWxGWAP6bnzWRkj3lGMoa96xGlqWQn9RiHAbtnt1rJ7xlhbi-FLb-4oCN_z-vbQDCkJOfwRPQwBnp_TaYgNWu5un5r')" 
              }}
            ></div>
          </div>
          <div className="p-md">
            <p className="font-label-md text-label-md text-on-surface font-bold">New Card Template: Security V3</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Released 2 days ago • Enterprise Exclusive</p>
          </div>
        </Card>

        {/* Cost Efficiency metrics card */}
        <Card className="flex flex-col justify-between" animateHover>
          <div>
            <h4 className="font-label-md text-label-md text-outline uppercase font-bold tracking-widest mb-sm">Cost Analytics</h4>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-xs">Estimated Savings</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              By printing PVC cards locally instead of utilizing outsourced third-party hubs.
            </p>
          </div>
          <div className="pt-md mt-md border-t border-outline-variant/10">
            <p className="font-display-lg text-display-lg text-secondary font-extrabold leading-none">₹24,964</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mt-xs">Total saved this quarter</p>
          </div>
        </Card>
      </section>
    </main>
  );
}
