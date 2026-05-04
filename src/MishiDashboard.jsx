import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

/* ═══════════════════════════════════════════════════════════
   MISHI — Logged-in Dashboard (Variant B)
   Shows the user's personalised missions from the API
   ═══════════════════════════════════════════════════════════ */

const API_URL = "https://script.google.com/macros/s/AKfycbwW4qnpEN6wG0MCB5ZpKOiDwJ2cLI8LElNs8nOq1b7KMKbC6N4MBYp6WQnvH74VU2E_/exec";

// Confidence comes as raw adjusted score (0-200+), normalize to 0-99
function normalizeConf(raw) {
  if (raw <= 100) return Math.round(raw);
  return Math.min(99, Math.round(raw * 100 / 200));
}

// Normalize tags: "beach, surf" → take first tag, trim, lowercase
function primaryTag(tag) {
  if (!tag) return "";
  return tag.split(",")[0].trim().toLowerCase();
}

function capitalise(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// URL-safe slug from destination name: "Ubud, Bali" → "ubud-bali"
function slugify(name) {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Read ?destination= from current URL
function getDestinationSlugFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("destination") || "";
}

// Push or replace ?destination= in URL without reload
function setDestinationInURL(slug) {
  const url = new URL(window.location.href);
  if (slug) {
    url.searchParams.set("destination", slug);
  } else {
    url.searchParams.delete("destination");
  }
  window.history.pushState({}, "", url.toString());
}

// Build a shareable URL for a destination
function getShareURL(destinationName) {
  const url = new URL(window.location.origin);
  url.searchParams.set("destination", slugify(destinationName));
  return url.toString();
}

function formatPrice(n) {
  if (!n || n === 0) return "Local";
  return "$" + Math.round(n).toLocaleString();
}

function formatDates(depart, ret) {
  if (!depart) return "";
  const d = new Date(depart);
  const r = ret ? new Date(ret) : null;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dStr = `${months[d.getMonth()]} ${d.getDate()}`;
  if (!r) return dStr;
  const rStr = d.getMonth() === r.getMonth()
    ? `${r.getDate()}`
    : `${months[r.getMonth()]} ${r.getDate()}`;
  return `${dStr} – ${rStr}`;
}


export default function MishiDashboard({ user, onSignOut }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedMission, setSelectedMission] = useState(null);
  const [budgetTier, setBudgetTier] = useState("mid-range");

  const firstName = user.user_metadata?.full_name?.split(" ")[0] ||
                    user.email?.split("@")[0] || "traveller";

  // Open a mission detail and update the URL
  function openMission(mission) {
    setSelectedMission(mission);
    if (mission) {
      setDestinationInURL(slugify(mission.destination));
    }
  }

  // Close detail and clean URL
  function closeMission() {
    setSelectedMission(null);
    setDestinationInURL(null);
  }

  useEffect(() => {
    fetchMissions();
  }, [user.email]);

  // After missions load, check URL for ?destination= and auto-open
  useEffect(() => {
    if (missions.length === 0) return;
    const slug = getDestinationSlugFromURL();
    if (!slug) return;
    const match = missions.find(m => slugify(m.destination) === slug);
    if (match) {
      setSelectedMission(match);
    }
  }, [missions]);

  // Handle browser back/forward
  useEffect(() => {
    function onPopState() {
      const slug = getDestinationSlugFromURL();
      if (slug) {
        const match = missions.find(m => slugify(m.destination) === slug);
        setSelectedMission(match || null);
      } else {
        setSelectedMission(null);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [missions]);

  async function fetchMissions() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?action=recommendations&email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setMissions([]);
      } else {
        setMissions(data.missions || []);
        setBudgetTier(data.budgetTier || "mid-range");
        setError(null);
      }
    } catch (err) {
      setError("Couldn't load missions — check back soon");
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }

  const topMission = missions[0] || null;
  const otherMissions = missions.slice(1);

  // Deduplicated, normalised tags for filter pills
  const tagSet = new Set(missions.map(m => primaryTag(m.tag)).filter(Boolean));
  const tags = ["all", ...tagSet];
  const filtered = filter === "all"
    ? otherMissions
    : otherMissions.filter(m => primaryTag(m.tag) === filter);

  const responsiveCSS = `
    .nav-mobile { display: none !important; }
    @media (max-width: 768px) {
      .nav-desktop { display: none !important; }
      .nav-mobile { display: flex !important; align-items: center; position: relative; }
      .detail-two-col { grid-template-columns: 1fr !important; }
      .hero-stats { gap: 20px !important; }
      .hero-name { font-size: 36px !important; }
      .hero-content-wrap { padding: 0 20px 40px !important; }
      .section-inner-wrap { padding: 0 20px !important; }
      .detail-body-wrap { padding: 0 20px 32px !important; }
      nav { padding: 0 16px !important; }
    }
  `;

  // ─── Loading state ───
  if (loading) {
    return (
      <div style={{ background: "#0c0c0c", minHeight: "100vh", color: "#f5f4f0" }}>
        <style>{responsiveCSS}</style>
        <Nav user={user} onSignOut={onSignOut} />
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "calc(100vh - 72px)", flexDirection: "column", gap: 16
        }}>
          <div style={styles.spinner} />
          <p style={{ color: "#8a8a82", fontSize: 14 }}>Loading your missions...</p>
        </div>
      </div>
    );
  }

  // ─── No missions state ───
  if (missions.length === 0) {
    return (
      <div style={{ background: "#0c0c0c", minHeight: "100vh", color: "#f5f4f0" }}>
        <style>{responsiveCSS}</style>
        <Nav user={user} onSignOut={onSignOut} />
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "calc(100vh - 72px)", flexDirection: "column", gap: 16,
          padding: "0 32px", textAlign: "center"
        }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700 }}>
            No missions yet
          </h2>
          <p style={{ color: "#8a8a82", fontSize: 15, maxWidth: 400, lineHeight: 1.6 }}>
            {error || "We're scanning conditions across 50+ destinations. When something lines up for you, it'll appear here."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#0c0c0c", minHeight: "100vh", color: "#f5f4f0" }}>
      <style>{responsiveCSS}</style>
      <Nav user={user} onSignOut={onSignOut} />

      {/* ─── Hero: Top Mission ─── */}
      {topMission && (
        <section style={styles.heroSection}>
          <div style={{ ...styles.heroBg, backgroundImage: `url(${topMission.image})` }} />
          <div style={styles.heroOverlay} />
          <div className="hero-content-wrap" style={styles.heroContent}>
            <p style={styles.greeting}>Welcome back, {firstName}</p>
            <div style={styles.topLabel}>
              <span style={styles.pulseDot} />
              <span>Your top mission</span>
            </div>
            <h1 className="hero-name" style={styles.destName}>{topMission.destination}</h1>

            <div className="hero-stats" style={styles.statsRow}>
              <div style={styles.stat}>
                <span style={styles.statValue}>{formatDates(topMission.dateDepart, topMission.dateReturn)}</span>
                <span style={styles.statLabel}>Travel window</span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statValue}>
                  {topMission.flightPrice > 0 ? `from ${formatPrice(topMission.flightPrice)}` : "Staycation"}
                </span>
                <span style={styles.statLabel}>{topMission.flightPrice > 0 ? "Flight pp return" : ""}</span>
              </div>
              <div style={styles.stat}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={styles.confBarOuter}>
                    <div style={{ ...styles.confBarInner, width: `${Math.min(100, normalizeConf(topMission.confidence))}%` }} />
                  </div>
                  <span style={styles.confText}>{normalizeConf(topMission.confidence)}%</span>
                </div>
                <span style={styles.statLabel}>Confidence</span>
              </div>
            </div>

            {topMission.conditions && (
              <div style={styles.conditionBar}>
                {topMission.conditions.split("\n").filter(Boolean).map((c, i) => (
                  <span key={i} style={styles.condSignal}>
                    <span style={styles.sigDot} />
                    {c.trim()}
                  </span>
                ))}
              </div>
            )}

            <div style={styles.heroActions}>
              <button onClick={() => openMission(topMission)} style={styles.btnPrimary}>
                Learn more
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ─── Other missions ─── */}
      {otherMissions.length > 0 && (
        <section style={styles.missionsSection}>
          <div className="section-inner-wrap" style={styles.sectionInner}>
            <div style={styles.sectionHeader}>
              <div>
                <span style={styles.eyebrow}>Your missions</span>
                <h2 style={styles.sectionTitle}>More destinations lining up</h2>
              </div>
              {tags.length > 2 && (
                <div style={styles.filterPills}>
                  {tags.map(t => (
                    <button
                      key={t}
                      onClick={() => setFilter(t)}
                      style={t === filter ? styles.filterPillActive : styles.filterPill}
                    >
                      {t === "all" ? "All" : capitalise(t)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.cardGrid}>
              {filtered.map((m, i) => (
                <MissionCard
                  key={i}
                  mission={m}
                  onLearnMore={() => openMission(m)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer ─── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div>
            <span style={styles.footerLogo}>mishi</span>
            <span style={styles.footerTag}>Conditions-driven travel</span>
          </div>
          <span style={styles.footerCopy}>&copy; 2026 Mishi</span>
        </div>
      </footer>

      {/* ─── Destination Detail Overlay ─── */}
      {selectedMission && (
        <DestinationDetail
          mission={selectedMission}
          budgetTier={budgetTier}
          onClose={closeMission}
        />
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   Nav (logged-in) — hamburger on mobile
   ═══════════════════════════════════════════════════════════ */
function Nav({ user, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (user.user_metadata?.full_name || user.email || "?")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <nav style={styles.nav}>
      <span style={styles.navLogo}>mishi</span>

      {/* Desktop nav links */}
      <div className="nav-desktop" style={styles.navRight}>
        <span style={{ ...styles.navLink, color: "#9EB384" }}>My Missions</span>
        <button onClick={onSignOut} style={styles.navLink}>Sign out</button>
        <div style={styles.avatar}>{initials}</div>
      </div>

      {/* Mobile hamburger */}
      <div className="nav-mobile">
        <div style={styles.avatar} onClick={() => setMenuOpen(!menuOpen)}>{initials}</div>
        {menuOpen && (
          <div style={styles.mobileMenu}>
            <span style={{ ...styles.mobileMenuItem, color: "#9EB384" }}>My Missions</span>
            <button onClick={onSignOut} style={styles.mobileMenuItem}>Sign out</button>
          </div>
        )}
      </div>
    </nav>
  );
}


/* ═══════════════════════════════════════════════════════════
   Mission Card
   ═══════════════════════════════════════════════════════════ */
function MissionCard({ mission: m, onLearnMore }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ ...styles.card, ...(hovered ? styles.cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onLearnMore}
    >
      <div style={styles.cardImageWrap}>
        <img
          src={m.image}
          alt={m.destination}
          style={{ ...styles.cardImage, ...(hovered ? { transform: "scale(1.06)" } : {}) }}
          onError={(e) => { e.target.src = "/images/hero-beach.jpg"; }}
        />
        <div style={styles.cardImgOverlay} />
        {m.tag && <div style={styles.cardTag}>{primaryTag(m.tag)}</div>}
        <div style={styles.cardConfPill}>
          <span style={styles.miniDot} />
          {normalizeConf(m.confidence)}%
        </div>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardSignal}>
          <div style={styles.signalDot} />
          <span style={{ fontSize: 13, color: "#f5f4f0" }}>
            {(m.conditions || "Monitoring").split("\n")[0].trim()}
          </span>
        </div>
        <h3 style={styles.cardName}>{m.destination}</h3>
        <p style={styles.cardWhy}>{m.description?.slice(0, 100)}{m.description?.length > 100 ? "..." : ""}</p>
        <div style={styles.cardMetaRow}>
          <div>
            {m.flightPrice > 0 ? (
              <>
                <span style={styles.cardPrice}>from {formatPrice(m.flightPrice)}</span>
                <span style={styles.cardPriceSub}> pp return</span>
              </>
            ) : (
              <span style={{ ...styles.cardPrice, color: "#9EB384" }}>Staycation</span>
            )}
          </div>
          <span style={styles.cardDates}>{formatDates(m.dateDepart, m.dateReturn)}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onLearnMore(); }} style={styles.cardCtaPrimary}>
          Learn more
        </button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   Destination Detail Overlay
   Matches the existing Apps Script destination page:
   hero + pills + why now + budget + getting there + CTA
   ═══════════════════════════════════════════════════════════ */
function DestinationDetail({ mission: m, budgetTier = "mid-range", onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const conf = normalizeConf(m.confidence);
  const conditions = (m.conditions || "").split("\n").filter(c => c.trim());
  const tag = primaryTag(m.tag);

  // Condition quality label
  const condLabel = m.conditionRating >= 85 ? "Peak conditions"
    : m.conditionRating >= 70 ? "Great conditions"
    : m.conditionRating >= 55 ? "Good conditions"
    : "Conditions tracked";

  // Build pills
  const pills = [condLabel];
  if (tag) pills.push(capitalise(tag));
  const tierLabel = budgetTier === "budget" ? "Budget" : budgetTier === "top-end" ? "Top-end" : "Mid-range";
  if (m.hotelPrice > 0) pills.push(`~$${Math.round(m.hotelPrice)}/night pp`);
  if (m.flightPrice > 0) pills.push(`~$${Math.round(m.flightPrice)} return from ${m.homeAirport || "home"}`);
  pills.push(`${m.days} days`);

  // Use whyNow from API, fall back to conditions-based sentence
  const whyNow = m.whyNow
    ? m.whyNow
    : conditions.length > 0
      ? `${m.destination} is showing ${conditions.join(" · ").toLowerCase()} across the ${formatDates(m.dateDepart, m.dateReturn)} window.`
      : `Conditions are lining up at ${m.destination} for the ${formatDates(m.dateDepart, m.dateReturn)} window.`;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Hero image with name + description */}
        <div style={styles.detailHero}>
          <img
            src={m.image}
            alt={m.destination}
            style={styles.detailHeroImg}
            onError={(e) => { e.target.src = "/images/hero-beach.jpg"; }}
          />
          <div style={styles.detailHeroOverlay} />
          <div style={styles.detailHeroText}>
            <h1 style={styles.detailName}>{m.destination}</h1>
            <p style={styles.detailHeroDesc}>{m.description}</p>
          </div>
        </div>

        <div className="detail-body-wrap" style={styles.detailBody}>
          {/* ─── Pills row ─── */}
          <div style={styles.pillsRow}>
            {pills.map((p, i) => (
              <span key={i} style={i === 0 ? styles.pillHighlight : styles.pill}>{p}</span>
            ))}
          </div>

          {/* ─── Why we're recommending this now ─── */}
          <div style={styles.detailSection}>
            <h3 style={styles.detailSectionTitle}>Why we're recommending this now</h3>
            {m.conditionRating > 0 && (
              <div style={styles.condRatingRow}>
                <div style={styles.condRatingBar}>
                  <div style={{ ...styles.condRatingFill, width: `${m.conditionRating}%` }} />
                </div>
                <span style={styles.condRatingText}>Condition rating: {m.conditionRating}/100</span>
              </div>
            )}
            <div style={styles.whyBox}>
              <p style={styles.whyText}>
                {whyNow}
              </p>
            </div>
          </div>

          {/* ─── Two-column: Budget + Getting there ─── */}
          <div className="detail-two-col" style={styles.twoCol}>
            {/* Rough budget */}
            <div style={styles.infoCard}>
              <h4 style={styles.infoCardTitle}>Rough budget</h4>
              <div style={styles.infoCardBody}>
                {m.hotelPrice > 0 && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Accommodation <span style={{fontWeight: 400, opacity: 0.6, fontSize: 11}}>({tierLabel})</span></span>
                    <span style={styles.infoValue}>~${Math.round(m.hotelPrice)}/night pp</span>
                  </div>
                )}
                {m.flightPrice > 0 && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Flights from {m.homeAirport || "home"}</span>
                    <span style={styles.infoValue}>~${Math.round(m.flightPrice)} return</span>
                  </div>
                )}
                {m.flightPrice === 0 && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Flights</span>
                    <span style={styles.infoValue}>Local / no flight needed</span>
                  </div>
                )}
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Food</span>
                  <span style={styles.infoValue}>$10–30/day</span>
                </div>
                {m.tripCost > 0 && (
                  <div style={{ ...styles.infoRow, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, marginTop: 4 }}>
                    <span style={{ ...styles.infoLabel, fontWeight: 600, color: "#f5f4f0" }}>~${Math.round(m.tripCost).toLocaleString()} total pp</span>
                    <span style={styles.infoValue}>{m.days} days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Getting there */}
            <div style={styles.infoCard}>
              <h4 style={styles.infoCardTitle}>Getting there</h4>
              <div style={styles.infoCardBody}>
                {m.airportCode && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Airport</span>
                    <span style={styles.infoValue}>{m.airportCode}</span>
                  </div>
                )}
                {m.flightPrice > 0 && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>From {m.homeAirport || "home"}</span>
                    <span style={styles.infoValue}>~${Math.round(m.flightPrice)} return</span>
                  </div>
                )}
                {m.flightHours > 0 && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Flight time</span>
                    <span style={styles.infoValue}>~{m.flightHours}h</span>
                  </div>
                )}
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Suggested dates</span>
                  <span style={styles.infoValue}>{formatDates(m.dateDepart, m.dateReturn)}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Trip length</span>
                  <span style={styles.infoValue}>{m.days} days</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Ready to go? ─── */}
          <div style={styles.readySection}>
            <h3 style={styles.readyTitle}>Ready to go?</h3>
            <p style={styles.readySub}>We'll build a personalised itinerary matched to your travel style, budget, and airport.</p>
            <div style={styles.readyActions}>
              {m.planMyTripUrl ? (
                <a href={m.planMyTripUrl} target="_blank" rel="noopener" style={styles.detailCtaBtn}>
                  Plan my personalised trip
                </a>
              ) : (
                <button style={styles.detailCtaBtn}>Plan my personalised trip</button>
              )}
              <a
                href={`https://wa.me/?text=${encodeURIComponent("Check this out — I found this trip on Mishi: " + m.destination + " " + getShareURL(m.destination))}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.shareBtn}
              >
                Share this with a friend
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════ */
const styles = {
  // Nav
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 48px", height: 72,
    background: "rgba(12,12,12,0.92)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  navLogo: {
    fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
    color: "#fff", letterSpacing: -0.5,
  },
  navRight: { display: "flex", alignItems: "center", gap: 28 },
  navLink: {
    fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 400,
    letterSpacing: 0.5, cursor: "pointer", background: "none", border: "none",
    fontFamily: "'Inter', sans-serif",
  },
  avatar: {
    width: 36, height: 36, borderRadius: "50%",
    background: "#9EB384", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer",
  },

  // Hero
  heroSection: {
    position: "relative", minHeight: 520,
    display: "flex", alignItems: "flex-end", overflow: "hidden",
    marginTop: 72,
  },
  heroBg: {
    position: "absolute", inset: 0,
    backgroundSize: "cover", backgroundPosition: "center",
  },
  heroOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to top, rgba(12,12,12,1) 0%, rgba(12,12,12,0.7) 30%, rgba(0,0,0,0.25) 100%)",
  },
  heroContent: {
    position: "relative", zIndex: 2,
    width: "100%", maxWidth: 1200, margin: "0 auto",
    padding: "0 48px 56px",
  },
  greeting: {
    fontSize: 14, color: "rgba(255,255,255,0.6)",
    fontWeight: 400, marginBottom: 6, letterSpacing: 0.3,
  },
  topLabel: {
    display: "inline-flex", alignItems: "center", gap: 8,
    fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase",
    color: "#9EB384", fontWeight: 600, marginBottom: 16,
  },
  pulseDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#9EB384",
    boxShadow: "0 0 0 0 rgba(158,179,132,0.6)",
    animation: "livePulse 2s infinite",
  },
  destName: {
    fontFamily: "'Playfair Display', serif", fontSize: 56, fontWeight: 700,
    lineHeight: 1.08, letterSpacing: -1, color: "#fff",
    margin: "0 0 24px",
  },
  statsRow: { display: "flex", gap: 40, flexWrap: "wrap", marginBottom: 28 },
  stat: { display: "flex", flexDirection: "column" },
  statValue: { fontSize: 20, fontWeight: 600, color: "#f5f4f0", letterSpacing: -0.3 },
  statLabel: {
    fontSize: 11, color: "#8a8a82", textTransform: "uppercase",
    letterSpacing: 1.5, fontWeight: 500, marginTop: 2,
  },
  confBarOuter: {
    width: 120, height: 6, borderRadius: 6,
    background: "rgba(255,255,255,0.1)", overflow: "hidden",
  },
  confBarInner: {
    height: "100%", borderRadius: 6,
    background: "linear-gradient(90deg, #7a9868, #9EB384)",
  },
  confText: { fontSize: 14, fontWeight: 600, color: "#9EB384" },
  conditionBar: {
    display: "flex", alignItems: "center", gap: 24, marginBottom: 32,
    flexWrap: "wrap",
  },
  condSignal: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 14, color: "rgba(255,255,255,0.85)",
  },
  sigDot: { width: 6, height: 6, borderRadius: "50%", background: "#9EB384", flexShrink: 0 },
  heroActions: { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" },
  btnPrimary: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "#9EB384", color: "#fff",
    border: "none", borderRadius: 10,
    padding: "16px 32px", fontSize: 15, fontWeight: 600,
    letterSpacing: 0.2, cursor: "pointer", textDecoration: "none",
  },

  // Missions section
  missionsSection: { padding: "64px 0 120px", background: "#0c0c0c" },
  sectionInner: { maxWidth: 1200, margin: "0 auto", padding: "0 48px" },
  sectionHeader: {
    display: "flex", alignItems: "baseline", justifyContent: "space-between",
    marginBottom: 40, flexWrap: "wrap", gap: 16,
  },
  eyebrow: {
    fontSize: 11, letterSpacing: 3, textTransform: "uppercase",
    color: "#9EB384", fontWeight: 600, marginBottom: 10, display: "block",
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700,
    lineHeight: 1.12, letterSpacing: -0.5, color: "#f5f4f0", margin: 0,
  },
  filterPills: { display: "flex", gap: 8, flexWrap: "wrap" },
  filterPill: {
    padding: "8px 18px", borderRadius: 999,
    background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
    color: "#8a8a82", fontSize: 12, fontWeight: 500,
    letterSpacing: 0.3, cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
  filterPillActive: {
    padding: "8px 18px", borderRadius: 999,
    background: "rgba(158,179,132,0.12)", border: "1px solid rgba(158,179,132,0.3)",
    color: "#9EB384", fontSize: 12, fontWeight: 500,
    letterSpacing: 0.3, cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },

  // Cards
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 24,
  },
  card: {
    background: "#141414", borderRadius: 16, overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "pointer",
  },
  cardHover: {
    transform: "translateY(-6px)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  cardImageWrap: { position: "relative", height: 200, overflow: "hidden" },
  cardImage: {
    width: "100%", height: "100%", objectFit: "cover",
    transition: "transform 0.5s ease",
  },
  cardImgOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)",
  },
  cardTag: {
    position: "absolute", top: 14, left: 14,
    background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)",
    color: "#fff", fontSize: 10, fontWeight: 600,
    padding: "4px 12px", borderRadius: 999,
    letterSpacing: 1, textTransform: "uppercase",
  },
  cardConfPill: {
    position: "absolute", top: 14, right: 14,
    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
    color: "#9EB384", fontSize: 11, fontWeight: 700,
    padding: "4px 12px", borderRadius: 999,
    display: "flex", alignItems: "center", gap: 5,
  },
  miniDot: { width: 5, height: 5, borderRadius: "50%", background: "#9EB384" },
  cardBody: { padding: "18px 20px 22px" },
  cardSignal: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  signalDot: { width: 6, height: 6, borderRadius: "50%", background: "#9EB384", flexShrink: 0 },
  cardName: {
    fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700,
    color: "#f5f4f0", margin: "4px 0", letterSpacing: -0.3,
  },
  cardWhy: { fontSize: 13, color: "#8a8a82", lineHeight: 1.5, marginBottom: 16, fontWeight: 300 },
  cardMetaRow: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16,
  },
  cardPrice: { fontSize: 17, fontWeight: 700, color: "#f5f4f0", letterSpacing: -0.3 },
  cardPriceSub: { fontSize: 11, color: "#8a8a82", fontWeight: 400 },
  cardDates: { fontSize: 12, color: "#8a8a82", fontWeight: 400 },
  cardCtaPrimary: {
    width: "100%", padding: "11px 0",
    background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10, fontSize: 13, fontWeight: 500,
    color: "rgba(255,255,255,0.8)", cursor: "pointer", letterSpacing: 0.2,
    textDecoration: "none", textAlign: "center", display: "block",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.2s",
  },

  // Footer
  footer: {
    padding: "48px 0", borderTop: "1px solid rgba(255,255,255,0.08)", background: "#0c0c0c",
  },
  footerInner: {
    maxWidth: 1200, margin: "0 auto", padding: "0 48px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexWrap: "wrap", gap: 24,
  },
  footerLogo: {
    fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
    color: "#f5f4f0", display: "block",
  },
  footerTag: { fontSize: 11, color: "#8a8a82", marginTop: 2, display: "block", letterSpacing: 0.5 },
  footerCopy: { fontSize: 12, color: "rgba(255,255,255,0.25)" },

  // Mobile nav
  mobileMenu: {
    position: "absolute", top: 64, right: 16,
    background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "8px 0", minWidth: 160,
    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
    zIndex: 101,
  },
  mobileMenuItem: {
    display: "block", width: "100%", padding: "12px 20px",
    fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 400,
    background: "none", border: "none", textAlign: "left",
    cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },

  // Spinner
  spinner: {
    width: 32, height: 32, borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTopColor: "#9EB384",
    animation: "spin 0.8s linear infinite",
  },

  // ─── Destination Detail Overlay ───
  overlay: {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    display: "flex", justifyContent: "center",
    overflowY: "auto",
    padding: "40px 24px",
  },
  overlayContent: {
    position: "relative",
    width: "100%", maxWidth: 760,
    background: "#141414",
    borderRadius: 20,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    alignSelf: "flex-start",
  },
  closeBtn: {
    position: "absolute", top: 16, right: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: "50%",
    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
    border: "none", color: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  detailHero: {
    position: "relative", height: 340, overflow: "hidden",
  },
  detailHeroImg: {
    width: "100%", height: "100%", objectFit: "cover",
  },
  detailHeroOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to top, rgba(20,20,20,1) 0%, rgba(20,20,20,0.6) 50%, rgba(0,0,0,0.15) 100%)",
  },
  detailHeroText: {
    position: "absolute", bottom: 28, left: 32, right: 32, zIndex: 2,
  },
  detailName: {
    fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700,
    color: "#fff", margin: "0 0 10px", lineHeight: 1.1, letterSpacing: -0.5,
  },
  detailHeroDesc: {
    fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.75)",
    fontWeight: 300, maxWidth: 500, margin: 0,
  },
  detailBody: {
    padding: "0 32px 40px",
  },

  // Pills
  pillsRow: {
    display: "flex", flexWrap: "wrap", gap: 8,
    padding: "24px 0", justifyContent: "flex-start",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  pill: {
    padding: "6px 16px", borderRadius: 999,
    background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 400,
  },
  pillHighlight: {
    padding: "6px 16px", borderRadius: 999,
    background: "rgba(158,179,132,0.12)", border: "1px solid rgba(158,179,132,0.25)",
    color: "#9EB384", fontSize: 12, fontWeight: 500,
  },

  // Why now
  detailSection: {
    padding: "28px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  detailSectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20, fontWeight: 600, color: "#f5f4f0",
    marginBottom: 16, letterSpacing: -0.3,
  },
  condRatingRow: {
    display: "flex", alignItems: "center", gap: 12,
    marginBottom: 14,
  },
  condRatingBar: {
    width: 100, height: 6, borderRadius: 6,
    background: "rgba(255,255,255,0.08)", overflow: "hidden",
  },
  condRatingFill: {
    height: "100%", borderRadius: 6,
    background: "linear-gradient(90deg, #7a9868, #9EB384)",
  },
  condRatingText: {
    fontSize: 13, fontWeight: 500, color: "#9EB384",
  },
  whyBox: {
    borderLeft: "3px solid #9EB384",
    padding: "16px 20px",
    background: "rgba(158,179,132,0.06)",
    borderRadius: "0 10px 10px 0",
  },
  whyText: {
    fontSize: 14, lineHeight: 1.65, color: "rgba(255,255,255,0.75)",
    fontWeight: 300, margin: 0,
  },

  // Two-column cards
  twoCol: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
    padding: "28px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  infoCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14, padding: "20px",
  },
  infoCardTitle: {
    fontSize: 15, fontWeight: 600, color: "#f5f4f0",
    margin: "0 0 16px", letterSpacing: -0.2,
  },
  infoCardBody: {
    display: "flex", flexDirection: "column", gap: 10,
  },
  infoRow: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline",
  },
  infoLabel: {
    fontSize: 13, color: "#8a8a82", fontWeight: 400,
  },
  infoValue: {
    fontSize: 13, color: "#f5f4f0", fontWeight: 500,
  },

  // Ready to go CTA
  readySection: {
    padding: "36px 0 0", textAlign: "center",
  },
  readyTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24, fontWeight: 700, color: "#f5f4f0",
    margin: "0 0 8px", letterSpacing: -0.3,
  },
  readySub: {
    fontSize: 14, color: "#8a8a82", fontWeight: 300,
    margin: "0 0 24px", lineHeight: 1.5,
  },
  readyActions: {
    display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
  },
  detailCtaBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "14px 32px",
    background: "#9EB384", color: "#fff",
    border: "none", borderRadius: 10,
    fontSize: 14, fontWeight: 600, letterSpacing: 0.2,
    cursor: "pointer", textDecoration: "none",
  },
  shareBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "14px 28px",
    background: "transparent", color: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
    fontSize: 14, fontWeight: 500, letterSpacing: 0.2,
    cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
};
