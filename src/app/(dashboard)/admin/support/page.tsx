"use client";

import React, { useState } from "react";
import { 
  Headphones, 
  Search, 
  UserCheck, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2,
  XCircle
} from "lucide-react";
import ProfileHeader from "@/components/shared/ProfileHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  useSupportTickets, 
  useAssignTicketMutation, 
  useEscalateTicketMutation, 
  useCloseTicketMutation 
} from "@/hooks/useQueryHooks";
import Skeleton from "@/components/ui/Skeleton";

export default function AdminSupportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: tickets, isLoading } = useSupportTickets();
  const assignMutation = useAssignTicketMutation();
  const escalateMutation = useEscalateTicketMutation();
  const closeMutation = useCloseTicketMutation();

  const handleAssign = (ticketId: string, assigneeId: string) => {
    if (!assigneeId || assigneeId.length < 5) {
      alert("Please enter a valid assignee ID (at least 5 characters).");
      return;
    }
    assignMutation.mutate({ ticketId, assigneeId });
  };

  const handleEscalate = (ticketId: string, priority: string) => {
    escalateMutation.mutate({ ticketId, priority });
  };

  const handleClose = (ticketId: string) => {
    if (confirm("Are you sure you want to mark this support ticket as Closed?")) {
      closeMutation.mutate(ticketId);
    }
  };

  const filteredTickets = (tickets || []).filter((t: any) => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <main className="p-base md:p-md lg:p-lg min-h-screen relative overflow-y-auto max-w-container-max mx-auto w-full">
      {/* Background Glows */}
      <div className="fixed -z-10 top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed -z-10 bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="mb-md">
        <ProfileHeader pageName="Platform Support Tickets" />
      </div>

      <div className="flex flex-col gap-md mt-md">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface font-bold">Support Center</h1>
          <p className="text-on-surface-variant font-body-md">
            Manage technical assistance requests, assign tickets to support staff, and escalate urgent PVC issues.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex bg-surface-container-low/40 backdrop-blur-md p-sm rounded-2xl border border-outline-variant/10 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              placeholder="Search tickets by subject or ticket ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/50 border border-outline-variant/20 rounded-xl font-label-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Tickets Grid */}
        {isLoading ? (
          <Skeleton className="h-[300px]" />
        ) : filteredTickets.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-xl text-center space-y-md min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Headphones className="w-8 h-8" />
            </div>
            <div className="space-y-xs">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">No Tickets Found</h3>
              <p className="text-on-surface-variant font-body-md max-w-sm">
                No customer support tickets match your search parameters.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-md">
            {filteredTickets.map((ticket: any) => {
              const isClosed = ticket.status === "Closed";
              
              return (
                <Card 
                  key={ticket.id} 
                  className={`border border-outline-variant/10 p-md flex flex-col md:flex-row justify-between gap-md ${
                    isClosed ? "opacity-75 bg-surface-container-low" : ""
                  }`}
                  animateHover
                >
                  <div className="flex-1 space-y-sm">
                    <div className="flex flex-wrap items-center gap-sm">
                      <span className="font-mono text-xs font-bold text-primary">
                        #{ticket.id.slice(-8).toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase border rounded-full ${getPriorityClass(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isClosed ? "bg-surface-container-high text-outline" : "bg-secondary/15 text-secondary"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-label-md text-on-surface leading-tight">{ticket.subject}</h3>
                      <p className="text-xs text-on-surface-variant mt-xs">Category: {ticket.category}</p>
                    </div>
                  </div>

                  {!isClosed && (
                    <div className="flex flex-wrap items-center gap-sm pt-sm md:pt-0 border-t border-outline-variant/10 md:border-t-0">
                      {/* Assignee Handler */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const assignee = formData.get("assigneeId") as string;
                          handleAssign(ticket.id, assignee);
                        }}
                        className="flex items-center gap-xs"
                      >
                        <input
                          name="assigneeId"
                          placeholder="Agent ID"
                          required
                          className="bg-surface-container border border-outline-variant/20 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-primary w-24 text-on-surface"
                        />
                        <Button 
                          type="submit" 
                          variant="outline" 
                          size="sm"
                          disabled={assignMutation.isPending}
                          className="text-xs p-1 h-7"
                          title="Assign Agent"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </Button>
                      </form>

                      {/* Escalate Priority */}
                      <select
                        onChange={(e) => handleEscalate(ticket.id, e.target.value)}
                        value={ticket.priority}
                        disabled={escalateMutation.isPending}
                        className="bg-surface-container border border-outline-variant/20 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer text-on-surface"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>

                      {/* Close Ticket */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={closeMutation.isPending}
                        onClick={() => handleClose(ticket.id)}
                        className="flex items-center gap-xs text-xs font-semibold text-error border-error/20 hover:bg-error-container/10 h-7 px-2"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Close
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
