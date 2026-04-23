import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/api/client";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";

export default function InviteAcceptPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { updateRelationships } = useRelationshipAuth();
  const [lookup, setLookup] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [authMode, setAuthMode] = useState("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await api.invites.lookup(token);
        if (!cancelled) {
          setLookup(result);
          setEmail(result?.invite?.invited_email || "");
          setName(result?.invite?.invited_name || "");
          if (result?.invite?.provisional_user_id) {
            setAuthMode("login");
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load invite.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (token) void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError("");
    try {
      const result = await api.invites.accept(token);
      updateRelationships(result.relationships || [], result.default_relationship_id);
      navigate("/questionnaire");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept invite.");
    } finally {
      setAccepting(false);
    }
  };

  const handleAuth = async () => {
    try {
      if (authMode === "register") {
        await api.auth.register({ name, email, password });
      } else {
        await api.auth.login({ email, password });
      }
      await handleAccept();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue.");
    }
  };

  const hasSession = Boolean(api.session.getStoredAuthToken());

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Card className="border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-3xl">Join Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading invite…</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : lookup ? (
              <>
                <p className="text-sm text-muted-foreground">
                  You’ve been invited to join <span className="font-semibold text-foreground">{lookup.relationship.name}</span>.
                </p>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                  <p><span className="font-semibold">Type:</span> {lookup.relationship.type}</p>
                  <p><span className="font-semibold">Participants:</span> {lookup.relationship.participant_names?.join(", ")}</p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
                  <p className="font-semibold text-foreground">What happens next</p>
                  <p className="mt-1">
                    After you sign in and accept this invite, ReflectIQ will take you to the Questionnaire first.
                    Complete that setup before relying on the other pages so the coaching, analysis, and insights are grounded in your own private responses.
                  </p>
                </div>
                {hasSession ? (
                  <Button onClick={handleAccept} disabled={accepting} className="w-full">
                    {accepting ? "Joining…" : "Accept Invite"}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button variant={authMode === "register" ? "default" : "outline"} onClick={() => setAuthMode("register")} className="flex-1">Create Account</Button>
                      <Button variant={authMode === "login" ? "default" : "outline"} onClick={() => setAuthMode("login")} className="flex-1">Sign In</Button>
                    </div>
                    {authMode === "register" ? (
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your name"
                        className="w-full rounded-2xl border border-border px-4 py-3"
                      />
                    ) : null}
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      disabled={Boolean(lookup?.invite?.provisional_user_id)}
                      className="w-full rounded-2xl border border-border px-4 py-3"
                    />
                    {lookup?.invite?.provisional_user_id ? (
                      <p className="text-xs text-muted-foreground">
                        This connection already has a private login assigned for {lookup?.invite?.invited_name || "you"}.
                        Use the credentials shared by the owner/admin, then accept the invite.
                      </p>
                    ) : null}
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      className="w-full rounded-2xl border border-border px-4 py-3"
                    />
                    <Button onClick={handleAuth} className="w-full">
                      {authMode === "register" ? "Create Account & Join" : "Sign In & Join"}
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
