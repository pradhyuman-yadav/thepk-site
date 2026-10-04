import React from 'react';
import { Link } from 'react-router-dom';

const Tools = () => {
  const tools = [
    { id: "tool-1", name: "Git Commit Generator", liveLink: "/tools/git-commit-generator" },
    { id: "tool-2", name: "Code Formatter", liveLink: "/tools/code-formatter" },
    { id: "tool-3", name: "API Testing Tool", liveLink: "/tools/api-tester" },
    { id: "tool-4", name: "Regex Builder", liveLink: "/tools/regex-builder" },
    { id: "tool-5", name: "JSON Validator", liveLink: "/tools/json-validator" },
    { id: "tool-6", name: "Base64 Encoder/Decoder", liveLink: "/tools/base64-converter" },
    { id: "tool-7", name: "Color Palette Generator", liveLink: "/tools/color-palette" },
    { id: "tool-8", name: "Password Generator", liveLink: "/tools/password-generator" },
    { id: "tool-9", name: "2FA Code Generator", liveLink: "/tools/2fa-generator" },
    { id: "tool-10", name: "QR Code Generator", liveLink: "/tools/qr-generator" },
    { id: "tool-11", name: "Portrait Processor", liveLink: "/tools/portrait-processor" },
  ];

  const projects = [
    { id: "project-flightline", name: "Flightline", description: "Endless arcade flyer for Android: six weather zones, hangar upgrades and daily missions. No ads, plays offline.", category: "Game", status: "In Development", technologies: ["Unity", "C#", "Android"], githubLink: "", liveLink: "", pageLink: "/flightline", startDate: "2026" },
    { id: "project-A", name: "Platform", description: "My platform showcasing projects, skills, and experience.", category: "Web Development", status: "Live", technologies: ["React", "Vite", "Tailwind CSS", "Docker", "Jenkins"], githubLink: "https://thepk.in", liveLink: "https://thepk.in", startDate: "Jan 2025", endDate: "Present" },
    { id: "project-D", name: "Video Streaming Platform", description: "Full-stack platform for video uploading, processing, and streaming with user management.", category: "Web Development", status: "Completed", technologies: ["Next.js", "AWS", "Docker"], githubLink: "https://github.com/pradhyuman-yadav/shadowveil", liveLink: "", startDate: "Oct 2024" },
    { id: "project-B", name: "JobMatch Automator", description: "Automated job application data collection from multiple job boards.", category: "Automation", status: "Completed", technologies: ["Python", "Selenium", "Discord Webhooks"], githubLink: "", liveLink: "", startDate: "Jun 2024", endDate: "Jul 2024" },
    { id: "project-C", name: "Trading with ML", description: "ML-powered trading platform using real-time data and optimized pipelines.", category: "Machine Learning", status: "Completed", technologies: ["Python", "Backtrader", "Machine Learning Libraries"], githubLink: "https://github.com/pradhyuman-yadav/trading-script", liveLink: "", startDate: "Dec 2024", endDate: "Jan 2025" },
    { id: "project-E", name: "AI Roommate Assistant", description: "AI assistant to help with roommate tasks.", category: "AI/ML", status: "Completed", technologies: ["Python"], githubLink: "", liveLink: "", startDate: "Sep 2023" },
    { id: "project-G", name: "AI Instagram Model", description: "Project to generate images using AI.", category: "AI/ML", status: "Completed", technologies: ["Python", "Generative AI"], githubLink: "", liveLink: "", startDate: "Jan 2023", endDate: "Feb 2023" },
    { id: "project-J", name: "Custom Music Player", description: "Custom music player integrating Spotify and YT Music APIs.", category: "Web Development", status: "Completed", technologies: ["ReactJS", "ExpressJS", "Spotify API", "YT Music API"], githubLink: "", liveLink: "", startDate: "May 2021", endDate: "Jun 2021" },
    { id: "project-H", name: "E-Commerce Platform for MIT", description: "Full-stack e-commerce site for Manipal Institute of Technology with Stripe payments.", category: "Web Development", status: "Completed", technologies: ["ReactJS", "Material-UI", "ExpressJS", "Stripe", "Firebase"], githubLink: "", liveLink: "", startDate: "Apr 2021", endDate: "May 2021" },
    { id: "project-I", name: "Full Body Motion Capture Suit", description: "Motion capture suit using Arduino Mega and MPU9250 sensors for real-time tracking.", category: "Hardware/IoT", status: "Completed", technologies: ["Arduino", "C++", "MPU9250", "I2C Multiplexer"], githubLink: "", liveLink: "", startDate: "Mar 2021", endDate: "Mar 2022" },
    { id: "project-L", name: "Parkinson's Disease Detector", description: "Deep learning project to detect Parkinson's disease using XGBoost classifier.", category: "Machine Learning", status: "Completed", technologies: ["Python", "Jupyter Notebook", "XGBoost", "NumPy", "pandas", "scikit-learn"], githubLink: "", liveLink: "", startDate: "Apr 2020", endDate: "May 2020" },
    { id: "project-F", name: "Wild Animal Detection", description: "Computer vision project to detect wild animals.", category: "Computer Vision", status: "Completed", technologies: ["Python", "Computer Vision"], githubLink: "", liveLink: "", startDate: "Oct 2020" },
    { id: "project-K", name: "Fake Profile Detector", description: "Tool to detect fake Instagram profiles using deep learning.", category: "Machine Learning", status: "Completed", technologies: ["Python", "Keras", "TensorFlow", "Seaborn"], githubLink: "", liveLink: "", startDate: "Mar 2020", endDate: "Jul 2020" },
    { id: "project-M", name: "Color Detection Application", description: "OpenCV project for color detection and analysis in images.", category: "Computer Vision", status: "Completed", technologies: ["Python", "OpenCV", "NumPy", "pandas"], githubLink: "", liveLink: "", startDate: "Mar 2020", endDate: "Apr 2020" },
    { id: "project-N", name: "Newsletter Signup Website", description: "Newsletter signup site with MailChimp integration, hosted on Heroku.", category: "Web Development", status: "Completed", technologies: ["HTML", "CSS", "NodeJS", "ExpressJS", "MailChimp API"], githubLink: "", liveLink: "", startDate: "Oct 2019", endDate: "Nov 2019" },
  ];

  const statusBadgeClass = (status) => {
    if (status === 'Live') return 'badge badge-live';
    if (status === 'In Development') return 'badge badge-dev';
    return 'badge badge-done';
  };

  return (
    <div className="tools-page">
      <header className="page-header">
        <h1 className="page-title">Tools &amp; Projects</h1>
        <p className="page-subtitle">
          Tools are utilities I've built; projects are complete applications and systems.
        </p>
      </header>

      <section className="tools-section">
        <h2 className="section-header">Tools</h2>
        <div className="tools-grid-simple">
          {tools.map((tool) => (
            <a key={tool.id} href={tool.liveLink} className="tool-card-simple">
              <h3 className="tool-name-simple">{tool.name}</h3>
            </a>
          ))}
        </div>
      </section>

      <section className="projects-section" style={{ marginTop: '2rem' }}>
        <h2 className="section-header">Projects</h2>
        <div className="projects-list">
          {projects.map((project) => (
            <div key={project.id} className="project-row">
              <div className="proj-header">
                <span className="proj-name">{project.name}</span>
                <span className={statusBadgeClass(project.status)}>{project.status}</span>
                <span className="badge-cat">{project.category}</span>
                <span className="proj-period">
                  {project.startDate}{project.endDate ? ` - ${project.endDate}` : ' onwards'}
                </span>
              </div>
              <p className="proj-desc">{project.description}</p>
              <div className="exp-techs">
                {project.technologies.map((tech, i) => (
                  <span key={i} className="exp-tech">{tech}</span>
                ))}
              </div>
              {(project.githubLink || project.liveLink || project.pageLink) && (
                <div style={{ marginTop: '.6rem', display: 'flex', gap: '1rem' }}>
                  {project.githubLink && (
                    <a href={project.githubLink} className="profile-contact" target="_blank" rel="noopener noreferrer">
                      GitHub →
                    </a>
                  )}
                  {project.pageLink && (
                    <Link to={project.pageLink} className="profile-contact">
                      Read more →
                    </Link>
                  )}
                  {project.liveLink && (
                    <a href={project.liveLink} className="profile-contact" target="_blank" rel="noopener noreferrer">
                      Live →
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="stats-bar" style={{ marginTop: '2rem' }}>
        <div className="stat">
          <span className="stat-num">{tools.length}</span>
          <span className="stat-label">Tools</span>
        </div>
        <div className="stat">
          <span className="stat-num">{projects.length}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="stat">
          <span className="stat-num">{projects.filter(p => p.status === 'Live').length}</span>
          <span className="stat-label">Live</span>
        </div>
        <div className="stat">
          <span className="stat-num">{projects.filter(p => p.status === 'Completed').length}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>
    </div>
  );
};

export default Tools;
