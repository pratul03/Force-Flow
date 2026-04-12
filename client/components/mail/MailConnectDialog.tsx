"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useMailStore } from "@/lib/stores/mailStore";
import { Mail, Mailbox } from "lucide-react";
import { cn } from "@/lib/utils";

function GmailIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Gmail"
      role="img"
      viewBox="0 0 512 512"
      className={className}
    >
      <rect width="512" height="512" rx="15%" fill="#ffffff" />
      <path d="M158 391v-142l-82-63V361q0 30 30 30" fill="#4285f4" />
      <path d="M154 248l102 77l102-77v-98l-102 77l-102-77" fill="#ea4335" />
      <path d="M354 391v-142l82-63V361q0 30-30 30" fill="#34a853" />
      <path d="M76 188l82 63v-98l-30-23c-27-21-52 0-52 26" fill="#c5221f" />
      <path d="M436 188l-82 63v-98l30-23c27-21 52 0 52 26" fill="#fbbc04" />
    </svg>
  );
}

function OutlookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Outlook"
      role="img"
      viewBox="0 0 32 32"
      className={className}
    >
      <rect x="10" y="2" width="20" height="28" rx="2" fill="#1066B5" />
      <rect
        x="10"
        y="2"
        width="20"
        height="28"
        rx="2"
        fill="url(#outlook-paint0-linear)"
      />
      <rect x="10" y="5" width="10" height="10" fill="#32A9E7" />
      <rect x="10" y="15" width="10" height="10" fill="#167EB4" />
      <rect x="20" y="15" width="10" height="10" fill="#32A9E7" />
      <rect x="20" y="5" width="10" height="10" fill="#58D9FD" />
      <mask
        id="outlook-mask0"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="8"
        y="14"
        width="24"
        height="16"
      >
        <path
          d="M8 14H30C31.1046 14 32 14.8954 32 16V28C32 29.1046 31.1046 30 30 30H10C8.89543 30 8 29.1046 8 28V14Z"
          fill="url(#outlook-paint1-linear)"
        />
      </mask>
      <g mask="url(#outlook-mask0)">
        <path d="M32 14V18H30V14H32Z" fill="#135298" />
        <path d="M32 30V16L7 30H32Z" fill="url(#outlook-paint2-linear)" />
        <path d="M8 30V16L33 30H8Z" fill="url(#outlook-paint3-linear)" />
      </g>
      <path
        d="M8 12C8 10.3431 9.34315 9 11 9H17C18.6569 9 20 10.3431 20 12V24C20 25.6569 18.6569 27 17 27H8V12Z"
        fill="#000000"
        fillOpacity="0.3"
      />
      <rect
        x="0"
        y="7"
        width="18"
        height="18"
        rx="2"
        fill="url(#outlook-paint4-linear)"
      />
      <path
        d="M14 16.0693V15.903C14 13.0222 11.9272 11 9.01582 11C6.08861 11 4 13.036 4 15.9307V16.097C4 18.9778 6.07278 21 9 21C11.9114 21 14 18.964 14 16.0693ZM11.6424 16.097C11.6424 18.0083 10.5665 19.1579 9.01582 19.1579C7.46519 19.1579 6.37342 17.9806 6.37342 16.0693V15.903C6.37342 13.9917 7.44937 12.8421 9 12.8421C10.5348 12.8421 11.6424 14.0194 11.6424 15.9307V16.097Z"
        fill="white"
      />
      <defs>
        <linearGradient
          id="outlook-paint0-linear"
          x1="10"
          y1="16"
          x2="30"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#064484" />
          <stop offset="1" stopColor="#0F65B5" />
        </linearGradient>
        <linearGradient
          id="outlook-paint1-linear"
          x1="8"
          y1="26.7692"
          x2="32"
          y2="26.7692"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1B366F" />
          <stop offset="1" stopColor="#2657B0" />
        </linearGradient>
        <linearGradient
          id="outlook-paint2-linear"
          x1="32"
          y1="23"
          x2="8"
          y2="23"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#44DCFD" />
          <stop offset="0.453125" stopColor="#259ED0" />
        </linearGradient>
        <linearGradient
          id="outlook-paint3-linear"
          x1="8"
          y1="23"
          x2="32"
          y2="23"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#259ED0" />
          <stop offset="1" stopColor="#44DCFD" />
        </linearGradient>
        <linearGradient
          id="outlook-paint4-linear"
          x1="0"
          y1="16"
          x2="18"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#064484" />
          <stop offset="1" stopColor="#0F65B5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const providerMeta = {
  gmail: {
    label: "Gmail",
    description: "Connect your Google mailbox with OAuth 2.0",
    icon: GmailIcon,
    cardClass:
      "border-red-100/80 bg-linear-to-br from-red-50/80 via-white to-blue-50/70 dark:border-red-950/40 dark:from-red-950/20 dark:via-background dark:to-blue-950/20",
    iconWrapClass:
      "border-red-100 bg-white shadow-[0_8px_18px_-10px_rgba(234,67,53,0.7)]",
    buttonClass: "bg-[#EA4335] text-white hover:bg-[#d7372c]",
  },
  outlook: {
    label: "Outlook",
    description: "Connect your Microsoft mailbox with OAuth 2.0",
    icon: OutlookIcon,
    cardClass:
      "border-sky-100/80 bg-linear-to-br from-sky-50/80 via-white to-cyan-50/70 dark:border-sky-950/40 dark:from-sky-950/20 dark:via-background dark:to-cyan-950/20",
    iconWrapClass:
      "border-sky-100 bg-white shadow-[0_8px_18px_-10px_rgba(16,102,181,0.7)]",
    buttonClass: "bg-[#1066B5] text-white hover:bg-[#0d56a0]",
  },
} as const;

