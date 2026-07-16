"use client";

import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonLoadingSkeleton } from "@/components/ui/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useMailStore } from "@/features/mailbox/store";

const integrationMeta = {
  gmail: {
    title: "Gmail",
    description: "Connect Google Workspace/Gmail mailbox",
  },
  outlook: {
    title: "Outlook",
    description: "Connect Outlook/Microsoft 365 mailbox",
  },
} as const;

export default function SettingsPage() {
  const { logout, isLoading } = useAuth();
  const {
    providers,
    connectProvider,
    disconnectProvider,
    connectionError,
    clearConnectionError,
    isConnecting,
  } = useMailStore();

  const connectedCount = (["gmail", "outlook"] as const).filter(
    (provider) => providers[provider].connected,
  ).length;

  const handleToggle = async (
    provider: "gmail" | "outlook",
    checked: boolean,
  ) => {
    if (checked) {
      await connectProvider(provider);
      return;
    }

    disconnectProvider(provider);
  };

  return (
    <PageShell
      title="Settings"
      description="Manage your session and preferences."
    >

        <StaggerItem>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/settings/organization'}>
            <CardHeader>
              <CardTitle className="text-xl">Organization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage global settings, localization preferences (currency, timezone), and payroll rules for your tenant.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="w-full sm:w-auto" onClick={(e) => { e.stopPropagation(); window.location.href = '/settings/organization'; }}>
                  Organization Details
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={(e) => { e.stopPropagation(); window.location.href = '/settings/locations'; }}>
                  Locations
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={(e) => { e.stopPropagation(); window.location.href = '/settings/holidays'; }}>
                  Holidays
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={(e) => { e.stopPropagation(); window.location.href = '/settings/shifts'; }}>
                  Shifts
                </Button>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Integrations</span>
                <Badge variant="secondary">{connectedCount}/2 connected</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <div className="flex items-center justify-between gap-3">
                    <span>{connectionError}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearConnectionError}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}

              {(["gmail", "outlook"] as const).map((provider) => (
                <div
                  key={provider}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {integrationMeta[provider].title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {integrationMeta[provider].description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant={
                          providers[provider].clientIdConfigured
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {providers[provider].clientIdConfigured
                          ? "Server OAuth configured"
                          : "Server OAuth missing"}
                      </Badge>
                      <Badge variant="outline">OAuth 2.0</Badge>
                    </div>
                    {providers[provider].connected &&
                      providers[provider].accountEmail && (
                        <p className="mt-2 text-xs text-emerald-700">
                          Connected as {providers[provider].accountEmail}
                        </p>
                      )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {providers[provider].connected
                        ? "Connected"
                        : "Disconnected"}
                    </span>
                    <Switch
                      checked={providers[provider].connected}
                      onCheckedChange={(checked) => {
                        void handleToggle(provider, checked);
                      }}
                      aria-label={`${integrationMeta[provider].title} integration toggle`}
                      disabled={isConnecting}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                disabled={isLoading}
                onClick={() => void logout()}
              >
                {isLoading ? (
                  <ButtonLoadingSkeleton inverted className="w-28" />
                ) : (
                  "Logout"
                )}
              </Button>
            </CardContent>
          </Card>
        </StaggerItem>
    </PageShell>
  );
}
