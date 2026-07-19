export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "customer" | "support" | "super_admin";
  status: string;
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
  status: string;
  createdAt: string;
  expiresAt: string;
  activeDevices: number;
  maxDevices: number;
}

export interface SubscriptionDetails {
  id?: string;
  planName: string;
  status: string;
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

/** Matches backend CustomerDetailsOut exactly. */
export interface CustomerProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  company_name: string;
  phone: string;
  gst_number?: string | null;
  avatar_url?: string | null;
  billing_address: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  };
  created_at: string;
}

/** Matches backend CustomerUpdateInput. */
export interface CustomerUpdateInput {
  company_name?: string;
  phone?: string;
  billing_address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  gst_number?: string;
  avatar_url?: string;
}
