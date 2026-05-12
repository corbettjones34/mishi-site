import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import MishiHomepage from "./MishiHomepage";
import MishiDashboard from "./MishiDashboard";
import MishiSettings from "./MishiSettings";

const API_URL = "https://script.google.com/macros/s/AKfycbwW4qnpEN6wG0MCB5ZpKOiDwJ2cLI8LElNs8nOq1b7KMKbC6N4MBYp6WQnvH74VU2E_/exec";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("loading"); // "loading" | "dashboard" | "settings" | "welcome"

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // When we get a session, check if this user has a profile
  useEffect(() => {
    if (!session?.user) return;
    checkProfile(session.user.email);
  }, [session?.user?.email]);

  async function checkProfile(email) {
    try {
      const res = await fetch(
        `${API_URL}?action=user_profile&email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (data.profile && data.profile.homeAirport) {
        // Existing user with a profile — go to dashboard
        setPage("dashboard");
      } else {
        // New user or empty profile — show welcome
        setPage("welcome");
      }
    } catch {
      // If check fails, just show dashboard (don't block)
      setPage("dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    // Preserve ?destination= param through OAuth so user lands on the right page after login
    const redirectUrl = new URL(window.location.origin);
    const destParam = new URLSearchParams(window.location.search).get("destination");
    if (destParam) {
      redirectUrl.searchParams.set("destination", destParam);
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl.toString(),
      },
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setPage("loading");
  }

  if (loading) {
    return (
      <div style={{
        background: "#0c0c0c", minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.1)",
          borderTopColor: "#9EB384",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  if (session?.user) {
    // First-time welcome flow
    if (page === "welcome") {
      return (
        <MishiSettings
          user={session.user}
          onBack={() => setPage("dashboard")}
          firstTime={true}
        />
      );
    }
    // Normal settings (from nav link)
    if (page === "settings") {
      return (
        <MishiSettings
          user={session.user}
          onBack={() => setPage("dashboard")}
        />
      );
    }
    return (
      <MishiDashboard
        user={session.user}
        onSignOut={handleSignOut}
        onOpenSettings={() => setPage("settings")}
      />
    );
  }

  return <MishiHomepage onSignIn={handleSignIn} />;
}
