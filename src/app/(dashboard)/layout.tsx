"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";
import MobileNav from "@/components/shared/MobileNav";

import PageTransition from "@/components/shared/PageTransition";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen">
      {/* Shared Responsive Sidebar */}
      <Sidebar mode={isAdmin ? "admin" : "customer"} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-20 md:pb-0">
        <PageTransition key={pathname}>
          {children}
        </PageTransition>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
