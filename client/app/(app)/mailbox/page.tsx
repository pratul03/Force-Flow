"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/layout/PageShell";
import { useMailStore } from "@/features/mailbox/store";
import { cn } from "@/lib/utils";
import {
  MailAttachmentFilter,
  MailDraftAttachment,
  MailFolder,
  MailMessage,
  MailProvider,
  MailReadFilter,
  MailSortOption,
} from "@/features/mailbox/types";
import {
  Archive,
  Circle,
  FilePenLine,
  Inbox,
  MailPlus,
  Paperclip,
  RefreshCcw,
  Search,
  Send,
  SquareArrowOutUpRight,
} from "lucide-react";

const providerLabels: Record<MailProvider, string> = {
  gmail: "Gmail",
  outlook: "Outlook",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMessageTime(dateIso: string): string {
  return new Date(dateIso).toLocaleString();
}

function formatRelativeTime(dateIso: string): string {
  const value = new Date(dateIso).getTime();
  const diffMs = Date.now() - value;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const mins = Math.max(1, Math.round(diffMs / minute));
    return `${mins} min ago`;
  }

  if (diffMs < day) {
    const hours = Math.round(diffMs / hour);
    return `${hours} hr ago`;
  }

  if (diffMs < 365 * day) {
    const days = Math.round(diffMs / day);
    return `${days} day ago${days > 1 ? "s" : ""}`;
  }

  const years = Math.round(diffMs / (365 * day));
  return `${years} year ago${years > 1 ? "s" : ""}`;
}

function extractEmailAddress(raw: string): string {
  const bracketMatch = raw.match(/<([^>]+)>/);
  if (bracketMatch?.[1]) {
    return bracketMatch[1].trim();
  }

  return raw.trim();
}

