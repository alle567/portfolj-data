"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon,
  Save,
  X,
  Edit,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface ProfileSectionProps {
  user: any; // Clerk user object
}

interface BillingStatus {
  plan: "free" | "pro";
  subscriptionStatus: string | null;
}

export function ProfileSection({ user: initialUser }: ProfileSectionProps) {
  const { user } = useUser(); // Get the live user object with update methods
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(
    null
  );

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const fetchBillingStatus = async () => {
    try {
      const response = await fetch("/api/billing/status");
      if (response.ok) {
        const data = await response.json();
        setBillingStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch billing status:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await user.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      setIsEditing(false);
      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    });
    setIsEditing(false);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  if (!user) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <UserIcon className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6">
            {/* Profile Image Section */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-2 border-slate-200 shadow-lg">
                <AvatarImage
                  src={user.imageUrl}
                  alt={user.fullName || "Profile"}
                />
                <AvatarFallback className="text-xl sm:text-2xl bg-slate-500 text-white">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* User Info */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-black leading-tight">
                    {user.fullName || "Welcome"}
                  </CardTitle>
                  {billingStatus && (
                    <Badge
                      variant={
                        billingStatus.plan === "pro" ? "default" : "secondary"
                      }
                      className="text-xs px-2 py-1 font-medium w-fit mx-auto sm:mx-0"
                    >
                      {billingStatus.plan.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {user.emailAddresses?.[0]?.emailAddress}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-4">
          <Separator className="my-8" />

          {/* Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold">Basic Information</h4>
                <p className="text-sm text-muted-foreground">
                  Update your personal details
                </p>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </Label>
                  <p className="text-lg font-medium p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    {user.firstName || "Not set"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </Label>
                  <p className="text-lg font-medium p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    {user.lastName || "Not set"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-8" />

          {/* Account Information */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">
                Account Information
              </h4>
              <p className="text-sm text-muted-foreground">
                View your account details and timestamps
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  User ID
                </Label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="font-mono text-sm break-all">{user.id}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Account Created
                </Label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="font-medium">
                    {user.createdAt &&
                      new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </Label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="font-medium">
                    {user.updatedAt &&
                      new Date(user.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
