import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

/* ─── Animation helpers ──────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};
const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay } },
});

/* ─── Data ────────────────────────────────────────────────── */
const features = [
  { icon: "📋", title: "Counselling Forms",   desc: "Digital counselling forms with auto-fill and version tracking." },
  { icon: "📊", title: "Academic Tracking",   desc: "Semester marks, attendance records and mentor grading in real time." },
  { icon: "👨‍🏫", title: "Mentor Connect",    desc: "Direct mentor assignment, grading, and placement tracking." },
  { icon: "🔐", title: "Role-Based Access",   desc: "Separate dashboards for students, admins, faculty and principal." },
  { icon: "📱", title: "Mobile Friendly",     desc: "Fully responsive design — works on any device, anywhere." },
  { icon: "🌐", title: "Multi-language",      desc: "Google Translate integration for regional language support." },
];

const testimonials = [
  { quote: "GVP-IT's portal made submitting counselling forms so much faster. Everything is in one place!", name: "Priya Sharma", batch: "CSE 2024" },
  { quote: "The mentor grading system gives real feedback on my progress every semester.", name: "Rahul Reddy", batch: "IT 2025" },
  { quote: "I can track my attendance and marks without bothering my HOD. Brilliant system.", name: "Aditya Kumar", batch: "ECE 2024" },
];

const faqs = [
  { q: "Who can access the student portal?", a: "Any student enrolled at GVP-IT with a valid college email (rollno@gvpce.ac.in) can sign up and access their dashboard." },
  { q: "What data can I manage on my profile?", a: "Personal details, academic marks, attendance, counselling forms, mentor grading records, and placement information." },
  { q: "How do login windows work?", a: "Admins can open and close login windows per year of study to control when students can access the portal." },
  { q: "Can faculty access student data?", a: "Yes. Mentors and admins have scoped access to only the students assigned to them." },
];