export default function MailboxPage() {
  const {
    activeProvider,
    providers,
    messagesByProvider,
    connectProvider,
    setActiveProvider,
    completeOAuthCallbackIfPresent,
    syncProviderMessages,
    markAsRead,
    sendEmail,
    isSyncing,
    isConnecting,
    syncError,
    connectionError,
    clearConnectionError,
  } = useMailStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [folderFilter, setFolderFilter] = useState<"all" | MailFolder>("INBOX");
  const [readFilter, setReadFilter] = useState<MailReadFilter>("all");
  const [attachmentFilter, setAttachmentFilter] =
    useState<MailAttachmentFilter>("all");
  const [sortBy, setSortBy] = useState<MailSortOption>("newest");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [quickReplyBody, setQuickReplyBody] = useState("");
  const [isReplySending, setIsReplySending] = useState(false);

  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeAttachments, setComposeAttachments] = useState<
    MailDraftAttachment[]
  >([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    void completeOAuthCallbackIfPresent();
  }, [completeOAuthCallbackIfPresent]);

  const connectedProviders = useMemo(
    () =>
      (["gmail", "outlook"] as const).filter(
        (provider) => providers[provider].connected,
      ),
    [providers],
  );

  const currentProvider: MailProvider | null =
    activeProvider && providers[activeProvider].connected
      ? activeProvider
      : connectedProviders[0] || null;

  useEffect(() => {
    if (!currentProvider && connectedProviders.length > 0) {
      setActiveProvider(connectedProviders[0]);
    }
  }, [currentProvider, connectedProviders, setActiveProvider]);

  useEffect(() => {
    if (!currentProvider) {
      return;
    }

    void syncProviderMessages(currentProvider);
  }, [currentProvider, syncProviderMessages]);

  const providerMessages: MailMessage[] = currentProvider
    ? messagesByProvider[currentProvider]
    : [];

  const filteredMessages = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = providerMessages.filter((message) => {
      const matchesSearch =
        !normalizedSearch ||
        message.subject.toLowerCase().includes(normalizedSearch) ||
        message.from.toLowerCase().includes(normalizedSearch) ||
        message.preview.toLowerCase().includes(normalizedSearch) ||
        message.body.toLowerCase().includes(normalizedSearch);

      const matchesFolder =
        folderFilter === "all" || message.folder === folderFilter;
      const matchesRead =
        readFilter === "all" ||
        (readFilter === "read" ? message.isRead : !message.isRead);
      const matchesAttachment =
        attachmentFilter === "all" ||
        (attachmentFilter === "with_attachments"
          ? message.hasAttachments
          : true);

      return matchesSearch && matchesFolder && matchesRead && matchesAttachment;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "unread_first") {
        if (a.isRead !== b.isRead) {
          return a.isRead ? 1 : -1;
        }
      }

      const aTime = new Date(a.receivedAt).getTime();
      const bTime = new Date(b.receivedAt).getTime();

      if (sortBy === "oldest") {
        return aTime - bTime;
      }

      return bTime - aTime;
    });
  }, [
    providerMessages,
    searchTerm,
    folderFilter,
    readFilter,
    attachmentFilter,
    sortBy,
  ]);

  const selectedMessage = useMemo(() => {
    if (!selectedMessageId) {
      return filteredMessages[0] || null;
    }

    return (
      filteredMessages.find((item) => item.id === selectedMessageId) || null
    );
  }, [filteredMessages, selectedMessageId]);

  useEffect(() => {
    if (!selectedMessage && filteredMessages.length > 0) {
      setSelectedMessageId(filteredMessages[0].id);
      return;
    }

    if (filteredMessages.length === 0) {
      setSelectedMessageId(null);
    }
  }, [filteredMessages, selectedMessage]);

  useEffect(() => {
    if (!currentProvider || !selectedMessage || selectedMessage.isRead) {
      return;
    }

    void markAsRead(currentProvider, selectedMessage.id);
  }, [currentProvider, selectedMessage, markAsRead]);

  const counts = useMemo(() => {
    const inboxCount = providerMessages.filter(
      (item) => item.folder === "INBOX",
    ).length;
    const sentCount = providerMessages.filter(
      (item) => item.folder === "SENT",
    ).length;
    const draftCount = providerMessages.filter(
      (item) => item.folder === "DRAFT",
    ).length;
    const archiveCount = providerMessages.filter(
      (item) => item.folder === "ARCHIVE",
    ).length;
    const unreadCount = providerMessages.filter((item) => !item.isRead).length;
    const withAttachmentsCount = providerMessages.filter(
      (item) => item.hasAttachments,
    ).length;

    return {
      inboxCount,
      sentCount,
      draftCount,
      archiveCount,
      unreadCount,
      withAttachmentsCount,
    };
  }, [providerMessages]);

  const folderQuickFilters: Array<{
    value: "all" | MailFolder;
    label: string;
    count: number;
    icon: typeof Inbox;
  }> = [
    { value: "INBOX", label: "Inbox", count: counts.inboxCount, icon: Inbox },
    {
      value: "DRAFT",
      label: "Drafts",
      count: counts.draftCount,
      icon: FilePenLine,
    },
    { value: "SENT", label: "Sent", count: counts.sentCount, icon: Send },
    {
      value: "ARCHIVE",
      label: "Archive",
      count: counts.archiveCount,
      icon: Archive,
    },
  ];

  const handleAttachmentSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) {
      setComposeAttachments([]);
      return;
    }

    const fileList = Array.from(selectedFiles);
    const mapped = await Promise.all(
      fileList.map(
        (file) =>
          new Promise<MailDraftAttachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result !== "string") {
                reject(new Error("Unable to encode file"));
                return;
              }

              const base64Content = reader.result.split(",")[1] || "";
              resolve({
                id: `${file.name}_${file.size}_${Date.now()}`,
                name: file.name,
                size: file.size,
                type: file.type || "application/octet-stream",
                contentBase64: base64Content,
              });
            };
            reader.onerror = () => reject(new Error("Unable to read file"));
            reader.readAsDataURL(file);
          }),
      ),
    );

    setComposeAttachments(mapped);
  };

  const handleSend = async () => {
    if (!currentProvider || !composeTo.trim() || !composeBody.trim()) {
      return;
    }

    setIsSending(true);
    const result = await sendEmail({
      provider: currentProvider,
      to: composeTo.trim(),
      subject: composeSubject.trim() || "(no subject)",
      body: composeBody,
      attachments: composeAttachments,
    });

    setIsSending(false);

    if (!result.success) {
      return;
    }

    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setComposeAttachments([]);
    setIsComposeOpen(false);

    await syncProviderMessages(currentProvider);
  };

  const handleProviderTabChange = (value: string) => {
    const nextProvider = value as MailProvider;
    if (providers[nextProvider]?.connected) {
      setActiveProvider(nextProvider);
      setSelectedMessageId(null);
    }
  };

  const handleQuickReplySend = async () => {
    if (!currentProvider || !selectedMessage || !quickReplyBody.trim()) {
      return;
    }

    setIsReplySending(true);
    const result = await sendEmail({
      provider: currentProvider,
      to: extractEmailAddress(selectedMessage.from),
      subject: `Re: ${selectedMessage.subject}`,
      body: quickReplyBody.trim(),
      attachments: [],
    });

    setIsReplySending(false);

    if (!result.success) {
      return;
    }

    setQuickReplyBody("");
    await syncProviderMessages(currentProvider);
  };

  return (
    <PageShell
      title="Inbox"
      description="Keep all provider conversations in one place."
      action={
        <div className="flex flex-wrap items-center gap-2">
          {(["gmail", "outlook"] as const).map((provider) => (
            <Button
              key={provider}
              size="sm"
              variant={currentProvider === provider ? "default" : "outline"}
              disabled={!providers[provider].connected}
              onClick={() => handleProviderTabChange(provider)}
            >
              {providerLabels[provider]}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              if (!currentProvider) return;
              void syncProviderMessages(currentProvider);
            }}
            disabled={!currentProvider || isSyncing}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {isSyncing ? "Syncing" : "Sync"}
          </Button>
          <Button
            onClick={() => setIsComposeOpen(true)}
            disabled={!currentProvider}
          >
            <MailPlus className="mr-2 h-4 w-4" />
            Compose
          </Button>
        </div>
      }
    >
      <div className="space-y-4">



        {connectionError && (
          <div className="rounded-md border border-red-200/80 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <div className="flex items-center justify-between gap-2">
              <span>{connectionError}</span>
              <Button variant="ghost" size="sm" onClick={clearConnectionError}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {syncError && (
          <div className="rounded-md border border-amber-200/80 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            {syncError}
          </div>
        )}

        {connectedProviders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
            <p className="text-base font-medium text-foreground">
              No mailbox connected yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect Gmail or Outlook from Settings or use quick connect below.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  void connectProvider("gmail");
                }}
                disabled={isConnecting}
              >
                Connect Gmail
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void connectProvider("outlook");
                }}
                disabled={isConnecting}
              >
                Connect Outlook
              </Button>
            </div>
          </div>
        )}

        {currentProvider && (
          <div className="min-h-155 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="grid h-[calc(100vh-13.5rem)] min-h-155 grid-cols-1 lg:grid-cols-[240px_360px_minmax(0,1fr)]">
              <aside className="flex min-h-0 flex-col border-b border-border bg-muted/40 lg:border-b-0 lg:border-r">
                <div className="border-b border-border px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Account
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {providers[currentProvider].accountEmail ||
                      providerLabels[currentProvider]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {providerLabels[currentProvider]} connected
                  </p>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-5 p-3">
                    <div className="space-y-1">
                      {folderQuickFilters.map((item) => {
                        const Icon = item.icon;
                        const isActive = folderFilter === item.value;
                        return (
                          <button
                            key={item.value}
                            onClick={() => {
                              setFolderFilter(item.value);
                              setSelectedMessageId(null);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition",
                              isActive
                                ? "border-border bg-background text-foreground shadow-sm"
                                : "border-transparent text-muted-foreground hover:border-border hover:bg-background",
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </span>
                            <Badge variant="secondary" className="rounded-full">
                              {item.count}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-1">
                      <p className="px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Filters
                      </p>
                      <button
                        onClick={() =>
                          setReadFilter(
                            readFilter === "unread" ? "all" : "unread",
                          )
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition",
                          readFilter === "unread"
                            ? "border-border bg-background text-foreground shadow-sm"
                            : "border-transparent text-muted-foreground hover:border-border hover:bg-background",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Circle className="h-3.5 w-3.5 fill-current" />
                          Unread
                        </span>
                        <Badge variant="secondary" className="rounded-full">
                          {counts.unreadCount}
                        </Badge>
                      </button>
                      <button
                        onClick={() =>
                          setAttachmentFilter(
                            attachmentFilter === "with_attachments"
                              ? "all"
                              : "with_attachments",
                          )
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition",
                          attachmentFilter === "with_attachments"
                            ? "border-border bg-background text-foreground shadow-sm"
                            : "border-transparent text-muted-foreground hover:border-border hover:bg-background",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Paperclip className="h-3.5 w-3.5" />
                          Attachments
                        </span>
                        <Badge variant="secondary" className="rounded-full">
                          {counts.withAttachmentsCount}
                        </Badge>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground"
                        onClick={() => {
                          setFolderFilter("INBOX");
                          setReadFilter("all");
                          setAttachmentFilter("all");
                        }}
                      >
                        Reset filters
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </aside>

              <section className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
                <div className="space-y-3 border-b border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {folderFilter === "all" ? "All mail" : folderFilter}
                    </h2>
                    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                      <button
                        onClick={() => setReadFilter("all")}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-medium transition",
                          readFilter === "all"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground",
                        )}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setReadFilter("unread")}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-medium transition",
                          readFilter === "unread"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground",
                        )}
                      >
                        Unread
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search mails"
                      className="pl-9"
                    />
                  </div>

                  <Select
                    value={sortBy}
                    onValueChange={(value) =>
                      setSortBy(value as MailSortOption)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="unread_first">Unread first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-2 p-3">
                    {filteredMessages.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                        No messages match the active filters.
                      </p>
                    )}

                    {filteredMessages.map((message) => (
                      <button
                        key={message.id}
                        onClick={() => setSelectedMessageId(message.id)}
                        className={cn(
                          "w-full rounded-xl border p-3 text-left transition",
                          selectedMessage?.id === message.id
                            ? "border-border bg-muted/70"
                            : "border-border bg-card hover:bg-muted/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "truncate text-sm text-foreground",
                              message.isRead ? "font-medium" : "font-semibold",
                            )}
                          >
                            {message.from}
                          </p>
                          <span className="text-[11px] text-muted-foreground">
                            {formatRelativeTime(message.receivedAt)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-foreground/90">
                          {message.subject}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {message.preview}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          {!message.isRead && (
                            <Badge className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground hover:bg-primary">
                              unread
                            </Badge>
                          )}
                          {message.hasAttachments && (
                            <Badge
                              variant="secondary"
                              className="rounded-full px-2 py-0.5 text-[10px]"
                            >
                              attachment
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </section>

              <section className="flex min-h-0 flex-col">
                {!selectedMessage ? (
                  <div className="flex flex-1 items-center justify-center p-6">
                    <p className="rounded-lg border border-dashed border-border px-6 py-4 text-sm text-muted-foreground">
                      Select a message to read.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">
                            {selectedMessage.subject}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedMessage.from}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Reply to:{" "}
                            {extractEmailAddress(selectedMessage.from)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="rounded-full">
                            {selectedMessage.folder}
                          </Badge>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatMessageTime(selectedMessage.receivedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="space-y-4 p-4">
                        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-6 whitespace-pre-wrap text-foreground/90">
                          {selectedMessage.body}
                        </div>

                        {selectedMessage.hasAttachments &&
                          selectedMessage.attachments.length > 0 && (
                            <div className="rounded-xl border border-border p-3">
                              <p className="mb-2 text-sm font-medium text-foreground">
                                Attachments
                              </p>
                              <div className="space-y-2">
                                {selectedMessage.attachments.map(
                                  (attachment) => (
                                    <div
                                      key={attachment.id}
                                      className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                                    >
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                          {attachment.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {attachment.type} -{" "}
                                          {formatBytes(attachment.size)}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled
                                      >
                                        <SquareArrowOutUpRight className="mr-1 h-4 w-4" />
                                        Open
                                      </Button>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </ScrollArea>

                    <div className="border-t border-border p-4">
                      <Textarea
                        value={quickReplyBody}
                        onChange={(event) =>
                          setQuickReplyBody(event.target.value)
                        }
                        rows={3}
                        placeholder={`Reply ${extractEmailAddress(selectedMessage.from)}...`}
                      />
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsComposeOpen(true)}
                        >
                          Full compose
                        </Button>
                        <Button
                          onClick={() => {
                            void handleQuickReplySend();
                          }}
                          disabled={!quickReplyBody.trim() || isReplySending}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {isReplySending ? "Sending..." : "Send"}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compose email</DialogTitle>
            <DialogDescription>
              Sending via{" "}
              {currentProvider
                ? providerLabels[currentProvider]
                : "mail provider"}
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="compose-to">To</Label>
              <Input
                id="compose-to"
                value={composeTo}
                onChange={(event) => setComposeTo(event.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="compose-subject">Subject</Label>
              <Input
                id="compose-subject"
                value={composeSubject}
                onChange={(event) => setComposeSubject(event.target.value)}
                placeholder="Email subject"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="compose-body">Message</Label>
              <Textarea
                id="compose-body"
                value={composeBody}
                onChange={(event) => setComposeBody(event.target.value)}
                placeholder="Write your email..."
                rows={7}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compose-attachments">Attachments</Label>
              <Input
                id="compose-attachments"
                type="file"
                multiple
                onChange={handleAttachmentSelect}
              />
              {composeAttachments.length > 0 && (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <p className="mb-2 font-medium">Selected files</p>
                  <ul className="space-y-1">
                    {composeAttachments.map((attachment) => (
                      <li key={attachment.id}>
                        {attachment.name} ({formatBytes(attachment.size)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleSend();
              }}
              disabled={
                !currentProvider ||
                !composeTo.trim() ||
                !composeBody.trim() ||
                isSending
              }
            >
              <Send className="mr-2 h-4 w-4" />
              {isSending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
