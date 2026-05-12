import { useState, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════
   MISHI — Settings / Profile Questionnaire
   Straight migration of the Softr questionnaire.
   Same questions, same options, same wording.
   ═══════════════════════════════════════════════════════════ */

const API_URL = "https://script.google.com/macros/s/AKfycbwW4qnpEN6wG0MCB5ZpKOiDwJ2cLI8LElNs8nOq1b7KMKbC6N4MBYp6WQnvH74VU2E_/exec";

// ─── Question definitions (exact Softr match) ───
const QUESTIONS = [
  {
    key: "homeAirport",
    label: "What is your home airport?",
    type: "text",
    placeholder: "e.g. DPS, SYD, BKK",
    required: true,
  },
  {
    key: "lifestyle",
    label: "Who do you travel with?",
    type: "single",
    options: ["solo", "couple", "friends", "family-young"],
    required: false,
  },
  {
    key: "skillSurf",
    label: "Do you want to go on surf trips?",
    type: "single",
    options: ["yes", "no"],
    required: true,
  },
  {
    key: "skillSnow",
    label: "Do you want to go on skiing and snowboard trips?",
    type: "single",
    options: ["yes", "no"],
    required: false,
  },
  {
    key: "budget",
    label: "How would you best describe your budget?",
    type: "single",
    options: ["lean", "balanced", "spend"],
    required: true,
  },
  {
    key: "travelStyle",
    label: "What do you enjoy when you travel?",
    type: "multi",
    options: ["beach", "city", "culture", "food", "nature", "nightlife", "wellness"],
    required: false,
  },
  {
    key: "comfortPref",
    label: "What do you prioritize when you travel?",
    type: "single",
    options: ["experience-first", "comfort-first", "A bit of both"],
    required: false,
  },
  {
    key: "travelExp",
    label: "How would you describe your experience level as a traveller?",
    type: "single",
    options: ["novice", "moderate", "experienced"],
    required: false,
  },
];


export default function MishiSettings({ user, onBack }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Load existing profile on mount
  useEffect(() => {
    loadProfile();
  }, [user.email]);

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}?action=user_profile&email=${encodeURIComponent(user.email)}`
      );
      const data = await res.json();
      if (data.profile) {
        setAnswers(data.profile);
      }
    } catch (err) {
      // No existing profile — that's fine, start fresh
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSaved(false);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "save_profile",
          email: user.email,
          ...answers,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError("Couldn't save — please try again");
    } finally {
      setSaving(false);
    }
  }

  function updateAnswer(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleMulti(key, option) {
    setAnswers((prev) => {
      const current = prev[key] || [];
      const arr = Array.isArray(current) ? current : current.split(",").map((s) => s.trim()).filter(Boolean);
      const next = arr.includes(option)
        ? arr.filter((o) => o !== option)
        : [...arr, option];
      return { ...prev, [key]: next };
    });
    setSaved(false);
  }

  const responsiveCSS = `
    @media (max-width: 768px) {
      .settings-container { padding: 0 20px !important; }
      .settings-title { font-size: 32px !important; }
    }
  `;

  if (loading) {
    return (
      <div style={s.page}>
        <style>{responsiveCSS}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
          <div style={s.spinner} />
          <p style={{ color: "#8a8a82", fontSize: 14 }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{responsiveCSS}</style>

      <div className="settings-container" style={s.container}>
        {/* Header */}
        <button onClick={onBack} style={s.backBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to missions
        </button>

        <h1 className="settings-title" style={s.title}>Your travel profile</h1>
        <p style={s.subtitle}>
          These answers help Mishi find destinations that match you.
          Update them anytime — your recommendations will adjust.
        </p>

        {/* Questions */}
        <div style={s.questionsWrap}>
          {QUESTIONS.map((q) => (
            <div key={q.key} style={s.questionBlock}>
              <label style={s.questionLabel}>
                {q.label}
                {q.required && <span style={s.requiredStar}> *</span>}
              </label>

              {q.type === "text" && (
                <input
                  type="text"
                  value={answers[q.key] || ""}
                  onChange={(e) => updateAnswer(q.key, e.target.value.toUpperCase())}
                  placeholder={q.placeholder}
                  style={s.textInput}
                />
              )}

              {q.type === "single" && (
                <div style={s.optionsRow}>
                  {q.options.map((opt) => {
                    const selected = answers[q.key] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => updateAnswer(q.key, opt)}
                        style={selected ? s.optionSelected : s.option}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "multi" && (
                <div style={s.optionsRow}>
                  {q.options.map((opt) => {
                    const arr = Array.isArray(answers[q.key])
                      ? answers[q.key]
                      : (answers[q.key] || "").split(",").map((x) => x.trim()).filter(Boolean);
                    const selected = arr.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleMulti(q.key, opt)}
                        style={selected ? s.optionSelected : s.option}
                      >
                        {selected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9EB384" strokeWidth="3" style={{ marginRight: 6, flexShrink: 0 }}>
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save */}
        <div style={s.saveRow}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              ...s.saveBtn,
              opacity: saving ? 0.6 : 1,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save profile"}
          </button>

          {saved && (
            <span style={s.savedMsg}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9EB384" strokeWidth="2.5" style={{ marginRight: 6 }}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Saved
            </span>
          )}

          {error && <span style={s.errorMsg}>{error}</span>}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   Styles — matches the dark Mishi dashboard aesthetic
   ═══════════════════════════════════════════════════════════ */
const s = {
  page: {
    background: "#0c0c0c",
    minHeight: "100vh",
    color: "#f5f4f0",
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  container: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "0 48px",
    paddingTop: 40,
    paddingBottom: 120,
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: 400,
    cursor: "pointer",
    padding: "8px 0",
    marginBottom: 32,
    fontFamily: "'Inter', sans-serif",
    letterSpacing: 0.2,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 40,
    fontWeight: 700,
    letterSpacing: -0.5,
    lineHeight: 1.1,
    color: "#f5f4f0",
    margin: "0 0 12px",
  },
  subtitle: {
    fontSize: 14,
    color: "#8a8a82",
    lineHeight: 1.6,
    fontWeight: 300,
    margin: "0 0 48px",
    maxWidth: 480,
  },

  // Questions
  questionsWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 36,
  },
  questionBlock: {},
  questionLabel: {
    display: "block",
    fontSize: 15,
    fontWeight: 500,
    color: "#f5f4f0",
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  requiredStar: {
    color: "#9EB384",
    fontWeight: 400,
  },

  // Text input
  textInput: {
    width: "100%",
    maxWidth: 200,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    color: "#f5f4f0",
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: 1,
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box",
  },

  // Option buttons
  optionsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 20px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: 400,
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.15s ease",
  },
  optionSelected: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 20px",
    background: "rgba(158,179,132,0.12)",
    border: "1px solid rgba(158,179,132,0.4)",
    borderRadius: 10,
    color: "#9EB384",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.15s ease",
  },

  // Save area
  saveRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginTop: 48,
    paddingTop: 32,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  saveBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 36px",
    background: "#9EB384",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: 0.2,
    fontFamily: "'Inter', sans-serif",
  },
  savedMsg: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 14,
    color: "#9EB384",
    fontWeight: 500,
  },
  errorMsg: {
    fontSize: 14,
    color: "#e57373",
    fontWeight: 400,
  },

  // Spinner
  spinner: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTopColor: "#9EB384",
    animation: "spin 0.8s linear infinite",
  },
};
