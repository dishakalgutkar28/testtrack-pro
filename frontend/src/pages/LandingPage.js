import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();
  const handleLoginClick = () => {
    navigate('/login?force=true');
  };

  return (
    <div className="landing-page">
      <div className="landing-overlay" />

      <header className="landing-topbar">
        <div className="landing-brand">TestTrack Pro</div>
        <div className="landing-actions">
          <button
            type="button"
            className="topbar-btn topbar-btn-secondary"
            onClick={handleLoginClick}
          >
            Login
          </button>
          <button
            type="button"
            className="topbar-btn topbar-btn-primary"
            onClick={() => navigate("/register")}
          >
            Sign Up
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <p className="hero-kicker">Modern QA Workspace</p>
          <h1 className="hero-title">Build Better Releases With TestTrack</h1>
          <p className="hero-description">
            Organize test cases, track defects, and collaborate across teams in one
            focused platform built for fast, reliable software delivery.
          </p>

          <div className="hero-highlights">
            <div className="highlight-card">
              <h3>Test Case Management</h3>
              <p>Design, categorize, and maintain reusable test coverage.</p>
            </div>
            <div className="highlight-card">
              <h3>Bug Lifecycle Tracking</h3>
              <p>Report, assign, and monitor issues from discovery to resolution.</p>
            </div>
            <div className="highlight-card">
              <h3>Execution Insights</h3>
              <p>Review run history and quality signals for each release cycle.</p>
            </div>
          </div>
        </section>

        <aside className="landing-visual" aria-label="Team collaboration illustration">
          <img
            src="/images/illustration.png"
            alt="Team collaborating around a project dashboard"
            className="landing-illustration"
          />
        </aside>
      </main>
    </div>
  );
}

export default LandingPage;
