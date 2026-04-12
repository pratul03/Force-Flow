"use client";

import { ReactNode, useEffect } from "react";
import * as motion from "motion/react-client";
import { ProtectedRoute } from "../ProtectedRoute";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MOTION_TRANSITIONS } from "@/lib/motion-presets";
import { useAuth } from "@/hooks/useAuth";
import { useMailStore } from "@/lib/stores/mailStore";
import { MailConnectDialog } from "@/components/mail/MailConnectDialog";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
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
        <div className="flex-1 flex flex-col md:ml-0">
          {/* Header */}
          <Header />

          {/* Content */}
          <motion.main
            layout
            transition={MOTION_TRANSITIONS.layout}
            className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8"
          >
            {children}
          </motion.main>
        </div>
        <MailConnectDialog />
      </div>
    </ProtectedRoute>
  );
}
