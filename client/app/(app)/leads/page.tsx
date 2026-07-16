"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ButtonLoadingSkeleton,
  ListLoadingSkeleton,
} from "@/components/ui/loading-skeletons";
import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/hooks/useAuth";
import { quotationsApi } from "@/features/quotations/api";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from "@/features/leads/queries";
import { BackendLead, LeadStatus } from "@/features/leads/types";
import {
  BackendQuotation,
  QuotationDesigner,
  QuotationLineItem,
  QuotationStatus,
} from "@/features/quotations/types";
import { Download, Send, Trash2 } from "lucide-react";

const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "QUOTED",
  "WON",
  "LOST",
];

type DraftLineItem = {
  title: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxPercent: string;
  discountPercent: string;
};

function createEmptyLineItem(): DraftLineItem {
  return {
    title: "",
    description: "",
    quantity: "1",
    unitPrice: "0",
    taxPercent: "0",
    discountPercent: "0",
  };
}

function statusBadgeClass(status: LeadStatus | QuotationStatus) {
  if (status === "WON" || status === "APPROVED")
    return "bg-emerald-100 text-emerald-800";
  if (status === "LOST" || status === "REJECTED")
    return "bg-rose-100 text-rose-800";
  if (status === "QUOTED" || status === "SENT")
    return "bg-blue-100 text-blue-800";
  if (status === "EXPIRED") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export default function LeadsPage() {
  const { user } = useAuth();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  
  const { data: leads = [], isLoading: isLoadingLeads, error: leadsError, refetch: refetchLeads } = useLeads({
    organizationId: user?.organizationId,
    limit: 500
  });
  
  const { mutateAsync: createLead, isPending: isCreatingLead } = useCreateLead();
  const { mutateAsync: updateLead, isPending: isUpdatingLead } = useUpdateLead();
  const { mutateAsync: deleteLead } = useDeleteLead();
  
  const isSavingLead = isCreatingLead || isUpdatingLead;

  const [quotations, setQuotations] = useState<BackendQuotation[]>([]);
  const [leadName, setLeadName] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [leadStatus, setLeadStatus] = useState<LeadStatus>("NEW");
  const [leadExpectedAmount, setLeadExpectedAmount] = useState("");

  const [quoteTitle, setQuoteTitle] = useState("");
  const [quoteDescription, setQuoteDescription] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteTaxPercent, setQuoteTaxPercent] = useState("0");
  const [quoteDiscountPercent, setQuoteDiscountPercent] = useState("0");
  const [quoteValidUntil, setQuoteValidUntil] = useState("");
  const [quoteLineItems, setQuoteLineItems] = useState<DraftLineItem[]>([
    createEmptyLineItem(),
  ]);
  const [quoteCompanyDisplayName, setQuoteCompanyDisplayName] = useState("");
  const [quoteLogoUrl, setQuoteLogoUrl] = useState("");
  const [quotePrimaryColor, setQuotePrimaryColor] = useState("#1d4ed8");
  const [quoteAccentColor, setQuoteAccentColor] = useState("#eff6ff");
  const [quoteHeaderHtml, setQuoteHeaderHtml] = useState("");
  const [quoteFooterHtml, setQuoteFooterHtml] = useState("");

  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) || null,
    [leads, selectedLeadId],
  );

  // Set default selected lead
  useEffect(() => {
    if (!selectedLeadId && leads.length > 0) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  async function loadQuotations(leadId: string) {
    const response = await quotationsApi.list({ leadId, limit: 200 });

    if (!response.success || !response.data) {
      setError(response.error || "Failed to load quotations");
      setQuotations([]);
      return;
    }

    setQuotations(response.data);
  }



  useEffect(() => {
    if (!selectedLeadId) {
      setQuotations([]);
      return;
    }

    void loadQuotations(selectedLeadId);
  }, [selectedLeadId]);

  async function handleSaveLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user?.id || !user.organizationId) {
      setError("You must be logged in.");
      return;
    }

    setError(null);
    setInfo(null);

    const payload = {
      name: leadName.trim(),
      company: leadCompany.trim(),
      email: leadEmail.trim(),
      phone: leadPhone.trim() || undefined,
      source: leadSource.trim() || undefined,
      notes: leadNotes.trim() || undefined,
      status: leadStatus,
      expectedAmount: leadExpectedAmount
        ? Number(leadExpectedAmount)
        : undefined,
    };
    
    try {
      if (editingLeadId) {
        await updateLead({ id: editingLeadId, payload });
        setInfo("Lead updated");
      } else {
        const res = await createLead({
          organizationId: user.organizationId,
          ...payload,
        });
        setSelectedLeadId(res.data?.id || null);
        setInfo("Lead created");
      }
      
      setEditingLeadId(null);
      setLeadName("");
      setLeadCompany("");
      setLeadEmail("");
      setLeadPhone("");
      setLeadSource("");
      setLeadNotes("");
      setLeadStatus("NEW");
      setLeadExpectedAmount("");
    } catch (err: any) {
      setError(err.message || "Failed to save lead");
    }
  }

  function startEditLead(lead: BackendLead) {
    setEditingLeadId(lead.id);
    setLeadName(lead.name);
    setLeadCompany(lead.company);
    setLeadEmail(lead.email);
    setLeadPhone(lead.phone || "");
    setLeadSource(lead.source || "");
    setLeadNotes(lead.notes || "");
    setLeadStatus(lead.status);
    setLeadExpectedAmount(lead.expectedAmount?.toString() || "");
  }

  async function removeLead(leadId: string) {
    if (!user?.id) return;
    const confirmed = window.confirm("Delete this lead?");
    if (!confirmed) return;

    setError(null);
    setInfo(null);
    
    try {
      await deleteLead(leadId);
      setInfo("Lead deleted");
    } catch (err: any) {
      setError(err.message || "Failed to delete lead");
    }
  }

  async function createQuotation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user?.id || !user.organizationId || !selectedLeadId) {
      setError("Select a lead first.");
      return;
    }

    setIsCreatingQuote(true);
    setError(null);
    setInfo(null);

    const parsedAmount = quoteAmount.trim() ? Number(quoteAmount) : undefined;
    const lineItems: QuotationLineItem[] = [];

    for (const item of quoteLineItems) {
      const title = item.title.trim();
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const taxPercent = Number(item.taxPercent || 0);
      const discountPercent = Number(item.discountPercent || 0);

      if (!title || quantity <= 0 || unitPrice < 0) {
        continue;
      }

      lineItems.push({
        title,
        description: item.description.trim() || undefined,
        quantity,
        unitPrice,
        taxPercent,
        discountPercent,
      });
    }

    if (!parsedAmount && lineItems.length === 0) {
      setError("Provide either a base amount or at least one valid line item.");
      setIsCreatingQuote(false);
      return;
    }

    const designer: QuotationDesigner = {
      companyDisplayName: quoteCompanyDisplayName.trim() || undefined,
      logoUrl: quoteLogoUrl.trim() || undefined,
      primaryColor: quotePrimaryColor.trim() || undefined,
      accentColor: quoteAccentColor.trim() || undefined,
      headerHtml: quoteHeaderHtml.trim() || undefined,
      footerHtml: quoteFooterHtml.trim() || undefined,
    };

    const hasDesignerFields = Object.values(designer).some((value) => !!value);

    const response = await quotationsApi.create({
      organizationId: user.organizationId,
      leadId: selectedLeadId,
      actorUserId: user.id,
      title: quoteTitle.trim(),
      description: quoteDescription.trim(),
      amount: parsedAmount,
      taxPercent: Number(quoteTaxPercent || 0),
      discountPercent: Number(quoteDiscountPercent || 0),
      validUntil: quoteValidUntil || undefined,
      lineItems: lineItems.length > 0 ? lineItems : undefined,
      designer: hasDesignerFields ? designer : undefined,
    });

    if (!response.success || !response.data) {
      setError(response.error || "Failed to create quotation");
      setIsCreatingQuote(false);
      return;
    }

    setQuoteTitle("");
    setQuoteDescription("");
    setQuoteAmount("");
    setQuoteTaxPercent("0");
    setQuoteDiscountPercent("0");
    setQuoteValidUntil("");
    setQuoteLineItems([createEmptyLineItem()]);
    setQuoteCompanyDisplayName("");
    setQuoteLogoUrl("");
    setQuotePrimaryColor("#1d4ed8");
    setQuoteAccentColor("#eff6ff");
    setQuoteHeaderHtml("");
    setQuoteFooterHtml("");
    setInfo(`Quotation ${response.data.quoteNumber} created`);
    setIsCreatingQuote(false);
    await Promise.all([refetchLeads(), loadQuotations(selectedLeadId)]);
  }

  function updateLineItem(
    index: number,
    field: keyof DraftLineItem,
    value: string,
  ) {
    setQuoteLineItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addLineItem() {
    setQuoteLineItems((current) => [...current, createEmptyLineItem()]);
  }

  function removeLineItem(index: number) {
    setQuoteLineItems((current) =>
      current.length <= 1
        ? [createEmptyLineItem()]
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function sendQuotation(quotationId: string) {
    if (!user?.id) return;

    const emailMessage =
      window.prompt(
        "Optional email message",
        "Please review attached quotation.",
      ) || undefined;

    const response = await quotationsApi.send(quotationId, {
      actorUserId: user.id,
      emailMessage,
    });

    if (!response.success || !response.data) {
      setError(response.error || "Failed to send quotation");
      return;
    }

    setInfo(`Quotation sent. Public link: ${response.data.publicUrl}`);
    if (selectedLeadId) {
      await loadQuotations(selectedLeadId);
    }
  }

  async function manualAction(quotationId: string, type: "approve" | "reject") {
    if (!user?.id) return;

    const note =
      window.prompt(
        type === "approve"
          ? "Approval note (optional)"
          : "Rejection note (optional)",
      ) || undefined;

    const response =
      type === "approve"
        ? await quotationsApi.manualApprove(quotationId, {
            actorUserId: user.id,
            note,
          })
        : await quotationsApi.manualReject(quotationId, {
            actorUserId: user.id,
            note,
          });

    if (!response.success || !response.data) {
      setError(response.error || `Failed to ${type} quotation`);
      return;
    }

    setInfo(`Quotation ${type}d successfully`);
    if (selectedLeadId) {
      await loadQuotations(selectedLeadId);
    }
  }

  async function downloadQuotationPdf(quotationId: string) {
    if (!user?.id) return;

    const response = await quotationsApi.downloadPdf(quotationId, user.id);
    if (!response.success || !response.data) {
      setError(response.error || "Failed to download PDF");
      return;
    }

    const url = URL.createObjectURL(response.data.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = response.data.fileName || `${quotationId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell
      title="Leads & Quotations"
      description="Create leads, move them to quotations, send quotes with PDF, and manage approvals."
      error={error}
    >
      <div className="space-y-6">
        {info && <p className="text-sm text-emerald-700">{info}</p>}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingLeadId ? "Edit Lead" : "Create Lead"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleSaveLead}>
                <Input
                  placeholder="Lead name"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  required
                />
                <Input
                  placeholder="Company"
                  value={leadCompany}
                  onChange={(e) => setLeadCompany(e.target.value)}
                  required
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  required
                />
                <Input
                  placeholder="Phone"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                />
                <Input
                  placeholder="Source"
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value)}
                />
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={leadStatus}
                  onChange={(e) => setLeadStatus(e.target.value as LeadStatus)}
                >
                  {LEAD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Expected amount"
                  type="number"
                  min="0"
                  value={leadExpectedAmount}
                  onChange={(e) => setLeadExpectedAmount(e.target.value)}
                />
                <Textarea
                  placeholder="Notes"
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSavingLead}>
                    {isSavingLead ? (
                      <ButtonLoadingSkeleton inverted className="w-24" />
                    ) : editingLeadId ? (
                      "Update Lead"
                    ) : (
                      "Create Lead"
                    )}
                  </Button>
                  {editingLeadId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingLeadId(null);
                        setLeadName("");
                        setLeadCompany("");
                        setLeadEmail("");
                        setLeadPhone("");
                        setLeadSource("");
                        setLeadNotes("");
                        setLeadStatus("NEW");
                        setLeadExpectedAmount("");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLeads ? (
                <ListLoadingSkeleton items={6} />
              ) : leads.length === 0 ? (
                <p className="text-sm text-slate-500">No leads yet.</p>
              ) : (
                <div className="space-y-3 max-h-105 overflow-y-auto pr-1">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`rounded-md border p-3 ${selectedLeadId === lead.id ? "border-blue-400 bg-blue-50/30" : "border-slate-200"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          className="text-left"
                          onClick={() => setSelectedLeadId(lead.id)}
                        >
                          <p className="font-semibold text-sm text-slate-900">
                            {lead.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {lead.company} • {lead.email}
                          </p>
                        </button>
                        <Badge className={statusBadgeClass(lead.status)}>
                          {lead.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditLead(lead)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600"
                          onClick={() => void removeLead(lead.id)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedLead
                  ? `Create Quotation for ${selectedLead.name}`
                  : "Create Quotation"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedLead ? (
                <p className="text-sm text-slate-500">
                  Select a lead to create quotation.
                </p>
              ) : (
                <form className="space-y-3" onSubmit={createQuotation}>
                  <Input
                    placeholder="Quotation title"
                    value={quoteTitle}
                    onChange={(e) => setQuoteTitle(e.target.value)}
                    required
                  />
                  <Textarea
                    placeholder="Description"
                    rows={3}
                    value={quoteDescription}
                    onChange={(e) => setQuoteDescription(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Base amount (optional when using line items)"
                    type="number"
                    min="0"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                  />
                  <div className="space-y-2 rounded-md border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">
                        Line items
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addLineItem}
                      >
                        Add item
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {quoteLineItems.map((item, index) => (
                        <div
                          key={`line-item-${index}`}
                          className="rounded-md border border-slate-200 p-2"
                        >
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <Input
                              placeholder="Item title"
                              value={item.title}
                              onChange={(e) =>
                                updateLineItem(index, "title", e.target.value)
                              }
                            />
                            <Input
                              placeholder="Description"
                              value={item.description}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "description",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                            <Input
                              placeholder="Qty"
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                            />
                            <Input
                              placeholder="Unit price"
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "unitPrice",
                                  e.target.value,
                                )
                              }
                            />
                            <Input
                              placeholder="Tax %"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.taxPercent}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "taxPercent",
                                  e.target.value,
                                )
                              }
                            />
                            <Input
                              placeholder="Discount %"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.discountPercent}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "discountPercent",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="mt-2 flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-rose-600"
                              onClick={() => removeLineItem(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Tax %"
                      type="number"
                      min="0"
                      max="100"
                      value={quoteTaxPercent}
                      onChange={(e) => setQuoteTaxPercent(e.target.value)}
                    />
                    <Input
                      placeholder="Discount %"
                      type="number"
                      min="0"
                      max="100"
                      value={quoteDiscountPercent}
                      onChange={(e) => setQuoteDiscountPercent(e.target.value)}
                    />
                  </div>
                  <Input
                    type="date"
                    value={quoteValidUntil}
                    onChange={(e) => setQuoteValidUntil(e.target.value)}
                  />
                  <div className="space-y-2 rounded-md border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-800">
                      Branding and templates
                    </p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <Input
                        placeholder="Company display name"
                        value={quoteCompanyDisplayName}
                        onChange={(e) =>
                          setQuoteCompanyDisplayName(e.target.value)
                        }
                      />
                      <Input
                        placeholder="Logo URL"
                        value={quoteLogoUrl}
                        onChange={(e) => setQuoteLogoUrl(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Primary color (hex)"
                        value={quotePrimaryColor}
                        onChange={(e) => setQuotePrimaryColor(e.target.value)}
                      />
                      <Input
                        placeholder="Accent color (hex)"
                        value={quoteAccentColor}
                        onChange={(e) => setQuoteAccentColor(e.target.value)}
                      />
                    </div>
                    <Textarea
                      placeholder="Header HTML"
                      rows={3}
                      value={quoteHeaderHtml}
                      onChange={(e) => setQuoteHeaderHtml(e.target.value)}
                    />
                    <Textarea
                      placeholder="Footer HTML"
                      rows={3}
                      value={quoteFooterHtml}
                      onChange={(e) => setQuoteFooterHtml(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isCreatingQuote}>
                    {isCreatingQuote ? (
                      <ButtonLoadingSkeleton inverted className="w-32" />
                    ) : (
                      "Create Quotation"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quotations</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedLead ? (
                <p className="text-sm text-slate-500">
                  Select a lead to view quotations.
                </p>
              ) : quotations.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No quotations for this lead yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-105 overflow-y-auto pr-1">
                  {quotations.map((quote) => (
                    <div
                      key={quote.id}
                      className="rounded-md border border-slate-200 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {quote.quoteNumber}
                          </p>
                          <p className="text-xs text-slate-600">
                            {quote.title}
                          </p>
                        </div>
                        <Badge className={statusBadgeClass(quote.status)}>
                          {quote.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        Total: {quote.totalAmount.toFixed(2)} {quote.currency}
                      </p>
                      {quote.lineItems?.length ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {quote.lineItems.length} line item(s)
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void sendQuotation(quote.id)}
                        >
                          <Send className="mr-1 h-3 w-3" /> Send
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void downloadQuotationPdf(quote.id)}
                        >
                          <Download className="mr-1 h-3 w-3" /> PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void manualAction(quote.id, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void manualAction(quote.id, "reject")}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
