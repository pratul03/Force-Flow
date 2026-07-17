"use client";

import { ReactNode, useEffect } from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import { Header } from "@/components/layout/Header/Header";

import { useAuth } from "@/hooks/useAuth";
import { useMailStore } from "@/features/mailbox/store";
import { MailConnectDialog } from "@/components/mail/MailConnectDialog";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const initializeForUser = useMailStore((state) => state.initializeForUser);
  const maybeOpenConnectDialog = useMailStore(
    (state) => state.maybeOpenConnectDialog,
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    initializeForUser(user);
    maybeOpenConnectDialog();
  }, [user, initializeForUser, maybeOpenConnectDialog]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 flex flex-col md:ml-0 overflow-hidden">
          {/* Header */}
          <Header />

          {/* Content */}
          <main
            className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 thin-scrollbar"
          >
            {children}
          </main>
        </div>
        <MailConnectDialog />
      </div>
    </ProtectedRoute>
  );
}
