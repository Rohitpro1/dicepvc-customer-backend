"use client";

import React from "react";
import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileHeaderProps {
  pageName: string;
}

import {
  useUserProfile,
  useNotifications,
  useUnreadNotificationsCount,
  useMarkAllNotificationsReadMutation
} from "@/hooks/useQueryHooks";

export default function ProfileHeader({ pageName }: ProfileHeaderProps) {
  const [showNotifications, setShowNotifications] = React.useState(false);
  const { data: profile } = useUserProfile();
  const { data: notificationsData } = useNotifications();
  const { data: unreadData } = useUnreadNotificationsCount();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const unreadCount = unreadData?.unread_count ?? 0;
  const rawNotifications = notificationsData || [];
  
  const notifications = rawNotifications.map((n: any) => ({
    id: n.id,
    text: n.message || n.title,
    unread: !n.is_read,
    time: new Date(n.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }));

  const userName = profile?.name || "Customer";
  const userRole = profile?.role === "admin" || profile?.role === "super_admin" ? "Enterprise Admin" : "SaaS Customer";

  const markAllRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <header className="flex justify-between items-center w-full relative">
      <nav className="flex items-center gap-xs font-label-md text-label-md text-on-surface-variant select-none" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary transition-colors">
          DicePVC
        </Link>
        <ChevronRight className="w-4 h-4 text-on-surface-variant" aria-hidden="true" />
        <span className="text-on-surface font-semibold">{pageName}</span>
      </nav>
      <div className="flex items-center gap-md">
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer relative"
            aria-label="Toggle notifications"
            type="button"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary border-2 border-surface-container-high rounded-full" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl border border-outline-variant/20 rounded-2xl shadow-xl p-md z-50 space-y-md"
                >
                  <div className="flex justify-between items-center pb-xs border-b border-outline-variant/10">
                    <p className="font-label-md font-bold text-on-surface">Notifications</p>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead}
                        className="text-primary hover:underline text-[11px] font-semibold cursor-pointer"
                        type="button"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="space-y-md max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-label-sm text-on-surface-variant text-center py-sm">No new notifications.</p>
                    ) : (
                      notifications.map((n: any) => (
                        <div key={n.id} className="text-label-md space-y-[2px]">
                          <div className="flex justify-between items-start gap-sm">
                            <p className={`text-label-md leading-snug ${n.unread ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>{n.text}</p>
                            {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />}
                          </div>
                          <p className="text-[10px] text-outline font-semibold">{n.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-sm">
          <div className="text-right hidden sm:block">
            <p className="font-label-md text-label-md text-on-surface font-bold leading-tight">{userName}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{userRole}</p>
          </div>
          <img 
            className="w-10 h-10 rounded-full border-2 border-primary-fixed shadow-sm object-cover" 
            alt="User Portrait" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBv3CGK_BHcG0nad0tMKx0W5ZV1QfrLX7aoK7byWfpOgn7ISGJI8wFuweCQmC00qVeMDEvBl9njzbhPBlu8fYRhlQOrkWj86rsS7jB_RkB2kYPYXxabiZBYlwWB0gu5_mkgq6_4M5KU5wpZLvdQWCtztx47gCGWftg5_pgBzMxGFlSNwMhl1E86u3GmM1ncNwtWBbp7cZ-z3rFsRQPsw-AUZkbNbTKq-HhD1H7-w3muipIaW5Huz_db"
          />
        </div>
      </div>
    </header>
  );
}
