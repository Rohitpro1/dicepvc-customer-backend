"use client";

import React, { useEffect, useState } from "react";
import { 
  DollarSign, 
  UserPlus, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import RevenueAnalytics from "@/components/sections/admin/RevenueAnalytics";
import VersionRollout from "@/components/sections/admin/VersionRollout";
import UrgentTickets from "@/components/sections/admin/UrgentTickets";
import ActiveUsersTable from "@/components/sections/admin/ActiveUsersTable";
import AdminPricingPanel from "@/components/sections/admin/AdminPricingPanel";
import Skeleton from "@/components/ui/Skeleton";

export default function AdminDashboard() {
  const [revenue, setRevenue] = useState(1482900);
  const [isLoading, setIsLoading] = useState(true);

  // Live revenue updates every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRevenue((prev) => prev + Math.floor(Math.random() * 50));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <main className="p-base md:p-md lg:p-lg min-h-screen relative overflow-y-auto max-w-container-max mx-auto w-full">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-xl gap-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Executive Dashboard</h2>
            <p className="text-on-surface-variant font-body-md opacity-80">Welcome back, Super Admin. Here is the current platform state.</p>
          </div>
        </header>

        {/* Stats Grid Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-xl animate-fade-in">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>

        {/* Analytics Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mb-xl">
          <Skeleton className="lg:col-span-2 h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>

        {/* Version & Tickets Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-xl">
          <Skeleton className="h-[250px]" />
          <Skeleton className="h-[250px]" />
        </div>

        {/* Users & Config Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
          <Skeleton className="md:col-span-8 h-[300px]" />
          <Skeleton className="md:col-span-4 h-[300px]" />
        </div>
      </main>
    );
  }

  return (
    <main className="p-base md:p-md lg:p-lg min-h-screen relative overflow-y-auto max-w-container-max mx-auto w-full">
      {/* Background Glows */}
      <div className="fixed -z-10 top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed -z-10 bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-xl gap-md">
        <div>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Executive Dashboard</h2>
          <p className="text-on-surface-variant font-body-md opacity-80">Welcome back, Super Admin. Here is the current platform state.</p>
        </div>
        <div className="flex items-center gap-md">
          <div className="text-right">
            <p className="font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">System Status</p>
            <div className="flex items-center gap-base justify-end">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
              <p className="font-label-md font-bold text-secondary">All Nodes Operational</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 p-0.5 shadow-sm select-none">
            <img 
              className="w-full h-full rounded-full object-cover" 
              alt="Super Admin Portrait" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCF4uwFZ29BhVi4iQTsiIaKeXsV2sSUIkLg24uHXgE8Ih1dqK2Ac51iBSSX5nIDxBkyA0y7H7jt4mL6V0U9qT3Bv6RXeDBh3dNDLSaTN_XjUY9wffKoJuvdINwg5dpr_QwXpjtbjDw9R_hAxEONvQabgGaEHob1qktriE2cpPuKHEAKLXHvDCQpJFdwlj2YlrL_72EQj-vtp8v1yyGiFPbBGJOvQlKswar1Xg8GCZ56X12gy8UvcXc"
            />
          </div>
        </div>
      </header>

      {/* Stats Grid using reusable StatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
        <StatCard
          label="Monthly Revenue"
          value={revenue}
          icon={<DollarSign className="w-5 h-5 text-primary" />}
          trend="+12.5%"
          trendType="positive"
        />
        <StatCard
          label="New Users"
          value={12402}
          icon={<UserPlus className="w-5 h-5 text-secondary" />}
          trend="+4.2%"
          trendType="positive"
        />
        <StatCard
          label="License Renewals"
          value="94.8%"
          icon={<CheckCircle className="w-5 h-5 text-tertiary" />}
          trend="-1.1%"
          trendType="negative"
        />
        <StatCard
          label="Open Tickets"
          value={42}
          icon={<AlertCircle className="w-5 h-5 text-error" />}
          trend="Active"
          trendType="neutral"
        />
      </div>

      {/* Analytics chart and trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mb-xl">
        <RevenueAnalytics />

        {/* License trends details */}
        <StatCard
          label="License Trends"
          value="64%"
          trend="Activation by plan type"
          className="h-[400px] flex flex-col justify-between"
        >
          <div className="space-y-md flex-1 flex flex-col justify-center">
            <div className="space-y-xs">
              <div className="flex justify-between font-label-md">
                <span className="text-on-surface font-semibold">Enterprise AI</span>
                <span className="font-bold">64%</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[64%] rounded-full"></div>
              </div>
            </div>
            <div className="space-y-xs">
              <div className="flex justify-between font-label-md">
                <span className="text-on-surface font-semibold">Professional Plus</span>
                <span className="font-bold">28%</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-secondary-fixed-dim w-[28%] rounded-full"></div>
              </div>
            </div>
            <div className="space-y-xs">
              <div className="flex justify-between font-label-md">
                <span className="text-on-surface font-semibold">Legacy Base</span>
                <span className="font-bold">8%</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-container w-[8%] rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="pt-md mt-auto">
            <button className="w-full py-sm border border-outline-variant text-on-surface-variant rounded-xl font-label-md hover:bg-surface-container transition-all cursor-pointer font-semibold">
              Download Audit Log
            </button>
          </div>
        </StatCard>
      </div>

      {/* Software Fleet Release & Ticket Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-xl">
        <VersionRollout />
        <UrgentTickets />
      </div>

      {/* Users & Configuration panels */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
        <ActiveUsersTable />
        <AdminPricingPanel />
      </div>
    </main>
  );
}
