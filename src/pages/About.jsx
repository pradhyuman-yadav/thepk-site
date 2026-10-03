import useAboutPage from '../hooks/useAboutPage';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const About = () => {
  const { data, loading, error } = useAboutPage();

  if (loading) {
    return <LoadingSpinner />;
  }

  const { about, education, experience, projects, skills } = data;

  return (
    <div className="about-page">
      {error && <ErrorMessage message={error} />}

      <header className="page-header">
        <div className="profile-row">
          {about.profileImage ? (
            <img src={about.profileImage} alt={about.name} className="profile-img" />
          ) : (
            <div className="initials-avatar">PY</div>
          )}
          <div className="profile-info">
            <h1 className="about-name">{about.name || 'Pradhyuman Yadav'}</h1>
            {about.currentRole && <p className="current-role">{about.currentRole}</p>}
            <div className="profile-contacts">
              {about.location && <span className="profile-contact">{about.location}</span>}
              {about.phone && (
                <a href={`tel:${about.phone}`} className="profile-contact">
                  {about.phone}
                </a>
              )}
              {about.email && (
                <a href={`mailto:${about.email}`} className="profile-contact">
                  {about.email}
                </a>
              )}
              {about.resumeFile && (
                <a href={about.resumeFile} className="profile-contact" target="_blank" rel="noopener noreferrer">
                  Resume
                </a>
              )}
              {about.socialLinks && about.socialLinks.length > 0 && about.socialLinks.map((link, idx) => (
                <a key={idx} href={link.url} className="profile-contact" target="_blank" rel="noopener noreferrer">
                  {link.platform || link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {about.tagline && (
          <p className="tagline-rule">{about.tagline}</p>
        )}
      </header>

      {about.bio && (
        <section className="about-section">
          <h2 className="section-header">About</h2>
          <p className="bio-text">{about.bio}</p>
        </section>
      )}

      {education && education.length > 0 && (
        <section className="about-section">
          <h2 className="section-header">Education</h2>
          <div className="education-list">
            {education.map((edu, index) => (
              <div key={index} className="edu-item">
                <h3 className="edu-degree">
                  {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                </h3>
                <div className="edu-school">
                  {edu.institution}{edu.location ? `, ${edu.location}` : ''}
                </div>
                {edu.startDate && edu.endDate && (
                  <div className="edu-dates">{edu.startDate} - {edu.endDate}</div>
                )}
                {edu.gpa && <div className="edu-dates">GPA: {edu.gpa}</div>}
                {edu.relevantCoursework && edu.relevantCoursework.length > 0 && (
                  <div className="coursework" style={{ marginTop: '.5rem', fontSize: '.85rem' }}>
                    <strong>Coursework:</strong> {edu.relevantCoursework.filter(Boolean).join(', ')}
                  </div>
                )}
                {edu.achievements && edu.achievements.length > 0 && (
                  <ul className="achievements" style={{ marginTop: '.5rem', paddingLeft: '1.2rem', fontSize: '.85rem' }}>
                    {edu.achievements.filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {experience && experience.length > 0 && (
        <section className="about-section">
          <h2 className="section-header">Work Experience</h2>
          <div className="experience-timeline">
            {experience.map((job, index) => (
              <div key={index} className="exp-item">
                <div className="exp-header">
                  <h3 className="exp-role">{job.role}</h3>
                  {job.period && <span className="exp-period">{job.period}</span>}
                </div>
                <div className="exp-company">
                  {job.company}{job.location ? `, ${job.location}` : ''}
                  {job.employmentType ? ` · ${job.employmentType}` : ''}
                </div>
                {job.description && <p className="exp-desc">{job.description}</p>}
                {job.achievements && job.achievements.length > 0 && (
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '.85rem', marginTop: '.4rem' }}>
                    {job.achievements.filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                )}
                {job.technologies && job.technologies.length > 0 && (
                  <div className="exp-techs">
                    {job.technologies.map((tech, i) => (
                      <span key={i} className="exp-tech">{tech}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {projects && projects.length > 0 && (
        <section className="about-section">
          <h2 className="section-header">Projects</h2>
          <div className="projects-list">
            {projects.map((project, index) => (
              <div key={index} className="project-row">
                <div className="proj-header">
                  <span className="proj-name">{project.title}</span>
                  {project.category && <span className="badge-cat">{project.category}</span>}
                  {project.startDate && project.endDate && (
                    <span className="proj-period">{project.startDate} - {project.endDate}</span>
                  )}
                </div>
                {project.shortDescription && (
                  <p className="proj-desc">{project.shortDescription}</p>
                )}
                {project.fullDescription && !project.shortDescription && (
                  <p className="proj-desc">{project.fullDescription}</p>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="exp-techs">
                    {project.technologies.map((tech, i) => (
                      <span key={i} className="exp-tech">{tech}</span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: '.6rem', display: 'flex', gap: '1rem' }}>
                  {project.projectUrl && project.projectUrl !== '#' && (
                    <a href={project.projectUrl} className="profile-contact" target="_blank" rel="noopener noreferrer">
                      Live →
                    </a>
                  )}
                  {project.githubUrl && project.githubUrl !== '#' && (
                    <a href={project.githubUrl} className="profile-contact" target="_blank" rel="noopener noreferrer">
                      Code →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills && Object.keys(skills).length > 0 && (
        <section className="about-section">
          <h2 className="section-header">Technical Skills</h2>
          <div className="skills-newspaper-grid">
            {Object.entries(skills).map(([category, skillList]) => (
              <div key={category} className="skill-cat">
                <h3 className="skill-cat-title">{category}</h3>
                <p className="skill-cat-list">
                  {skillList.map((skill) => skill.name).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default About;
