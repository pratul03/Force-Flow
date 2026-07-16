"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InlineTextLoadingSkeleton,
  ListLoadingSkeleton,
} from "@/components/ui/loading-skeletons";
import { Textarea } from "@/components/ui/textarea";
import { quotationsApi } from "@/features/quotations/api";
import { BackendQuotation } from "@/features/quotations/types";

export default function PublicQuotationResponsePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [quotation, setQuotation] = useState<BackendQuotation | null>(null);
  const [clientName, setClientName] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canRespond = useMemo(
    () => quotation?.status === "SENT",
    [quotation?.status],
  );

  const lineItems = useMemo(() => quotation?.lineItems || [], [quotation]);
  const designer = useMemo(() => quotation?.designer || null, [quotation]);

  async function loadQuotation() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const response = await quotationsApi.publicDetails(token);
    if (!response.success || !response.data) {
      setError(response.error || "Failed to load quotation");
      setQuotation(null);
      setIsLoading(false);
      return;
    }

    setQuotation(response.data);
    setClientName(response.data.lead?.name || "");
    setIsLoading(false);
  }

  useEffect(() => {
    void loadQuotation();
  }, [token]);

  async function submitResponse(type: "approve" | "reject") {
    if (!token) return;

    setIsSubmitting(true);
    setError(null);
    setInfo(null);

    const response =
      type === "approve"
        ? await quotationsApi.publicApprove(token, {
            clientName: clientName.trim() || undefined,
            note: note.trim() || undefined,
          })
        : await quotationsApi.publicReject(token, {
            clientName: clientName.trim() || undefined,
            note: note.trim() || undefined,
          });

    if (!response.success || !response.data) {
      setError(response.error || `Failed to ${type} quotation`);
      setIsSubmitting(false);
      return;
    }

    setQuotation(response.data);
    setInfo(
      type === "approve"
        ? "Quotation approved successfully."
        : "Quotation rejected successfully.",
    );
    setIsSubmitting(false);
  }

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Quotation Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <InlineTextLoadingSkeleton lines={2} />
                <ListLoadingSkeleton items={3} />
              </div>
            ) : !quotation ? (
              <p className="text-sm text-rose-600">
                {error || "Quotation not found"}
              </p>
            ) : (
              <>
                {designer?.companyDisplayName || designer?.logoUrl ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    {designer.logoUrl ? (
                      <img
                        src={designer.logoUrl}
                        alt="Company logo"
                        className="mb-2 h-10 max-w-48 object-contain"
                      />
                    ) : null}
                    {designer.companyDisplayName ? (
                      <p className="text-sm font-semibold text-slate-900">
                        {designer.companyDisplayName}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-1">
                  <p className="text-sm text-slate-600">Quote Number</p>
                  <p className="font-semibold">{quotation.quoteNumber}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-slate-600">Title</p>
                  <p className="font-semibold">{quotation.title}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-slate-600">Description</p>
                  <p>{quotation.description}</p>
                </div>

                {lineItems.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Line Items</p>
                    <div className="overflow-x-auto rounded-md border border-slate-200">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-700">
                          <tr>
                            <th className="px-3 py-2">Item</th>
                            <th className="px-3 py-2">Qty</th>
                            <th className="px-3 py-2">Unit</th>
                            <th className="px-3 py-2">Tax%</th>
                            <th className="px-3 py-2">Discount%</th>
                            <th className="px-3 py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item, index) => (
                            <tr
                              key={`${item.title}-${index}`}
                              className="border-t"
                            >
                              <td className="px-3 py-2">
                                <p className="font-medium text-slate-900">
                                  {item.title}
                                </p>
                                {item.description ? (
                                  <p className="text-xs text-slate-500">
                                    {item.description}
                                  </p>
                                ) : null}
                              </td>
                              <td className="px-3 py-2">{item.quantity}</td>
                              <td className="px-3 py-2">{item.unitPrice}</td>
                              <td className="px-3 py-2">
                                {item.taxPercent || 0}
                              </td>
                              <td className="px-3 py-2">
                                {item.discountPercent || 0}
                              </td>
                              <td className="px-3 py-2 font-medium">
                                {item.lineTotal?.toFixed(2) ?? "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-slate-600">Amount</p>
                    <p className="font-semibold">
                      {quotation.totalAmount.toFixed(2)} {quotation.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <p className="font-semibold">{quotation.status}</p>
                  </div>
                </div>

                <a
                  className="inline-block text-sm text-blue-700 underline"
                  href={quotationsApi.publicPdfUrl(token)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View / Download Quotation PDF
                </a>

                {error && <p className="text-sm text-rose-600">{error}</p>}
                {info && <p className="text-sm text-emerald-700">{info}</p>}

                {canRespond && (
                  <>
                    <Input
                      placeholder="Your name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                    <Textarea
                      placeholder="Optional note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        disabled={isSubmitting}
                        onClick={() => void submitResponse("approve")}
                      >
                        Approve Quotation
                      </Button>
                      <Button
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() => void submitResponse("reject")}
                      >
                        Reject Quotation
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
