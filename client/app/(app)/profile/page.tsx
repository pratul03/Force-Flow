"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import { CURRENCIES } from "@/lib/config/currencies";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ButtonLoadingSkeleton } from "@/components/ui/loading-skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { uploadsApi } from "@/features/uploads/api";
import { organizationsApi } from "@/features/organizations/api";
import { usersApi } from "@/features/users/api";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OrganizationSummary = {
  id: string;
  name: string;
  logoUrl?: string | null;
};

function getInitials(name?: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { updateUser } = useAuthStore();
  const [organization, setOrganization] = useState<OrganizationSummary | null>(null);

  // Loading States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  
  // Banking State
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    swiftCode: "",
    routingNumber: "",
  });
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Compensation State
  const [compensation, setCompensation] = useState({
    salaryAmount: "",
    salaryCurrency: "USD",
    payFrequency: "MONTHLY",
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  const [isSavingComp, setIsSavingComp] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;
      
      // Load Organization
      if (user.organizationId) {
        const orgRes = await organizationsApi.getById(user.organizationId);
        if (orgRes.success && orgRes.data) {
          setOrganization({
            id: orgRes.data.id,
            name: orgRes.data.name,
            logoUrl: orgRes.data.logoUrl,
          });
        }
      }

      // Load Bank Details
      const bankRes = await usersApi.getBankDetails(user.id);
      if (bankRes.success && bankRes.data) {
        setBankDetails({
          accountName: (bankRes.data as any).accountName || "",
          accountNumber: (bankRes.data as any).accountNumber || "",
          bankName: (bankRes.data as any).bankName || "",
          swiftCode: (bankRes.data as any).swiftCode || "",
          routingNumber: (bankRes.data as any).routingNumber || "",
        });
      }

      // Load Compensation Details
      const compRes = await usersApi.getCompensation(user.id);
      if (compRes.success && compRes.data) {
        setCompensation({
          salaryAmount: (compRes.data as any).salaryAmount?.toString() || "",
          salaryCurrency: (compRes.data as any).salaryCurrency || "USD",
          payFrequency: (compRes.data as any).payFrequency || "MONTHLY",
          effectiveDate: (compRes.data as any).effectiveDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        });
      }
    }
    void loadData();
  }, [user?.id, user?.organizationId]);

  const canUploadLogo = useMemo(() => user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "HR_MANAGER", [user?.role]);
  const canEditComp = useMemo(() => user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "HR_MANAGER", [user?.role]);

  // --- Avatar & Logo Handlers ---
  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user?.id) return;
    setIsUploadingAvatar(true);
    const response = await uploadsApi.uploadUserProfilePhotoDirect(user.id, file);
    if (!response.success || !response.data?.avatarUrl) {
      toast.error(response.error || "Failed to upload profile photo");
    } else {
      updateUser({ avatarUrl: response.data.avatarUrl });
      toast.success("Profile photo updated");
    }
    setIsUploadingAvatar(false);
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !organization?.id) return;
    setIsUploadingLogo(true);
    const response = await uploadsApi.uploadOrganizationLogoDirect(organization.id, file);
    if (!response.success || !response.data?.logoUrl) {
      toast.error(response.error || "Failed to upload organization logo");
    } else {
      setOrganization((prev) => prev ? { ...prev, logoUrl: response.data?.logoUrl } : prev);
      window.dispatchEvent(new CustomEvent("organization-logo-updated", { detail: { logoUrl: response.data?.logoUrl || null } }));
      toast.success("Organization logo updated");
    }
    setIsUploadingLogo(false);
  };

  const handleAvatarDelete = async () => {
    if (!user?.id) return;
    setIsDeletingAvatar(true);
    const response = await uploadsApi.deleteUserProfilePhoto(user.id);
    if (!response.success) {
      toast.error(response.error || "Failed to delete profile photo");
    } else {
      updateUser({ avatarUrl: undefined });
      toast.success("Profile photo removed");
    }
    setIsDeletingAvatar(false);
  };

  const handleLogoDelete = async () => {
    if (!organization?.id) return;
    setIsDeletingLogo(true);
    const response = await uploadsApi.deleteOrganizationLogo(organization.id);
    if (!response.success) {
      toast.error(response.error || "Failed to delete organization logo");
    } else {
      setOrganization((prev) => (prev ? { ...prev, logoUrl: null } : prev));
      window.dispatchEvent(new CustomEvent("organization-logo-updated", { detail: { logoUrl: null } }));
      toast.success("Organization logo removed");
    }
    setIsDeletingLogo(false);
  };

  // --- Bank Handlers ---
  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSavingBank(true);
    const res = await usersApi.updateBankDetails(user.id, bankDetails);
    if (res.success) toast.success("Bank details updated successfully");
    else toast.error(res.error || "Failed to update bank details");
    setIsSavingBank(false);
  };

  // --- Compensation Handlers ---
  const handleCompSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSavingComp(true);
    const payload = {
      ...compensation,
      salaryAmount: parseFloat(compensation.salaryAmount) || 0,
    };
    const res = await usersApi.updateCompensation(user.id, payload);
    if (res.success) toast.success("Compensation updated successfully");
    else toast.error(res.error || "Failed to update compensation");
    setIsSavingComp(false);
  };

  return (
    <PageShell
      title="Profile Settings"
      description="Manage your account, organization details, and financial information."
    >
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg">General</TabsTrigger>
          <TabsTrigger value="banking" className="rounded-lg">Banking</TabsTrigger>
          <TabsTrigger value="compensation" className="rounded-lg">Compensation</TabsTrigger>
        </TabsList>

              {/* GENERAL TAB */}
              <TabsContent value="general" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Photo */}
                  <Card className="shadow-sm border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-lg">Profile Photo</CardTitle>
                      <CardDescription>Update your avatar to personalize your account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 border-2 border-primary/10 shadow-sm">
                          <AvatarImage src={user?.avatarUrl} alt={user?.name} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                            {getInitials(user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="avatar-upload">
                            <Button asChild disabled={isUploadingAvatar || isDeletingAvatar || !user?.id} size="sm" className="w-full">
                              <span>
                                {isUploadingAvatar ? <ButtonLoadingSkeleton inverted className="w-24" /> : "Upload Photo"}
                              </span>
                            </Button>
                          </label>
                          <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar || isDeletingAvatar || !user?.id} />
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full" disabled={isDeletingAvatar || isUploadingAvatar || !user?.id || !user?.avatarUrl} onClick={() => void handleAvatarDelete()}>
                            {isDeletingAvatar ? <ButtonLoadingSkeleton className="w-24" /> : "Remove"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Information */}
                  <Card className="shadow-sm border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-lg">Account Details</CardTitle>
                      <CardDescription>Your personal information and role.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <Label className="text-gray-500 text-xs uppercase tracking-wider">Full Name</Label>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{user?.name || "-"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-500 text-xs uppercase tracking-wider">Email Address</Label>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{user?.email || "-"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-500 text-xs uppercase tracking-wider">System Role</Label>
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {user?.role || "-"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Organization Logo */}
                <Card className="shadow-sm border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Organization Logo</CardTitle>
                    <CardDescription>Manage the logo for {organization?.name || "your organization"}.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="relative h-20 w-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                        {organization?.logoUrl ? (
                          <img src={organization.logoUrl} alt={organization.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">No Logo</span>
                        )}
                      </div>
                      
                      {canUploadLogo ? (
                        <div className="flex gap-2">
                          <label htmlFor="logo-upload">
                            <Button asChild disabled={isUploadingLogo || isDeletingLogo || !organization?.id} size="sm">
                              <span>
                                {isUploadingLogo ? <ButtonLoadingSkeleton inverted className="w-28" /> : "Upload Logo"}
                              </span>
                            </Button>
                          </label>
                          <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploadingLogo || isDeletingLogo || !organization?.id} />
                          <Button variant="outline" size="sm" disabled={isDeletingLogo || isUploadingLogo || !organization?.id || !organization?.logoUrl} onClick={() => void handleLogoDelete()}>
                            {isDeletingLogo ? <ButtonLoadingSkeleton className="w-20" /> : "Remove Logo"}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">You do not have permission to change the organization logo.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BANKING TAB */}
              <TabsContent value="banking" className="mt-6">
                <Card className="shadow-sm border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl">Bank Details</CardTitle>
                    <CardDescription>Update your banking information for payroll deposits.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleBankSubmit} className="space-y-6 max-w-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="accountName">Account Holder Name</Label>
                          <Input id="accountName" value={bankDetails.accountName} onChange={e => setBankDetails({...bankDetails, accountName: e.target.value})} placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input id="bankName" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} placeholder="Chase Bank" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input id="accountNumber" type="password" value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="routingNumber">Routing Number</Label>
                          <Input id="routingNumber" value={bankDetails.routingNumber} onChange={e => setBankDetails({...bankDetails, routingNumber: e.target.value})} placeholder="123456789" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="swiftCode">SWIFT/BIC Code (Optional)</Label>
                          <Input id="swiftCode" value={bankDetails.swiftCode} onChange={e => setBankDetails({...bankDetails, swiftCode: e.target.value})} placeholder="CHASUS33" />
                        </div>
                      </div>
                      <Button type="submit" disabled={isSavingBank} className="w-full md:w-auto">
                        {isSavingBank ? "Saving..." : "Save Bank Details"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* COMPENSATION TAB */}
              <TabsContent value="compensation" className="mt-6">
                <Card className="shadow-sm border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl">Compensation Profile</CardTitle>
                    <CardDescription>View and manage salary information and pay frequencies.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCompSubmit} className="space-y-6 max-w-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="salaryAmount">Salary Amount</Label>
                          <Input 
                            id="salaryAmount" 
                            type="number" 
                            value={compensation.salaryAmount} 
                            onChange={e => setCompensation({...compensation, salaryAmount: e.target.value})} 
                            placeholder="0.00" 
                            disabled={!canEditComp}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Select 
                            value={compensation.salaryCurrency} 
                            onValueChange={v => setCompensation({...compensation, salaryCurrency: v})}
                            disabled={!canEditComp}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map(c => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Pay Frequency</Label>
                          <Select 
                            value={compensation.payFrequency} 
                            onValueChange={v => setCompensation({...compensation, payFrequency: v})}
                            disabled={!canEditComp}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MONTHLY">Monthly</SelectItem>
                              <SelectItem value="HOURLY">Hourly</SelectItem>
                              <SelectItem value="YEARLY">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="effectiveDate">Effective Date</Label>
                          <Input 
                            id="effectiveDate" 
                            type="date" 
                            value={compensation.effectiveDate} 
                            onChange={e => setCompensation({...compensation, effectiveDate: e.target.value})} 
                            disabled={!canEditComp}
                          />
                        </div>
                      </div>
                      
                      {canEditComp ? (
                        <Button type="submit" disabled={isSavingComp} className="w-full md:w-auto">
                          {isSavingComp ? "Saving..." : "Save Compensation"}
                        </Button>
                      ) : (
                        <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                          Only administrators or HR managers can update compensation details.
                        </div>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
      </Tabs>
    </PageShell>
  );
}
