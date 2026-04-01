import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import muraliPhoto from "../images/Murali.jpeg";
import gunjeshPhoto from "../images/gunjesh.jpeg";
import tejaPhoto from "../images/Tejaswarrao.png";
import rishiPhoto from "../images/rishi.jpeg";

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

// Faculty — add more: { name, role, photo: 'https://www.gvpce.ac.in/IT/FacPhotos/[filename].jpg', initials, color }
const facultyList = [
  { name: 'Dr. M. Phani Krishna Kishore', role: 'Professor & Dean',               photo: 'https://www.gvpce.ac.in/IT/FacPhotos/mpkk.jpg',        initials: 'PK', color: '#818cf8' },
  { name: 'Dr. B. Jaya Lakshmi',          role: 'Associate Professor & HOD',       photo: 'https://www.gvpce.ac.in/IT/FacPhotos/jayalakshmi.jpg',  initials: 'JL', color: '#a78bfa' },
  { name: 'Dr. K.K. Sandhya Rani',        role: 'Associate Professor & IIC Convenor', photo: 'https://www.gvpce.ac.in/IT/FacPhotos/sandhya.jpg',   initials: 'SR', color: '#f472b6' },
  { name: 'Mrs. M. Chandra Jyotsna',      role: 'Assistant Professor',             photo: 'https://www.gvpce.ac.in/IT/FacPhotos/jyotsna.jpg',      initials: 'CJ', color: '#c084fc' },
  { name: 'Mr. Yayathi Pavan Kumar',      role: 'Assistant Professor',             photo: 'https://www.gvpce.ac.in/IT/FacPhotos/SYPavanKUmar.jpg', initials: 'YP', color: '#facc15' },
  { name: 'Mr. P. Praveen Kumar',         role: 'Assistant Professor',             photo: 'https://www.gvpce.ac.in/IT/FacPhotos/p%20praveen.jpg',  initials: 'PP', color: '#34d399' },
  { name: 'Mr. Srinu Bevara',             role: 'Asst. Prof. & Network Admin',     photo: 'https://www.gvpce.ac.in/IT/FacPhotos/SRINU%20B.jpg',    initials: 'SB', color: '#fb923c' },
  { name: 'Mr. K.V.S.S. Prakash',        role: 'Assistant Professor',             photo: 'https://www.gvpce.ac.in/IT/FacPhotos/SatyaPrakash.jpg', initials: 'KP', color: '#38bdf8' },
];

const developers = [
  { name: 'Murali Paila', role: 'Developer', initials: 'MP', color: '#818cf8', photo: muraliPhoto, link: 'https://murali-paila.vercel.app/' },
  { name: 'Gunjesh Kumar', role: 'Developer', initials: 'GK', color: '#34d399', photo: gunjeshPhoto, link: 'https://gunjesh.in' },
  { name: 'Tejaswarrao Majji', role: 'Developer', initials: 'TM', color: '#f59e0b', photo: tejaPhoto, link: 'https://www.linkedin.com/in/teja-majji-3396a5291/' },
  { name: 'JS Rishi Varma', role: 'Developer', initials: 'RV', color: '#f472b6', photo: rishiPhoto, link: 'https://www.linkedin.com/in/jsrishivarma/' },
];

const testimonials = [
  {
    quote: 'The portal gives our department a clear and structured view of counselling records, attendance, and mentoring progress in one place.',
    name: 'Dr. B. Jaya Lakshmi',
    batch: 'Associate Professor & HOD, Information Technology',
  },
  {
    quote: 'Mentor grading and student academic tracking are now transparent and efficient. This system significantly improves faculty coordination.',
    name: 'Dr. M. Phani Krishna Kishore',
    batch: 'Professor & Dean, Information Technology',
  },
  {
    quote: 'The digital workflow has reduced manual effort and helps us review student progress quickly during counselling sessions.',
    name: 'Dr. K.K. Sandhya Rani',
    batch: 'Associate Professor & IIC Convenor, Information Technology',
  },
];

const faqs = [
  { q: "Who can access the student portal?", a: "Any student enrolled at GVP-IT with a valid college email (rollno@gvpce.ac.in) can sign up and access their dashboard." },
  { q: "What data can I manage on my profile?", a: "Personal details, academic marks, attendance, counselling forms, mentor grading records, and placement information." },
  { q: "How do login windows work?", a: "Admins can open and close login windows per year of study to control when students can access the portal." },
  { q: "Can faculty access student data?", a: "Yes. Mentors and admins have scoped access to only the students assigned to them." },
];

