import React, { useMemo, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
  CalendarCheck2,
  Bot,
  Menu,
  X,
  Wrench,
  ShieldAlert,
  LogOut,
  MessagesSquare,
  BrainCircuit,
  LibraryBig,
  BookOpenText,
  TrendingUp,
  Handshake,
  Gamepad2,
  Layers3,
  NotebookPen,
  Telescope,
  ActivitySquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Plus,
  Link2,
  Settings2,
  Pencil,
  Trash2,
  RefreshCw,
  Copy,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/api/client";
import PageBanner from "@/components/layout/PageBanner";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const navGroups = [
  {
    id: "core",
    label: "Core Workspace",
    items: [
      { path: "/", label: "Home", icon: LayoutDashboard },
      { path: "/journal", label: "Journal", icon: NotebookPen },
      { path: "/health-report", label: "Health Report", icon: ActivitySquare },
      { path: "/vision", label: "Vision Board", icon: Telescope },
      { path: "/playbook", label: "Playbook", icon: BookOpenText },
      { path: "/play-lab-ii", label: "Play Lab II", icon: Layers3 },
      { path: "/play-lab", label: "Play Lab", icon: Gamepad2 },
    ],
  },
  {
    id: "intelligence",
    label: "Relationship Intelligence",
    items: [
      { path: "/profiles", label: "Profiles", icon: Users },
      { path: "/questionnaire", label: "Questionnaire", icon: ClipboardList },
      { path: "/analysis", label: "Analysis Engine", icon: BrainCircuit },
      { path: "/insights", label: "Insights", icon: BarChart3 },
      { path: "/roadmap", label: "Growth Roadmap", icon: TrendingUp },
      { path: "/daily", label: "Daily Connections", icon: Handshake },
      { path: "/insight-library", label: "Insight Library", icon: LibraryBig },
      { path: "/knowledge", label: "Knowledge Hub", icon: BookOpenText },
    ],
  },
  {
    id: "support",
    label: "Support Tools",
    items: [
      { path: "/coach", label: "AI Coach", icon: Bot },
      { path: "/check-in", label: "Check-In", icon: CalendarCheck2 },
      { path: "/tools", label: "Smart Tools", icon: Wrench },
      { path: "/triggers", label: "Triggers", icon: ShieldAlert },
      { path: "/repair", label: "Proactive Repair", icon: ShieldAlert },
      { path: "/chat", label: "Relationship Chat", icon: MessagesSquare },
      { path: "/appendix", label: "Appendix", icon: BookMarked },
    ],
  },
];

function generateTemporaryPassword() {
  const base = crypto.randomUUID().replace(/-/g, "");
  return `${base.slice(0, 4)}${base.slice(4, 8)}!${base.slice(8, 11)}A`;
}

function formatRelationshipTypeLabel(type) {
  const normalized = String(type || "").trim().toLowerCase();
  if (normalized === "romantic") return "Partners";
  if (normalized === "friendship") return "Friendship";
  if (normalized === "family") return "Family";
  if (normalized === "other") return "Other";
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Other";
}

export default function AppLayout() {
  const location = useLocation();
  const { user, relationships, activeRelationshipId, activeRelationship, selectRelationship, updateRelationships, logout } =
    useRelationshipAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [relationshipName, setRelationshipName] = useState("");
  const [relationshipType, setRelationshipType] = useState("romantic");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [provisionedAccount, setProvisionedAccount] = useState(null);
  const [managedRows, setManagedRows] = useState([]);
  const [editingRelationshipId, setEditingRelationshipId] = useState("");
  const [selectedManagedRow, setSelectedManagedRow] = useState(null);
  const [selfDescription, setSelfDescription] = useState("");
  const [supportStyle, setSupportStyle] = useState("");
  const [supportNotes, setSupportNotes] = useState("");
  const [communicationNote, setCommunicationNote] = useState("");
  const [relationshipError, setRelationshipError] = useState("");
  const [managementLoading, setManagementLoading] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    core: true,
    intelligence: true,
    support: true,
  });
  const [mobileGroupOpen, setMobileGroupOpen] = useState({
    core: false,
    intelligence: false,
    support: false,
  });
  const isOwner = activeRelationship?.current_user_role === "owner";
  const showPlayLabII = String(activeRelationship?.type || "romantic").toLowerCase() === "romantic";
  const selectedManagedRelationshipId = useMemo(
    () => selectedManagedRow?.relationship_id || editingRelationshipId || "",
    [selectedManagedRow, editingRelationshipId],
  );
  const visibleNavGroups = useMemo(
    () =>
      navGroups.map((group) => ({
        ...group,
        items: group.items.filter((item) => item.path !== "/play-lab-ii" || showPlayLabII),
      })),
    [showPlayLabII],
  );

  const toggleGroup = (groupId) => {
    setOpenGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const toggleMobileGroup = (groupId) => {
    setMobileGroupOpen((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const ensureInvitePassword = () => {
    const nextPassword = invitePassword.trim() || generateTemporaryPassword();
    if (!invitePassword.trim()) {
      setInvitePassword(nextPassword);
    }
    return nextPassword;
  };

  const loadManagedRows = async () => {
    setManagementLoading(true);
    try {
      const result = await api.relationships.manage();
      setManagedRows(result.rows || []);
    } catch (error) {
      setRelationshipError(error instanceof Error ? error.message : "Unable to load managed connections.");
    } finally {
      setManagementLoading(false);
    }
  };

  const openManageDialog = async () => {
    setRelationshipError("");
    resetConnectionForm();
    setManageOpen(true);
    await loadManagedRows();
  };

  const startEditingRow = (row) => {
    setRelationshipError("");
    setSelectedManagedRow(row);
    setEditingRelationshipId(row.relationship_id);
    setRelationshipName(row.relationship_name || "");
    setRelationshipType(row.relationship_type || "romantic");
    setInviteName(row.user_name || "");
    setInviteEmail(row.email || "");
    setInvitePassword(row.temporary_password || generateTemporaryPassword());
    setInviteLink(row.invite_link || "");
  };

  const resetConnectionForm = () => {
    setRelationshipName("");
    setRelationshipType("romantic");
    setInviteName("");
    setInviteEmail("");
    setInvitePassword(generateTemporaryPassword());
    setInviteLink("");
    setProvisionedAccount(null);
    setEditingRelationshipId("");
    setSelectedManagedRow(null);
  };

  const resolveRelationshipIdForEdit = async (relationshipIdHint) => {
    const normalizedHint = String(relationshipIdHint || "").trim();
    if (normalizedHint) return normalizedHint;

    const rows = managedRows.length ? managedRows : (await api.relationships.manage()).rows || [];
    if (!managedRows.length) {
      setManagedRows(rows);
    }

    const match = rows.find((row) => {
      if (selectedManagedRow?.invite_link && row.invite_link === selectedManagedRow.invite_link) return true;
      if (
        selectedManagedRow?.relationship_name &&
        selectedManagedRow?.user_name &&
        row.relationship_name === selectedManagedRow.relationship_name &&
        row.user_name === selectedManagedRow.user_name &&
        (row.email || "") === (selectedManagedRow.email || "")
      ) {
        return true;
      }
      return false;
    });

    return match?.relationship_id || "";
  };

  const handleCreateRelationship = async () => {
    try {
      setRelationshipError("");
      const nextPassword = ensureInvitePassword();
      const trimmedPartnerName = inviteName.trim();
      const resolvedName =
        relationshipName.trim() || [user?.name, trimmedPartnerName].filter(Boolean).join(" & ");
      const result = await api.relationships.create({
        name: resolvedName,
        type: relationshipType,
      });
      updateRelationships(result.relationships || [], result.relationship?.id);
      setRelationshipName(resolvedName);
      if (inviteEmail.trim()) {
        const inviteResult = await api.relationships.invite({
          relationship_id: result.relationship?.id,
          email: inviteEmail,
          name: trimmedPartnerName,
          password: nextPassword,
        });
        setInviteLink(inviteResult.absolute_invite_link || inviteResult.invite_link || "");
        setProvisionedAccount(
          inviteResult.provisional_user
            ? {
                name: inviteResult.provisional_user.name,
                email: inviteResult.provisional_user.email,
                password: nextPassword,
              }
            : null,
        );
      } else {
        setInviteLink("");
        setProvisionedAccount(null);
      }
      await loadManagedRows();
      setRelationshipType("romantic");
      setCreateOpen(false);
      setInviteOpen(true);
      toast.success("Connection created. Invite details are ready to share.");
    } catch (error) {
      setRelationshipError(error instanceof Error ? error.message : "Unable to create relationship.");
      toast.error("Unable to create connection.");
    }
  };

  const handleCreateInvite = async () => {
    try {
      setRelationshipError("");
      const nextPassword = ensureInvitePassword();
      const result = await api.relationships.invite({
        relationship_id: activeRelationshipId,
        email: inviteEmail,
        name: inviteName,
        password: nextPassword,
      });
      setInviteLink(result.absolute_invite_link || result.invite_link || "");
      setProvisionedAccount(
        result.provisional_user
          ? {
              name: result.provisional_user.name,
              email: result.provisional_user.email,
              password: nextPassword,
          }
        : null,
      );
      await loadManagedRows();
      toast.success("Invite link and assigned login saved for this connection.");
    } catch (error) {
      setRelationshipError(error instanceof Error ? error.message : "Unable to create invite.");
      toast.error("Unable to create invite.");
    }
  };

  const handleSaveManagedRow = async () => {
    setRelationshipError("");
    try {
      const relationshipId = await resolveRelationshipIdForEdit(selectedManagedRelationshipId);
      if (!relationshipId) {
        setRelationshipError("Select a valid connection row before saving changes.");
        return;
      }
      const nextPassword = ensureInvitePassword();
      const result = await api.relationships.updateManaged(relationshipId, {
        relationship_name: relationshipName,
        relationship_type: relationshipType,
        user_name: inviteName,
        email: inviteEmail,
        temporary_password: nextPassword,
      });
      updateRelationships(result.relationships || relationships, activeRelationshipId);
      setManagedRows(result.adminRows || []);
      resetConnectionForm();
      toast.success("Managed connection changes saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update managed connection.";
      if (message.includes("relationship_not_found")) {
        await loadManagedRows();
        setRelationshipError("That connection list was stale. The panel has been refreshed; please select the row again.");
        toast.error("That connection row was stale. The panel has been refreshed.");
      } else {
        setRelationshipError(message);
        toast.error("Unable to save managed connection changes.");
      }
    }
  };

  const handleDeleteManagedRow = async (relationshipId) => {
    try {
      setRelationshipError("");
      const resolvedRelationshipId = await resolveRelationshipIdForEdit(relationshipId);
      if (!resolvedRelationshipId) {
        setRelationshipError("Unable to find that connection. The list has been refreshed.");
        await loadManagedRows();
        return;
      }
      const result = await api.relationships.deleteManaged(resolvedRelationshipId);
      updateRelationships(result.relationships || [], activeRelationshipId);
      setManagedRows(result.adminRows || []);
      if (selectedManagedRelationshipId === resolvedRelationshipId) {
        resetConnectionForm();
      }
      toast.success("Managed connection deleted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete managed connection.";
      if (message.includes("relationship_not_found")) {
        await loadManagedRows();
        setRelationshipError("That connection list was stale. The panel has been refreshed; please try again.");
        toast.error("That connection row was stale. The panel has been refreshed.");
      } else {
        setRelationshipError(message);
        toast.error("Unable to delete managed connection.");
      }
    }
  };

  const handleSubmitOnboarding = async () => {
    try {
      const result = await api.relationships.onboard({
        self_description: selfDescription,
        support_style: supportStyle,
        support_notes: supportNotes,
        communication_note: communicationNote,
      });
      updateRelationships(result.relationships || relationships, activeRelationshipId);
      setOnboardingOpen(false);
      setSelfDescription("");
      setSupportStyle("");
      setSupportNotes("");
      setCommunicationNote("");
      toast.success("Onboarding notes saved for this connection.");
    } catch (error) {
      setRelationshipError(error instanceof Error ? error.message : "Unable to save onboarding.");
      toast.error("Unable to save onboarding.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar fixed h-full z-30 shadow-[6px_0_30px_rgba(15,23,42,0.08)] transition-all duration-300",
          sidebarCollapsed ? "w-[92px]" : "w-72"
        )}
      >
        <div className={cn("border-b border-border", sidebarCollapsed ? "p-4" : "p-6")}>
          <div className="flex items-start justify-between gap-3">
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/35 bg-white/5 p-1 shrink-0">
                <img src="/site-logo.png" alt="ReflectIQ logo" className="h-full w-full rounded-xl object-contain" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="font-display text-lg font-semibold tracking-tight text-white">ReflectIQ</h1>
                  <p className="text-[10px] text-teal-200/70 tracking-[0.24em] uppercase">Relationship Intelligence</p>
                </div>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed((value) => !value)}
              className="h-9 w-9 shrink-0 rounded-xl border border-white/10 bg-white/5 text-teal-100 hover:bg-white/10 hover:text-white"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          {!sidebarCollapsed && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-teal-200/70">Active Connection</p>
              <select
                value={activeRelationshipId}
                onChange={(event) => selectRelationship(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#14263f] px-3 py-2 text-sm text-white"
              >
                {relationships.map((relationship) => (
                  <option key={relationship.id} value={relationship.id}>
                    {relationship.name} · {formatRelationshipTypeLabel(relationship.type)}
                  </option>
                ))}
              </select>
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-primary/30 bg-transparent text-teal-100 hover:bg-primary/10"
                  onClick={() => {
                    setRelationshipError("");
                    resetConnectionForm();
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-primary/30 bg-transparent text-teal-100 hover:bg-primary/10"
                  onClick={() => {
                    setRelationshipError("");
                    setInviteLink("");
                    setProvisionedAccount(null);
                    if (!invitePassword.trim()) setInvitePassword(generateTemporaryPassword());
                    setInviteOpen(true);
                  }}
                >
                  <Link2 className="mr-1 h-3.5 w-3.5" />
                  Invite
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-11 justify-center border-primary/30 bg-transparent px-0 text-teal-100 hover:bg-primary/10"
                  onClick={() => void openManageDialog()}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <nav className={cn("flex-1 overflow-y-auto", sidebarCollapsed ? "p-3 space-y-2" : "p-4 space-y-4")}>
          {visibleNavGroups.map((group) => {
            const groupHasActiveItem = group.items.some((item) => location.pathname === item.path);
            return (
              <div key={group.id} className="space-y-2">
                {!sidebarCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition-all",
                      groupHasActiveItem
                        ? "border-primary/20 bg-white/5 text-white"
                        : "border-transparent text-teal-200/70 hover:bg-sidebar-accent hover:text-white"
                    )}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">{group.label}</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", openGroups[group.id] ? "rotate-0" : "-rotate-90")} />
                  </button>
                ) : (
                  <div className="px-2 pt-2">
                    <div className="h-px w-full bg-white/10" />
                  </div>
                )}

                {(sidebarCollapsed || openGroups[group.id]) && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={cn(
                            "flex items-center rounded-2xl border text-sm font-medium transition-all duration-200",
                            sidebarCollapsed
                              ? "justify-center px-3 py-3"
                              : "gap-3 px-3 py-2.5",
                            active
                              ? "border-primary/40 bg-primary/15 text-white shadow-sm"
                              : "border-transparent text-teal-200/85 hover:border-primary/20 hover:bg-sidebar-accent hover:text-white"
                          )}
                        >
                          <item.icon className="w-4.5 h-4.5 shrink-0" />
                          {!sidebarCollapsed && item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className={cn("border-t border-border", sidebarCollapsed ? "p-3" : "p-4")}>
          <button
            onClick={() => logout()}
            className={cn(
              "flex w-full items-center rounded-2xl text-xs transition-all mb-2",
              sidebarCollapsed
                ? "justify-center px-3 py-3 text-teal-200/80 hover:text-white hover:bg-sidebar-accent"
                : "gap-2 px-3 py-2 text-teal-200/80 hover:text-white hover:bg-sidebar-accent"
            )}
            title={sidebarCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-3.5 h-3.5" />
            {!sidebarCollapsed && "Sign Out"}
          </button>
          {!sidebarCollapsed && (
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              This app provides guidance based on behavioral patterns. It is not a substitute for licensed therapy.
            </p>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src="/site-logo.png" alt="ReflectIQ logo" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-display font-semibold text-foreground">ReflectIQ</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="space-y-3 border-b border-border bg-card px-4 pb-4">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Active Connection
              </p>
              <select
                value={activeRelationshipId}
                onChange={(event) => selectRelationship(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {relationships.map((relationship) => (
                  <option key={relationship.id} value={relationship.id}>
                    {relationship.name} · {formatRelationshipTypeLabel(relationship.type)}
                  </option>
                ))}
              </select>
              <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => { setRelationshipError(""); resetConnectionForm(); setCreateOpen(true); }}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
            <Button variant="outline" onClick={() => { setRelationshipError(""); if (!invitePassword.trim()) setInvitePassword(generateTemporaryPassword()); setInviteOpen(true); }}>
                  <Link2 className="mr-1 h-4 w-4" />
                  Invite
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => void openManageDialog()}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Manage Connections
                </Button>
            </div>
            {visibleNavGroups.map((group) => {
              const groupHasActiveItem = group.items.some((item) => location.pathname === item.path);
              return (
                <div key={group.id} className="rounded-2xl border border-border/60 bg-muted/20">
                  <button
                    type="button"
                    onClick={() => toggleMobileGroup(group.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors",
                      groupHasActiveItem ? "bg-primary/8 text-primary" : "text-foreground hover:bg-muted/40"
                    )}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                      {group.label}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", mobileGroupOpen[group.id] ? "rotate-0" : "-rotate-90")} />
                  </button>

                  {mobileGroupOpen[group.id] && (
                    <div className="space-y-1 px-2 pb-2">
                      {group.items.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className={cn("flex-1 pt-14 lg:pt-0 transition-all duration-300", sidebarCollapsed ? "lg:ml-[92px]" : "lg:ml-72")}>
        {/* Top bar with theme toggle */}
        <div className="hidden lg:flex items-center justify-end px-8 pt-4 pb-0">
          <div className="mr-auto text-sm text-muted-foreground">
            {activeRelationship ? `${activeRelationship.name} · ${activeRelationship.type}` : ""}
          </div>
          <Button variant="outline" size="sm" className="mr-2" onClick={() => setOnboardingOpen(true)}>
            Onboarding
          </Button>
          <ThemeToggle />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <PageBanner />
          <Outlet />
        </div>
      </main>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>Create New Connection</DialogTitle>
            <DialogDescription>
              Create a new private connection and provision an invite login for the second participant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Owner/admin setup</p>
              <p className="mt-1">
                You are the owner of this connection. Add the second person’s name, email, and password below
                to generate a private invite link and dedicated login for them.
              </p>
            </div>
            <input
              value={relationshipName}
              onChange={(event) => setRelationshipName(event.target.value)}
              placeholder={`${user?.name || "Tony"} & Alex`}
              className="w-full rounded-2xl border border-border px-4 py-3"
            />
            <select
              value={relationshipType}
              onChange={(event) => setRelationshipType(event.target.value)}
              className="w-full rounded-2xl border border-border px-4 py-3"
            >
              <option value="romantic">Partners</option>
              <option value="friendship">Friendship</option>
              <option value="family">Family</option>
              <option value="other">Other</option>
            </select>
            <input
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              placeholder="Second person’s name"
              className="w-full rounded-2xl border border-border px-4 py-3"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="alex@example.com"
                className="w-full rounded-2xl border border-border px-4 py-3"
              />
              <input
                value={invitePassword}
                onChange={(event) => setInvitePassword(event.target.value)}
                placeholder="Temporary password"
                className="w-full rounded-2xl border border-border px-4 py-3"
              />
            </div>
            {relationshipError ? <p className="text-sm text-red-600">{relationshipError}</p> : null}
            <Button onClick={handleCreateRelationship} className="w-full" disabled={!isOwner && relationships.length > 0}>
              Create Connection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>Invite Someone</DialogTitle>
            <DialogDescription>
              Generate a private invite link and provisional login details for the selected connection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              placeholder="Their name"
              className="w-full rounded-2xl border border-border px-4 py-3"
            />
            <input
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="friend@example.com"
              className="w-full rounded-2xl border border-border px-4 py-3"
            />
            <input
              value={invitePassword}
              onChange={(event) => setInvitePassword(event.target.value)}
              placeholder="Password to share with them"
              className="w-full rounded-2xl border border-border px-4 py-3"
            />
            {inviteLink ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm break-all">
                <p className="font-medium text-foreground">Invite link</p>
                <p className="mt-1 break-all">{inviteLink}</p>
                {provisionedAccount ? (
                  <div className="mt-3 rounded-2xl border border-border/70 bg-background/70 p-3 text-foreground">
                    <p className="text-sm font-medium">Assigned login</p>
                    <p className="mt-1 text-sm">Name: {provisionedAccount.name}</p>
                    <p className="text-sm">Email: {provisionedAccount.email}</p>
                    <p className="text-sm">Password: {provisionedAccount.password}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
            {relationshipError ? <p className="text-sm text-red-600">{relationshipError}</p> : null}
            <Button onClick={handleCreateInvite} className="w-full" disabled={!isOwner}>
              Generate Invite Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-h-[85vh] w-[min(96vw,80rem)] max-w-[96vw] overflow-x-auto overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Manage Connections</DialogTitle>
            <DialogDescription>
              Review, edit, or delete owner-managed relationship connections and invite credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              This owner-only panel shows the people you’ve added, their assigned login email, the current temporary password on file, and edit/delete controls for each managed connection.
            </div>
            <div className="overflow-x-auto">
              <div className="grid min-w-[980px] gap-4 lg:grid-cols-[1.3fr_1fr]">
              <div className="overflow-hidden rounded-2xl border border-border/70">
                <div className="hidden grid-cols-[1.1fr_1.2fr_1fr_0.9fr] gap-3 border-b border-border/70 bg-muted/20 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid">
                  <div>User</div>
                  <div>Email</div>
                  <div>Temporary Password</div>
                  <div>Actions</div>
                </div>
                <div className="divide-y divide-border/60">
                  {managementLoading ? (
                    <div className="px-4 py-6 text-sm text-muted-foreground">Loading managed connections…</div>
                  ) : managedRows.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-muted-foreground">No managed connections yet.</div>
                  ) : (
                    managedRows.map((row) => (
                      <div key={row.relationship_id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.1fr_1.2fr_1fr_0.9fr] md:items-center">
                        <div>
                          <p className="font-medium text-foreground">{row.user_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.relationship_name} · {formatRelationshipTypeLabel(row.relationship_type)}
                          </p>
                        </div>
                        <div className="break-all text-sm text-foreground">{row.email || "No email yet"}</div>
                        <div className="flex items-center gap-2">
                          <code className="rounded-xl bg-muted/40 px-2 py-1 text-xs text-foreground">{row.temporary_password || "Not set"}</code>
                          {row.temporary_password ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => navigator.clipboard.writeText(row.temporary_password)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => startEditingRow(row)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => void handleDeleteManagedRow(row.relationship_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {editingRelationshipId ? "Edit managed connection" : "Select a row to edit"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Update the connection label, invited user, email, or temporary password. Password changes are re-hashed on the backend and remain scoped to this connection only.
                  </p>
                </div>
                <input
                  value={relationshipName}
                  onChange={(event) => setRelationshipName(event.target.value)}
                  placeholder="Connection name"
                  className="w-full rounded-2xl border border-border px-4 py-3"
                />
                <select
                  value={relationshipType}
                  onChange={(event) => setRelationshipType(event.target.value)}
                  className="w-full rounded-2xl border border-border px-4 py-3"
                >
                  <option value="romantic">Partners</option>
                  <option value="friendship">Friendship</option>
                  <option value="family">Family</option>
                  <option value="other">Other</option>
                </select>
                <input
                  value={inviteName}
                  onChange={(event) => setInviteName(event.target.value)}
                  placeholder="User name"
                  className="w-full rounded-2xl border border-border px-4 py-3"
                />
                <input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="Email"
                  className="w-full rounded-2xl border border-border px-4 py-3"
                />
                <div className="flex gap-2">
                  <input
                    value={invitePassword}
                    onChange={(event) => setInvitePassword(event.target.value)}
                    placeholder="Temporary password"
                    className="w-full rounded-2xl border border-border px-4 py-3"
                  />
                  <Button type="button" variant="outline" onClick={() => setInvitePassword(generateTemporaryPassword())}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </div>
                {relationshipError ? <p className="text-sm text-red-600">{relationshipError}</p> : null}
                <div className="flex gap-2">
                  <Button type="button" className="flex-1" disabled={!editingRelationshipId} onClick={() => void handleSaveManagedRow()}>
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={resetConnectionForm}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Connection Onboarding</DialogTitle>
            <DialogDescription className="sr-only">
              Save onboarding notes for this connection so the app can personalize guidance safely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This space is just for you and {activeRelationship?.participant_names?.find((name) => name !== user?.name) || "the other person"}.
            </p>
            <input
              value={selfDescription}
              onChange={(event) => setSelfDescription(event.target.value)}
              placeholder="How would you describe yourself in conversations?"
              className="w-full rounded-2xl border border-border px-4 py-3"
            />
            <input
              value={supportStyle}
              onChange={(event) => setSupportStyle(event.target.value)}
              placeholder="What helps you feel supported?"
              className="w-full rounded-2xl border border-border px-4 py-3"
            />
            <textarea
              value={supportNotes}
              onChange={(event) => setSupportNotes(event.target.value)}
              placeholder="Anything else that helps your partner understand your needs?"
              className="min-h-[110px] w-full rounded-2xl border border-border px-4 py-3"
            />
            <textarea
              value={communicationNote}
              onChange={(event) => setCommunicationNote(event.target.value)}
              placeholder="Anything they should know about how you communicate?"
              className="min-h-[110px] w-full rounded-2xl border border-border px-4 py-3"
            />
            {relationshipError ? <p className="text-sm text-red-600">{relationshipError}</p> : null}
            <Button onClick={handleSubmitOnboarding} className="w-full">Save Onboarding</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
