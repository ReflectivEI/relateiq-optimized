/**
 * WelcomeScreen — shown to unauthenticated users or new users who aren't registered.
 * Replaces the generic platform redirect with a clear, friendly in-app entry point.
 */
import React from "react";
import { Heart, Sparkles, Shield, MessageCircleHeart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";

export default function WelcomeScreen({ isNewUser = false }) {
  const handleLogin = () => api.auth.redirectToLogin(window.location.href);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Brand */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Heart className="w-8 h-8 text-primary" fill="currentColor" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Context: Us</h1>
          <p className="text-muted-foreground mt-1 text-sm">Relationship intelligence for Tony & Drew</p>
        </div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        {isNewUser ? (
          <div className="p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="font-display text-xl font-semibold text-foreground">Welcome, Drew</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tony has set up a shared relationship app to help you both communicate better, understand each other more deeply, and navigate challenges with clarity.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: Shield, text: "Your answers are private by default — only what you choose to share is visible to Tony." },
                { icon: Sparkles, text: "AI-powered insights are generated from both of your inputs combined." },
                { icon: MessageCircleHeart, text: "No therapy jargon — just practical guidance tailored to how you both communicate." },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  {text}
                </div>
              ))}
            </div>

            <Button onClick={handleLogin} className="w-full gap-2">
              Create your account to join
              <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <button onClick={handleLogin} className="text-primary underline underline-offset-2">
                Sign in
              </button>
            </p>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="font-display text-xl font-semibold text-foreground">Sign in to continue</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This is a private app for Tony & Drew. Sign in to access your relationship intelligence dashboard.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: Shield, text: "All data is private and only accessible to Tony and Drew." },
                { icon: Sparkles, text: "AI insights, coaching, and repair tools — all in one place." },
                { icon: MessageCircleHeart, text: "Evidence-informed relationship support, not generic advice." },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  {text}
                </div>
              ))}
            </div>

            <Button onClick={handleLogin} className="w-full gap-2">
              Sign in
              <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              New to the app?{" "}
              <button onClick={handleLogin} className="text-primary underline underline-offset-2">
                Create an account
              </button>
            </p>
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground/60 text-center max-w-xs">
        This app provides guidance based on behavioral patterns and is not a substitute for licensed therapy.
      </p>
    </div>
  );
}