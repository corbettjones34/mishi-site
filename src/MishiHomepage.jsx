import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════
   MISHI — Homepage v2
   Inspired by Mr & Mrs Smith + Black Tomato
   Dark cinematic aesthetic, full-bleed imagery,
   generous whitespace, editorial feel
   ═══════════════════════════════════════════════════════════ */

// ─── Hero images — cinematic Unsplash photos ───
const HERO_SLIDES = [
  {
    image: "/images/hero-beach.jpg",
    category: "beach",
    location: "Koh Samui, Thailand",
  },
  {
    image: "/images/hero-surf.jpg",
    category: "surf",
    location: "Mentawai Islands, Indonesia",
  },
  {
    image: "/images/hero-tokyo.jpg",
    category: "city",
    location: "Tokyo, Japan",
  },
  {
    image: "/images/hero-snow.jpg",
    category: "snow",
    location: "Niseko, Japan",
  },
  {
    image: "/images/hero-hanoi.jpg",
    category: "city",
    location: "Hanoi, Vietnam",
  },
];

// ─── Live missions (sample data) ───
const MISSIONS = [
  {
    name: "West Sumbawa",
    region: "Indonesia",
    tag: "surf",
    signal: "4.5ft @ 14s · Offshore",
    why: "Consistent swell and clean winds all week",
    image: "/images/card-sumbawa.jpg",
    dates: "May 1 – 7",
    days: 7,
    price: "$720",
  },
  {
    name: "Seoul",
    region: "South Korea",
    tag: "city",
    signal: "21°C · Dry · Low humidity",
    why: "Perfect exploring weather — no rain forecast",
    image: "/images/card-seoul.jpg",
    dates: "May 1 – 5",
    days: 4,
    price: "$825",
  },
  {
    name: "Koh Samui",
    region: "Thailand",
    tag: "beach",
    signal: "31°C · Calm seas · Clear",
    why: "Pre-monsoon sweet spot — empty beaches",
    image: "/images/card-samui.jpg",
    dates: "May 2 – 7",
    days: 5,
    price: "$200",
  },
  {
    name: "Melbourne",
    region: "Australia",
    tag: "city",
    signal: "22°C · Mostly dry",
    why: "Autumn sweet spot — great food and culture",
    image: "/images/card-melbourne.jpg",
    dates: "May 1 – 5",
    days: 4,
    price: "$536",
  },
];

function tagLabel(tag) {
  const labels = { surf: "Surf", snow: "Snow", city: "City", beach: "Beach", safari: "Safari" };
  return labels[tag] || tag;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

function Nav({ onSignIn }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav style={{
      ...s.nav,
      background: scrolled ? "rgba(12,12,12,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
    }}>
      <span style={s.navLogo}>mishi</span>
      <div style={s.navRight}>
        <span style={s.navLink}>How it works</span>
        <span style={s.navLink}>Destinations</span>
        <button style={s.navCta} onClick={onSignIn}>Get started</button>
      </div>
    </nav>
  );
}

function Hero({ onSignIn }) {
  const [current, setCurrent] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const iv = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setCurrent((p) => (p + 1) % HERO_SLIDES.length);
        setOpacity(1);
      }, 800);
    }, 7000);
    return () => clearInterval(iv);
  }, []);

  const slide = HERO_SLIDES[current];

  return (
    <section style={s.hero}>
      {/* Preload all images */}
      {HERO_SLIDES.map((sl, i) => (
        <div key={i} style={{
          ...s.heroBg,
          backgroundImage: `url(${sl.image})`,
          opacity: i === current ? opacity : 0,
          zIndex: i === current ? 1 : 0,
        }} />
      ))}

      <div style={s.heroOverlay} />

      <div style={s.heroContent}>
        {/* Live indicator */}
        <div style={s.livePill}>
          <span style={s.liveDot} />
          <span>6 destinations live now</span>
        </div>

        <h1 style={{ ...s.heroHeadline, opacity, transition: "opacity 0.6s ease" }}>
          We watch the conditions.<br />
          You book the moment.
        </h1>

        <p style={{ ...s.heroSub, opacity, transition: "opacity 0.6s ease 0.1s" }}>
          Mishi monitors weather, swell, snowfall and flights across 50+ destinations.
          When conditions are exceptional, your mission appears.
        </p>

        <div style={s.heroCtas}>
          <button style={s.btnPrimary} onClick={onSignIn}>Find my next mission</button>
          <span style={s.btnGhost} onClick={onSignIn}>Already a member? Sign in</span>
        </div>
      </div>

      {/* Slide indicator dots */}
      <div style={s.slideDots}>
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setOpacity(0); setTimeout(() => { setCurrent(i); setOpacity(1); }, 400); }}
            style={{
              ...s.dot,
              background: i === current ? "#fff" : "rgba(255,255,255,0.3)",
              width: i === current ? 24 : 8,
            }}
          />
        ))}
      </div>

      {/* Bottom fade to content */}
      <div style={s.heroFade} />
    </section>
  );
}

