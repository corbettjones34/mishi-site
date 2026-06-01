import { useState } from "react";

/*
 * PlanMyTripButton
 * ----------------
 * Drop-in replacement for the plain "Plan my personalised trip" link in
 * MishiDashboard. Instead of opening the Make webhook immediately, it asks
 * three quick questions, then opens the same webhook URL with the answers
 * appended as query params:
 *
 *   ...&companion_type=couple&pace=base&must_do=great%20diving
 *
 * Make scenario 9019718 maps those three params into columns I/J/K of the
 * Itinerary Requests tab (see integration notes).
 *
 * Props:
 *   planMyTripUrl    (string)  the per-mission webhook URL from the sheet (m.planMyTripUrl)
 *   defaultCompanion (string)  optional pre-selected companion type from the user's profile
 *                              ("solo" | "couple" | "friends" | "family-young")
 *   buttonStyle      (object)  optional style override so it matches the existing CTA
 */

const COMPANIONS = [
  { value: "couple", label: "A couple" },
  { value: "solo", label: "Just me" },
  { value: "friends", label: "Friends" },
  { value: "family-young", label: "Family (kids)" },
];

const PACES = [
  { value: "base", label: "Settle into one base", hint: "One spot, day trips out" },
  { value: "split", label: "Split between two areas", hint: "Two bases, one move" },
  { value: "roam", label: "Move around", hint: "A road-trip / multi-stop" },
];

export default function PlanMyTripButton({ planMyTripUrl, defaultCompanion = "", showPace = true, buttonStyle }) {
  const [open, setOpen] = useState(false);
  const [companion, setCompanion] = useState(defaultCompanion);
  const [pace, setPace] = useState("");
  const [mustDo, setMustDo] = useState("");
  const [sent, setSent] = useState(false);

  // When there's nowhere to move to (single standalone destination), the pace
  // question is hidden and the trip defaults to one base.
  const effectivePace = showPace ? pace : "base";
  const canSubmit = companion && effectivePace && planMyTripUrl;

  function submit() {
    if (!canSubmit) return;
    const sep = planMyTripUrl.includes("?") ? "&" : "?";
    const url =
      planMyTripUrl +
      sep +
      "companion_type=" + encodeURIComponent(companion) +
      "&pace=" + encodeURIComponent(effectivePace) +
      "&must_do=" + encodeURIComponent(mustDo.trim());
    // Fire the webhook in the background so the user stays on our own dark
    // confirmation screen — no second tab showing Make's response page.
    try {
      fetch(url, { mode: "no-cors", keepalive: true });
    } catch (e) {
      // Fallback: a pixel beacon still delivers the GET to the webhook.
      new Image().src = url;
    }
    setSent(true);
  }

  function reset() {
    setOpen(false);
    setSent(false);
    setPace("");
    setMustDo("");
    setCompanion(defaultCompanion);
  }

  return (
    <>
      <button
        style={buttonStyle || s.cta}
        onClick={() => setOpen(true)}
        disabled={!planMyTripUrl}
      >
        Plan my personalised trip
      </button>

      {open && (
        <div style={s.overlay} onClick={reset}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            {!sent ? (
              <>
                <h3 style={s.title}>Two quick things</h3>
                <p style={s.sub}>
                  So we build the right trip — this takes ten seconds.
                </p>

                <div style={s.qBlock}>
                  <span style={s.qLabel}>Who's coming on this trip?</span>
                  <div style={s.chips}>
                    {COMPANIONS.map((c) => (
                      <button
                        key={c.value}
                        style={companion === c.value ? s.chipOn : s.chip}
                        onClick={() => setCompanion(c.value)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {showPace && (
                  <div style={s.qBlock}>
                    <span style={s.qLabel}>How do you want to move?</span>
                    <div style={s.paceList}>
                      {PACES.map((p) => (
                        <button
                          key={p.value}
                          style={pace === p.value ? s.paceOn : s.paceBtn}
                          onClick={() => setPace(p.value)}
                        >
                          <span style={s.paceMain}>{p.label}</span>
                          <span style={s.paceHint}>{p.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={s.qBlock}>
                  <span style={s.qLabel}>
                    One thing you don't want to miss? <span style={s.opt}>(optional)</span>
                  </span>
                  <input
                    style={s.input}
                    type="text"
                    value={mustDo}
                    onChange={(e) => setMustDo(e.target.value)}
                    placeholder="e.g. great diving, a proper food scene, somewhere quiet"
                    maxLength={140}
                  />
                </div>

                <div style={s.actions}>
                  <button style={s.ghost} onClick={reset}>Cancel</button>
                  <button
                    style={canSubmit ? s.cta : { ...s.cta, opacity: 0.4, cursor: "default" }}
                    onClick={submit}
                    disabled={!canSubmit}
                  >
                    Build my itinerary
                  </button>
                </div>
              </>
            ) : (
              <div style={s.doneBox}>
                <h3 style={s.title}>You're all set ✦</h3>
                <p style={s.sub}>
                  We're building your personalised itinerary now — it'll land in your inbox shortly.
                </p>
                <button style={s.cta} onClick={reset}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const ACCENT = "#9EB384";

const s = {
  cta: {
    background: ACCENT, color: "#fff", border: "none", borderRadius: 10,
    padding: "14px 22px", fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
  ghost: {
    background: "transparent", color: "#8a8a82", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, padding: "14px 22px", fontSize: 15, fontWeight: 500, cursor: "pointer",
  },
  overlay: {
    position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  },
  modal: {
    background: "#141414", color: "#f5f4f0", borderRadius: 18, padding: "28px 26px",
    width: "100%", maxWidth: 460, border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto",
  },
  title: { fontSize: 22, fontWeight: 600, letterSpacing: -0.4, margin: "0 0 6px" },
  sub: { fontSize: 14, color: "#8a8a82", lineHeight: 1.5, margin: "0 0 22px" },
  qBlock: { marginBottom: 22 },
  qLabel: { display: "block", fontSize: 14, fontWeight: 600, marginBottom: 10 },
  opt: { color: "#8a8a82", fontWeight: 400 },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    background: "#1e1e1e", color: "#f5f4f0", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 999, padding: "9px 16px", fontSize: 14, cursor: "pointer",
  },
  chipOn: {
    background: ACCENT, color: "#fff", border: "1px solid " + ACCENT,
    borderRadius: 999, padding: "9px 16px", fontSize: 14, cursor: "pointer", fontWeight: 600,
  },
  paceList: { display: "flex", flexDirection: "column", gap: 8 },
  paceBtn: {
    textAlign: "left", background: "#1e1e1e", color: "#f5f4f0",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px",
    cursor: "pointer", display: "flex", flexDirection: "column", gap: 2,
  },
  paceOn: {
    textAlign: "left", background: "rgba(158,179,132,0.16)", color: "#f5f4f0",
    border: "1px solid " + ACCENT, borderRadius: 12, padding: "12px 14px",
    cursor: "pointer", display: "flex", flexDirection: "column", gap: 2,
  },
  paceMain: { fontSize: 14, fontWeight: 600 },
  paceHint: { fontSize: 12, color: "#8a8a82" },
  input: {
    width: "100%", boxSizing: "border-box", background: "#1e1e1e", color: "#f5f4f0",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px",
    fontSize: 14, outline: "none",
  },
  actions: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 },
  doneBox: { textAlign: "center", padding: "10px 0" },
};
