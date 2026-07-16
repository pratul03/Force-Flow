"use client";

import { useEffect, useState } from "react";
import { StaggerItem } from "@/components/animations/StaggerReveal";
import { PageShell } from "@/components/layout/PageShell";
import { CURRENCIES } from "@/lib/config/currencies";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { organizationsApi } from "@/features/organizations/api";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function OrganizationSettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    currency: "USD",
    timezone: "UTC",
    baseHourlyRate: "",
    overtimeMultiplier: "",
  });

  useEffect(() => {
    async function loadData() {
      if (!user?.organizationId) return;
      
      setIsLoading(true);
      try {
        const res = await organizationsApi.getById(user.organizationId);
        if (res.success && res.data) {
          const org = res.data as any;
          setFormData({
            name: org.name || "",
            country: org.country || "",
            currency: org.currency || "USD",
            timezone: org.timezone || "UTC",
            baseHourlyRate: org.baseHourlyRate?.toString() || "0",
            overtimeMultiplier: org.overtimeMultiplier?.toString() || "1",
          });
        }
      } catch (err) {
        toast.error("Failed to load organization settings");
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, [user?.organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.organizationId) return;
    
    setIsSaving(true);
    const payload = {
      name: formData.name,
      country: formData.country,
      currency: formData.currency,
      timezone: formData.timezone,
      baseHourlyRate: parseFloat(formData.baseHourlyRate) || 0,
      overtimeMultiplier: parseFloat(formData.overtimeMultiplier) || 1,
    };
    
    const res = await organizationsApi.update(user.organizationId, payload);
    if (res.success) {
      toast.success("Organization settings updated successfully");
    } else {
      toast.error(res.error || "Failed to update settings");
    }
    setIsSaving(false);
  };

  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return (
      <>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">You do not have permission to access organization settings.</p>
        </div>
      </>
    );
  }

  return (
    <PageShell
      title="Organization Settings"
      description="Manage global settings, localization preferences, and payroll rules for your tenant."
      action={
        <Link href="/settings" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Settings
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* General Settings */}
              <Card className="shadow-sm border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl">General Details</CardTitle>
                  <CardDescription>Core identity of the organization.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="animate-pulse flex space-x-4">
                      <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Organization Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Operating Country</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          placeholder="e.g. United States"
                          required
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Localization Settings */}
              <Card className="shadow-sm border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Localization & Formats</CardTitle>
                  <CardDescription>Configure the default currency and timezone for all dates and financial records.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? null : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Base Currency</Label>
                        <Select 
                          value={formData.currency} 
                          onValueChange={(val) => setFormData({ ...formData, currency: val })}
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
                        <Label>Default Timezone</Label>
                        <Select 
                          value={formData.timezone} 
                          onValueChange={(val) => setFormData({ ...formData, timezone: val })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                            <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                            <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                            <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                            <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                            <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                            <SelectItem value="Australia/Sydney">Australia/Sydney (AEST)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payroll Settings */}
              <Card className="shadow-sm border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Payroll Defaults</CardTitle>
                  <CardDescription>Default hourly rates and overtime multipliers for timesheets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? null : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="baseHourlyRate">Base Hourly Rate ({formData.currency})</Label>
                        <Input
                          id="baseHourlyRate"
                          type="number"
                          step="0.01"
                          value={formData.baseHourlyRate}
                          onChange={(e) => setFormData({ ...formData, baseHourlyRate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="overtimeMultiplier">Overtime Multiplier (e.g. 1.5x)</Label>
                        <Input
                          id="overtimeMultiplier"
                          type="number"
                          step="0.1"
                          min="1"
                          value={formData.overtimeMultiplier}
                          onChange={(e) => setFormData({ ...formData, overtimeMultiplier: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={isSaving || isLoading} className="min-w-[150px] shadow-lg">
                  {isSaving ? "Saving Changes..." : "Save Settings"}
                </Button>
              </div>
            </form>
    </PageShell>
  );
}
