import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Lightbulb,
  Wrench,
  TrendingUp,
  Mail,
  User,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { useState } from "react";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/reflect", label: "Reflect", icon: Lightbulb },
  { path: "/repair", label: "Repair", icon: Wrench },
  { path: "/grow", label: "Grow", icon: TrendingUp },
  { path: "/inbox", label: "Inbox", icon: Mail },
  { path: "/profile", label: "Profile", icon: User },
];

export default function MainNavigation({ children }) {
  const location = useLocation();
  const { logout, user } = useRelationshipAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-border/50 bg-card/60 backdrop-blur-lg supports-[backdrop-filter]:bg-card/50">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link to="/" className="font-display text-xl font-bold text-primary">
                ReflectIQ
              </Link>
              <span className="hidden sm:inline text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Intelligence
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "gap-2 rounded-lg font-medium transition-all",
                        isActive 
                          ? "bg-primary/20 text-primary shadow-lg shadow-primary/20" 
                          : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
              >
                Logout
              </Button>

              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-border/30 flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-2 rounded-lg font-medium transition-all",
                        isActive 
                          ? "bg-primary/20 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
