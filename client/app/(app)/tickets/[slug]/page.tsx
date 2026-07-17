"use client";

import { useParams, useRouter } from "next/navigation";
import { useTicketBySlug, useTicketComments, useAddTicketComment, useUpdateTicketDetails } from "@/features/tickets/queries";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2, Edit2, X, Check } from "lucide-react";
import { formatDateTime12Hour } from "@/lib/utils";
import { priorityBadgeVariant, statusBadgeClass, formatName } from "@/components/tickets/utils";

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();
  
  const { data: ticket, isLoading: isLoadingTicket } = useTicketBySlug(slug);
  const { data: comments = [], isLoading: isLoadingComments } = useTicketComments(ticket?.id || '', user?.id);
  const { mutate: addComment, isPending: isAddingComment } = useAddTicketComment();
  const { mutate: updateDetails, isPending: isUpdatingDetails } = useUpdateTicketDetails();

  const [commentBody, setCommentBody] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    if (ticket) {
      setEditTitle(ticket.title);
      setEditDesc(ticket.description);
    }
  }, [ticket]);

  const handleAddComment = () => {
    if (!commentBody.trim() || !ticket) return;
    addComment({
      id: ticket.id,
      payload: { body: commentBody }
    }, {
      onSuccess: () => setCommentBody("")
    });
  };

  const handleSaveTitle = () => {
    if (!editTitle.trim() || !ticket) return;
    updateDetails({
      id: ticket.id,
      payload: { title: editTitle, description: ticket.description }
    }, {
      onSuccess: () => setIsEditingTitle(false)
    });
  };

  const handleSaveDesc = () => {
    if (!editDesc.trim() || !ticket) return;
    updateDetails({
      id: ticket.id,
      payload: { title: ticket.title, description: editDesc }
    }, {
      onSuccess: () => setIsEditingDesc(false)
    });
  };

  if (isLoadingTicket) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  if (!ticket) {
    return <div className="flex h-full items-center justify-center text-slate-500">Ticket not found.</div>;
  }

  const canComment = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'HR_MANAGER' || 
                     user?.id === ticket.requesterId || user?.id === ticket.assigneeId;

  const canEditDetails = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'HR_MANAGER' ||
                         user?.id === ticket.requesterId;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/40 p-6 overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{ticket.slug}</h1>
              <Badge variant={priorityBadgeVariant(ticket.priority)}>{ticket.priority}</Badge>
              <Badge className={statusBadgeClass(ticket.status)}>{ticket.status}</Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Created on {formatDateTime12Hour(ticket.createdAt)} by {formatName(ticket.requester as any)}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      className="font-bold text-lg max-w-md flex-1"
                      placeholder="Ticket Title"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" onClick={() => { setIsEditingTitle(false); setEditTitle(ticket.title); }} disabled={isUpdatingDetails}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button variant="default" size="icon" onClick={handleSaveTitle} disabled={isUpdatingDetails || !editTitle.trim()}>
                      {isUpdatingDetails ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <CardTitle 
                    className={`text-xl ${canEditDetails ? 'hover:bg-slate-100 dark:hover:bg-slate-800 p-2 -ml-2 rounded-md cursor-pointer transition-colors' : ''}`}
                    onClick={() => {
                      if (canEditDetails) setIsEditingTitle(true);
                    }}
                    title={canEditDetails ? "Click to edit title" : undefined}
                  >
                    {ticket.title}
                  </CardTitle>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {isEditingDesc ? (
                  <div className="space-y-2">
                    <Textarea 
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      className="min-h-[150px] resize-y w-full"
                      placeholder="Ticket description..."
                      autoFocus
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => { setIsEditingDesc(false); setEditDesc(ticket.description); }} disabled={isUpdatingDetails}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button variant="default" size="sm" onClick={handleSaveDesc} disabled={isUpdatingDetails || !editDesc.trim()}>
                        {isUpdatingDetails ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />} Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`text-slate-700 dark:text-slate-300 whitespace-pre-wrap ${canEditDetails ? 'hover:bg-slate-100 dark:hover:bg-slate-800 p-2 -ml-2 rounded-md cursor-pointer transition-colors min-h-[100px]' : ''}`}
                    onClick={() => {
                      if (canEditDetails) setIsEditingDesc(true);
                    }}
                    title={canEditDetails ? "Click to edit description" : undefined}
                  >
                    {ticket.description || (canEditDetails ? <span className="text-slate-400 italic">Click to add description...</span> : '')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Comments</h3>
              
              <div className="space-y-4">
                {isLoadingComments ? (
                  <div className="text-sm text-slate-500 py-4 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="text-sm text-slate-500 py-4 italic border border-dashed rounded-lg text-center dark:border-slate-800">No comments yet.</div>
                ) : (
                  comments.map(comment => (
                    <Card key={comment.id} className="shadow-sm">
                      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 bg-slate-50 dark:bg-slate-900/50 rounded-t-xl border-b dark:border-slate-800">
                        <div className="font-medium text-sm">{formatName(comment.author as any)}</div>
                        <div className="text-xs text-slate-500">{formatDateTime12Hour(comment.createdAt)}</div>
                      </CardHeader>
                      <CardContent className="py-3 px-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{comment.body}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {canComment ? (
                <div className="flex flex-col gap-2 mt-4">
                  <Textarea 
                    placeholder="Add a comment..."
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleAddComment} disabled={!commentBody.trim() || isAddingComment}>
                      {isAddingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Post Comment
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic p-4 bg-slate-100 dark:bg-slate-900 rounded-lg text-center">
                  Only the requester, assignee, or administrators can add comments to this ticket.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assignee</div>
                  <div className="text-sm">{ticket.assignee ? formatName(ticket.assignee as any) : "Unassigned"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Requester</div>
                  <div className="text-sm">{ticket.requester ? formatName(ticket.requester as any) : "Unknown"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Updated</div>
                  <div className="text-sm">{formatDateTime12Hour(ticket.updatedAt as string)}</div>
                </div>
                {ticket.resolvedAt && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Resolved At</div>
                    <div className="text-sm">{formatDateTime12Hour(ticket.resolvedAt)}</div>
                  </div>
                )}
                {ticket.resolutionNote && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Resolution Note</div>
                    <div className="text-sm p-2 bg-slate-50 dark:bg-slate-900 rounded">{ticket.resolutionNote}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