function MissionCard({ mission, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...s.card,
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered ? "0 20px 60px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.15)",
        animationDelay: `${index * 0.12}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div style={s.cardImageWrap}>
        <img
          src={mission.image}
          alt={mission.name}
          style={{
            ...s.cardImage,
            transform: hovered ? "scale(1.06)" : "scale(1)",
          }}
        />
        <div style={s.cardOverlay} />
        <div style={s.cardTag}>{tagLabel(mission.tag)}</div>
        <div style={s.cardDays}>{mission.days} days</div>

        {/* Name overlay on image */}
        <div style={s.cardNameOverlay}>
          <h3 style={s.cardName}>{mission.name}</h3>
          <span style={s.cardRegion}>{mission.region}</span>
        </div>
      </div>

      {/* Body */}
      <div style={s.cardBody}>
        <div style={s.cardSignal}>
          <div style={s.signalDot} />
          <span>{mission.signal}</span>
        </div>
        <p style={s.cardWhy}>{mission.why}</p>

        <div style={s.cardFooter}>
          <div>
            <span style={s.cardPrice}>Flights from {mission.price}</span>
            <span style={s.cardPriceSub}> per person return</span>
          </div>
          <span style={s.cardDates}>{mission.dates}</span>
        </div>

        <button style={s.cardCta}>
          View mission
        </button>
      </div>
    </div>
  );
}

function LiveMissions() {
  return (
    <section style={s.missionsSection}>
      <div style={s.sectionInner}>
        <div style={s.sectionHeader}>
          <span style={s.eyebrow}>Live now</span>
          <h2 style={s.sectionTitle}>Conditions are lining up.</h2>
          <p style={s.sectionSub}>
            These destinations just hit exceptional conditions. They won't last.
          </p>
        </div>

        <div style={s.cardGrid}>
          {MISSIONS.map((m, i) => (
            <MissionCard key={m.name} mission={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Tell us what moves you",
      desc: "Six questions. Surf or snow? Culture or coast? We learn what gets you on a plane.",
    },
    {
      num: "02",
      title: "We watch the world",
      desc: "Swell, snowfall, temperature, rainfall, wind. We monitor 50+ destinations around the clock.",
    },
    {
      num: "03",
      title: "Your mission appears",
      desc: "When conditions align with your profile — flights, accommodation and a confidence score. Just go.",
    },
  ];

  return (
    <section style={s.howSection}>
      <div style={s.howInner}>
        <span style={s.eyebrowLight}>How it works</span>
        <h2 style={s.howTitle}>
          You don't search for trips.{" "}
          <span style={{ color: sage }}>Trips find you.</span>
        </h2>

        <div style={s.stepsRow}>
          {steps.map((step, i) => (
            <div key={i} style={s.stepCard}>
              <span style={s.stepNum}>{step.num}</span>
              <h3 style={s.stepTitle}>{step.title}</h3>
              <p style={s.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section style={s.manifestoSection}>
      <div style={s.manifestoInner}>
        <span style={s.eyebrowLight}>The idea</span>
        <blockquote style={s.manifestoQuote}>
          Most travel sites show you everything, everywhere, always.
          We show you one thing — the place that's perfect <em>right now</em>.
        </blockquote>
        <p style={s.manifestoBody}>
          We built Mishi because we were tired of booking trips based on brochures
          and guesswork. Conditions change daily. The best week in Bali isn't the same
          as the best week in Seoul. We track the signals that matter — so you arrive
          when it actually counts.
        </p>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { value: "50+", label: "Destinations tracked" },
    { value: "6", label: "Condition signals" },
    { value: "Daily", label: "Recommendations updated" },
  ];

  return (
    <section style={s.statsSection}>
      <div style={s.statsInner}>
        {items.map((item, i) => (
          <div key={i} style={s.statItem}>
            <div style={s.statValue}>{item.value}</div>
            <div style={s.statLabel}>{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta({ onSignIn }) {
  return (
    <section style={s.finalCtaSection}>
      <div style={s.finalCtaInner}>
        <h2 style={s.finalCtaTitle}>Never book the wrong week again.</h2>
        <p style={s.finalCtaSub}>
          Join Mishi and get personalised missions based on real-time conditions.
        </p>
        <button style={s.btnPrimary} onClick={onSignIn}>Get started — it's free</button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={s.footer}>
      <div style={s.footerInner}>
        <div>
          <span style={s.footerLogo}>mishi</span>
          <span style={s.footerTag}>Conditions-driven travel</span>
        </div>
        <div style={s.footerLinks}>
          {["How it works", "Destinations", "About", "Contact"].map((l) => (
            <span key={l} style={s.footerLink}>{l}</span>
          ))}
        </div>
        <span style={s.footerCopy}>© 2026 Mishi</span>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

export default function MishiHomepage({ onSignIn } = {}) {
  const destParam = new URLSearchParams(window.location.search).get("destination");
  const destName = destParam ? destParam.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : null;

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');

        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(158,179,132,0.6); }
          70%  { box-shadow: 0 0 0 10px rgba(158,179,132,0); }
          100% { box-shadow: 0 0 0 0 rgba(158,179,132,0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; }
        body { overflow-x: hidden; }
        button { font-family: 'Inter', sans-serif; }
      `}</style>

      <Nav onSignIn={onSignIn} />

      {/* Banner when arriving via a shared destination link */}
      {destName && (
        <div style={{
          background: "rgba(158,179,132,0.12)", borderBottom: "1px solid rgba(158,179,132,0.25)",
          padding: "14px 24px", textAlign: "center", position: "fixed", top: 72, left: 0, right: 0, zIndex: 99,
        }}>
          <span style={{ color: "#9EB384", fontSize: 14, fontFamily: "'Inter', sans-serif" }}>
            Someone shared <strong>{destName}</strong> with you —{" "}
            <button onClick={onSignIn} style={{
              background: "none", border: "none", color: "#fff", textDecoration: "underline",
              cursor: "pointer", fontSize: 14, fontFamily: "'Inter', sans-serif", fontWeight: 600,
            }}>
              sign in to see the full trip
            </button>
          </span>
        </div>
      )}

      <Hero onSignIn={onSignIn} />
      <LiveMissions />
      <HowItWorks />
      <Manifesto />
      <Stats />
      <FinalCta onSignIn={onSignIn} />
      <Footer />
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════

const serif = "'Playfair Display', Georgia, serif";
const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const sage = "#9EB384";
const sageDark = "#7a9868";
const dark = "#0c0c0c";
const darkCard = "#141414";
const warmWhite = "#f5f4f0";
const muted = "#8a8a82";
const faintBorder = "rgba(255,255,255,0.08)";

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const s = {
  page: {
    fontFamily: sans,
    color: warmWhite,
    background: dark,
    minHeight: "100vh",
    overflowX: "hidden",
    fontWeight: 300,
  },

  // ─── Nav ───
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 48px", height: 72,
    transition: "all 0.3s ease",
  },
  navLogo: {
    fontFamily: serif, fontSize: 28, fontWeight: 700, color: "#fff",
    letterSpacing: -0.5,
  },
  navRight: { display: "flex", alignItems: "center", gap: 32 },
  navLink: {
    fontSize: 13, color: "rgba(255,255,255,0.7)", cursor: "pointer",
    fontWeight: 400, letterSpacing: 0.5, transition: "color 0.2s",
  },
  navCta: {
    background: "transparent", color: "#fff",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 8, padding: "10px 22px",
    fontSize: 13, fontWeight: 500, cursor: "pointer",
    transition: "all 0.2s", letterSpacing: 0.3,
  },

  // ─── Hero ───
  hero: {
    position: "relative", height: "100vh", minHeight: 700,
    display: "flex", alignItems: "center", overflow: "hidden",
  },
  heroBg: {
    position: "absolute", inset: 0,
    backgroundSize: "cover", backgroundPosition: "center",
    transition: "opacity 1s ease",
  },
  heroOverlay: {
    position: "absolute", inset: 0, zIndex: 2,
    background: "linear-gradient(160deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.2) 100%)",
  },
  heroContent: {
    position: "relative", zIndex: 3,
    maxWidth: 800, padding: "0 64px",
  },
  heroHeadline: {
    fontFamily: serif, fontWeight: 700, fontSize: 62,
    lineHeight: 1.08, letterSpacing: -1,
    color: "#fff", margin: "0 0 24px",
  },
  heroSub: {
    fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,0.8)",
    maxWidth: 520, margin: "0 0 36px", fontWeight: 300,
  },
  heroCtas: {
    display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
  },
  heroFade: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
    background: `linear-gradient(to bottom, transparent, ${dark})`,
    zIndex: 4,
  },
  slideDots: {
    position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)",
    display: "flex", gap: 8, zIndex: 5,
  },
  dot: {
    height: 4, borderRadius: 4, border: "none", cursor: "pointer",
    transition: "all 0.4s ease",
  },

  // ─── Live pill ───
  livePill: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "8px 16px 8px 12px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 999, fontSize: 12, fontWeight: 500,
    letterSpacing: 0.6, marginBottom: 32, color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
  },
  liveDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: sage,
    animation: "livePulse 2s infinite",
  },

  // ─── Buttons ───
  btnPrimary: {
    display: "inline-flex", alignItems: "center",
    background: sage, color: "#fff",
    border: "none", borderRadius: 10,
    padding: "16px 32px", fontSize: 15, fontWeight: 600,
    cursor: "pointer", letterSpacing: 0.2,
    transition: "all 0.2s",
  },
  btnGhost: {
    color: "rgba(255,255,255,0.7)", fontSize: 14,
    textDecoration: "underline", textUnderlineOffset: 4,
    cursor: "pointer", fontWeight: 400,
  },

  // ─── Missions section ───
  missionsSection: {
    padding: "100px 0 120px", background: dark,
  },
  sectionInner: {
    maxWidth: 1200, margin: "0 auto", padding: "0 48px",
  },
  sectionHeader: {
    marginBottom: 56,
  },
  eyebrow: {
    fontSize: 11, letterSpacing: 3, textTransform: "uppercase",
    color: sage, fontWeight: 600, marginBottom: 12, display: "block",
  },
  eyebrowLight: {
    fontSize: 11, letterSpacing: 3, textTransform: "uppercase",
    color: sage, fontWeight: 600, marginBottom: 16, display: "block",
  },
  sectionTitle: {
    fontFamily: serif, fontSize: 42, fontWeight: 700,
    lineHeight: 1.12, letterSpacing: -0.5, color: warmWhite,
    margin: "0 0 14px",
  },
  sectionSub: {
    fontSize: 16, lineHeight: 1.6, color: muted,
    maxWidth: 480, fontWeight: 300,
  },

  // ─── Cards ───
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 24,
  },
  card: {
    background: darkCard, borderRadius: 16, overflow: "hidden",
    border: `1px solid ${faintBorder}`,
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    animation: "fadeUp 0.6s ease both",
    cursor: "pointer",
  },
  cardImageWrap: {
    position: "relative", height: 240, overflow: "hidden",
  },
  cardImage: {
    width: "100%", height: "100%", objectFit: "cover",
    transition: "transform 0.5s ease",
  },
  cardOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)",
  },
  cardTag: {
    position: "absolute", top: 16, left: 16,
    background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)",
    color: "#fff", fontSize: 11, fontWeight: 600,
    padding: "5px 14px", borderRadius: 999,
    letterSpacing: 1, textTransform: "uppercase",
  },
  cardDays: {
    position: "absolute", top: 16, right: 16,
    background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
    color: "#fff", fontSize: 11, fontWeight: 600,
    padding: "5px 12px", borderRadius: 999,
  },
  cardNameOverlay: {
    position: "absolute", bottom: 16, left: 20,
  },
  cardName: {
    fontFamily: serif, fontSize: 24, fontWeight: 700,
    color: "#fff", margin: 0, letterSpacing: -0.3,
    textShadow: "0 2px 12px rgba(0,0,0,0.4)",
  },
  cardRegion: {
    fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 400,
  },

  cardBody: { padding: "20px 22px 24px" },
  cardSignal: {
    display: "flex", alignItems: "center", gap: 8,
    marginBottom: 8,
  },
  signalDot: {
    width: 6, height: 6, borderRadius: "50%", background: sage, flexShrink: 0,
  },
  cardWhy: {
    fontSize: 13, color: muted, lineHeight: 1.5, marginBottom: 20,
    fontWeight: 300,
  },
  cardFooter: {
    display: "flex", justifyContent: "space-between",
    alignItems: "baseline", marginBottom: 16,
  },
  cardPrice: {
    fontSize: 18, fontWeight: 700, color: warmWhite, letterSpacing: -0.3,
  },
  cardPriceSub: {
    fontSize: 12, color: muted, fontWeight: 400,
  },
  cardDates: { fontSize: 13, color: muted, fontWeight: 400 },
  cardCta: {
    width: "100%", padding: "12px 0",
    background: "transparent",
    border: `1px solid rgba(255,255,255,0.15)`,
    borderRadius: 10, fontSize: 13, fontWeight: 500,
    color: "rgba(255,255,255,0.8)", cursor: "pointer",
    transition: "all 0.2s", letterSpacing: 0.3,
  },

  // ─── How it works ───
  howSection: {
    padding: "120px 0", background: darkCard,
    borderTop: `1px solid ${faintBorder}`,
    borderBottom: `1px solid ${faintBorder}`,
  },
  howInner: {
    maxWidth: 1100, margin: "0 auto", padding: "0 48px",
  },
  howTitle: {
    fontFamily: serif, fontSize: 44, fontWeight: 700,
    lineHeight: 1.15, color: warmWhite, maxWidth: 600,
    margin: "0 0 64px", letterSpacing: -0.5,
  },
  stepsRow: {
    display: "flex", gap: 48, flexWrap: "wrap",
  },
  stepCard: {
    flex: "1 1 280px", maxWidth: 320,
  },
  stepNum: {
    fontSize: 11, letterSpacing: 3, color: sage,
    fontWeight: 700, marginBottom: 16, display: "block",
  },
  stepTitle: {
    fontFamily: serif, fontSize: 22, fontWeight: 600,
    color: warmWhite, marginBottom: 12, letterSpacing: -0.2,
  },
  stepDesc: {
    fontSize: 14, lineHeight: 1.65, color: muted, fontWeight: 300,
  },

  // ─── Manifesto ───
  manifestoSection: {
    padding: "120px 0", background: dark,
  },
  manifestoInner: {
    maxWidth: 700, margin: "0 auto", padding: "0 48px",
    textAlign: "center",
  },
  manifestoQuote: {
    fontFamily: serif, fontSize: 32, fontWeight: 400,
    fontStyle: "italic", lineHeight: 1.4,
    color: warmWhite, margin: "0 0 32px", letterSpacing: -0.3,
  },
  manifestoBody: {
    fontSize: 15, lineHeight: 1.75, color: muted, fontWeight: 300,
  },

  // ─── Stats ───
  statsSection: {
    padding: "80px 0",
    borderTop: `1px solid ${faintBorder}`,
    borderBottom: `1px solid ${faintBorder}`,
    background: darkCard,
  },
  statsInner: {
    maxWidth: 900, margin: "0 auto", padding: "0 48px",
    display: "flex", justifyContent: "center", gap: 80,
    flexWrap: "wrap",
  },
  statItem: { textAlign: "center" },
  statValue: {
    fontFamily: serif, fontSize: 48, fontWeight: 700,
    color: warmWhite, letterSpacing: -1,
  },
  statLabel: {
    fontSize: 11, color: muted, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: 2, marginTop: 6,
  },

  // ─── Final CTA ───
  finalCtaSection: {
    padding: "120px 0", background: dark, textAlign: "center",
  },
  finalCtaInner: {
    maxWidth: 600, margin: "0 auto", padding: "0 48px",
  },
  finalCtaTitle: {
    fontFamily: serif, fontSize: 44, fontWeight: 700,
    color: warmWhite, lineHeight: 1.12, letterSpacing: -0.5,
    margin: "0 0 16px",
  },
  finalCtaSub: {
    fontSize: 16, lineHeight: 1.6, color: muted,
    fontWeight: 300, margin: "0 0 36px",
  }