/* ─── Component ─────────────────────────────────────────── */
const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [facultyScroll, setFacultyScroll] = useState(0);

  const scrollFaculty = (dir) => {
    const el = document.getElementById("facultyContainer");
    const step = 248;
    const next = dir === "left"
      ? Math.max(facultyScroll - step, 0)
      : Math.min(facultyScroll + step, el.scrollWidth - el.clientWidth);
    setFacultyScroll(next);
    el.scrollTo({ left: next, behavior: "smooth" });
  };

  return (
    <div style={{ background: "#f8fafc", color: "#0f172a", fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════════ HERO ══════════════ */}
      <section style={{ position: "relative", minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#f8fafc" }}>
        {/* Subtle radial bg */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        {/* Grid pattern */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)", backgroundSize: "48px 48px", opacity: 0.4, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "760px", padding: "60px 24px" }}>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={stagger(0)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "9999px", padding: "6px 14px", marginBottom: "28px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#6366f1" }}>GVP-IT Student Portal — Now Live</span>
            </motion.div>

            <motion.h1 variants={stagger(0.05)} style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px", color: "#0f172a" }}>
              Your academic life,{" "}
              <span style={{ color: "#6366f1" }}>beautifully organised</span>
            </motion.h1>

            <motion.p variants={stagger(0.1)} style={{ fontSize: "18px", color: "#64748b", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto 36px" }}>
              Access counselling forms, track attendance, view marks, connect with mentors — everything in one clean dashboard.
            </motion.p>

            <motion.div variants={stagger(0.15)} style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/signup")}
                style={{ fontSize: "15px", padding: "14px 28px" }}
              >
                Get Started →
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => window.open("https://www.gvpce.ac.in", "_blank")}
                style={{ fontSize: "15px", padding: "14px 28px" }}
              >
                Visit College Website
              </button>
            </motion.div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{ display: "flex", gap: "40px", justifyContent: "center", marginTop: "64px", flexWrap: "wrap" }}
          >
            {[["1000+", "Students"], ["6", "User Roles"], ["4", "Year Batches"], ["100%", "Digital"]].map(([num, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#6366f1", letterSpacing: "-0.02em" }}>{num}</div>
                <div style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section style={{ background: "#ffffff", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            style={{ textAlign: "center", marginBottom: "56px" }}
          >
            <div style={{ display: "inline-block", background: "#eef2ff", color: "#6366f1", borderRadius: "9999px", padding: "4px 14px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px" }}>Features</div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#0f172a", marginBottom: "12px" }}>
              Everything students & faculty need
            </h2>
            <p style={{ fontSize: "16px", color: "#64748b", maxWidth: "520px", margin: "0 auto" }}>
              Built for Gayatri Vidyaparishad College — one portal for the entire academic lifecycle.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
                variants={stagger(i * 0.05)}
                whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.08)" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", cursor: "default" }}
              >
                <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "16px" }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FACULTY SECTION ══════════════ */}
      <section style={{ background: "#f8fafc", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            style={{ textAlign: "center", marginBottom: "48px" }}
          >
            <div style={{ display: "inline-block", background: "#eef2ff", color: "#6366f1", borderRadius: "9999px", padding: "4px 14px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px" }}>Faculty</div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a" }}>
              Meet Our Department Faculty
            </h2>
          </motion.div>

          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => scrollFaculty("left")}
              style={{ flexShrink: 0, width: "36px", height: "36px", border: "1px solid #e2e8f0", borderRadius: "50%", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgb(0 0 0/0.07)", fontSize: "14px", color: "#475569" }}
            >‹</button>

            <div id="facultyContainer" style={{ display: "flex", overflowX: "auto", gap: "16px", padding: "8px 4px 12px", scrollbarWidth: "none", flexGrow: 1 }}>
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{ minWidth: "180px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", textAlign: "center", boxShadow: "0 1px 3px rgb(0 0 0/0.05)" }}
                >
                  <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #eef2ff, #c7d2fe)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>👩‍🏫</div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>Faculty {i + 1}</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>Information Technology</div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => scrollFaculty("right")}
              style={{ flexShrink: 0, width: "36px", height: "36px", border: "1px solid #e2e8f0", borderRadius: "50%", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgb(0 0 0/0.07)", fontSize: "14px", color: "#475569" }}
            >›</button>
          </div>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section style={{ background: "#ffffff", padding: "80px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            style={{ textAlign: "center", marginBottom: "48px" }}
          >
            <div style={{ display: "inline-block", background: "#eef2ff", color: "#6366f1", borderRadius: "9999px", padding: "4px 14px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px" }}>Testimonials</div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a" }}>
              What Our Students Say
            </h2>
          </motion.div>

          <Carousel showThumbs={false} infiniteLoop autoPlay interval={4000} transitionTime={600} showStatus={false} showArrows={false}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ padding: "0 8px 24px" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "36px 40px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
                  <div style={{ fontSize: "40px", color: "#6366f1", marginBottom: "16px", lineHeight: 1 }}>"</div>
                  <p style={{ fontSize: "16px", color: "#475569", lineHeight: 1.75, marginBottom: "20px", fontStyle: "italic" }}>{t.quote}</p>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{t.batch}</div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section style={{ background: "#f8fafc", padding: "80px 24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            style={{ textAlign: "center", marginBottom: "48px" }}
          >
            <div style={{ display: "inline-block", background: "#eef2ff", color: "#6366f1", borderRadius: "9999px", padding: "4px 14px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px" }}>FAQ</div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a" }}>
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {faqs.map((item, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger(i * 0.04)}
                style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", fontFamily: "'Inter', sans-serif" }}
                >
                  <span style={{ fontWeight: 600, fontSize: "15px", color: "#0f172a" }}>{item.q}</span>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: "#6366f1", fontSize: "20px", lineHeight: 1, flexShrink: 0, marginLeft: "12px" }}
                  >+</motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ padding: "0 20px 18px", fontSize: "14px", color: "#475569", lineHeight: 1.7, borderTop: "1px solid #f1f5f9" }}>
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA BANNER ══════════════ */}
      <section style={{ background: "#6366f1", padding: "80px 24px" }}>
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}
        >
          <h2 style={{ fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", marginBottom: "16px" }}>
            Ready to get started?
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", marginBottom: "32px", lineHeight: 1.7 }}>
            Sign in with your college credentials and access your complete academic profile.
          </p>
          <button
            onClick={() => navigate("/signup")}
            style={{ background: "#fff", color: "#6366f1", border: "none", borderRadius: "10px", padding: "14px 32px", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", transition: "transform 150ms ease, box-shadow 150ms ease" }}
            onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 16px 40px rgba(0,0,0,0.2)"; }}
            onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)"; }}
          >
            Sign In Now →
          </button>
        </motion.div>
      </section>

    </div>
  );
};

export default LandingPage;
