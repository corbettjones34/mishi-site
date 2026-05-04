import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import MishiHomepage from "./MishiHomepage";
import MishiDashboard from "./MishiDashboard";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
    return <MishiDashboard user={session.user} onSignOut={handleSignOut} />;
  }

  return <MishiHomepage onSignIn={handleSignIn} />;
}
