import { Link, useLocation } from "wouter";
import {
  Home,
  Users,
  ClipboardList,
  MessageSquareHeart,
  Sparkles,
  HeartPulse,
  Wrench,
  Siren,
  RefreshCcw,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Profiles", url: "/profiles", icon: Users },
  { title: "Questionnaire", url: "/questionnaire", icon: ClipboardList },
  { title: "Coach", url: "/coach", icon: MessageSquareHeart },
  { title: "Insights", url: "/insights", icon: Sparkles },
  { title: "Check-In", url: "/check-in", icon: HeartPulse },
  { title: "Tools", url: "/tools", icon: Wrench },
  { title: "Triggers", url: "/triggers", icon: Siren },
  { title: "Repair", url: "/repair", icon: RefreshCcw },
];

type HealthResponse = {
  ok: boolean;
  service: string;
  questionnaireImported?: boolean;
};

export function AppSidebar() {
  const [location] = useLocation();
  const { data } = useQuery<HealthResponse>({
    queryKey: ["/health"],
  });

  return (
    <Sidebar className="border-r border-border/60 bg-[hsl(38_35%_97%)]">
      <SidebarHeader className="border-b border-border/60 px-4 py-5">
        <Link href="/" className="block">
          <p className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            RelateIQ
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Relationship intelligence for Tony and Drew
          </p>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-4">
        <div className="rounded-xl border border-border/70 bg-card/80 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Backend
            </span>
            <Badge variant={data?.ok ? "secondary" : "outline"}>
              {data?.ok ? "Healthy" : "Pending"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-foreground">
            Cloudflare worker API with GitHub-managed source.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Questionnaire import {data?.questionnaireImported ? "ready" : "awaiting real JSON files"}.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
