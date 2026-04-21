/**
 * ErrorFallback.jsx — Structured Error Display
 * Shows structured error fallback with next steps and actions.
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowRight } from "lucide-react";

export default function ErrorFallback({ error, onRetry, onAction }) {
  if (!error) return null;

  const actionLabels = {
    try_again: "Try Again",
    retry: "Retry",
    validate_input: "Check Input",
    provide_more_data: "Add Data",
    checkin_first: "Do Check-In",
    build_profiles: "Build Profiles",
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <span>{error.icon || "⚠️"} {error.message}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-orange-800 leading-relaxed">
          {error.next_step}
        </p>
        <div className="flex gap-2 pt-2">
          {error.action && (
            <Button
              onClick={() => onAction && onAction(error.action)}
              className="gap-1.5"
            >
              <span>{actionLabels[error.action] || "Continue"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
          {onRetry && (
            <Button variant="outline" onClick={onRetry} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}