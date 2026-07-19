"use client";

import React from "react";
import { MoreVertical, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAdminUsers } from "@/hooks/useQueryHooks";

export default function ActiveUsersTable() {
  const { data: usersData, isLoading } = useAdminUsers(1, 10);

  if (isLoading) {
    return (
      <Card className="md:col-span-8 flex items-center justify-center min-h-[300px]" animateHover>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  const users = usersData?.results || [];

  return (
    <Card className="md:col-span-8" animateHover>
      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-md">Active Platform Users</h3>
      <div className="overflow-x-auto w-full">
        {users.length === 0 ? (
          <p className="text-label-md text-on-surface-variant py-md text-center">No active users found.</p>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="text-left font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
                <th className="pb-sm px-base font-semibold">Entity</th>
                <th className="pb-sm px-base font-semibold">Role</th>
                <th className="pb-sm px-base font-semibold">Status</th>
                <th className="pb-sm px-base font-semibold">Created At</th>
                <th className="pb-sm px-base"></th>
              </tr>
            </thead>
            <tbody className="font-label-md">
              {users.map((u: any) => {
                const initials = u.name ? u.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "U";
                const createdDate = u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A";
                
                return (
                  <tr key={u.id} className="border-b border-outline-variant/10 hover:bg-white/40 transition-colors last:border-0">
                    <td className="py-md px-base flex items-center gap-sm">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-[10px] text-primary">
                        {initials}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{u.name}</p>
                        <p className="text-xs text-on-surface-variant opacity-70">ID: {u.id}</p>
                      </div>
                    </td>
                    <td className="py-md px-base">
                      <span className="px-sm py-xs bg-primary/10 text-primary rounded-full text-xs font-semibold">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-md px-base">
                      <span className="flex items-center gap-xs font-semibold text-on-surface">
                        <span className={`w-2 h-2 rounded-full ${u.status === "active" ? "bg-secondary" : "bg-outline"}`}></span>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-md px-base text-on-surface-variant">
                      {createdDate}
                    </td>
                    <td className="py-md px-base text-right">
                      <Button variant="ghost" size="icon" className="text-outline hover:text-primary">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
