"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import RevenueChart from "@/components/custom/RevenueChart";

export default function RevenueAnalytics() {
  return (
    <Card className="lg:col-span-2 h-[400px] flex flex-col justify-between p-md" animateHover={false}>
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Revenue Analytics</h3>
          <p className="text-on-surface-variant font-label-md">Rolling 30-day performance</p>
        </div>
        <div className="flex gap-base">
          <Button size="sm" variant="primary" className="px-4 py-1.5 rounded-full text-label-sm">Daily</Button>
          <Button size="sm" variant="outline" className="px-4 py-1.5 rounded-full text-label-sm">Monthly</Button>
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <RevenueChart />
      </div>
    </Card>
  );
}
