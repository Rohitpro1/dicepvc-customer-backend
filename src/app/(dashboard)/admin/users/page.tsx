"use client";

import React, { useState } from "react";
import { 
  Users, 
  Search, 
  ShieldAlert, 
  UserCheck, 
  UserMinus, 
  Loader2, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  useAdminUsers, 
  useUpdateUserRoleMutation, 
  useSuspendUserMutation, 
  useUnsuspendUserMutation 
} from "@/hooks/useQueryHooks";
import Skeleton from "@/components/ui/Skeleton";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  const { data: usersData, isLoading } = useAdminUsers(page, 10);
  const updateRoleMutation = useUpdateUserRoleMutation();
  const suspendMutation = useSuspendUserMutation();
  const unsuspendMutation = useUnsuspendUserMutation();

  const handleRoleChange = (userId: string, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };

  const handleToggleSuspend = (userId: string, isSuspended: boolean) => {
    if (isSuspended) {
      unsuspendMutation.mutate(userId);
    } else {
      suspendMutation.mutate(userId);
    }
  };

  const users = usersData?.results || [];
  const totalPages = usersData?.pages || 1;

  // Local client-side filter fallback as user types (or they can hit search)
  const filteredUsers = users.filter((u: any) => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="p-base md:p-md lg:p-lg min-h-screen relative overflow-y-auto max-w-container-max mx-auto w-full">
      {/* Background Glows */}
      <div className="fixed -z-10 top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed -z-10 bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="mb-md">
        <ProfileHeader pageName="User Management" />
      </div>

      <div className="flex flex-col gap-md mt-md">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface font-bold">Platform Users</h1>
          <p className="text-on-surface-variant font-body-md">
            Manage administrative role elevations, suspend credentials, and inspect customer profiles.
          </p>
        </div>

        {/* Search Toolbar */}
        <div className="flex bg-surface-container-low/40 backdrop-blur-md p-sm rounded-2xl border border-outline-variant/10 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              placeholder="Filter active users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/50 border border-outline-variant/20 rounded-xl font-label-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="space-y-md">
            <Skeleton className="h-[200px]" />
          </div>
        ) : (
          <Card className="p-lg" animateHover={false}>
            <div className="overflow-x-auto w-full">
              {filteredUsers.length === 0 ? (
                <p className="text-label-md text-on-surface-variant py-md text-center">No platform users found.</p>
              ) : (
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="text-left font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
                      <th className="pb-sm px-base font-semibold">User Info</th>
                      <th className="pb-sm px-base font-semibold">Current Role</th>
                      <th className="pb-sm px-base font-semibold">Status</th>
                      <th className="pb-sm px-base font-semibold">Credentials Created</th>
                      <th className="pb-sm px-base text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-label-md">
                    {filteredUsers.map((u: any) => {
                      const initials = u.name ? u.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "U";
                      const createdDate = u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A";
                      const isSuspended = u.status === "suspended";

                      return (
                        <tr key={u.id} className="border-b border-outline-variant/10 hover:bg-white/40 transition-colors last:border-0">
                          <td className="py-md px-base flex items-center gap-sm">
                            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-[10px] text-primary">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-on-surface">{u.name}</p>
                              <p className="text-xs text-on-surface-variant opacity-75">{u.email}</p>
                            </div>
                          </td>
                          <td className="py-md px-base">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={updateRoleMutation.isPending}
                              className="bg-surface-container border border-outline-variant/20 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer text-on-surface"
                            >
                              <option value="customer">Customer</option>
                              <option value="support">Support Staff</option>
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          </td>
                          <td className="py-md px-base">
                            <span className="flex items-center gap-xs font-semibold text-on-surface">
                              <span className={`w-2 h-2 rounded-full ${isSuspended ? "bg-error animate-pulse" : "bg-secondary"}`}></span>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-md px-base text-on-surface-variant">
                            {createdDate}
                          </td>
                          <td className="py-md px-base text-right">
                            <Button
                              variant={isSuspended ? "outline" : "outline"}
                              size="sm"
                              disabled={suspendMutation.isPending || unsuspendMutation.isPending}
                              onClick={() => handleToggleSuspend(u.id, isSuspended)}
                              className="flex items-center gap-xs text-xs font-semibold ml-auto"
                            >
                              {isSuspended ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 text-secondary" />
                                  Unsuspend
                                </>
                              ) : (
                                <>
                                  <UserMinus className="w-3.5 h-3.5 text-error" />
                                  Suspend
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-sm pt-md border-t border-outline-variant/10 mt-md select-none">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-label-sm text-xs font-bold text-on-surface-variant">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}
