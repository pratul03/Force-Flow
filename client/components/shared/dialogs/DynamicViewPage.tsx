"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface DynamicViewPageProps {
  title: string;
  subtitle?: string;
  backUrl?: string;
  onBack?: () => void;
  actions?: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
}

export function DynamicViewPage({
  title,
  subtitle,
  backUrl,
  onBack,
  actions,
  children,
  isLoading,
}: DynamicViewPageProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  const titleWithBack = (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 -ml-2">
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Go back</span>
      </Button>
      <span>{title}</span>
    </div>
  );

  return (
    <PageShell
      title={titleWithBack}
      description={subtitle}
      action={actions}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading details...
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      )}
    </PageShell>
  );
}
