"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";

// Import our custom account sections
import { ProfileSection } from "@/components/account/ProfileSection";
import { SecuritySection } from "@/components/account/SecuritySection";
import { EmailSection } from "@/components/account/EmailSection";
import { SessionsSection } from "@/components/account/SessionsSection";

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState("profile");

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8 lg:py-12">
            <div className="animate-pulse space-y-6">
              <div className="space-y-3">
                <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
              <div className="h-12 bg-slate-200 rounded-xl"></div>
              <div className="grid gap-6">
                <div className="h-64 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl"></div>
                <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8 lg:py-12">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  Sign In Required
                </h2>
                <p className="text-muted-foreground">
                  Please sign in to access your account settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="py-6 sm:py-8 lg:py-12">
          {/* Header */}
          <div className="mb-8 sm:mb-12 text-center sm:text-left">
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                Account Settings
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Manage your Profile settings, Security settings, Email, and see
                Sessions
              </p>
            </div>
          </div>

          {/* Account Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6 sm:space-y-8"
          >
            {/* Clean tab navigation */}
            <div className="flex justify-center px-2">
              <TabsList className="grid w-full max-w-sm sm:max-w-md grid-cols-4 h-10 sm:h-auto">
                <TabsTrigger value="profile" className="text-xs sm:text-sm">
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="text-xs sm:text-sm">
                  Security
                </TabsTrigger>
                <TabsTrigger value="emails" className="text-xs sm:text-sm">
                  Emails
                </TabsTrigger>
                <TabsTrigger value="sessions" className="text-xs sm:text-sm">
                  Sessions
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content with enhanced styling */}
            <div className="relative">
              <TabsContent
                value="profile"
                className="mt-0 focus-visible:outline-none"
              >
                <div className="transform transition-all duration-300 ease-in-out">
                  <ProfileSection user={user} />
                </div>
              </TabsContent>

              <TabsContent
                value="security"
                className="mt-0 focus-visible:outline-none"
              >
                <div className="transform transition-all duration-300 ease-in-out">
                  <SecuritySection user={user} />
                </div>
              </TabsContent>

              <TabsContent
                value="emails"
                className="mt-0 focus-visible:outline-none"
              >
                <div className="transform transition-all duration-300 ease-in-out">
                  <EmailSection user={user} />
                </div>
              </TabsContent>

              <TabsContent
                value="sessions"
                className="mt-0 focus-visible:outline-none"
              >
                <div className="transform transition-all duration-300 ease-in-out">
                  <SessionsSection user={user} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
