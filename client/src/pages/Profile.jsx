import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Profiles from "@/pages/Profiles";
import Questionnaire from "@/pages/Questionnaire";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings,
  User,
  Edit2,
  Camera,
  Upload,
  Trash2,
  Sparkles,
  Shield,
  Bell,
  Database,
  Link as LinkIcon,
} from "lucide-react";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function initialsFromName(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

export default function Profile() {
  const { user, activeRelationship, participants, primaryPerson } = useRelationshipAuth();
  const queryClient = useQueryClient();
  const currentPersonName = activeRelationship?.current_person_name || user?.name || primaryPerson || "User";
  const isOwner = activeRelationship?.current_user_role === "owner";
  const fileInputRef = useRef(null);
  const avatarStorageKey = useMemo(() => {
    const relationshipId = activeRelationship?.id || "global";
    return `relateiq:avatar:${relationshipId}:${currentPersonName}`;
  }, [activeRelationship?.id, currentPersonName]);
  const [selectedTab, setSelectedTab] = useState("profile");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(() => localStorage.getItem(avatarStorageKey) || "");
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem("relateiq:ui-preferences");
      return stored
        ? JSON.parse(stored)
        : {
            notifications: true,
            dailyDigest: true,
            dataSharing: true,
          };
    } catch {
      return {
        notifications: true,
        dailyDigest: true,
        dataSharing: true,
      };
    }
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["profiles", activeRelationship?.id],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const currentBehaviorProfile = allProfiles.find((entry) => entry.person_name === currentPersonName) || null;
  const persistedAvatar = currentBehaviorProfile?.profile_image_url || "";
  const effectiveAvatar = persistedAvatar || localAvatar;

  const saveAvatarToProfile = async (nextAvatar) => {
    setAvatarSaving(true);
    try {
      if (currentBehaviorProfile?.id) {
        await api.entities.UserProfile.update(currentBehaviorProfile.id, {
          profile_image_url: nextAvatar || "",
        });
      } else {
        await api.entities.UserProfile.create({
          person_name: currentPersonName,
          profile_image_url: nextAvatar || "",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["profiles", activeRelationship?.id] });
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image is too large. Use a file under 5MB.");
      return;
    }

    try {
      const dataUrl = await toDataUrl(file);
      setLocalAvatar(dataUrl);
      localStorage.setItem(avatarStorageKey, dataUrl);
      await saveAvatarToProfile(dataUrl);
      toast.success("Profile image updated.");
    } catch (error) {
      toast.error("Unable to upload profile image right now.");
    } finally {
      event.target.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    setLocalAvatar("");
    localStorage.removeItem(avatarStorageKey);
    await saveAvatarToProfile("");
    toast.success("Profile image removed.");
  };

  const updatePreference = (key) => {
    setPreferences((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem("relateiq:ui-preferences", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
        <div className="mb-8 rounded-[1.75rem] border border-border/60 bg-card/70 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-md">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-3xl border border-primary/20">
                {effectiveAvatar ? <AvatarImage src={effectiveAvatar} alt={`${currentPersonName} profile`} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {initialsFromName(currentPersonName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/85">Identity</p>
                <h1 className="text-4xl font-bold text-foreground font-display">Profile</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentPersonName} · {activeRelationship?.name || participants.join(" & ")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              {isOwner && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-primary/30 bg-background/70"
                    disabled={avatarSaving}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {avatarSaving ? "Saving..." : "Upload Photo"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-border/60"
                    disabled={avatarSaving || !effectiveAvatar}
                    onClick={() => void handleAvatarRemove()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl grid-cols-5 mb-8 rounded-2xl border border-border/70 bg-card/60 p-1">
            <TabsTrigger value="profile" className="gap-2 rounded-xl">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="workspace" className="gap-2 rounded-xl">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Workspace</span>
            </TabsTrigger>
            <TabsTrigger value="questionnaire" className="gap-2 rounded-xl">
              <Edit2 className="h-4 w-4" />
              <span className="hidden sm:inline">Questionnaire</span>
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="gap-2 rounded-xl">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Intelligence</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2 rounded-xl">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="rounded-3xl border border-border/60 bg-card/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Your Profile Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="text-sm font-semibold text-foreground">Name</label>
                    <p className="text-muted-foreground mt-1">{currentPersonName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground">Email</label>
                    <p className="text-muted-foreground mt-1">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground">Role</label>
                    <p className="text-muted-foreground mt-1 capitalize">{activeRelationship?.current_user_role || "member"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Active Connection</label>
                  <p className="text-muted-foreground mt-1">
                    {participants.join(" & ")} · {activeRelationship?.type || "connection"}
                  </p>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-medium text-foreground">Profile photo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload a square image for the most consistent sidebar and account presentation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workspace" className="space-y-6">
            <Card className="rounded-3xl border border-border/60 bg-card/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Consolidated Workspace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    { title: "Reflect", description: "AI Coach, What Happened, Journal, Daily connections.", to: "/reflect", icon: Sparkles },
                    { title: "Repair", description: "Repair strategies and message builder workflows.", to: "/repair", icon: Shield },
                    { title: "Grow", description: "Insights, analysis engine, and knowledge tools.", to: "/grow", icon: Database },
                    { title: "Inbox", description: "Relationship notes and clean message handoff.", to: "/inbox", icon: Bell },
                    { title: "Profile", description: "Identity, questionnaire, and intelligence profile.", to: "/profile", icon: User },
                  ].map((section) => (
                    <Link
                      key={section.title}
                      to={section.to}
                      className="rounded-2xl border border-border/70 bg-background/70 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                    >
                      <section.icon className="h-4 w-4 text-primary" />
                      <p className="mt-3 text-sm font-semibold text-foreground">{section.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{section.description}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border/60 bg-card/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Connection Management (Admin Only)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Additional connection management and admin tools are available in the Admin Panel.
                </p>
                <Button asChild variant="outline">
                  <Link to="/restore-center">Open Admin Panel</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questionnaire" className="space-y-6">
            <Questionnaire />
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6">
            <Profiles />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="rounded-3xl border border-border/60 bg-card/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Theme</p>
                    <p className="text-xs text-muted-foreground mt-1">Switch light or dark mode across the app.</p>
                  </div>
                  <ThemeToggle />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      <p className="text-xs text-muted-foreground mt-1">Receive alerts for new messages and insights</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifications}
                      onChange={() => updatePreference("notifications")}
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
                      checked={preferences.dailyDigest}
                      onChange={() => updatePreference("dailyDigest")}
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
                      checked={preferences.dataSharing}
                      onChange={() => updatePreference("dataSharing")}
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-border/30 flex flex-wrap gap-3">
                  <Button asChild variant="outline">
                    <Link to="/inbox">Open Inbox</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/download-data">Export Data</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/grow" className="inline-flex items-center">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Open Grow Hub
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