export function MailConnectDialog() {
  const {
    isConnectDialogOpen,
    closeConnectDialog,
    connectProvider,
    clearConnectionError,
    connectionError,
    isConnecting,
    providers,
  } = useMailStore();

  return (
    <Dialog
      open={isConnectDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          clearConnectionError();
          closeConnectDialog();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-xl border-border/80 bg-card/95 p-0 backdrop-blur-sm"
      >
        <div className="rounded-t-lg border-b border-border/70 bg-linear-to-r from-slate-50 via-white to-slate-50 px-6 py-4 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/40">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            Secure OAuth connection
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mailbox className="h-5 w-5" />
              Connect your mailbox
            </DialogTitle>
            <DialogDescription>
              Link Gmail and/or Outlook to read, search, and send real emails
              from inside the portal.
            </DialogDescription>
          </DialogHeader>

          {connectionError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {connectionError}
            </div>
          )}

          <div className="space-y-3">
            {(["gmail", "outlook"] as const).map((provider) => {
              const meta = providerMeta[provider];
              const ProviderIcon = meta.icon;
              const isConnected = providers[provider].connected;

              return (
                <div
                  key={provider}
                  className={cn(
                    "group flex items-center justify-between gap-4 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                    meta.cardClass,
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl border",
                        meta.iconWrapClass,
                      )}
                    >
                      <ProviderIcon className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{meta.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {meta.description}
                      </p>
                      {isConnected && providers[provider].accountEmail && (
                        <Badge variant="secondary" className="mt-1">
                          Connected: {providers[provider].accountEmail}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      void connectProvider(provider);
                    }}
                    variant={isConnected ? "secondary" : "default"}
                    className={cn("min-w-28", !isConnected && meta.buttonClass)}
                    disabled={isConnecting || isConnected}
                  >
                    {isConnected ? "Connected" : "Connect"}
                  </Button>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeConnectDialog}>
              Maybe later
            </Button>
            <Button onClick={closeConnectDialog}>
              <Mail className="mr-2 h-4 w-4" />
              Continue to portal
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
