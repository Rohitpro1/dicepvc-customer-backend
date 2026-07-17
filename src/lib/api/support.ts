import { fetchWithRetry } from "./client";
import { SupportTicket } from "./types";

export const supportService = {
  async getSupportTickets(): Promise<SupportTicket[]> {
    const res = await fetchWithRetry("/tickets");
    const data = await res.json();
    
    // Map list payload
    const results = data.results || data;
    return results.map((t: any) => ({
      id: t.id,
      subject: t.title,
      status: t.status === "open" ? "Open" : t.status === "closed" ? "Closed" : "In Progress",
      priority: t.priority === "critical" ? "Critical" : t.priority === "high" ? "High" : t.priority === "medium" ? "Medium" : "Low",
      category: "Technical", // Default category metadata
      createdAt: t.created_at
    }));
  },

  async createSupportTicket(
    subject: string,
    category: "Billing" | "Technical" | "License" | "General",
    priority: "Low" | "Medium" | "High" | "Critical"
  ): Promise<SupportTicket> {
    const res = await fetchWithRetry("/tickets", {
      method: "POST",
      body: JSON.stringify({
        title: subject,
        description: `Support request for ${category}. Priority designated as ${priority}.`,
        priority: priority.toLowerCase()
      })
    });
    const t = await res.json();
    return {
      id: t.id,
      subject: t.title,
      status: "Open",
      priority: priority,
      category: category,
      createdAt: t.created_at || new Date().toISOString()
    };
  }
};

export default supportService;
