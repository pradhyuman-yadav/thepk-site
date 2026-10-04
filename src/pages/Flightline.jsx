import React from 'react';
import { Link } from 'react-router-dom';
import { FLIGHTLINE, DOWNLOAD, FACTS, ZONES, UPGRADES, PROGRESSION } from '../seo/flightline';

// Flightline's page uses the same layout, placement and transitions as every other page; only the
// palette and type change, via the "flightline" skin that AnimatedRoutes sets on <html> for this
// route (see "Flightline skin" in App.css).
const Flightline = () => (
  <div className="flightline-page">
    <header className="page-header flightline-header">
      <img src={FLIGHTLINE.icon} alt="Flightline app icon" className="flightline-icon" width="96" height="96" />
      <div>
        <h1 className="page-title">{FLIGHTLINE.name}</h1>
        <p className="page-subtitle">{FLIGHTLINE.tagline}</p>
      </div>
    </header>

    <section className="home-section">
      <p className="flightline-summary">{FLIGHTLINE.summary}</p>
      <ul className="flightline-facts">
        {FACTS.map((f) => (
          <li key={f.label}>
            <span className="flightline-fact-label">{f.label}</span>
            <span className="flightline-fact-value">{f.value}</span>
          </li>
        ))}
      </ul>
      <div className="flightline-download">
        {DOWNLOAD.url ? (
          <a href={DOWNLOAD.url} className="flightline-cta" target="_blank" rel="noopener noreferrer">
            {DOWNLOAD.label}
          </a>
        ) : (
          <p className="flightline-soon">
            Coming soon to {FLIGHTLINE.platform}. The download link will be here.
          </p>
        )}
      </div>
    </section>

    <figure className="flightline-feature">
      <img
        src={FLIGHTLINE.feature}
        alt="Flightline feature graphic: a yellow jet climbing through clouds next to the Flightline wordmark"
        width="1024"
        height="500"
        loading="lazy"
      />
    </figure>

    <section className="home-section" aria-labelledby="fl-zones">
      <h2 id="fl-zones" className="section-heading">Six zones</h2>
      <ol className="flightline-zones">
        {ZONES.map((z) => (
          <li key={z.gate}>
            <span className="flightline-gate">{z.gate}</span>
            <span className="flightline-zone-name">{z.name}</span>
            <span className="flightline-zone-line">{z.line}</span>
          </li>
        ))}
      </ol>
    </section>

    <section className="home-section" aria-labelledby="fl-hangar">
      <h2 id="fl-hangar" className="section-heading">The hangar</h2>
      <ul className="flightline-list">
        {UPGRADES.map((u) => (
          <li key={u.name}>
            <span className="flightline-item-name">{u.name}</span>
            <span className="flightline-item-desc">{u.desc}</span>
          </li>
        ))}
      </ul>
    </section>

    <section className="home-section" aria-labelledby="fl-progress">
      <h2 id="fl-progress" className="section-heading">Keep coming back</h2>
      <ul className="flightline-list">
        {PROGRESSION.map((p) => (
          <li key={p.name}>
            <span className="flightline-item-name">{p.name}</span>
            <span className="flightline-item-desc">{p.desc}</span>
          </li>
        ))}
      </ul>
    </section>

    <p className="flightline-meta">
      {FLIGHTLINE.platform}, version {FLIGHTLINE.version}.{' '}
      <Link to={FLIGHTLINE.privacyAnchor} className="text-link">
        Privacy policy
      </Link>
    </p>
  </div>
);

export default Flightline;
