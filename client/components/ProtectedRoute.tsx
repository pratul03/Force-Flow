"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageLoadingSkeleton } from "@/components/ui/loading-skeletons";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string[];
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (requiredRole && user && !requiredRole.includes(user.role)) {
      router.push("/unauthorized");
      return;
    }

    setIsAuthorized(true);
  }, [isAuthenticated, isInitialized, user, requiredRole, router]);

  if (!isInitialized || !isAuthorized) {
    return <PageLoadingSkeleton className="min-h-screen" />;
  }

  return <>{children}</>;
}
