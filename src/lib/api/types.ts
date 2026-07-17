export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "customer" | "support" | "super_admin";
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LicenseKey {
  id: string;
  key: string;
  plan: string;
  status: "Active" | "Expired" | "Suspended";
  createdAt: string;
  expiresAt: string;
  activeDevices: number;
  maxDevices: number;
}

export interface SubscriptionDetails {
  planName: string;
  status: "Active" | "Past Due" | "Canceled";
  price: string;
  period: "month" | "year";
  nextBillingDate: string;
  features: string[];
}

export interface DownloadItem {
  id: string;
  name: string;
  version: string;
  platform: "Windows" | "macOS" | "Linux" | "All";
  size: string;
  url: string;
  category: "CLI" | "Driver" | "Template";
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Critical";
  category: "Billing" | "Technical" | "License" | "General";
  createdAt: string;
}
