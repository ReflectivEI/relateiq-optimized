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
  Heart,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigation = [
  { title: "Home", url: "/", icon: Home },
  { title: "Profiles", url: "/profiles", icon: Users },
  { title: "Questionnaire", url: "/questionnaire", icon: ClipboardList },
  { title: "AI Coach", url: "/coach", icon: MessageSquareHeart },
  { title: "Insights", url: "/insights", icon: Sparkles },
  { title: "Check-In", url: "/check-in", icon: HeartPulse },
  { title: "Smart Tools", url: "/tools", icon: Wrench },
  { title: "Triggers", url: "/triggers", icon: Siren },
  { title: "Proactive Repair", url: "/repair", icon: RefreshCcw },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-border/60 bg-[hsl(45_30%_97%)]">
      <SidebarHeader className="border-b border-border/60 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(145_30%_92%)] text-[hsl(145_35%_42%)]">
            <Heart className="h-4 w-4 fill-current" />
          </div>
          <div>
            <p className="font-serif text-2xl font-semibold leading-none">Context: Us</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Better Together
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu>
          {navigation.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={location === item.url}
                className="h-11 rounded-xl px-3 text-[15px] font-medium data-[active=true]:bg-[hsl(145_22%_92%)] data-[active=true]:text-[hsl(145_25%_34%)]"
              >
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-border/60 px-4 py-5 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Sign Out</p>
        <p className="mt-4 leading-relaxed">
          This app provides guidance based on behavior patterns. It is not a substitute for licensed therapy.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
