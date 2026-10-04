import React from 'react';
import { DEVELOPER, CONTACT_EMAIL, UPDATED, APPS, SECTIONS, APP_FIELDS } from '../seo/privacy';
import { formatArticleDate } from '../utils/dates';

// One privacy policy for every published app. Store listings link to /privacy#<app id>.
const Privacy = () => (
  <div className="privacy-page">
    <header className="page-header">
      <h1 className="page-title">Privacy Policy</h1>
      <p className="page-subtitle">
        For apps and games by {DEVELOPER}. Last updated{' '}
        <time dateTime={UPDATED}>{formatArticleDate(`${UPDATED}T12:00:00Z`)}</time>.
      </p>
    </header>

    {SECTIONS.map((section) => (
      <section key={section.heading} className="privacy-section">
        <h2 className="privacy-heading">{section.heading}</h2>
        {section.paragraphs.map((text) => (
          <p key={text.slice(0, 40)}>{text}</p>
        ))}
      </section>
    ))}

    <section className="privacy-section" aria-labelledby="app-details">
      <h2 id="app-details" className="privacy-heading">App details</h2>
      {APPS.map((app) => (
        <article key={app.id} id={app.id} className="privacy-app">
          <h3 className="privacy-app-name">{app.name}</h3>
          <p className="privacy-app-meta">
            {app.platforms} · {app.packageId}
          </p>
          <dl className="privacy-app-facts">
            {APP_FIELDS.map(([key, label]) => (
              <div key={key} className="privacy-fact">
                <dt>{label}</dt>
                <dd>{app[key]}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </section>

    <section className="privacy-section">
      <h2 className="privacy-heading">Contact</h2>
      <p>
        Questions or requests about this policy or any of my apps:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-link">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </section>
  </div>
);

export default Privacy;
