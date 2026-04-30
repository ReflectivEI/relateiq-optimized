import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import Profiles from "@/pages/Profiles";
import Questionnaire from "@/pages/Questionnaire";
import { Settings, User, Edit2 } from "lucide-react";

export default function Profile() {
  const { user, activeRelationship, participants, primaryPerson, secondaryPerson } = useRelationshipAuth();
  const [selectedTab, setSelectedTab] = useState("my-profile");

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 font-display">Profile</h1>
          <p className="text-muted-foreground text-lg">
            Manage your profile, relationship settings, and questionnaire responses.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8 bg-card/50">
            <TabsTrigger value="my-profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">My Profile</span>
            </TabsTrigger>
            <TabsTrigger value="connection" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Connection</span>
            </TabsTrigger>
            <TabsTrigger value="questionnaire" className="gap-2">
              <Edit2 className="h-4 w-4" />
              <span className="hidden sm:inline">Questionnaire</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>

          {/* My Profile Tab */}
          <TabsContent value="my-profile" className="space-y-6">
            <Card className="border border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl">Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-foreground">Name</label>
                    <p className="text-muted-foreground mt-1">{user?.name || primaryPerson}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground">Email</label>
                    <p className="text-muted-foreground mt-1">{user?.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Active Connection</label>
                  <p className="text-muted-foreground mt-1">
                    {participants.join(" & ")} · {activeRelationship?.type || "connection"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Profile Details from Profiles Page */}
            <Profiles />
          </TabsContent>

          {/* Connection Tab */}
          <TabsContent value="connection" className="space-y-6">
            <Card className="border border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl">Connection Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground">Relationship Name</label>
                    <p className="text-muted-foreground mt-1">{activeRelationship?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground">Relationship Type</label>
                    <p className="text-muted-foreground mt-1 capitalize">
                      {activeRelationship?.type || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground">Participants</label>
                    <p className="text-muted-foreground mt-1">{participants.join(" & ")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground">Created</label>
                    <p className="text-muted-foreground mt-1">
                      {activeRelationship?.created_at
                        ? new Date(activeRelationship.created_at).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-sm">Connection Management (Admin Only)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Additional connection management and admin tools are available in the Admin Panel.
                </p>
                <Button variant="outline" disabled>
                  Go to Admin Panel
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questionnaire Tab */}
          <TabsContent value="questionnaire" className="space-y-6">
            <Questionnaire />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="border border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl">Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      <p className="text-xs text-muted-foreground mt-1">Receive alerts for new messages and insights</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Daily Digest</p>
                      <p className="text-xs text-muted-foreground mt-1">Receive a daily summary of activity</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Data Sharing</p>
                      <p className="text-xs text-muted-foreground mt-1">Allow partner to see your insights</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-border/30">
                  <Button disabled>Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
