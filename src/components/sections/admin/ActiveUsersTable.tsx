"use client";

import React from "react";
import { MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ActiveUsersTable() {
  const users = [
    { name: "NextGen Quantum", tag: "NQ", id: "#99281", plan: "Enterprise", status: "Active", progress: 75 },
    { name: "DataSphere Global", tag: "DS", id: "#44102", plan: "Enterprise", status: "Active", progress: 22 },
  ];

  return (
    <Card className="md:col-span-8" animateHover>
      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-md">Active Platform Users</h3>
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="text-left font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
              <th className="pb-sm px-base font-semibold">Entity</th>
              <th className="pb-sm px-base font-semibold">Plan</th>
              <th className="pb-sm px-base font-semibold">Status</th>
              <th className="pb-sm px-base font-semibold">Usage</th>
              <th className="pb-sm px-base"></th>
            </tr>
          </thead>
          <tbody className="font-label-md">
            {users.map((u) => (
              <tr key={u.id} className="border-b border-outline-variant/10 hover:bg-white/40 transition-colors last:border-0">
                <td className="py-md px-base flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-[10px] text-primary">
                    {u.tag}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{u.name}</p>
                    <p className="text-xs text-on-surface-variant opacity-70">ID: {u.id}</p>
                  </div>
                </td>
                <td className="py-md px-base">
                  <span className="px-sm py-xs bg-primary/10 text-primary rounded-full text-xs font-semibold">
                    {u.plan}
                  </span>
                </td>
                <td className="py-md px-base">
                  <span className="flex items-center gap-xs font-semibold text-on-surface">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    {u.status}
                  </span>
                </td>
                <td className="py-md px-base">
                  <div className="flex items-center gap-base">
                    <span className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full" 
                        style={{ width: `${u.progress}%` }}
                      ></div>
                    </span>
                    {u.progress}%
                  </div>
                </td>
                <td className="py-md px-base text-right">
                  <Button variant="ghost" size="icon" className="text-outline hover:text-primary">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
