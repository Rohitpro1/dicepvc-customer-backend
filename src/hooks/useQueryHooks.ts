"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/api/auth";
import { profileService } from "@/lib/api/profile";
import { licenseService } from "@/lib/api/license";
import { subscriptionService } from "@/lib/api/subscription";
import { downloadService } from "@/lib/api/download";
import { supportService } from "@/lib/api/support";
import { fetchWithRetry } from "@/lib/api/client";

// --- AUTH QUERIES & MUTATIONS ---

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => authService.getCurrentUser(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(["currentUser"], data.user);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: ({ email, name, companyName, phone, password }: any) =>
      authService.register(email, name, password), // registration parameters matching backend schemas
  });
}

// --- PROFILE QUERIES & MUTATIONS ---

export function useUserProfile() {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: () => profileService.getUserProfile(),
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, email }: { name: string; email: string }) =>
      profileService.updateUserProfile(name, email),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["userProfile"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

// --- LICENSE QUERIES & MUTATIONS ---

export function useActiveLicenses() {
  return useQuery({
    queryKey: ["activeLicenses"],
    queryFn: () => licenseService.getActiveLicenses(),
  });
}

export function useGenerateLicenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: string) => licenseService.generateNewLicense(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeLicenses"] });
    },
  });
}

export function useRevokeLicenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => licenseService.revokeLicense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeLicenses"] });
    },
  });
}

// --- SUBSCRIPTION & BILLING QUERIES ---

export function useSubscriptionDetails() {
  return useQuery({
    queryKey: ["subscriptionDetails"],
    queryFn: () => subscriptionService.getSubscriptionDetails(),
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const res = await fetchWithRetry("/billing/plans");
      return res.json();
    },
  });
}

export function usePaymentHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["paymentHistory", page, limit],
    queryFn: async () => {
      const res = await fetchWithRetry(`/billing/payments/history?page=${page}&limit=${limit}`);
      return res.json();
    },
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await fetchWithRetry("/billing/invoices/my");
      return res.json();
    },
  });
}

// --- SUPPORT TICKETS QUERIES & MUTATIONS ---

export function useSupportTickets() {
  return useQuery({
    queryKey: ["supportTickets"],
    queryFn: () => supportService.getSupportTickets(),
  });
}

export function useCreateTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subject, category, priority }: any) =>
      supportService.createSupportTicket(subject, category, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
  });
}

// --- DOWNLOADS QUERIES ---

export function useAvailableDownloads() {
  return useQuery({
    queryKey: ["availableDownloads"],
    queryFn: () => downloadService.getAvailableDownloads(),
  });
}

// --- DASHBOARD STATISTICS QUERIES ---

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const res = await fetchWithRetry("/customers/dashboard/stats");
      return res.json();
    },
  });
}

// --- NOTIFICATIONS & ANNOUNCEMENTS ---

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetchWithRetry("/notifications");
      return res.json();
    },
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ["unreadNotificationsCount"],
    queryFn: async () => {
      const res = await fetchWithRetry("/notifications/unread-count");
      return res.json();
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await fetchWithRetry("/notifications/mark-all-read", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationsCount"] });
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const res = await fetchWithRetry("/announcements");
      return res.json();
    },
  });
}

// --- ADMIN SPECIFIC QUERIES ---

export function useAdminStats() {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await fetchWithRetry("/admin/stats");
      return res.json();
    },
  });
}

export function useAdminUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["adminUsers", page, limit],
    queryFn: async () => {
      const res = await fetchWithRetry(`/admin/users?page=${page}&limit=${limit}`);
      return res.json();
    },
  });
}

export function useAdminSubscriptions(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["adminSubscriptions", page, limit],
    queryFn: async () => {
      const res = await fetchWithRetry(`/admin/subscriptions?page=${page}&limit=${limit}`);
      return res.json();
    },
  });
}

export function useAdminLicenses(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["adminLicenses", page, limit],
    queryFn: async () => {
      const res = await fetchWithRetry(`/admin/licenses?page=${page}&limit=${limit}`);
      return res.json();
    },
  });
}

export function useAdminAuditLogs(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["adminAuditLogs", page, limit],
    queryFn: async () => {
      const res = await fetchWithRetry(`/admin/audit-logs?page=${page}&limit=${limit}`);
      return res.json();
    },
  });
}