const glass = { background: "rgba(148,163,184,0.08)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "14px" };
const sectionAlt = { background: "rgba(148,163,184,0.04)" };

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
    <div style={{ background: "rgba(10,15,26,1)", color: "rgba(255,255,255,0.85)", fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════════ HERO ══════════════ */}
      <section style={{ position: "relative", minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "rgba(10,15,26,1)" }}>
        {/* Blobs */}
        <div style={{ position: "absolute", top: "-20%", left: "-15%", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(148,163,184,0.55) 0%, rgba(148,163,184,0.18) 45%, transparent 70%)", filter: "blur(130px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-15%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(71,85,105,0.55) 0%, rgba(71,85,105,0.18) 45%, transparent 70%)", filter: "blur(130px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "-5%", right: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(226,232,240,0.50) 0%, rgba(226,232,240,0.12) 45%, transparent 70%)", filter: "blur(110px)", pointerEvents: "none" }} />
        {/* Subtle grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "760px", padding: "60px 24px" }}>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={stagger(0)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.30)", borderRadius: "9999px", padding: "6px 14px", marginBottom: "28px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#818cf8", display: "inline-block" }} />
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#a5b4fc" }}>GVP-IT Student Portal — Now Live</span>
            </motion.div>

            <motion.h1 variants={stagger(0.05)} style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px", color: "rgba(255,255,255,0.95)" }}>
              Your academic life,{" "}
              <span style={{ color: "#818cf8" }}>beautifully organised</span>
            </motion.h1>

            <motion.p variants={stagger(0.1)} style={{ fontSize: "18px", color: "rgba(255,255,255,0.52)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto 36px" }}>
              Access counselling forms, track attendance, view marks, connect with mentors — everything in one clean dashboard.
            </motion.p>

            <motion.div variants={stagger(0.15)} style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/signup")}
                style={{ fontSize: "15px", padding: "14px 28px", background: "linear-gradient(135deg, #6d28d9, #818cf8)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 700, fontFamily: "'Inter', sans-serif", boxShadow: "0 8px 24px rgba(129,140,248,0.30)", transition: "all 160ms ease" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(129,140,248,0.40)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(129,140,248,0.30)"; }}
              >
                Get Started →
              </button>
              <button
                onClick={() => window.open("https://www.gvpce.ac.in", "_blank")}
                style={{ fontSize: "15px", padding: "14px 28px", background: "rgba(148,163,184,0.10)", color: "rgba(255,255,255,0.80)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "10px", cursor: "pointer", fontWeight: 600, fontFamily: "'Inter', sans-serif", backdropFilter: "blur(16px)", transition: "all 160ms ease" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(148,163,184,0.18)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(148,163,184,0.10)"; e.currentTarget.style.color = "rgba(255,255,255,0.80)"; }}
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
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#818cf8", letterSpacing: "-0.02em" }}>{num}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section style={{ ...sectionAlt, padding: "80px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            style={{ textAlign: "center", marginBottom: "56px" }}
          >
            <div style={{ display: "inline-block", background: "rgba(129,140,248,0.12)", color: "#a5b4fc", borderRadius: "9999px", padding: "4px 14px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px", border: "1px solid rgba(129,140,248,0.25)" }}>Features</div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, letterSpacing: "-0.025em", color: "rgba(255,255,255,0.95)", marginBottom: "12px" }}>
              Everything students & faculty need
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.50)", maxWidth: "520px", margin: "0 auto" }}>
              Built for Gayatri Vidyaparishad College — one portal for the entire academic lifecycle.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
                variants={stagger(i * 0.05)}
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.35)" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ ...glass, padding: "24px", cursor: "default" }}
              >
                <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(71,85,105,0.30)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "16px" }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: "8px" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.50)", lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FACULTY SECTION ══════════════ */}
      <section style={{ background: "rgba(10,15,26,1)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            style={{ textAlign: "center", marginBottom: "48px" }}
          >
            <div style={{ display: "inline-block", background: "rgba(129,140,248,0.12)", color: "#a5b4fc", borderRadius: "9999px", padding: "4px 14px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px", border: "1px solid rgba(129,140,248,0.25)" }}>Faculty</div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.95)" }}>
              Meet Our Department Faculty
            </h2>
          </motion.div>

          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => scrollFaculty("left")}
              style={{ flexShrink: 0, width: "36px", height: "36px", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "50%", background: "rgba(148,163,184,0.10)", backdropFilter: "blur(16px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "rgba(255,255,255,0.70)" }}
            >‹</button>

            <div id="facultyContainer" style={{ display: "flex", overflowX: "auto", gap: "16px", padding: "8px 4px 16px", scrollbarWidth: "none", flexGrow: 1 }}>
              {facultyList.map((f, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{ minWidth: "190px", maxWidth: "190px", ...glass, padding: "24px 18px 20px", textAlign: "center", cursor: "default" }}
                >
                  {/* Photo or initials avatar */}
                  {f.photo ? (
                    <img
                      src={f.photo}
                      alt={f.name}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${f.color}55`, margin: "0 auto 14px", display: "block", boxShadow: `0 0 20px ${f.color}33` }}
                    />
                  ) : null}
                  <div style={{
                    width: "80px", height: "80px", borderRadius: "50%",
                    background: `linear-gradient(135deg, ${f.color}33, ${f.color}18)`,
                    border: `2px solid ${f.color}44`,
                    margin: "0 auto 14px",
                    display: f.photo ? "none" : "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: "20px", fontWeight: 800, color: f.color,
                    letterSpacing: "-0.02em",
                    boxShadow: `0 0 20px ${f.color}22`,
                  }}>
                    {f.initials}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "13.5px", color: "rgba(255,255,255,0.92)", marginBottom: "5px", lineHeight: 1.3 }}>{f.name}</div>
                  <div style={{ fontSize: "11.5px", color: f.color, fontWeight: 600, marginBottom: "4px" }}>{f.role}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>Information Technology</div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => scrollFaculty("right")}
              style={{ flexShrink: 0, width: "36px", height: "36px", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "50%", background: "rgba(148,163,184,0.10)", backdropFilter: "blur(16px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "rgba(255,255,255,0.70)" }}
            >›</button>
          </div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
            variants={fadeUp}
            style={{ marginTop: "44px" }}
          >
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "8px" }}>
                Project Team
              </div>
              <h3 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.95)" }}>
                Developers
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              {developers.map((d) => (
                <div key={d.name} style={{ ...glass, padding: "18px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "50%",
                    background: `linear-gradient(135deg, ${d.color}33, ${d.color}18)`,
                    border: `2px solid ${d.color}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    {d.photo ? (
                      <img
                        src={d.photo}
                        alt={d.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: "15px", fontWeight: 800, color: d.color, letterSpacing: "-0.02em" }}>{d.initials}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "rgba(255,255,255,0.92)", marginBottom: "3px" }}>{d.name}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "8px" }}>{d.role}</div>
                    <a
                      href={d.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: `1px solid ${d.color}55`,
                        background: `${d.color}1a`,
                        color: d.color,
                        textDecoration: "none",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        transition: "all 150ms ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${d.color}33`;
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${d.color}1a`;
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section style={{ ...sectionAlt, padding: "80px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            style={{ textAlign: "center", marginBottom: "48px" }}
          >
            <div style={{ display: "inline-block", background: "rgba(129,140,248,0.12)", color: "#a5b4fc", borderRadius: "9999px", padding: "4px 14px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px", border: "1px solid rgba(129,140,248,0.25)" }}>Testimonials</div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.95)" }}>
              What Our Faculty Say
            </h2>
          </motion.div>

          <Carousel showThumbs={false} infiniteLoop autoPlay interval={4000} transitionTime={600} showStatus={false} showArrows={false}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ padding: "0 8px 24px" }}>
                <div style={{ ...glass, padding: "36px 40px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
                  <div style={{ fontSize: "40px", color: "#818cf8", marginBottom: "16px", lineHeight: 1 }}>"</div>
                  <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginBottom: "20px", fontStyle: "italic" }}>{t.quote}</p>
                  <div style={{ fontWeight: 700, color: "rgba(255,255,255,0.92)", fontSize: "14px" }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.38)", marginTop: "2px" }}>{t.batch}</div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section style={{ background: "rgba(10,15,26,1)", padding: "80px 24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            style={{ textAlign: "center", marginBottom: "48px" }}
          >
            <div style={{ display: "inline-block", background: "rgba(129,140,248,0.12)", color: "#a5b4fc", borderRadius: "9999px", padding: "4px 14px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "16px", border: "1px solid rgba(129,140,248,0.25)" }}>FAQ</div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.95)" }}>
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {faqs.map((item, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger(i * 0.04)}
                style={{ ...glass, overflow: "hidden" }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", fontFamily: "'Inter', sans-serif" }}
                >
                  <span style={{ fontWeight: 600, fontSize: "15px", color: "rgba(255,255,255,0.90)" }}>{item.q}</span>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: "#818cf8", fontSize: "20px", lineHeight: 1, flexShrink: 0, marginLeft: "12px" }}
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
                      <div style={{ padding: "0 20px 18px", fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
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
      <section style={{ background: "linear-gradient(135deg, rgba(55,48,163,0.80), rgba(109,40,217,0.80))", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.12)", padding: "80px 24px" }}>
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}
        >
          <h2 style={{ fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", marginBottom: "16px" }}>
            Ready to get started?
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.70)", marginBottom: "32px", lineHeight: 1.7 }}>
            Sign in with your college credentials and access your complete academic profile.
          </p>
          <button
            onClick={() => navigate("/signup")}
            style={{ background: "#fff", color: "#6d28d9", border: "none", borderRadius: "10px", padding: "14px 32px", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", transition: "transform 150ms ease, box-shadow 150ms ease" }}
            onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 16px 40px rgba(0,0,0,0.35)"; }}
            onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)"; }}
          >
            Sign In Now →
          </button>
        </motion.div>
      </section>

    </div>
  );
};

export default LandingPage;
