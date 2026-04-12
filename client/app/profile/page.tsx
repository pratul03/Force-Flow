"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ButtonLoadingSkeleton } from "@/components/ui/loading-skeletons";
import { useAuth } from "@/hooks/useAuth";
import { organizationsApi, uploadsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";

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
  const [organization, setOrganization] = useState<OrganizationSummary | null>(
    null,
  );
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);

  useEffect(() => {
    async function loadOrganization() {
      if (!user?.organizationId) {
        setOrganization(null);
        return;
      }

      const response = await organizationsApi.getById(user.organizationId);
      if (!response.success || !response.data) {
        return;
      }

      setOrganization({
        id: response.data.id,
        name: response.data.name,
        logoUrl: response.data.logoUrl,
      });
    }

    void loadOrganization();
  }, [user?.organizationId]);

  const canUploadLogo = useMemo(
    () =>
      user?.role === "SUPER_ADMIN" ||
      user?.role === "ADMIN" ||
      user?.role === "HR_MANAGER",
    [user?.role],
  );

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !user?.id) {
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setIsUploadingAvatar(true);

    const response = await uploadsApi.uploadUserProfilePhotoDirect(
      user.id,
      file,
    );

    if (!response.success || !response.data?.avatarUrl) {
      setErrorMessage(response.error || "Failed to upload profile photo");
      setIsUploadingAvatar(false);
      return;
    }

    updateUser({ avatarUrl: response.data.avatarUrl });
    setInfoMessage("Profile photo updated");
    setIsUploadingAvatar(false);
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !organization?.id) {
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setIsUploadingLogo(true);

    const response = await uploadsApi.uploadOrganizationLogoDirect(
      organization.id,
      file,
    );

    if (!response.success || !response.data?.logoUrl) {
      setErrorMessage(response.error || "Failed to upload organization logo");
      setIsUploadingLogo(false);
      return;
    }

    setOrganization((prev) =>
      prev ? { ...prev, logoUrl: response.data?.logoUrl } : prev,
    );
    window.dispatchEvent(
      new CustomEvent("organization-logo-updated", {
        detail: { logoUrl: response.data?.logoUrl || null },
      }),
    );
    setInfoMessage("Organization logo updated");
    setIsUploadingLogo(false);
  };

  const handleAvatarDelete = async () => {
    if (!user?.id) {
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setIsDeletingAvatar(true);

    const response = await uploadsApi.deleteUserProfilePhoto(user.id);
    if (!response.success) {
      setErrorMessage(response.error || "Failed to delete profile photo");
      setIsDeletingAvatar(false);
      return;
    }

    updateUser({ avatarUrl: undefined });
    setInfoMessage("Profile photo removed");
    setIsDeletingAvatar(false);
  };

  const handleLogoDelete = async () => {
    if (!organization?.id) {
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setIsDeletingLogo(true);

    const response = await uploadsApi.deleteOrganizationLogo(organization.id);
    if (!response.success) {
      setErrorMessage(response.error || "Failed to delete organization logo");
      setIsDeletingLogo(false);
      return;
    }

    setOrganization((prev) => (prev ? { ...prev, logoUrl: null } : prev));
    window.dispatchEvent(
      new CustomEvent("organization-logo-updated", {
        detail: { logoUrl: null },
      }),
    );
    setInfoMessage("Organization logo removed");
    setIsDeletingLogo(false);
  };

  return (
    <MainLayout>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="mt-2 text-gray-600">
              Your account and organization details.
            </p>
            {infoMessage && (
              <p className="mt-2 text-sm text-green-700">{infoMessage}</p>
            )}
            {errorMessage && (
              <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
            )}
          </div>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                  <AvatarFallback className="bg-blue-600 text-white text-lg">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <label htmlFor="avatar-upload">
                    <Button
                      asChild
                      disabled={
                        isUploadingAvatar || isDeletingAvatar || !user?.id
                      }
                    >
                      <span>
                        {isUploadingAvatar ? (
                          <ButtonLoadingSkeleton inverted className="w-32" />
                        ) : (
                          "Upload Profile Photo"
                        )}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={
                      isUploadingAvatar || isDeletingAvatar || !user?.id
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      isDeletingAvatar ||
                      isUploadingAvatar ||
                      !user?.id ||
                      !user?.avatarUrl
                    }
                    onClick={() => void handleAvatarDelete()}
                  >
                    {isDeletingAvatar ? (
                      <ButtonLoadingSkeleton className="w-30" />
                    ) : (
                      "Remove Profile Photo"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle>Organization Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {organization?.logoUrl ? (
                <img
                  src={organization.logoUrl}
                  alt={organization.name}
                  className="h-16 w-16 rounded-md border object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-gray-100 text-xs text-gray-500">
                  No Logo
                </div>
              )}

              <div className="text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Organization:</span>{" "}
                  {organization?.name || "-"}
                </p>
                <p>
                  <span className="font-semibold">Organization ID:</span>{" "}
                  {user?.organizationId || "-"}
                </p>
              </div>

              {canUploadLogo && (
                <div>
                  <label htmlFor="logo-upload">
                    <Button
                      asChild
                      disabled={
                        isUploadingLogo || isDeletingLogo || !organization?.id
                      }
                    >
                      <span>
                        {isUploadingLogo ? (
                          <ButtonLoadingSkeleton inverted className="w-32" />
                        ) : (
                          "Upload Organization Logo"
                        )}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={
                      isUploadingLogo || isDeletingLogo || !organization?.id
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    disabled={
                      isDeletingLogo ||
                      isUploadingLogo ||
                      !organization?.id ||
                      !organization?.logoUrl
                    }
                    onClick={() => void handleLogoDelete()}
                  >
                    {isDeletingLogo ? (
                      <ButtonLoadingSkeleton className="w-24" />
                    ) : (
                      "Remove Logo"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Name:</span> {user?.name || "-"}
              </p>
              <p>
                <span className="font-semibold">Email:</span>{" "}
                {user?.email || "-"}
              </p>
              <p>
                <span className="font-semibold">Role:</span> {user?.role || "-"}
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    </MainLayout>
  );
}
